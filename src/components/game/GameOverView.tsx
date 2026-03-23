import {
  Box,
  Container,
  Paper,
  Stack,
  Text,
  Title,
  Button,
  Group,
  Badge,
} from '@mantine/core'
import { IconRefresh } from '@tabler/icons-react'
import type { GameState } from '@/hooks/useGame'
import { ROLE_NAMES, ROLE_EMOJI, DEATH_REASON_LABELS } from '@/shared/constants'

interface Props {
  state: GameState
}

export function GameOverView({ state }: Readonly<Props>) {
  const summary = state.gameSummary
  if (!summary) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-bg-deep)',
        }}
      >
        <Text c="dimmed">Đang tải kết quả...</Text>
      </Box>
    )
  }

  const isWolfWin = summary.winner === 'wolf'

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'var(--color-bg-deep)',
        overflowY: 'auto',
      }}
    >
      <Container size="sm" py="xl">
        <Stack gap="lg" className="animate-slide-up">
          {/* Winner Banner */}
          <Paper
            p="xl"
            radius="lg"
            ta="center"
            style={{
              background: isWolfWin
                ? 'rgba(229, 83, 75, 0.05)'
                : 'rgba(70, 147, 212, 0.05)',
              border: `2px solid ${isWolfWin ? 'rgba(229, 83, 75, 0.3)' : 'rgba(70, 147, 212, 0.3)'}`,
            }}
          >
            <Text style={{ fontSize: '4rem' }}>{isWolfWin ? '🐺' : '🎉'}</Text>
            <Title
              order={1}
              mt="xs"
              c={isWolfWin ? 'red' : 'blue'}
              style={{ fontSize: '2rem' }}
            >
              {isWolfWin ? 'Phe Sói chiến thắng!' : 'Phe Dân chiến thắng!'}
            </Title>
          </Paper>

          {/* Player Summary */}
          <div>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={2} mb="sm">
              <span style={{ color: 'var(--color-coral)' }}>{'//'}</span> Bảng
              tổng kết
            </Text>
            <Stack gap="xs">
              {summary.players.map((p) => (
                <Paper
                  key={p.id}
                  p="sm"
                  radius="sm"
                  style={{
                    background: 'rgba(26, 35, 50, 0.8)',
                    border: '1px solid rgba(45, 61, 82, 0.3)',
                    opacity: p.alive ? 1 : 0.6,
                  }}
                >
                  <Group justify="space-between" wrap="nowrap">
                    <Group gap="sm" wrap="nowrap">
                      <Text size="lg">{ROLE_EMOJI[p.role]}</Text>
                      <div>
                        <Group gap={6}>
                          <Text size="sm" fw={600}>
                            {p.name}
                          </Text>
                          <Badge
                            size="xs"
                            variant="light"
                            color={p.faction === 'wolf' ? 'red' : 'blue'}
                          >
                            {p.faction === 'wolf' ? 'Sói' : 'Dân'}
                          </Badge>
                        </Group>
                        <Text size="xs" c="dimmed">
                          {ROLE_NAMES[p.role]}
                        </Text>
                      </div>
                    </Group>
                    <div style={{ textAlign: 'right' }}>
                      <Text size="xs" c={p.alive ? 'teal' : 'red'}>
                        {p.alive ? '✅ Sống' : '💀 Chết'}
                      </Text>
                      {!p.alive && p.deathRound && (
                        <Text size="xs" c="dimmed">
                          {p.deathTime === 'night'
                            ? `Đêm ${p.deathRound}`
                            : `Ngày ${p.deathRound}`}
                          {p.deathReason &&
                            ` · ${DEATH_REASON_LABELS[p.deathReason] ?? p.deathReason}`}
                        </Text>
                      )}
                    </div>
                  </Group>
                </Paper>
              ))}
            </Stack>
          </div>

          {/* Night History */}
          {summary.history.nights.length > 0 && (
            <div>
              <Text
                size="xs"
                c="dimmed"
                tt="uppercase"
                fw={600}
                lts={2}
                mb="sm"
              >
                <span style={{ color: 'var(--color-amber)' }}>{'//'}</span> Lịch
                sử đêm
              </Text>
              <Stack gap="xs">
                {summary.history.nights.map((n) => (
                  <Paper
                    key={n.night}
                    p="sm"
                    radius="sm"
                    style={{
                      background: 'rgba(26, 35, 50, 0.6)',
                      border: '1px solid rgba(45, 61, 82, 0.3)',
                    }}
                  >
                    <Text size="sm" fw={600} c="yellow" mb={4}>
                      🌙 Đêm {n.night}
                    </Text>
                    <Stack gap={2}>
                      {n.seerTarget && (
                        <Text size="xs" c="dimmed">
                          🔮 Thị xem:{' '}
                          <Text span c={n.seerIsWolf ? 'red' : 'teal'}>
                            {summary.players.find((p) => p.id === n.seerTarget)
                              ?.name ?? '?'}
                          </Text>{' '}
                          {n.seerIsWolf ? '(là Sói)' : '(là Dân)'}
                        </Text>
                      )}
                      {n.guardTarget && (
                        <Text size="xs" c="dimmed">
                          🛡️ Gác bảo vệ:{' '}
                          <Text span c="teal">
                            {summary.players.find((p) => p.id === n.guardTarget)
                              ?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.witchSaved && (
                        <Text size="xs" c="dimmed">
                          🧪 Phù thủy cứu:{' '}
                          <Text span c="teal">
                            {summary.players.find((p) => p.id === n.witchSaved)
                              ?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.witchKilled && (
                        <Text size="xs" c="dimmed">
                          🧪 Phù thủy độc giết:{' '}
                          <Text span c="red">
                            {summary.players.find((p) => p.id === n.witchKilled)
                              ?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.disruptorTarget && (
                        <Text size="xs" c="dimmed">
                          🔇 Phá rối bịt miệng:{' '}
                          <Text span c="yellow">
                            {summary.players.find(
                              (p) => p.id === n.disruptorTarget,
                            )?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.hunterTarget && (
                        <Text size="xs" c="dimmed">
                          🎯 Săn nhắm:{' '}
                          <Text span c="orange">
                            {summary.players.find(
                              (p) => p.id === n.hunterTarget,
                            )?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.curseConverted && (
                        <Text size="xs" c="dimmed">
                          🐺 Cursed Wolf quy hàng:{' '}
                          <Text span c="red">
                            {summary.players.find(
                              (p) => p.id === n.curseConverted,
                            )?.name ?? '?'}
                          </Text>
                        </Text>
                      )}
                      {n.wolfCubDied && (
                        <Text size="xs" c="dimmed" fs="italic">
                          🐺 Sói con đã chết tối qua
                        </Text>
                      )}
                      {n.wolfTargets.length > 0 && (
                        <Text size="xs" c="dimmed">
                          🐺 Sói cắn:{' '}
                          <Text span c="red">
                            {n.wolfTargets
                              .map(
                                (id) =>
                                  summary.players.find((p) => p.id === id)
                                    ?.name,
                              )
                              .join(', ')}
                          </Text>
                        </Text>
                      )}
                      {n.deaths.length > 0 ? (
                        <Text size="xs" c="dimmed">
                          💀 Chết:{' '}
                          <Text span c="red">
                            {n.deaths.map((d) => d.playerName).join(', ')}
                          </Text>
                        </Text>
                      ) : (
                        <Text size="xs" c="dimmed" fs="italic">
                          Không ai chết
                        </Text>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </div>
          )}

          {/* Refresh */}
          <Button
            fullWidth
            size="lg"
            variant="gradient"
            gradient={{ from: '#e5534b', to: '#d4a72c', deg: 135 }}
            leftSection={<IconRefresh size={20} />}
            onClick={() => {
              globalThis.location.href = '/'
            }}
            style={{ fontWeight: 700 }}
          >
            Chơi lại
          </Button>

          <Text size="xs" c="dimmed" ta="center">
            The Werewolves of Millers Hollow — Phiên bản Việt Nam
          </Text>
        </Stack>
      </Container>
    </Box>
  )
}
