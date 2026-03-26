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
  Progress,
  Modal,
  Divider,
  List,
} from '@mantine/core'
import { IconCheck, IconPlayerPlay, IconInfoCircle } from '@tabler/icons-react'
import { useState } from 'react'
import type { GameState } from '@/hooks/useGame'
import type { PlayerPrivateInfo } from '@/shared/types'
import { ROLE_NAMES, ROLE_EMOJI, ROLE_DESC } from '@/shared/constants'

interface Props {
  state: GameState
  actions: { confirmRoleSeen: () => void; advancePhase: () => void }
}

function getPlayerRowBadge(
  isConfirmed: boolean,
  isConnected: boolean,
): {
  color: string
  label: string
} {
  if (isConfirmed) return { color: 'teal', label: '✅ Sẵn sàng' }
  if (isConnected) return { color: 'yellow', label: '⏳ Đang xem...' }
  return { color: 'red', label: '🔴 Offline' }
}

function RoleRevealHostView({ state, actions }: Readonly<Props>) {
  const { seen, total, confirmedIds } = state.roleSeenCount
  const allReady = total > 0 && seen >= total

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
        <Stack align="center" gap="xl" className="animate-fade-in">
          <Text style={{ fontSize: '3rem' }}>🎭</Text>
          <Title order={2} ta="center" style={{ color: 'var(--color-amber)' }}>
            Đang phân vai
          </Title>

          <Paper
            p="lg"
            radius="md"
            style={{
              width: '100%',
              background: 'rgba(26, 35, 50, 0.9)',
              border: '1px solid rgba(45, 61, 82, 0.5)',
            }}
          >
            <Group justify="space-between" mb="xs">
              <Text size="sm" c="dimmed">
                Xác nhận vai trò
              </Text>
              <Badge
                size="lg"
                variant="light"
                color={allReady ? 'teal' : 'yellow'}
              >
                {seen}/{total}
              </Badge>
            </Group>
            <Progress
              value={total > 0 ? (seen / total) * 100 : 0}
              color={allReady ? 'teal' : 'yellow'}
              size="lg"
              radius="xl"
              animated={!allReady}
            />

            <Stack gap="xs" mt="md">
              {state.players.map((p) => {
                const isConfirmed = confirmedIds.includes(p.id)
                const { color, label } = getPlayerRowBadge(
                  isConfirmed,
                  p.isConnected,
                )
                return (
                  <Group key={p.id} justify="space-between">
                    <Text size="sm">{p.name}</Text>
                    <Badge size="sm" variant="light" color={color}>
                      {label}
                    </Badge>
                  </Group>
                )
              })}
            </Stack>
          </Paper>

          <Button
            fullWidth
            size="xl"
            variant="gradient"
            gradient={{ from: '#e5534b', to: '#d4a72c', deg: 135 }}
            leftSection={<IconPlayerPlay size={24} />}
            onClick={actions.advancePhase}
            disabled={!allReady}
            style={{ fontWeight: 700 }}
          >
            {allReady
              ? 'Bắt đầu đêm đầu tiên ▶'
              : 'Đang chờ tất cả xác nhận...'}
          </Button>
        </Stack>
      </Container>
    </Box>
  )
}

function RoleRevealPlayerLoading() {
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
      <Text c="dimmed">Đang phân vai...</Text>
    </Box>
  )
}

function HowToPlay({
  roleId,
  buttonLabel = 'Xem hướng dẫn cách chơi',
}: Readonly<{
  roleId?: PlayerPrivateInfo['role']
  buttonLabel?: string
}>) {
  const [opened, setOpened] = useState(false)

  return (
    <>
      <Button
        fullWidth
        variant="subtle"
        color="gray"
        leftSection={<IconInfoCircle size={18} />}
        onClick={() => setOpened(true)}
      >
        {buttonLabel}
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Hướng dẫn cách chơi"
        centered
        size="lg"
      >
        <Stack gap="sm">
          <Text size="sm" fw={700}>
            Mục tiêu
          </Text>
          <List size="sm" spacing="xs">
            <List.Item>
              Phe{' '}
              <Text span fw={700}>
                Sói
              </Text>{' '}
              thắng khi số Sói ≥ số Dân.
            </List.Item>
            <List.Item>
              Phe{' '}
              <Text span fw={700}>
                Dân
              </Text>{' '}
              thắng khi loại hết Sói.
            </List.Item>
          </List>

          <Divider />

          <Text size="sm" fw={700}>
            Luật chung (cực ngắn)
          </Text>
          <List size="sm" spacing="xs">
            <List.Item>
              <Text span fw={700}>
                Ban đêm
              </Text>
              : các vai có kỹ năng hành động theo lượt quản trò gọi.
            </List.Item>
            <List.Item>
              <Text span fw={700}>
                Ban ngày
              </Text>
              : thảo luận, suy luận và bỏ phiếu loại người nghi là Sói.
            </List.Item>
            <List.Item>
              <Text span fw={700}>
                Giữ bí mật
              </Text>
              : không tiết lộ vai trừ khi luật/phòng cho phép.
            </List.Item>
          </List>

          {roleId && (
            <>
              <Divider />
              <Text size="sm" fw={700}>
                Vai của bạn
              </Text>
              <Paper
                p="sm"
                radius="md"
                style={{
                  background: 'rgba(26, 35, 50, 0.6)',
                  border: '1px solid rgba(45, 61, 82, 0.3)',
                }}
              >
                <Group gap="sm" wrap="nowrap">
                  <Text size="lg">{ROLE_EMOJI[roleId]}</Text>
                  <div>
                    <Text size="sm" fw={700}>
                      {ROLE_NAMES[roleId]}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {ROLE_DESC[roleId]}
                    </Text>
                  </div>
                </Group>
              </Paper>
              <Text size="xs" c="dimmed" fs="italic">
                Nếu bạn đã bấm “Đã ghi nhớ”, vai sẽ bị ẩn để bảo mật.
              </Text>
            </>
          )}
        </Stack>
      </Modal>
    </>
  )
}

