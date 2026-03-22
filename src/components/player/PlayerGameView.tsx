import type { CSSProperties, ReactNode } from 'react'
import { Box, Container, Stack, Text, Title, Paper, Badge } from '@mantine/core'
import { IconMoon, IconSun, IconUsers, IconSkull } from '@tabler/icons-react'
import type { GameState } from '@/hooks/useGame'

interface Props {
  state: GameState
}

export function PlayerGameView({ state }: Readonly<Props>) {
  const { phase, roundNumber, dayDeaths, silenced, players, myPlayerId } = state
  const me = players.find((p) => p.id === myPlayerId)

  if (me && !me.alive) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0a0a0a',
        }}
      >
        <Stack align="center" gap="xl">
          <IconSkull size={80} color="var(--mantine-color-red-9)" />
          <Title order={2} c="red">
            Bạn đã hy sinh
          </Title>
          <Text c="dimmed" ta="center">
            Hãy giữ bí mật vai trò của mình và không thảo luận làm ảnh hưởng đến
            game.
          </Text>
        </Stack>
      </Box>
    )
  }

  // ── Render based on phase ──────────────────────────────────────────────
  switch (phase) {
    case 'night':
      return (
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(ellipse at center, #1a2332 0%, #0f1923 100%)',
          }}
        >
          <Stack align="center" gap="lg" className="animate-fade-in">
            <IconMoon size={64} color="var(--mantine-color-yellow-4)" />
            <Title order={2} c="yellow">
              Đêm {roundNumber}
            </Title>
            <Text size="xl" fw={700} ta="center">
              Cả làng đang ngủ...
            </Text>
            <Text c="dimmed" fs="italic">
              Hãy giữ im lặng tuyệt đối.
            </Text>
          </Stack>
        </Box>
      )

    case 'day-result':
      return (
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(ellipse at center, #1a2332 0%, #0f1923 100%)',
          }}
        >
          <Container size="xs">
            <Stack align="center" gap="lg" className="animate-slide-up">
              <IconSun size={64} color="var(--mantine-color-orange-5)" />
              <Title order={2}>Bình minh — Ngày {roundNumber}</Title>

              <Paper
                p="lg"
                radius="md"
                style={{
                  width: '100%',
                  background: 'rgba(26, 35, 50, 0.9)',
                  border: '1px solid rgba(45, 61, 82, 0.5)',
                }}
              >
                {dayDeaths.length === 0 ? (
                  <Text ta="center" c="teal" fw={600} size="lg">
                    🎉 Không ai chết đêm qua!
                  </Text>
                ) : (
                  <Stack gap="sm">
                    <Text size="sm" c="dimmed" tt="uppercase" fw={600}>
                      Đã chết đêm qua:
                    </Text>
                    {dayDeaths.map((d) => (
                      <Text
                        key={d.playerId}
                        size="xl"
                        fw={800}
                        c="red"
                        ta="center"
                      >
                        💀 {d.playerName}
                      </Text>
                    ))}
                  </Stack>
                )}

                {silenced && (
                  <>
                    <PhaseDivider my="md" label="Thông báo" />
                    <Badge size="lg" variant="light" color="orange" fullWidth>
                      🤐 {silenced.name} — không được nói hôm nay
                    </Badge>
                  </>
                )}
              </Paper>

              <Text c="dimmed" fs="italic" ta="center">
                Hãy nghe quản trò điều phối thảo luận.
              </Text>
            </Stack>
          </Container>
        </Box>
      )

    case 'day-discussion':
    case 'day-vote':
      return (
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background:
              'radial-gradient(ellipse at center, #1a2332 0%, #0f1923 100%)',
          }}
        >
          <Stack align="center" gap="lg">
            <IconUsers size={64} color="var(--mantine-color-blue-4)" />
            <Title order={2}>Thảo luận & Biểu quyết</Title>
            <Text size="xl" fw={700} ta="center">
              Hãy thảo luận trực tiếp!
            </Text>
            <Text c="dimmed" ta="center">
              Mọi thao tác bỏ phiếu sẽ được Quản trò thực hiện.
            </Text>

            <Paper
              p="md"
              radius="md"
              style={{ background: 'rgba(26, 35, 50, 0.8)' }}
            >
              <Stack gap="xs">
                <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                  Người chơi còn sống:
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {players
                    .filter((p) => p.alive)
                    .map((p) => (
                      <Badge
                        key={p.id}
                        variant="outline"
                        color={p.isSilenced ? 'orange' : 'blue'}
                      >
                        {p.isSilenced ? '🤐 ' : ''}
                        {p.name}
                      </Badge>
                    ))}
                </div>
              </Stack>
            </Paper>
          </Stack>
        </Box>
      )

    default:
      return (
        <Box
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text c="dimmed">Chờ đợi...</Text>
        </Box>
      )
  }
}

function PhaseDivider({
  my,
  label,
}: Readonly<{
  my?: CSSProperties['marginBlock']
  label: ReactNode
}>) {
  return (
    <div
      style={{
        marginBlock: my,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '-10px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#1a2332',
          padding: '0 8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
        }}
      >
        {label}
      </span>
    </div>
  )
}
