import { customAlphabet } from 'nanoid'
import type {
  RoleConfig,
  PlayerFullInfo,
  RoomStatus,
  GamePhase,
  RoleId,
  Faction,
  NightStep,
  DeathRecord,
  NightRecord,
  DayRecord,
  GameHistory,
} from './shared/types.js'
import { NIGHT_ORDER } from './shared/types.js'
import { ROLE_STEP_MAP } from './shared/constants.js'

const generateRoomId = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

// Room
export interface Room {
  id: string
  hostId: string
  status: RoomStatus
  players: PlayerFullInfo[]
  roleConfig: RoleConfig
  // Game state
  phase: GamePhase
  roundNumber: number
  winnerFaction: Faction | null
  // Night state
  nightStepIndex: number
  nightActions: Map<string, Record<string, unknown>>
  wolfVotes: Map<string, string>
  wolfFinalTargets: string[]
  wolfCubDiedLastNight: boolean
  seerTarget: string | null
  seerResult: boolean | null
  guardTarget: string | null
  lastGuardTarget: string | null
  witchHealUsed: boolean
  witchPoisonUsed: boolean
  witchSaved: boolean
  witchKillTarget: string | null
  hunterTarget: string | null
  disruptorTarget: string | null
  currentNightSilenced: string | null
  // Cupid / lovers
  cupidTarget1: string | null
  cupidTarget2: string | null
  loverIds: [string, string] | null
  // Day state
  currentNightDeaths: DeathRecord[]
  dayDeaths: DeathRecord[]
  pendingHunterKill: string | null
  nominations: Map<string, string | null>
  nominatedPlayers: string[]
  hangVotes: Map<string, string | null>
  // History
  history: GameHistory
  // Role reveal tracking
  roleSeenBy: Set<string>
}

// Room Store
const rooms = new Map<string, Room>()

export function createRoom(hostId: string): Room {
  const id = generateRoomId()
  const room: Room = {
    id,
    hostId,
    status: 'waiting',
    players: [],
    roleConfig: {
      wolf: 2,
      'wolf-cub': 0,
      'cursed-wolf': 0,
      villager: 3,
      seer: 1,
      guard: 1,
      witch: 1,
      hunter: 0,
      disruptor: 0,
      traitor: 0,
      cupid: 0,
    },
    phase: 'waiting',
    roundNumber: 0,
    winnerFaction: null,
    nightStepIndex: 0,
    nightActions: new Map(),
    wolfVotes: new Map(),
    wolfFinalTargets: [],
    wolfCubDiedLastNight: false,
    seerTarget: null,
    seerResult: null,
    guardTarget: null,
    lastGuardTarget: null,
    witchHealUsed: false,
    witchPoisonUsed: false,
    witchSaved: false,
    witchKillTarget: null,
    hunterTarget: null,
    disruptorTarget: null,
    currentNightSilenced: null,
    cupidTarget1: null,
    cupidTarget2: null,
    loverIds: null,
    currentNightDeaths: [],
    dayDeaths: [],
    pendingHunterKill: null,
    nominations: new Map(),
    nominatedPlayers: [],
    hangVotes: new Map(),
    history: { nights: [], days: [] },
    roleSeenBy: new Set(),
  }
  rooms.set(id, room)
  return room
}

export function getRoomCount(): number {
  return rooms.size
}

export function getRoom(roomId: string): Room | undefined {
  return rooms.get(roomId.toUpperCase())
}

export function joinRoom(
  roomId: string,
  playerId: string,
  playerName: string,
): Room | null {
  const room = getRoom(roomId)
  if (!room) return null
  if (room.status !== 'waiting') return null

  // Check duplicate name
  if (
    room.players.some((p) => p.name.toLowerCase() === playerName.toLowerCase())
  )
    return null

  room.players.push({
    id: playerId,
    name: playerName,
    isHost: false,
    isConnected: true,
    alive: true,
    isSilenced: false,
    role: 'villager',
    faction: 'villager',
  })
  return room
}

