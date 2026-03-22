import { useMemo, useCallback } from 'react'
import {
  Container,
  Paper,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Badge,
  ActionIcon,
  Box,
  Tooltip,
  CopyButton,
} from '@mantine/core'
import {
  IconPlus,
  IconMinus,
  IconCopy,
  IconCheck,
  IconPlayerPlay,
} from '@tabler/icons-react'
import { QRCodeSVG } from 'qrcode.react'
import type { GameState } from '@/hooks/useGame'
import type { RoleConfig, RoleId } from '@/shared/types'
import {
  ROLE_NAMES,
  ROLE_EMOJI,
  ROLE_DESC,
  ROLE_POINTS,
  CONFIGURABLE_ROLES,
  PRESETS,
} from '@/shared/constants'

const FALLBACK_ROLE_CONFIG: RoleConfig = {
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
}

function balanceScoreTextColor(
  balanceScore: number,
): 'teal' | 'red' | 'yellow' {
  if (Math.abs(balanceScore) <= 3) return 'teal'
  if (balanceScore < 0) return 'red'
  return 'yellow'
}

function balanceScoreHintText(balanceScore: number): string {
  if (Math.abs(balanceScore) <= 3) return '(cân bằng)'
  if (balanceScore < 0) return '(nghiêng về Sói)'
  return '(nghiêng về Dân)'
}

interface Props {
  state: GameState
  actions: {
    updateConfig: (roleConfig: RoleConfig) => void
    startGame: () => void
  }
}

