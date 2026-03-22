import { Server, Socket } from 'socket.io'
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  PlayerInfo,
  RoomPublicState,
  NightStep,
  NightActionData,
  GameSummary,
} from './shared/types.js'
import { ROLE_NAMES, NIGHT_CALL, NIGHT_SLEEP } from './shared/constants.js'
import {
  createRoom,
  getRoom,
  joinRoom,
  removePlayer,
  findRoomByPlayer,
  startGame,
  markRoleSeen,
  getLivingPlayers,
  getActiveNightSteps,
  hasLivingRoleHolder,
  resolveNight,
  checkWinCondition,
  resetNightState,
  resetDayState,
  type Room,
} from './roomManager.js'

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>

// Helpers
function toPublicState(room: Room): RoomPublicState {
  return {
    roomId: room.id,
    status: room.status,
    players: room.players.map(toPublicPlayer),
    roleConfig: room.roleConfig,
    phase: room.phase,
    roundNumber: room.roundNumber,
  }
}

function toPublicPlayer(p: {
  id: string
  name: string
  isHost: boolean
  isConnected: boolean
  alive: boolean
  isSilenced: boolean
}): PlayerInfo {
  return {
    id: p.id,
    name: p.name,
    isHost: p.isHost,
    isConnected: p.isConnected,
    alive: p.alive,
    isSilenced: p.isSilenced,
  }
}

function applyLoverFollowDeath(room: Room, deadId: string): void {
  if (!room.loverIds) return
  const [l1, l2] = room.loverIds
  if (deadId !== l1 && deadId !== l2) return
  const loverId = deadId === l1 ? l2 : l1
  const lover = room.players.find((pl) => pl.id === loverId)
  if (lover?.alive) lover.alive = false
}

function applyHangedPlayerFromHostVote(
  room: Room,
  hangedPlayerId: string,
): void {
  const p = room.players.find((pl) => pl.id === hangedPlayerId)
  if (!p) return
  p.alive = false
  p.deathReason = 'hanged'
  p.deathRound = room.roundNumber
  applyLoverFollowDeath(room, hangedPlayerId)
}

// Night step tracking per room
const roomNightState = new Map<
  string,
  { steps: NightStep[]; currentIndex: number }
>()