export function removePlayer(roomId: string, playerId: string): Room | null {
  const room = getRoom(roomId)
  if (!room) return null

  // If host disconnects during waiting, delete room
  if (playerId === room.hostId && room.status === 'waiting') {
    rooms.delete(room.id)
    return room
  }

  if (room.status === 'waiting') {
    room.players = room.players.filter((p) => p.id !== playerId)
  } else {
    // Mark as disconnected during game
    const player = room.players.find((p) => p.id === playerId)
    if (player) player.isConnected = false
  }
  return room
}

export function reconnectPlayer(
  roomId: string,
  playerName: string,
  newSocketId: string,
): Room | null {
  const room = getRoom(roomId)
  if (!room) return null

  const player = room.players.find((p) => p.name === playerName)
  if (!player) return null

  player.id = newSocketId
  player.isConnected = true
  return room
}

export function findRoomByPlayer(socketId: string): Room | undefined {
  for (const room of rooms.values()) {
    if (room.hostId === socketId || room.players.some((p) => p.id === socketId))
      return room
  }
  return undefined
}

// Game Logic
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const vi = a[i]
    const vj = a[j]
    if (vi !== undefined && vj !== undefined) {
      a[i] = vj
      a[j] = vi
    }
  }
  return a
}

export function startGame(room: Room): boolean {
  const totalRoles = Object.values(room.roleConfig).reduce((a, b) => a + b, 0)
  if (room.players.length < 3) return false
  if (room.players.length !== totalRoles) return false

  // Build role list and shuffle
  const roles: RoleId[] = []
  for (const [role, count] of Object.entries(room.roleConfig)) {
    for (let i = 0; i < count; i++) roles.push(role as RoleId)
  }
  const shuffledRoles = shuffle(roles)
  const shuffledPlayers = shuffle(room.players)
  if (shuffledPlayers.length !== shuffledRoles.length) return false

  // Assign roles
  room.players = shuffledPlayers.map((p, i) => {
    const role = shuffledRoles[i]
    if (role === undefined) {
      throw new Error('Role assignment mismatch')
    }
    const faction: Faction =
      role === 'wolf' || role === 'wolf-cub' || role === 'traitor'
        ? 'wolf'
        : 'villager'
    return { ...p, role, faction, alive: true, isSilenced: false }
  })

  room.status = 'playing'
  room.phase = 'role-reveal'
  room.roundNumber = 0
  room.roleSeenBy = new Set()
  return true
}

export function markRoleSeen(room: Room, playerId: string): boolean {
  room.roleSeenBy.add(playerId)
  // Check if all connected players have seen their role
  const connectedPlayers = room.players.filter((p) => p.isConnected)
  return connectedPlayers.every((p) => room.roleSeenBy.has(p.id))
}

export function getLivingPlayers(room: Room): PlayerFullInfo[] {
  return room.players.filter((p) => p.alive)
}

export function getLivingWolves(room: Room): PlayerFullInfo[] {
  return room.players.filter((p) => p.alive && p.faction === 'wolf')
}

export function getLivingVillagers(room: Room): PlayerFullInfo[] {
  return room.players.filter((p) => p.alive && p.faction === 'villager')
}

export function isRoleInGame(room: Room, step: NightStep): boolean {
  if (step === 'wolves') {
    return (
      room.roleConfig.wolf +
        room.roleConfig['wolf-cub'] +
        room.roleConfig['cursed-wolf'] >
      0
    )
  }
  const stepRoles = ROLE_STEP_MAP[step]
  if (!stepRoles) return false
  const roleList = Array.isArray(stepRoles) ? stepRoles : [stepRoles]
  return roleList.some((r) => room.roleConfig[r] > 0)
}

export function hasLivingRoleHolder(room: Room, step: NightStep): boolean {
  if (step === 'wolves') return getLivingWolves(room).length > 0
  const stepRoles = ROLE_STEP_MAP[step]
  if (!stepRoles) return false
  const roleList = Array.isArray(stepRoles) ? stepRoles : [stepRoles]
  return room.players.some((p) => p.alive && roleList.includes(p.role))
}

