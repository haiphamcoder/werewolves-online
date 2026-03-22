import {
  Box,
  Container,
  Stack,
  Text,
  Title,
  Paper,
  Button,
  Group,
  Badge,
  Select,
  Divider,
} from '@mantine/core'
import { IconSun, IconCheck } from '@tabler/icons-react'
import { useState } from 'react'
import type { GameState } from '@/hooks/useGame'

interface Props {
  state: GameState
  actions: {
    advancePhase: () => void
    hostVoteResult: (playerId: string | null) => void
  }
}

export function HostDayPanel({ state, actions }: Readonly<Props>) {
  const { phase, roundNumber, dayDeaths, silenced, players } = state
  const livingPlayers = players.filter((p) => p.alive)
  const [hangedId, setHangedId] = useState<string | null>(null)

  // Render Day Result
  if (phase === 'day-result') {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: '#1a2332',
          paddingBlock: '40px',
        }}
      >
        <Container size="xs">
          <Stack gap="xl" align="center">
            <Group>
              <IconSun size={48} color="orange" />
              <Title order={2}>Sáng ngày {roundNumber}</Title>
            </Group>

            <Paper
              p="xl"
              radius="md"
              style={{ background: 'rgba(26, 35, 50, 0.9)', width: '100%' }}
            >
              <Stack gap="md">
                <Text fw={700} size="sm" c="dimmed" tt="uppercase">
                  Kịch bản:
                </Text>
                <Text size="lg" fs="italic">
                  "Trời sáng rồi, cả làng hãy mở mắt dậy. Đêm qua..."
                </Text>

                {dayDeaths.length === 0 ? (
                  <Text size="xl" ta="center" c="teal" fw={800}>
                    "...không có ai qua đời!"
                  </Text>
                ) : (
                  <Stack gap="xs">
                    <Text size="xl" ta="center" c="red" fw={800}>
                      "...có {dayDeaths.length} người đã ngã xuống:"
                    </Text>
                    {dayDeaths.map((d) => (
                      <Text key={d.playerId} size="lg" ta="center" fw={700}>
                        💀 {d.playerName}
                      </Text>
                    ))}
                  </Stack>
                )}

                {silenced && (
                  <Badge
                    size="lg"
                    color="orange"
                    variant="light"
                    fullWidth
                    mt="md"
                  >
                    🤐 {silenced.name} bị bịt miệng, không được nói.
                  </Badge>
                )}

                <Divider my="md" />

                <Text size="sm" c="dimmed">
                  Mời mọi người bắt đầu thảo luận.
                </Text>

                <Button
                  size="lg"
                  color="blue"
                  onClick={actions.advancePhase}
                  rightSection={<IconCheck size={20} />}
                >
                  Bắt đầu thảo luận ▶
                </Button>
              </Stack>
            </Paper>
          </Stack>
        </Container>
      </Box>
    )
  }

  // Render Discussion / Vote
  return (
    <Box
      style={{
        minHeight: '100vh',
        background: '#1a2332',
        paddingBlock: '40px',
      }}
    >
      <Container size="sm">
        <Stack gap="xl">
          <Group justify="space-between">
            <Title order={2}>
              {phase === 'day-discussion' ? '📢 Thảo luận' : '⚖ Biểu quyết'}
            </Title>
            <Badge size="xl" color="blue">
              {phase === 'day-discussion' ? '💡 Thảo luận' : '⚖ Biểu quyết'}
            </Badge>
          </Group>

          <Paper
            p="xl"
            radius="md"
            style={{ background: 'rgba(26, 35, 50, 0.9)' }}
          >
            <Stack gap="lg">
              {phase === 'day-discussion' ? (
                <>
                  <Text size="lg">
                    Quản trò hãy điều phối thảo luận thực tế giữa các người
                    chơi.
                  </Text>
                  <Button
                    size="lg"
                    color="orange"
                    onClick={actions.advancePhase}
                  >
                    Kết thúc thảo luận & Vote ▶
                  </Button>
                </>
              ) : (
                <>
                  <Text size="lg" fw={700}>
                    Kết quả bỏ phiếu thực tế:
                  </Text>
                  <Select
                    label="Ai bị treo cổ?"
                    placeholder="Chọn người nhận nhiều phiếu nhất"
                    data={[
                      { value: 'none', label: '❌ Không ai bị treo cổ' },
                      ...livingPlayers.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                    value={hangedId}
                    onChange={setHangedId}
                  />

                  <Button
                    size="lg"
                    color="red"
                    disabled={!hangedId}
                    onClick={() => {
                      actions.hostVoteResult(
                        hangedId === 'none' ? null : hangedId,
                      )
                      actions.advancePhase()
                    }}
                    leftSection={<IconCheck size={20} />}
                  >
                    Xác nhận kết quả & Sang đêm tiếp theo
                  </Button>
                </>
              )}
            </Stack>
          </Paper>

          {/* Living list for host reference */}
          <Paper
            p="md"
            radius="md"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          >
            <Text size="xs" fw={700} c="dimmed" mb="xs">
              DANH SÁCH CÒN SỐNG ({livingPlayers.length})
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {livingPlayers.map((p) => (
                <Badge
                  key={p.id}
                  variant="outline"
                  color={p.isSilenced ? 'orange' : 'blue'}
                >
                  {p.name}
                </Badge>
              ))}
            </div>
          </Paper>
        </Stack>
      </Container>
    </Box>
  )
}