// Socket Handlers
export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`🔌 Connected: ${socket.id}`)

    // Create Room
    socket.on('room:create', () => {
      const room = createRoom(socket.id)
      socket.join(room.id)
      socket.emit('room:created', room.id)
      socket.emit('room:state', toPublicState(room))
    })

    // Join Room
    socket.on('room:join', (roomId, playerName) => {
      const room = joinRoom(roomId.toUpperCase(), socket.id, playerName)
      if (!room) {
        socket.emit('room:error', 'Không thể tham gia phòng.')
        return
      }
      socket.join(room.id)
      socket.emit('room:state', toPublicState(room))
      const newPlayer = room.players.find((p) => p.id === socket.id)
      if (!newPlayer) return
      socket.to(room.id).emit('room:player-joined', toPublicPlayer(newPlayer))
    })

    // Update Config
    socket.on('room:update-config', (config) => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id) return
      room.roleConfig = { ...room.roleConfig, ...config.roleConfig }
      io.to(room.id).emit('room:config-updated', {
        roleConfig: room.roleConfig,
      })
    })

    // Start Game
    socket.on('room:start-game', () => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id) return
      if (!startGame(room)) {
        socket.emit('room:error', 'Không thể bắt đầu.')
        return
      }
      io.to(room.id).emit('game:started')
      for (const player of room.players) {
        io.to(player.id).emit('game:role-assigned', {
          role: player.role,
          faction: player.faction,
        })
      }
      io.to(room.id).emit('game:role-seen-count', 0, room.players.length, [])
    })

    // Role Seen (player only)
    socket.on('game:role-seen', () => {
      const room = findRoomByPlayer(socket.id)
      if (!room) return
      markRoleSeen(room, socket.id)
      const connected = room.players.filter((p) => p.isConnected)
      const confirmedIds = connected
        .filter((p) => room.roleSeenBy.has(p.id))
        .map((p) => p.id)
      io.to(room.id).emit(
        'game:role-seen-count',
        confirmedIds.length,
        connected.length,
        confirmedIds,
      )
    })

    // Host: Advance Phase
    socket.on('host:advance-phase', () => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id) return

      if (room.phase === 'role-reveal') {
        beginNight(io, room)
        return
      }

      if (room.phase === 'night') {
        advanceNightStep(io, room)
        return
      }

      if (room.phase === 'day-result') {
        startDiscussion(io, room)
        return
      }

      if (room.phase === 'day-discussion') {
        // Go to vote phase
        room.phase = 'day-vote'
        io.to(room.id).emit('game:phase-changed', 'day-vote', room.roundNumber)
        return
      }

      if (room.phase === 'day-vote') {
        // After vote result, go to next night
        beginNight(io, room)
      }
    })

    // Host: Night Action (host selects targets)
    socket.on('host:night-action', (step, action) => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id || room.phase !== 'night') return

      processHostNightAction(io, room, step, action)
    })

    // Host: Skip Step
    socket.on('host:skip-step', () => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id || room.phase !== 'night') return
      advanceNightStep(io, room)
    })

    // Host: Vote Result
    socket.on('host:vote-result', (hangedPlayerId) => {
      const room = findRoomByPlayer(socket.id)
      if (!room || room.hostId !== socket.id) return

      if (hangedPlayerId) applyHangedPlayerFromHostVote(room, hangedPlayerId)

      io.to(room.id).emit(
        'game:players-update',
        room.players.map(toPublicPlayer),
      )

      const winner = checkWinCondition(room)
      if (winner) endGame(io, room, winner)
    })

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`🔌 Disconnected: ${socket.id}`)
      const room = findRoomByPlayer(socket.id)
      if (room) {
        removePlayer(room.id, socket.id)
        io.to(room.id).emit('room:player-left', socket.id)
        io.to(room.id).emit(
          'game:players-update',
          room.players.map(toPublicPlayer),
        )
      }
    })

    // Reconnect
    socket.on('room:reconnect', (roomId, playerName) => {
      const room = getRoom(roomId)
      if (!room) {
        socket.emit('room:error', 'Phòng không tồn tại.')
        return
      }
      const player = room.players.find((p) => p.name === playerName)
      if (!player) {
        socket.emit('room:error', 'Không tìm thấy người chơi.')
        return
      }
      player.id = socket.id
      player.isConnected = true
      socket.join(room.id)
      socket.emit('room:state', toPublicState(room))
      socket.emit('game:role-assigned', {
        role: player.role,
        faction: player.faction,
      })
      io.to(room.id).emit(
        'game:players-update',
        room.players.map(toPublicPlayer),
      )
    })
  })
}

// Night Flow (Host-driven, step by step)
function beginNight(io: TypedServer, room: Room) {
  room.roundNumber++
  room.phase = 'night'
  resetNightState(room)
  resetDayState(room)
  room.players.forEach((p) => {
    p.isSilenced = false
  })

  io.to(room.id).emit('game:phase-changed', 'night', room.roundNumber)

  // Build step list
  const steps = getActiveNightSteps(room)
  roomNightState.set(room.id, { steps, currentIndex: -1 })

  // Send first script: "Trời tối, cả làng ngủ"
  io.to(room.hostId).emit(
    'host:night-step-data',
    'wolves' /* placeholder */,
    `🌙 Đêm ${room.roundNumber} bắt đầu.\n\n"Trời tối rồi, cả làng hãy nhắm mắt đi ngủ."`,
    null,
  )
}

function advanceNightStep(io: TypedServer, room: Room) {
  const ns = roomNightState.get(room.id)
  if (!ns) return

  ns.currentIndex++

  if (ns.currentIndex >= ns.steps.length) {
    // All steps done — resolve night
    finishNight(io, room)
    return
  }

  const step = ns.steps[ns.currentIndex]
  if (step === undefined) return
  sendNightStepToHost(io, room, step)
}

function sendNightStepToHost(io: TypedServer, room: Room, step: NightStep) {
  const hasHolder = hasLivingRoleHolder(room, step)
  const roleName = ROLE_NAMES[step === 'wolves' ? 'wolf' : step] ?? step
  const callScript = NIGHT_CALL[step]

  if (!hasHolder) {
    // Fake call — no living holder, but host still reads script for info hiding
    const script = `${callScript}\n\n💤 (Không có ${roleName} còn sống — giả vờ đợi vài giây)\n\n"${NIGHT_SLEEP[step]}"`
    io.to(room.hostId).emit('host:night-step-data', step, script, null)
    return
  }

  // Build action data for host to select targets
  const actionData = buildHostActionData(room, step)
  const script = `"${callScript}"`
  io.to(room.hostId).emit('host:night-step-data', step, script, actionData)
}