export function getActiveNightSteps(room: Room): NightStep[] {
  return NIGHT_ORDER.filter((step: NightStep) => {
    if (!isRoleInGame(room, step)) return false
    // Cupid only acts night 1
    if (step === 'cupid' && room.roundNumber > 1) return false
    return true
  })
}

export function getPlayersForNightStep(
  room: Room,
  step: NightStep,
): PlayerFullInfo[] {
  if (step === 'wolves') return getLivingWolves(room)
  const stepRoles = ROLE_STEP_MAP[step]
  if (!stepRoles) return []
  const roleList = Array.isArray(stepRoles) ? stepRoles : [stepRoles]
  return room.players.filter((p) => p.alive && roleList.includes(p.role))
}

// Night Resolution
function applyLoversChain(room: Room, deaths: DeathRecord[]): DeathRecord[] {
  if (!room.loverIds) return deaths
  const [l1, l2] = room.loverIds
  const deadIds = new Set(deaths.map((d) => d.playerId))
  room.players.filter((p) => !p.alive).forEach((p) => deadIds.add(p.id))

  const extra: DeathRecord[] = []
  const l1IsDying = deadIds.has(l1)
  const l2IsDying = deadIds.has(l2)

  if (l1IsDying && !l2IsDying) {
    const p = room.players.find((pl) => pl.id === l2)
    if (p?.alive)
      extra.push({ playerId: l2, playerName: p.name, reason: 'lover-death' })
  }
  if (l2IsDying && !l1IsDying) {
    const p = room.players.find((pl) => pl.id === l1)
    if (p?.alive)
      extra.push({ playerId: l1, playerName: p.name, reason: 'lover-death' })
  }
  return [...deaths, ...extra]
}

function collectWolfBiteDeaths(room: Room): DeathRecord[] {
  const deaths: DeathRecord[] = []
  for (const targetId of room.wolfFinalTargets) {
    const target = room.players.find((p) => p.id === targetId)
    if (!target?.alive) continue

    if (target.role === 'cursed-wolf' && target.faction === 'villager') {
      const isProtected = room.guardTarget === targetId
      const isSaved = room.witchSaved && room.wolfFinalTargets[0] === targetId
      if (!isProtected && !isSaved) {
        target.faction = 'wolf'
      }
      continue
    }

    const isProtected = room.guardTarget === targetId
    const isSaved = room.witchSaved && room.wolfFinalTargets.includes(targetId)
    if (!isProtected && !isSaved) {
      deaths.push({
        playerId: targetId,
        playerName: target.name,
        reason: 'wolf',
      })
    }
  }
  return deaths
}

function appendWitchPoisonDeath(room: Room, deaths: DeathRecord[]): void {
  if (!room.witchKillTarget) return
  const target = room.players.find((p) => p.id === room.witchKillTarget)
  if (
    !target ||
    !target.alive ||
    deaths.some((d) => d.playerId === target.id)
  ) {
    return
  }
  deaths.push({
    playerId: room.witchKillTarget,
    playerName: target.name,
    reason: 'witch-poison',
  })
}

function appendHunterShotChain(room: Room, deaths: DeathRecord[]): boolean {
  let wolfCubDied = false
  for (const d of deaths) {
    const p = room.players.find((pl) => pl.id === d.playerId)
    if (!p) continue
    if (p.role === 'hunter' && room.hunterTarget) {
      const hunterVictim = room.players.find(
        (pl) => pl.id === room.hunterTarget,
      )
      if (
        hunterVictim &&
        hunterVictim.alive &&
        !deaths.some((dd) => dd.playerId === hunterVictim.id)
      ) {
        deaths.push({
          playerId: hunterVictim.id,
          playerName: hunterVictim.name,
          reason: 'hunter-shot',
        })
      }
    }
    if (p.role === 'wolf-cub') wolfCubDied = true
  }
  return wolfCubDied
}