export function LobbySetup({ state, actions }: Readonly<Props>) {
  const roleConfig = useMemo(
    () => state.roomStatus?.roleConfig ?? FALLBACK_ROLE_CONFIG,
    [state.roomStatus?.roleConfig],
  )

  const totalRoles = useMemo(
    () => Object.values(roleConfig).reduce((a, b) => a + b, 0),
    [roleConfig],
  )

  const balanceScore = useMemo(() => {
    let score = 0
    for (const [role, count] of Object.entries(roleConfig)) {
      score += (ROLE_POINTS[role as RoleId] ?? 0) * count
    }
    return score
  }, [roleConfig])

  const canStart =
    state.isHost &&
    state.players.length >= 3 &&
    state.players.length === totalRoles

  const setRoleCount = useCallback(
    (role: RoleId, delta: number) => {
      const updated = {
        ...roleConfig,
        [role]: Math.max(0, roleConfig[role] + delta),
      }
      actions.updateConfig(updated)
    },
    [roleConfig, actions],
  )

  const applyPreset = useCallback(
    (config: Partial<Record<RoleId, number>>) => {
      const updated: RoleConfig = { ...roleConfig }
      for (const k of Object.keys(updated) as RoleId[]) {
        updated[k] = 0
      }
      for (const [role, count] of Object.entries(config)) {
        const r = role as RoleId
        if (r in updated) updated[r] = count ?? 0
      }
      actions.updateConfig(updated)
    },
    [roleConfig, actions],
  )

  return (
    <Box
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at top, #1a2332 0%, #0f1923 100%)',
      }}
    >
      <Container size="sm" py="xl">
        <Stack gap="lg">
          {/* Header with room code + QR */}
          <Paper
            p="lg"
            radius="md"
            style={{
              background: 'rgba(26, 35, 50, 0.9)',
              border: '1px solid rgba(45, 61, 82, 0.5)',
            }}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <div style={{ flex: 1 }}>
                <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={2}>
                  Mã Phòng
                </Text>
                <Group gap="xs" mt={4}>
                  <Title
                    order={2}
                    style={{
                      fontSize: '2rem',
                      letterSpacing: '0.3em',
                      color: 'var(--color-amber)',
                    }}
                  >
                    {state.roomId}
                  </Title>
                  <CopyButton value={state.roomId ?? ''}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Đã copy!' : 'Copy mã'}>
                        <ActionIcon
                          variant="subtle"
                          color={copied ? 'teal' : 'gray'}
                          onClick={copy}
                          size="lg"
                        >
                          {copied ? (
                            <IconCheck size={18} />
                          ) : (
                            <IconCopy size={18} />
                          )}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Badge size="lg" variant="light" color="teal" mt="xs">
                  {state.players.length} người
                </Badge>
              </div>
              {/* QR Code for quick join */}
              <Tooltip label="Quét mã QR để tham gia" position="left">
                <Paper
                  p={8}
                  radius="md"
                  style={{
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <QRCodeSVG
                    value={`${globalThis.window === undefined ? '' : globalThis.window.location.origin}/?room=${state.roomId ?? ''}`}
                    size={100}
                    bgColor="#ffffff"
                    fgColor="#1A1B1E"
                    level="M"
                  />
                </Paper>
              </Tooltip>
            </Group>
            <Text size="xs" c="dimmed" mt="sm" fs="italic">
              📱 Cho người chơi quét mã QR hoặc nhập mã{' '}
              <strong style={{ color: 'var(--color-amber)' }}>
                {state.roomId}
              </strong>{' '}
              để tham gia.
            </Text>
          </Paper>

          {/* Players list */}
          <Paper
            p="lg"
            radius="md"
            style={{
              background: 'rgba(26, 35, 50, 0.9)',
              border: '1px solid rgba(45, 61, 82, 0.5)',
            }}
          >
            <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={2} mb="sm">
              <span style={{ color: 'var(--color-coral)' }}>{'//'}</span> Người
              chơi ({state.players.length})
            </Text>
            <Group gap="xs">
              {state.players.map((p) => (
                <Badge
                  key={p.id}
                  size="lg"
                  variant={p.isHost ? 'gradient' : 'light'}
                  gradient={
                    p.isHost ? { from: '#e5534b', to: '#d4a72c' } : undefined
                  }
                  color={p.isConnected ? 'gray' : 'red'}
                  leftSection={p.isHost ? '👑' : undefined}
                  style={{ textTransform: 'none' }}
                >
                  {p.name}
                </Badge>
              ))}
            </Group>
            {!state.isHost && (
              <Text size="sm" c="dimmed" mt="md" fs="italic">
                Đang chờ quản trò bắt đầu game...
              </Text>
            )}
          </Paper>

          {/* Role config — host only */}
          {state.isHost && (
            <>
              <Paper
                p="lg"
                radius="md"
                style={{
                  background: 'rgba(26, 35, 50, 0.9)',
                  border: '1px solid rgba(45, 61, 82, 0.5)',
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={2}>
                    <span style={{ color: 'var(--color-amber)' }}>{'//'}</span>{' '}
                    Vai trò
                  </Text>
                  <Badge
                    color={totalRoles === state.players.length ? 'teal' : 'red'}
                    variant="light"
                  >
                    {totalRoles}/{state.players.length}
                  </Badge>
                </Group>

                {/* Presets */}
                <Text size="xs" c="dimmed" mb="xs">
                  Gợi ý nhanh:
                </Text>
                <Group gap="xs" mb="md">
                  {PRESETS.map((p) => (
                    <Button
                      key={p.label}
                      size="xs"
                      variant="default"
                      onClick={() => applyPreset(p.config)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </Group>

                {/* Wolf roles */}
                <Text size="xs" c="var(--color-coral)" fw={700} mb="xs">
                  Phe Sói 🐺
                </Text>
                <Stack gap="xs" mb="md">
                  {CONFIGURABLE_ROLES.filter((r) => r.faction === 'wolf').map(
                    (r) => (
                      <RoleRow
                        key={r.id}
                        roleId={r.id}
                        count={roleConfig[r.id]}
                        accentColor="var(--color-coral)"
                        onIncrement={() => setRoleCount(r.id, 1)}
                        onDecrement={() => setRoleCount(r.id, -1)}
                      />
                    ),
                  )}
                </Stack>

                {/* Villager roles */}
                <Text size="xs" c="var(--color-sky)" fw={700} mb="xs">
                  Phe Dân 👥
                </Text>
                <Stack gap="xs">
                  {CONFIGURABLE_ROLES.filter(
                    (r) => r.faction === 'villager',
                  ).map((r) => (
                    <RoleRow
                      key={r.id}
                      roleId={r.id}
                      count={roleConfig[r.id]}
                      accentColor="var(--color-sky)"
                      onIncrement={() => setRoleCount(r.id, 1)}
                      onDecrement={() => setRoleCount(r.id, -1)}
                    />
                  ))}
                </Stack>

                {/* Balance */}
                <Paper
                  p="sm"
                  mt="md"
                  radius="sm"
                  style={{
                    background: 'rgba(15, 25, 35, 0.5)',
                    border: '1px solid rgba(45, 61, 82, 0.3)',
                  }}
                >
                  <Group justify="space-between">
                    <Text size="xs" c="dimmed">
                      Điểm cân bằng
                    </Text>
                    <Text
                      size="sm"
                      fw={700}
                      c={balanceScoreTextColor(balanceScore)}
                    >
                      {balanceScore > 0 ? '+' : ''}
                      {balanceScore}
                      <Text span size="xs" c="dimmed" ml={4}>
                        {balanceScoreHintText(balanceScore)}
                      </Text>
                    </Text>
                  </Group>
                </Paper>
              </Paper>

              {/* Start button */}
              <Button
                fullWidth
                size="xl"
                variant="gradient"
                gradient={{ from: '#e5534b', to: '#d4a72c', deg: 135 }}
                leftSection={<IconPlayerPlay size={24} />}
                disabled={!canStart}
                onClick={actions.startGame}
                style={{
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  fontSize: '1.1rem',
                }}
              >
                Bắt Đầu Game
              </Button>

              {!canStart && (
                <Text size="xs" c="dimmed" ta="center">
                  {state.players.length >= 3 ? '' : 'Cần ít nhất 3 người. '}
                  {totalRoles === state.players.length
                    ? ''
                    : `Tổng vai (${totalRoles}) phải bằng số người (${state.players.length}).`}
                </Text>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  )
}

// Role Row Component
function RoleRow({
  roleId,
  count,
  accentColor,
  onIncrement,
  onDecrement,
}: Readonly<{
  roleId: RoleId
  count: number
  accentColor: string
  onIncrement: () => void
  onDecrement: () => void
}>) {
  return (
    <Paper
      p="xs"
      px="sm"
      radius="sm"
      style={{
        background: 'rgba(15, 25, 35, 0.4)',
        border: '1px solid rgba(45, 61, 82, 0.3)',
        borderLeft: `3px solid ${accentColor}`,
      }}
    >
      <Group justify="space-between" wrap="nowrap">
        <div style={{ flex: 1 }}>
          <Group gap={6}>
            <Text size="md">{ROLE_EMOJI[roleId]}</Text>
            <Text size="sm" fw={600}>
              {ROLE_NAMES[roleId]}
            </Text>
            <Text
              size="xs"
              fw={700}
              c={ROLE_POINTS[roleId] < 0 ? 'red' : 'teal'}
            >
              {ROLE_POINTS[roleId] > 0 ? '+' : ''}
              {ROLE_POINTS[roleId]}
            </Text>
          </Group>
          <Text size="xs" c="dimmed" mt={2}>
            {ROLE_DESC[roleId]}
          </Text>
        </div>
        <Group gap={6} wrap="nowrap">
          <ActionIcon
            variant="default"
            size="sm"
            onClick={onDecrement}
            disabled={count <= 0}
          >
            <IconMinus size={12} />
          </ActionIcon>
          <Text size="sm" fw={700} w={20} ta="center">
            {count}
          </Text>
          <ActionIcon variant="default" size="sm" onClick={onIncrement}>
            <IconPlus size={12} />
          </ActionIcon>
        </Group>
      </Group>
    </Paper>
  )
}
