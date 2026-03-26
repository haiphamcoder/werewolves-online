import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Box, LoadingOverlay, Text, Stack } from '@mantine/core'
import { useGameContext } from '@/hooks/GameContext'
import { LobbySetup } from '@/components/host/LobbySetup'
import { RoleRevealView } from '@/components/player/RoleReveal'
import { PlayerGameView } from '@/components/player/PlayerGameView'
import { PlayerHelpAffix } from '@/components/player/PlayerHelpAffix'
import { HostNightPanel } from '@/components/host/HostNightPanel'
import { HostDayPanel } from '@/components/host/HostDayPanel'
import { GameOverView } from '@/components/game/GameOverView'

export function RoomPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { state, actions } = useGameContext()

  useEffect(() => {
    if (roomId) {
      document.title = `Phòng ${roomId} — Ma Sói Online`
    }
  }, [roomId])

  // If no room state, redirect home
  useEffect(() => {
    if (!state.roomId && !state.isConnected) {
      navigate('/')
    }
  }, [state.roomId, state.isConnected, navigate])

  if (!state.roomId) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack align="center" gap="md">
          <Text size="xl">🐺</Text>
          <Text c="dimmed">Đang kết nối...</Text>
          <LoadingOverlay visible />
        </Stack>
      </Box>
    )
  }

  // ── Waiting Lobby (Common) ───────────────────────────────────────────
  if (state.phase === 'waiting') {
    return <LobbySetup state={state} actions={actions} />
  }

  // ── Role Reveal (Common) ─────────────────────────────────────────────
  if (state.phase === 'role-reveal') {
    return (
      <>
        <RoleRevealView state={state} actions={actions} />
        <PlayerHelpAffix state={state} />
      </>
    )
  }

  // ── Game Over (Common) ──────────────────────────────────────────────
  if (state.phase === 'game-over') {
    return <GameOverView state={state} />
  }

  // ── GAME FLOW ────────────────────────────────────────────────────────
  // Host sees control panels, Players see passive results
  if (state.isHost) {
    switch (state.phase) {
      case 'night':
        return <HostNightPanel state={state} actions={actions} />
      case 'day-result':
      case 'day-discussion':
      case 'day-vote':
        return <HostDayPanel state={state} actions={actions} />
      default:
        return (
          <Box p="xl">
            <Text>Pha host chưa hỗ trợ: {state.phase}</Text>
          </Box>
        )
    }
  } else {
    // Player view is passive for all game phases
    return (
      <>
        <PlayerGameView state={state} />
        <PlayerHelpAffix state={state} />
      </>
    )
  }
}