function markLoverWolfCubFlag(
  room: Room,
  deathsBeforeLovers: DeathRecord[],
  finalDeaths: DeathRecord[],
): void {
  for (const d of finalDeaths) {
    if (deathsBeforeLovers.some((dd) => dd.playerId === d.playerId)) continue
    const p = room.players.find((pl) => pl.id === d.playerId)
    if (p?.role === 'wolf-cub') room.wolfCubDiedLastNight = true
  }
}

function applyNightDeathsToPlayers(
  room: Room,
  finalDeaths: DeathRecord[],
): void {
  for (const d of finalDeaths) {
    const p = room.players.find((pl) => pl.id === d.playerId)
    if (!p) continue
    p.alive = false
    p.deathRound = room.roundNumber
    p.deathTime = 'night'
    p.deathReason = d.reason
  }
}

function applySilenceAfterNight(room: Room): void {
  for (const pl of room.players) {
    pl.isSilenced = false
  }
  if (!room.currentNightSilenced) return
  const silenced = room.players.find(
    (pl) => pl.id === room.currentNightSilenced,
  )
  if (silenced?.alive) silenced.isSilenced = true
}

function pushNightHistoryRecord(
  room: Room,
  finalDeaths: DeathRecord[],
  wolfCubDied: boolean,
): void {
  const nightRecord: NightRecord = {
    night: room.roundNumber,
    wolfTargets: room.wolfFinalTargets,
    seerTarget: room.seerTarget ?? undefined,
    seerIsWolf: room.seerResult ?? undefined,
    guardTarget: room.guardTarget ?? undefined,
    witchSaved: room.witchSaved
      ? (room.wolfFinalTargets[0] ?? undefined)
      : undefined,
    witchKilled: room.witchKillTarget ?? undefined,
    disruptorTarget: room.currentNightSilenced ?? undefined,
    hunterTarget: room.hunterTarget ?? undefined,
    deaths: finalDeaths,
    curseConverted: room.players.find(
      (p) => p.role === 'cursed-wolf' && p.faction === 'wolf',
    )?.id,
    wolfCubDied,
  }
  room.history.nights.push(nightRecord)
  room.currentNightDeaths = finalDeaths
}

function applyPendingHunterFromDay(
  room: Room,
  finalDeaths: DeathRecord[],
): void {
  if (!room.pendingHunterKill) return
  const target = room.players.find((p) => p.id === room.pendingHunterKill)
  if (target?.alive) {
    target.alive = false
    target.deathRound = room.roundNumber
    target.deathTime = 'night'
    target.deathReason = 'hunter-shot'
    finalDeaths.push({
      playerId: room.pendingHunterKill,
      playerName: target.name,
      reason: 'hunter-shot',
    })
  }
  room.pendingHunterKill = null
}

export function resolveNight(room: Room): DeathRecord[] {
  const deaths = collectWolfBiteDeaths(room)
  appendWitchPoisonDeath(room, deaths)

  const wolfCubDied = appendHunterShotChain(room, deaths)
  if (wolfCubDied) room.wolfCubDiedLastNight = true

  const finalDeaths = applyLoversChain(room, deaths)
  markLoverWolfCubFlag(room, deaths, finalDeaths)

  applyNightDeathsToPlayers(room, finalDeaths)
  applySilenceAfterNight(room)
  room.lastGuardTarget = room.guardTarget

  pushNightHistoryRecord(room, finalDeaths, wolfCubDied)
  applyPendingHunterFromDay(room, finalDeaths)

  room.dayDeaths = [...finalDeaths]
  return finalDeaths
}

// Win Condition
export function checkWinCondition(room: Room): Faction | null {
  const wolves = getLivingWolves(room).length
  const villagers = getLivingVillagers(room).length
  if (wolves === 0) return 'villager'
  if (wolves >= villagers) return 'wolf'
  return null
}

