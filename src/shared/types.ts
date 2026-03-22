/** All playable role ids — single source for `RoleId` and runtime checks */
export const ROLE_IDS = [
  'wolf',
  'wolf-cub',
  'cursed-wolf',
  'villager',
  'seer',
  'guard',
  'witch',
  'hunter',
  'disruptor',
  'traitor',
  'cupid',
] as const

export type RoleId = (typeof ROLE_IDS)[number]

export type Faction = 'wolf' | 'villager'

// Game Phases
export type GamePhase =
  | 'waiting'
  | 'role-reveal'
  | 'night'
  | 'day-result'
  | 'day-discussion'
  | 'day-vote'
  | 'game-over'

/** Host night order — single source for `NightStep` */
export const NIGHT_ORDER = [
  'disruptor',
  'cupid',
  'wolves',
  'traitor',
  'seer',
  'guard',
  'witch',
  'hunter',
] as const

export type NightStep = (typeof NIGHT_ORDER)[number]

export type NightUiState = 'calling' | 'acting' | 'fake-wait' | 'sleeping'

export type DeathReason =
  | 'wolf'
  | 'witch-poison'
  | 'hunter-shot'
  | 'hanged'
  | 'lover-death'

/** Common `{ id, name }` shape for UI lists / socket payloads */
export interface NamedPlayer {
  id: string
  name: string
}

// Player
export interface PlayerInfo {
  id: string
  name: string
  isHost: boolean
  isConnected: boolean
  alive: boolean
  isSilenced: boolean
}

export interface PlayerPrivateInfo {
  role: RoleId
  faction: Faction
}

export interface PlayerFullInfo extends PlayerInfo {
  role: RoleId
  faction: Faction
  deathRound?: number
  deathTime?: 'night' | 'day'
  deathReason?: DeathReason
}

// Room
export type RoomStatus = 'waiting' | 'playing' | 'finished'

/** Count per role in lobby / room config */
export type RoleConfig = Record<RoleId, number>

export type RoleConfigPatch = Partial<RoleConfig>

export interface RoomPublicState {
  roomId: string
  status: RoomStatus
  players: PlayerInfo[]
  roleConfig: RoleConfig
  phase: GamePhase
  roundNumber: number
}

// Death Record
export interface DeathRecord {
  playerId: string
  playerName: string
  reason: DeathReason
}

// Night Records
export interface NightRecord {
  night: number
  wolfTargets: string[]
  seerTarget?: string
  seerIsWolf?: boolean
  guardTarget?: string
  witchSaved?: string
  witchKilled?: string
  disruptorTarget?: string
  hunterTarget?: string
  deaths: DeathRecord[]
  curseConverted?: string
  wolfCubDied: boolean
}

export interface DayRecord {
  day: number
  silenced?: string
  nominated: string[]
  hanged?: string
  deaths: DeathRecord[]
}

export interface GameHistory {
  nights: NightRecord[]
  days: DayRecord[]
}

// Night Action Data (for host selection UI)
export interface NightActionData {
  step: NightStep
  targets?: NamedPlayer[]
  seerResult?: boolean
  witchVictim?: NamedPlayer | null
  witchHealAvailable?: boolean
  witchPoisonAvailable?: boolean
  lastGuardTarget?: string
  wolfList?: NamedPlayer[]
  isFirstNight?: boolean
  loverIds?: [string, string]
}

// Host Night Action Log
export interface NightActionLog {
  step: NightStep
  roleName: string
  playerName: string
  action: string
}

// Vote Data
export type VoteType = 'nominate' | 'hang'

export interface VoteRequest {
  voteType: VoteType
  voterName: string
  voterId: string
  candidates: NamedPlayer[]
}

export interface VoteResult {
  voteType: VoteType
  tally: Record<string, number>
  result: string | null
}

// Game Summary
export interface GameSummary {
  winner: Faction
  players: PlayerFullInfo[]
  history: GameHistory
}

/** Lobby preset row for role picker UI */
export interface RolePreset {
  label: string
  players: number
  config: RoleConfigPatch
}

// Socket Events
export interface ServerToClientEvents {
  // Room
  'room:created': (roomId: string) => void
  'room:state': (state: RoomPublicState) => void
  'room:player-joined': (player: PlayerInfo) => void
  'room:player-left': (playerId: string) => void
  'room:config-updated': (config: { roleConfig: RoleConfig }) => void
  'room:error': (message: string) => void

  // Game
  'game:started': () => void
  'game:role-assigned': (info: PlayerPrivateInfo) => void
  'game:role-seen-count': (
    seen: number,
    total: number,
    confirmedIds: string[],
  ) => void
  'game:phase-changed': (phase: GamePhase, roundNumber: number) => void
  'game:day-result': (
    deaths: DeathRecord[],
    silenced: NamedPlayer | null,
  ) => void
  'game:game-over': (summary: GameSummary) => void
  'game:players-update': (players: PlayerInfo[]) => void

  // Host-only events (only received by host)
  'host:night-step-data': (
    step: NightStep,
    script: string,
    actionData: NightActionData | null,
  ) => void
  'host:night-action-log': (log: NightActionLog) => void
  'host:night-resolved': (
    deaths: DeathRecord[],
    silenced: NamedPlayer | null,
  ) => void
}

export interface ClientToServerEvents {
  // Room
  'room:create': () => void
  'room:join': (roomId: string, playerName: string) => void
  'room:update-config': (config: { roleConfig: RoleConfigPatch }) => void
  'room:start-game': () => void

  // Game (player only)
  'game:role-seen': () => void

  // Host controls
  'host:advance-phase': () => void
  'host:night-action': (
    step: NightStep,
    action: Record<string, unknown>,
  ) => void
  'host:skip-step': () => void
  'host:vote-result': (hangedPlayerId: string | null) => void

  // Reconnect
  'room:reconnect': (roomId: string, playerName: string) => void
}
