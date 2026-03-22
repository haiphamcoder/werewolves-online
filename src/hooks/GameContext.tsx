/* Provider + hook belong together; Fast Refresh still updates the provider tree. */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, type ReactNode } from 'react'
import { useGame, type GameState } from './useGame'
import type { NightStep, RoleConfigPatch } from '@/shared/types'

interface GameActions {
  createRoom: () => void
  joinRoom: (roomId: string, playerName: string) => void
  updateConfig: (roleConfig: RoleConfigPatch) => void
  startGame: () => void
  confirmRoleSeen: () => void
  advancePhase: () => void
  skipStep: () => void
  hostNightAction: (step: NightStep, action: Record<string, unknown>) => void
  hostVoteResult: (hangedPlayerId: string | null) => void
}

interface GameContextType {
  state: GameState
  actions: GameActions
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: Readonly<{ children: ReactNode }>) {
  const game = useGame()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}

export function useGameContext(): GameContextType {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used within GameProvider')
  return ctx
}
