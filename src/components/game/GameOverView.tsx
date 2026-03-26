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
  const playerById = new Map(summary.players.map((p) => [p.id, p]))
  const isPresent = <T,>(v: T | null | undefined): v is T => v != null

  const actorByRole = (role: string) =>
    summary.players.find((p) => p.role === role) ?? null

  const renderActor = (roleId: string, fallbackLabel: string) => {
    const p = actorByRole(roleId)
    if (!p) return <Text span>{fallbackLabel}</Text>
    return (
      <Text span>
        {ROLE_NAMES[p.role] ?? p.role} - {p.name}
      </Text>
    )
  }

  const renderWolvesActor = () => {
    const wolves = summary.players.filter((p) => p.faction === 'wolf')
    if (wolves.length === 0) return <Text span>{'Sói'}</Text>
    if (wolves.length === 1) return <Text span>Sói - {wolves[0].name}</Text>
    return <Text span>Sói - {wolves.map((w) => w.name).join(', ')}</Text>
  }

  const renderPerson = (id: string) => {
    const p = playerById.get(id)
    if (!p) return <Text span>{'?'}</Text>
    return (
      <Text span>
        {ROLE_EMOJI[p.role]} {p.name}{' '}
        <Text span c="dimmed">
          ({ROLE_NAMES[p.role] ?? p.role})
        </Text>
      </Text>
    )
  }

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
                          🔮(
                          <Text span>{renderActor('seer', 'Tiên tri')}</Text>)
                          Kiểm tra{' '}
                          <Text span c={n.seerIsWolf ? 'red' : 'teal'}>
                            {renderPerson(n.seerTarget)}
                          </Text>{' '}
                          {n.seerIsWolf ? '(là Sói)' : '(là Dân)'}
                        </Text>
                      )}
                      {n.guardTarget && (
                        <Text size="xs" c="dimmed">
                          🛡️(
                          <Text span>{renderActor('guard', 'Bảo vệ')}</Text>)
                          Gác bảo vệ:{' '}
                          <Text span c="teal">
                            {renderPerson(n.guardTarget)}
                          </Text>
                        </Text>
                      )}
                      {n.witchSaved && (
                        <Text size="xs" c="dimmed">
                          🧪(
                          <Text span>{renderActor('witch', 'Phù thủy')}</Text>)
                          cứu:{' '}
                          <Text span c="teal">
                            {renderPerson(n.witchSaved)}
                          </Text>
                        </Text>
                      )}
                      {n.witchKilled && (
                        <Text size="xs" c="dimmed">
                          🧪(
                          <Text span>{renderActor('witch', 'Phù thủy')}</Text>)
                          độc giết:{' '}
                          <Text span c="red">
                            {renderPerson(n.witchKilled)}
                          </Text>
                        </Text>
                      )}
                      {n.disruptorTarget && (
                        <Text size="xs" c="dimmed">
                          🔇(
                          <Text span>
                            {renderActor('disruptor', 'Phá rối')}
                          </Text>
                          ) bịt miệng:{' '}
                          <Text span c="yellow">
                            {renderPerson(n.disruptorTarget)}
                          </Text>
                        </Text>
                      )}
                      {n.hunterTarget && (
                        <Text size="xs" c="dimmed">
                          🎯(
                          <Text span>{renderActor('hunter', 'Thợ săn')}</Text>)
                          nhắm:{' '}
                          <Text span c="orange">
                            {renderPerson(n.hunterTarget)}
                          </Text>
                        </Text>
                      )}
                      {n.curseConverted && (
                        <Text size="xs" c="dimmed">
                          🐺(Cursed Wolf -{' '}
                          <Text span>{renderPerson(n.curseConverted)}</Text>)
                          quy hàng
                        </Text>
                      )}
                      {n.wolfCubDied && (
                        <Text size="xs" c="dimmed" fs="italic">
                          🐺 Sói con đã chết tối qua
                        </Text>
                      )}
                      {n.wolfTargets.length > 0 && (
                        <Text size="xs" c="dimmed">
                          🐺(
                          <Text span>{renderWolvesActor()}</Text>) cắn:{' '}
                          <Text span c="red">
                            {n.wolfTargets
                              .map((id) => playerById.get(id))
                              .filter(isPresent)
                              .map(
                                (p) =>
                                  `${ROLE_EMOJI[p.role]} ${p.name} (${ROLE_NAMES[p.role] ?? p.role})`,
                              )
                              .join(', ')}
                          </Text>
                        </Text>
                      )}
                      {n.deaths.length > 0 ? (
                        <Text size="xs" c="dimmed">
                          💀 Chết:{' '}
                          <Text span c="red">
                            {n.deaths
                              .map((d) => {
                                const p = playerById.get(d.playerId)
                                if (!p) return d.playerName
                                return `${ROLE_EMOJI[p.role]} ${p.name} (${ROLE_NAMES[p.role] ?? p.role})`
                              })
                              .join(', ')}
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
