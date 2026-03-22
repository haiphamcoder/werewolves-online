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
  Checkbox,
  ScrollArea,
} from '@mantine/core'
import {
  IconMoon,
  IconCheck,
  IconChevronRight,
  IconPlayerSkipForward,
} from '@tabler/icons-react'
import { useState, useEffect } from 'react'
import type { GameState } from '@/hooks/useGame'
import { ROLE_NAMES, ROLE_EMOJI } from '@/shared/constants'
import type { NightStep, RoleId } from '@/shared/types'

interface Props {
  state: GameState
  actions: {
    advancePhase: () => void
    skipStep: () => void
    hostNightAction: (step: NightStep, action: Record<string, unknown>) => void
  }
}

export function HostNightPanel({ state, actions }: Readonly<Props>) {
  const { hostNightStep, hostNightLogs, roundNumber } = state
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [selectedTarget2, setSelectedTarget2] = useState<string | null>(null)
  const [witchSave, setWitchSave] = useState(false)
  const [witchKill, setWitchKill] = useState<string | null>(null)

  // Reset local state when step changes
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedTarget(null)
      setSelectedTarget2(null)
      setWitchSave(false)
      setWitchKill(null)
    })
  }, [hostNightStep?.step])

  if (!hostNightStep) {
    return (
      <Box
        style={{
          minHeight: '100vh',
          background: '#0f1923',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Stack align="center">
          <IconMoon size={48} color="var(--mantine-color-yellow-4)" />
          <Text c="dimmed">Đang chuẩn bị đêm...</Text>
          <Button onClick={actions.advancePhase}>Bắt đầu ▶</Button>
        </Stack>
      </Box>
    )
  }

  const { step, script, actionData } = hostNightStep
  const isActionRequired = !!actionData

  const handleConfirmAction = () => {
    const action: Record<string, unknown> = {}
    if (step === 'wolves') {
      action.targetId = selectedTarget
      if (selectedTarget2) action.targetId2 = selectedTarget2
    } else if (step === 'witch') {
      action.save = witchSave
      action.killTargetId = witchKill
    } else if (step === 'cupid') {
      action.target1 = selectedTarget
      action.target2 = selectedTarget2
    } else {
      action.targetId = selectedTarget
    }
    actions.hostNightAction(step, action)
  }

  return (
    <Box
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(ellipse at center, #1a2332 0%, #0f1923 100%)',
        paddingBlock: '40px',
      }}
    >
      <Container size="md">
        <Stack gap="xl">
          {/* Header */}
          <Group justify="space-between">
            <Stack gap={0}>
              <Title order={3} c="yellow">
                Đêm {roundNumber}
              </Title>
              <Text c="dimmed" size="xs">
                QUẢN TRÒ ĐIỀU PHỐI
              </Text>
            </Stack>
            <Badge size="xl" variant="dot" color="yellow">
              🌙 TRỜI TỐI
            </Badge>
          </Group>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 300px',
              gap: '20px',
            }}
          >
            {/* Left Column: Script & Action */}
            <Stack gap="lg">
              <Paper
                p="xl"
                radius="md"
                style={{
                  background: 'rgba(26, 35, 50, 0.9)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Stack gap="md">
                  <Text fw={700} c="dimmed" tt="uppercase" size="xs">
                    Kịch bản đối thoại:
                  </Text>
                  <Text
                    size="xl"
                    style={{ lineHeight: 1.6, whiteSpace: 'pre-line' }}
                  >
                    {script}
                  </Text>
                </Stack>
              </Paper>

              {isActionRequired && (
                <Paper
                  p="xl"
                  radius="md"
                  style={{
                    background: 'rgba(26, 35, 50, 0.9)',
                    border: '2px solid var(--color-amber)',
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Title order={4} c="amber">
                        {ROLE_EMOJI[
                          (step === 'wolves' ? 'wolf' : step) as RoleId
                        ] || '🎭'}{' '}
                        Thao tác{' '}
                        {ROLE_NAMES[
                          (step === 'wolves' ? 'wolf' : step) as RoleId
                        ] || step}
                      </Title>
                    </Group>

                    {/* Step-specific inputs */}
                    {step === 'wolves' && (
                      <Stack gap="sm">
                        <Select
                          label="Người bị cắn"
                          placeholder="Chọn một người"
                          data={actionData.targets?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                          value={selectedTarget}
                          onChange={setSelectedTarget}
                        />
                        {/* If wolf cub died, can bite two */}
                        <Text size="xs" c="dimmed">
                          Nếu Só con chết, có thể chọn mục tiêu thứ 2.
                        </Text>
                        <Select
                          label="Người bị cắn thứ 2 (nếu có)"
                          placeholder="Chọn một người"
                          data={actionData.targets?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                          value={selectedTarget2}
                          onChange={setSelectedTarget2}
                          clearable
                        />
                      </Stack>
                    )}

                    {step === 'witch' && (
                      <Stack gap="sm">
                        {actionData.witchVictim ? (
                          <Checkbox
                            label={`Cứu ${actionData.witchVictim.name}?`}
                            disabled={!actionData.witchHealAvailable}
                            checked={witchSave}
                            onChange={(e) =>
                              setWitchSave(e.currentTarget.checked)
                            }
                          />
                        ) : (
                          <Text size="sm" c="dimmed">
                            Không ai bị sập hầm.
                          </Text>
                        )}
                        <Select
                          label="Dùng thuốc độc giết ai?"
                          placeholder="Không dùng"
                          disabled={!actionData.witchPoisonAvailable}
                          data={actionData.targets?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                          value={witchKill}
                          onChange={setWitchKill}
                          clearable
                        />
                      </Stack>
                    )}

                    {step === 'cupid' && (
                      <Stack gap="sm">
                        <Select
                          label="Người thứ nhất"
                          data={actionData.targets?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                          value={selectedTarget}
                          onChange={setSelectedTarget}
                        />
                        <Select
                          label="Người thứ hai"
                          data={actionData.targets?.map((t) => ({
                            value: t.id,
                            label: t.name,
                          }))}
                          value={selectedTarget2}
                          onChange={setSelectedTarget2}
                        />
                      </Stack>
                    )}

                    {(step === 'seer' ||
                      step === 'guard' ||
                      step === 'disruptor' ||
                      step === 'hunter') && (
                      <Select
                        label="Chọn mục tiêu"
                        placeholder="Chọn một người"
                        data={actionData.targets?.map((t) => ({
                          value: t.id,
                          label: t.name,
                        }))}
                        value={selectedTarget}
                        onChange={setSelectedTarget}
                      />
                    )}

                    {step === 'traitor' && (
                      <Stack gap="xs">
                        <Text size="sm" c="dimmed">
                          Danh sách Sói cho Phản bội xem:
                        </Text>
                        {actionData.wolfList?.map((w) => (
                          <Badge key={w.id} variant="light" color="red">
                            {w.name}
                          </Badge>
                        ))}
                      </Stack>
                    )}

                    <Button
                      fullWidth
                      size="lg"
                      color="orange"
                      onClick={handleConfirmAction}
                      leftSection={<IconCheck size={20} />}
                    >
                      Xác nhận thao tác
                    </Button>
                  </Stack>
                </Paper>
              )}

              {!isActionRequired && (
                <Button
                  size="xl"
                  variant="filled"
                  color="blue"
                  rightSection={<IconChevronRight size={24} />}
                  onClick={actions.advancePhase}
                >
                  Tiếp theo ▶
                </Button>
              )}

              <Button
                variant="subtle"
                color="gray"
                leftSection={<IconPlayerSkipForward size={16} />}
                onClick={actions.skipStep}
              >
                Bỏ qua vai này
              </Button>
            </Stack>

            {/* Right Column: Logs & Info */}
            <Stack gap="md">
              <Paper
                p="md"
                radius="md"
                style={{ background: 'rgba(26, 35, 50, 0.7)' }}
              >
                <Text fw={600} size="sm" mb="sm" c="dimmed">
                  NHẬT KÝ ĐÊM:
                </Text>
                <ScrollArea h={400}>
                  <Stack gap="xs">
                    {hostNightLogs.length === 0 ? (
                      <Text size="xs" c="dimmed" ta="center" py="xl">
                        Chưa có hành động nào.
                      </Text>
                    ) : (
                      hostNightLogs.map((log) => (
                        <Paper
                          key={log.id}
                          p="xs"
                          radius="xs"
                          style={{ background: 'rgba(255,255,255,0.05)' }}
                        >
                          <Text size="xs" fw={700} c="yellow">
                            {log.roleName}
                          </Text>
                          <Text size="xs">{log.action}</Text>
                        </Paper>
                      ))
                    )}
                  </Stack>
                </ScrollArea>
              </Paper>
            </Stack>
          </div>
        </Stack>
      </Container>
    </Box>
  )
}