// Day Resolution
export function resolveNominations(room: Room): string[] {
  const tally: Record<string, number> = {}
  for (const [, nomineeId] of room.nominations) {
    if (!nomineeId) continue
    tally[nomineeId] = (tally[nomineeId] ?? 0) + 1
  }
  if (Object.keys(tally).length === 0) return []

  const maxVotes = Math.max(...Object.values(tally))
  return Object.entries(tally)
    .filter(([, v]) => v === maxVotes)
    .map(([id]) => id)
}

function buildHangVoteTally(room: Room): Record<string, number> {
  const tally: Record<string, number> = {}
  for (const [, targetId] of room.hangVotes) {
    if (!targetId) continue
    tally[targetId] = (tally[targetId] ?? 0) + 1
  }
  return tally
}

/** Single winner id, or `null` if no votes or a tie. */
function getHangVoteWinnerId(tally: Record<string, number>): string | null {
  if (Object.keys(tally).length === 0) return null
  const maxVotes = Math.max(...Object.values(tally))
  const topVoted = Object.entries(tally).filter(([, v]) => v === maxVotes)
  if (topVoted.length > 1) return null
  return topVoted[0]?.[0] ?? null
}

function applyHangedSideEffects(room: Room, hanged: PlayerFullInfo): void {
  if (hanged.role === 'hunter' && room.hunterTarget) {
    room.pendingHunterKill = room.hunterTarget
  }
  if (hanged.role === 'wolf-cub') room.wolfCubDiedLastNight = true
}

function collectLoverDeathsAfterHang(
  room: Room,
  withLovers: DeathRecord[],
  hangedId: string,
): DeathRecord[] {
  const extraDeaths: DeathRecord[] = []
  for (const d of withLovers) {
    if (d.playerId === hangedId) continue
    const loverPlayer = room.players.find((p) => p.id === d.playerId)
    if (!loverPlayer?.alive) continue
    loverPlayer.alive = false
    loverPlayer.deathRound = room.roundNumber
    loverPlayer.deathTime = 'day'
    loverPlayer.deathReason = 'lover-death'
    extraDeaths.push(d)
  }
  return extraDeaths
}

export function resolveHangVote(room: Room): {
  hangedId: string | null
  extraDeaths: DeathRecord[]
} {
  const tally = buildHangVoteTally(room)
  const hangedId = getHangVoteWinnerId(tally)
  if (hangedId === null) return { hangedId: null, extraDeaths: [] }

  const hanged = room.players.find((p) => p.id === hangedId)
  if (!hanged) return { hangedId: null, extraDeaths: [] }

  hanged.alive = false
  hanged.deathRound = room.roundNumber
  hanged.deathTime = 'day'
  hanged.deathReason = 'hanged'

  applyHangedSideEffects(room, hanged)

  const hangDeaths: DeathRecord[] = [
    { playerId: hangedId, playerName: hanged.name, reason: 'hanged' },
  ]
  const withLovers = applyLoversChain(room, hangDeaths)
  const extraDeaths = collectLoverDeathsAfterHang(room, withLovers, hangedId)

  const primaryDeath = hangDeaths[0]
  const dayRecord: DayRecord = {
    day: room.roundNumber,
    silenced: room.currentNightSilenced ?? undefined,
    nominated: room.nominatedPlayers,
    hanged: hangedId,
    deaths: primaryDeath ? [primaryDeath, ...extraDeaths] : extraDeaths,
  }
  room.history.days.push(dayRecord)

  return { hangedId, extraDeaths }
}

export function resetNightState(room: Room): void {
  room.wolfVotes = new Map()
  room.wolfFinalTargets = []
  room.seerTarget = null
  room.seerResult = null
  room.guardTarget = null
  room.disruptorTarget = null
  room.witchSaved = false
  room.witchKillTarget = null
  room.currentNightDeaths = []
  room.currentNightSilenced = null
  room.cupidTarget1 = null
  room.cupidTarget2 = null
  room.nightStepIndex = 0
  room.nightActions = new Map()
}

export function resetDayState(room: Room): void {
  room.nominations = new Map()
  room.nominatedPlayers = []
  room.hangVotes = new Map()
}