function buildHostActionData(room: Room, step: NightStep): NightActionData {
  const living = getLivingPlayers(room)
  const nonWolf = living.filter((p) => p.faction !== 'wolf')
  const data: NightActionData = { step }

  switch (step) {
    case 'disruptor':
      data.targets = living
        .filter((p) => p.role !== 'disruptor')
        .map((p) => ({ id: p.id, name: p.name }))
      break
    case 'cupid':
      data.targets = living.map((p) => ({ id: p.id, name: p.name }))
      data.isFirstNight = room.roundNumber === 1
      break
    case 'wolves':
      data.targets = nonWolf.map((p) => ({ id: p.id, name: p.name }))
      break
    case 'traitor':
      data.wolfList = room.players
        .filter((p) => (p.role === 'wolf' || p.role === 'wolf-cub') && p.alive)
        .map((p) => ({ id: p.id, name: p.name }))
      break
    case 'seer':
      data.targets = living
        .filter((p) => p.role !== 'seer')
        .map((p) => ({ id: p.id, name: p.name }))
      break
    case 'guard':
      data.targets = living.map((p) => ({ id: p.id, name: p.name }))
      data.lastGuardTarget = room.lastGuardTarget ?? undefined
      break
    case 'witch':
      data.witchVictim = room.wolfFinalTargets[0]
        ? (() => {
            const p = room.players.find(
              (pl) => pl.id === room.wolfFinalTargets[0],
            )
            return p ? { id: p.id, name: p.name } : null
          })()
        : null
      data.witchHealAvailable = !room.witchHealUsed
      data.witchPoisonAvailable = !room.witchPoisonUsed
      data.targets = living
        .filter((p) => p.role !== 'witch')
        .map((p) => ({ id: p.id, name: p.name }))
      break
    case 'hunter':
      data.targets = living
        .filter((p) => p.role !== 'hunter')
        .map((p) => ({ id: p.id, name: p.name }))
      break
  }

  return data
}

function emitHostNightActionLog(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  actionText: string,
) {
  io.to(room.hostId).emit('host:night-action-log', {
    step,
    roleName,
    playerName: '',
    action: actionText,
  })
}

function applyHostDisruptorNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  room.disruptorTarget = action.targetId as string
  room.currentNightSilenced = room.disruptorTarget
  const target = room.players.find((p) => p.id === room.disruptorTarget)
  emitHostNightActionLog(
    io,
    room,
    step,
    roleName,
    `bịt miệng ${target?.name ?? '?'}`,
  )
}

function applyHostCupidNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  room.cupidTarget1 = action.target1 as string
  room.cupidTarget2 = action.target2 as string
  if (room.cupidTarget1 && room.cupidTarget2) {
    room.loverIds = [room.cupidTarget1, room.cupidTarget2]
  }
  const t1 = room.players.find((p) => p.id === room.cupidTarget1)
  const t2 = room.players.find((p) => p.id === room.cupidTarget2)
  emitHostNightActionLog(
    io,
    room,
    step,
    roleName,
    `ghép đôi ${t1?.name ?? '?'} ❤ ${t2?.name ?? '?'}`,
  )
}

function applyHostWolvesNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  action: Record<string, unknown>,
) {
  const targetId = action.targetId as string
  room.wolfFinalTargets = [targetId]
  if (room.wolfCubDiedLastNight && action.targetId2) {
    room.wolfFinalTargets.push(action.targetId2 as string)
  }
  room.wolfCubDiedLastNight = false
  const names = room.wolfFinalTargets.map(
    (id) => room.players.find((p) => p.id === id)?.name ?? '?',
  )
  emitHostNightActionLog(io, room, step, 'Sói', `cắn ${names.join(', ')}`)
}

function applyHostTraitorNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
) {
  emitHostNightActionLog(io, room, step, roleName, 'đã xem danh sách sói')
}

function applyHostSeerNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  room.seerTarget = action.targetId as string
  const target = room.players.find((p) => p.id === room.seerTarget)
  if (!target) return
  room.seerResult = target.faction === 'wolf'
  emitHostNightActionLog(
    io,
    room,
    step,
    roleName,
    `xem ${target.name} → ${room.seerResult ? '🐺 Sói' : '👥 Dân'}`,
  )
}

function applyHostGuardNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  room.guardTarget = action.targetId as string
  room.lastGuardTarget = room.guardTarget
  const target = room.players.find((p) => p.id === room.guardTarget)
  emitHostNightActionLog(
    io,
    room,
    step,
    roleName,
    `bảo vệ ${target?.name ?? '?'}`,
  )
}

function applyHostWitchNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  if (action.save) {
    room.witchSaved = true
    room.witchHealUsed = true
  }
  if (action.killTargetId) {
    room.witchKillTarget = action.killTargetId as string
    room.witchPoisonUsed = true
  }
  const parts: string[] = []
  if (action.save) {
    const victim = room.wolfFinalTargets[0]
      ? room.players.find((p) => p.id === room.wolfFinalTargets[0])?.name
      : '?'
    parts.push(`cứu ${victim}`)
  }
  if (action.killTargetId) {
    const killId = action.killTargetId as string
    parts.push(`giết ${room.players.find((p) => p.id === killId)?.name ?? '?'}`)
  }
  if (parts.length === 0) parts.push('không làm gì')
  emitHostNightActionLog(io, room, step, roleName, parts.join(', '))
}

function applyHostHunterNight(
  io: TypedServer,
  room: Room,
  step: NightStep,
  roleName: string,
  action: Record<string, unknown>,
) {
  room.hunterTarget = action.targetId as string
  const target = room.players.find((p) => p.id === room.hunterTarget)
  emitHostNightActionLog(
    io,
    room,
    step,
    roleName,
    `nhắm ${target?.name ?? '?'}`,
  )
}

function processHostNightAction(
  io: TypedServer,
  room: Room,
  step: NightStep,
  action: Record<string, unknown>,
) {
  const roleName = ROLE_NAMES[step === 'wolves' ? 'wolf' : step] ?? step

  switch (step) {
    case 'disruptor':
      applyHostDisruptorNight(io, room, step, roleName, action)
      break
    case 'cupid':
      applyHostCupidNight(io, room, step, roleName, action)
      break
    case 'wolves':
      applyHostWolvesNight(io, room, step, action)
      break
    case 'traitor':
      applyHostTraitorNight(io, room, step, roleName)
      break
    case 'seer':
      applyHostSeerNight(io, room, step, roleName, action)
      break
    case 'guard':
      applyHostGuardNight(io, room, step, roleName, action)
      break
    case 'witch':
      applyHostWitchNight(io, room, step, roleName, action)
      break
    case 'hunter':
      applyHostHunterNight(io, room, step, roleName, action)
      break
  }

  const sleepScript = `"${NIGHT_SLEEP[step]}"`
  io.to(room.hostId).emit('host:night-step-data', step, sleepScript, null)
}

function finishNight(io: TypedServer, room: Room) {
  const deaths = resolveNight(room)
  const silenced = room.currentNightSilenced
    ? (() => {
        const p = room.players.find((pl) => pl.id === room.currentNightSilenced)
        return p ? { id: p.id, name: p.name } : null
      })()
    : null

  roomNightState.delete(room.id)

  // Send wake-up script to host first
  io.to(room.hostId).emit('host:night-resolved', deaths, silenced)

  // Transition to day-result
  room.phase = 'day-result'
  io.to(room.id).emit('game:phase-changed', 'day-result', room.roundNumber)
  io.to(room.id).emit('game:day-result', deaths, silenced)
  io.to(room.id).emit('game:players-update', room.players.map(toPublicPlayer))

  const winner = checkWinCondition(room)
  if (winner) {
    endGame(io, room, winner)
  }
}

// Day Flow
function startDiscussion(io: TypedServer, room: Room) {
  room.phase = 'day-discussion'
  io.to(room.id).emit('game:phase-changed', 'day-discussion', room.roundNumber)
}

function endGame(io: TypedServer, room: Room, winner: 'wolf' | 'villager') {
  room.phase = 'game-over'
  room.winnerFaction = winner
  room.status = 'finished'
  roomNightState.delete(room.id)

  const summary: GameSummary = {
    winner,
    players: room.players,
    history: room.history,
  }
  io.to(room.id).emit('game:game-over', summary)
}