function RoleRevealPlayerConfirmed() {
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
        <Stack align="center" gap="xl" className="animate-fade-in">
          <Text style={{ fontSize: '4rem' }}>🤫</Text>

          <Paper
            p="xl"
            radius="lg"
            style={{
              width: '100%',
              textAlign: 'center',
              background: 'rgba(26, 35, 50, 0.9)',
              border: '2px solid rgba(63, 185, 80, 0.3)',
            }}
          >
            <Stack align="center" gap="md">
              <IconCheck size={48} color="var(--mantine-color-teal-5)" />
              <Title order={3} c="teal">
                Đã xác nhận!
              </Title>
              <Text size="sm" c="dimmed">
                Vai trò đã được ẩn để bảo mật.
              </Text>
              <Text size="sm" c="dimmed">
                Hãy ghi nhớ vai trò của mình và chờ quản trò bắt đầu game.
              </Text>
            </Stack>
          </Paper>

          <HowToPlay buttonLabel="Xem lại hướng dẫn cách chơi" />

          <Text size="xs" c="dimmed" ta="center" fs="italic">
            Đang chờ tất cả người chơi xác nhận...
          </Text>
        </Stack>
      </Container>
    </Box>
  )
}

function isWolfFactionRole(roleId: PlayerPrivateInfo['role']): boolean {
  return ['wolf', 'wolf-cub', 'cursed-wolf', 'traitor'].includes(roleId)
}

function RoleRevealPlayerShowRole({
  role,
  actions,
}: Readonly<{ role: PlayerPrivateInfo; actions: Props['actions'] }>) {
  const isWolfSide = isWolfFactionRole(role.role)

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
        <Stack align="center" gap="xl" className="animate-fade-in">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} lts={2}>
            Vai trò của bạn
          </Text>

          <Paper
            p="xl"
            radius="lg"
            style={{
              width: '100%',
              textAlign: 'center',
              background: 'rgba(26, 35, 50, 0.9)',
              border: `2px solid ${isWolfSide ? 'var(--color-coral)' : 'var(--color-sky)'}`,
            }}
          >
            <Stack align="center" gap="md">
              <Text style={{ fontSize: '4rem' }}>{ROLE_EMOJI[role.role]}</Text>
              <Title
                order={2}
                style={{
                  fontSize: '2rem',
                  color: isWolfSide
                    ? 'var(--color-coral)'
                    : 'var(--color-amber)',
                }}
              >
                {ROLE_NAMES[role.role]}
              </Title>
              <Text size="sm" fw={700} c={isWolfSide ? 'red' : 'blue'}>
                {isWolfSide ? '🐺 Phe Sói' : '👥 Phe Dân'}
              </Text>
              <Text size="sm" c="dimmed" maw={300}>
                {ROLE_DESC[role.role]}
              </Text>
            </Stack>
          </Paper>

          <Button
            fullWidth
            size="lg"
            variant="gradient"
            gradient={{ from: '#4693d4', to: '#3fb950', deg: 135 }}
            leftSection={<IconCheck size={20} />}
            onClick={actions.confirmRoleSeen}
            style={{ fontWeight: 700 }}
          >
            Đã ghi nhớ — Sẵn sàng
          </Button>

          <HowToPlay roleId={role.role} />

          <Text size="xs" c="dimmed" ta="center" fs="italic">
            ⚠️ Hãy ghi nhớ vai trò. Sau khi bấm, vai sẽ được ẩn đi.
          </Text>
        </Stack>
      </Container>
    </Box>
  )
}

export function RoleRevealView({ state, actions }: Readonly<Props>) {
  if (state.isHost) {
    return <RoleRevealHostView state={state} actions={actions} />
  }

  const role = state.myRole
  if (!role) {
    return <RoleRevealPlayerLoading />
  }

  if (state.roleConfirmed) {
    return <RoleRevealPlayerConfirmed />
  }

  return <RoleRevealPlayerShowRole role={role} actions={actions} />
}
