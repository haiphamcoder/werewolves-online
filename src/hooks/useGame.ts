import { useState, useCallback, useEffect, useMemo } from 'react'
import type {
  RoomPublicState,
  PlayerInfo,
  RoleConfigPatch,
  PlayerPrivateInfo,
  GamePhase,
  NightStep,
  NightActionData,
  NightActionLog,
  DeathRecord,
  GameSummary,
  NamedPlayer,
  ServerToClientEvents,
} from '@/shared/types'
import { useSocket } from './useSocket'

export interface GameState {
  // Connection
  isConnected: boolean
  error: string | null

  // Room
  roomId: string | null
  roomStatus: RoomPublicState | null
  players: PlayerInfo[]
  isHost: boolean
  myPlayerId: string | null

  // My role (private)
  myRole: PlayerPrivateInfo | null
  roleConfirmed: boolean

  // Role reveal
  roleSeenCount: { seen: number; total: number; confirmedIds: string[] }

  // Game phase
  phase: GamePhase
  roundNumber: number

  // Night (Host only)
  hostNightStep: {
    step: NightStep
    script: string
    actionData: NightActionData | null
  } | null
  hostNightLogs: NightActionLog[]
  hostNightResolved: {
    deaths: DeathRecord[]
    silenced: NamedPlayer | null
  } | null

  // Day
  dayDeaths: DeathRecord[]
  silenced: NamedPlayer | null

  // Game over
  gameSummary: GameSummary | null
}

// Socket-derived fields are merged in useGame() return; rest lives in React state
type GameStateStored = Omit<GameState, 'isConnected' | 'myPlayerId'>

const initialStored: GameStateStored = {
  error: null,
  roomId: null,
  roomStatus: null,
  players: [],
  isHost: false,
  myRole: null,
  roleConfirmed: false,
  roleSeenCount: { seen: 0, total: 0, confirmedIds: [] },
  phase: 'waiting',
  roundNumber: 0,
  hostNightStep: null,
  hostNightLogs: [],
  hostNightResolved: null,
  dayDeaths: [],
  silenced: null,
  gameSummary: null,
}

type RoomConfigUpdatedPayload = Parameters<
  ServerToClientEvents['room:config-updated']
>[0]

function upsertPlayer(
  prev: GameStateStored,
  player: PlayerInfo,
): GameStateStored {
  const without = prev.players.filter((p) => p.id !== player.id)
  return { ...prev, players: [...without, player] }
}

function removePlayerById(
  prev: GameStateStored,
  playerId: string,
): GameStateStored {
  return {
    ...prev,
    players: prev.players.filter((p) => p.id !== playerId),
  }
}

function mergeRoomConfigUpdated(
  prev: GameStateStored,
  config: RoomConfigUpdatedPayload,
): GameStateStored {
  if (!prev.roomStatus) {
    return prev
  }
  return {
    ...prev,
    roomStatus: { ...prev.roomStatus, ...config },
  }
}

function appendHostNightLog(
  prev: GameStateStored,
  log: NightActionLog,
): GameStateStored {
  return {
    ...prev,
    hostNightLogs: [...prev.hostNightLogs, log],
  }
}

export function useGame() {
  const { isConnected, emit, on, socket } = useSocket()
  const [stored, setStored] = useState<GameStateStored>(initialStored)

  const patch = useCallback((partial: Partial<GameStateStored>) => {
    setStored((prev) => ({ ...prev, ...partial }))
  }, [])

  const state: GameState = useMemo(
    () => ({
      ...stored,
      isConnected,
      myPlayerId: socket.current?.id ?? null,
    }),
    [stored, isConnected, socket],
  )

  // Socket event listeners
  useEffect(() => {
    const unsubs: (() => void)[] = [
      on('room:created', (roomId) => {
        patch({ roomId, isHost: true, error: null })
      }),
      on('room:state', (roomState) => {
        patch({
          roomId: roomState.roomId,
          roomStatus: roomState,
          players: roomState.players,
          phase: roomState.phase,
          roundNumber: roomState.roundNumber,
          error: null,
        })
      }),
      on('room:player-joined', (player) => {
        setStored((prev) => upsertPlayer(prev, player))
      }),
      on('room:player-left', (playerId) => {
        setStored((prev) => removePlayerById(prev, playerId))
      }),
      on('room:config-updated', (config) => {
        setStored((prev) => mergeRoomConfigUpdated(prev, config))
      }),
      on('room:error', (message) => {
        patch({ error: message })
      }),
      on('game:started', () => {
        patch({ phase: 'role-reveal', roleConfirmed: false, hostNightLogs: [] })
      }),
      on('game:role-assigned', (info) => {
        patch({ myRole: info })
      }),
      on('game:role-seen-count', (seen, total, confirmedIds) => {
        patch({ roleSeenCount: { seen, total, confirmedIds } })
      }),
      on('game:phase-changed', (phase, roundNumber) => {
        patch({
          phase,
          roundNumber,
          hostNightStep: null,
          hostNightResolved: null,
          ...(phase === 'night' ? { hostNightLogs: [] } : {}),
        })
      }),
      on('game:day-result', (deaths, silenced) => {
        patch({ dayDeaths: deaths, silenced, phase: 'day-result' })
      }),
      on('game:game-over', (summary) => {
        patch({ gameSummary: summary, phase: 'game-over' })
      }),
      on('game:players-update', (players) => {
        patch({ players })
      }),
      on('host:night-step-data', (step, script, actionData) => {
        patch({ hostNightStep: { step, script, actionData } })
      }),
      on('host:night-action-log', (log) => {
        setStored((prev) => appendHostNightLog(prev, log))
      }),
      on('host:night-resolved', (deaths, silenced) => {
        patch({ hostNightResolved: { deaths, silenced } })
      }),
    ]

    return () => unsubs.forEach((fn) => fn())
  }, [on, patch])

  const createRoom = useCallback(() => {
    emit('room:create')
    patch({ isHost: true })
  }, [emit, patch])

  const joinRoom = useCallback(
    (roomId: string, playerName: string) => {
      emit('room:join', roomId.toUpperCase(), playerName)
      patch({ roomId: roomId.toUpperCase(), isHost: false })
    },
    [emit, patch],
  )

  const updateConfig = useCallback(
    (roleConfig: RoleConfigPatch) => {
      emit('room:update-config', { roleConfig })
    },
    [emit],
  )

  const startGame = useCallback(() => {
    emit('room:start-game')
  }, [emit])

  const confirmRoleSeen = useCallback(() => {
    emit('game:role-seen')
    patch({ roleConfirmed: true })
  }, [emit, patch])

  const advancePhase = useCallback(() => {
    emit('host:advance-phase')
  }, [emit])

  const skipStep = useCallback(() => {
    emit('host:skip-step')
  }, [emit])

  const hostNightAction = useCallback(
    (step: NightStep, action: Record<string, unknown>) => {
      emit('host:night-action', step, action)
    },
    [emit],
  )

  const hostVoteResult = useCallback(
    (hangedPlayerId: string | null) => {
      emit('host:vote-result', hangedPlayerId)
    },
    [emit],
  )

  return {
    state,
    actions: {
      createRoom,
      joinRoom,
      updateConfig,
      startGame,
      confirmRoleSeen,
      advancePhase,
      skipStep,
      hostNightAction,
      hostVoteResult,
    },
  }
}
