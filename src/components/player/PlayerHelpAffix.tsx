import { useState } from 'react'
import {
  Affix,
  Button,
  Group,
  Modal,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { IconBook, IconMask } from '@tabler/icons-react'
import type { GameState } from '@/hooks/useGame'
import { GameGuideModal } from '@/components/GameGuideModal'
import { ROLE_DESC, ROLE_EMOJI, ROLE_NAMES } from '@/shared/constants'
import type { RoleId } from '@/shared/types'

function isWolfFactionRole(roleId: RoleId): boolean {
  return ['wolf', 'wolf-cub', 'cursed-wolf', 'traitor'].includes(roleId)
}

export function PlayerHelpAffix({ state }: Readonly<{ state: GameState }>) {
  const [guideOpened, setGuideOpened] = useState(false)
  const [roleOpened, setRoleOpened] = useState(false)

  if (state.isHost) return null

  const roleId = state.myRole?.role ?? null
  const isWolfSide = roleId ? isWolfFactionRole(roleId) : false

  return (
    <>
      <Affix position={{ bottom: 16, right: 16 }} zIndex={500}>
        <Group gap="xs">
          <Button
            size="xs"
            variant="light"
            color="gray"
            leftSection={<IconBook size={16} />}
            onClick={() => setGuideOpened(true)}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            Hướng dẫn
          </Button>
          <Button
            size="xs"
            variant="light"
            color="gray"
            leftSection={<IconMask size={16} />}
            onClick={() => setRoleOpened(true)}
            style={{ backdropFilter: 'blur(10px)' }}
          >
            Vai của tôi
          </Button>
        </Group>
      </Affix>

      <GameGuideModal
        opened={guideOpened}
        onClose={() => setGuideOpened(false)}
      />

      <Modal
        opened={roleOpened}
        onClose={() => setRoleOpened(false)}
        centered
        size="md"
        title={
          <Title order={3} component="span">
            🎭 Vai trò của tôi
          </Title>
        }
        styles={{
          header: {
            background: 'rgba(26, 35, 50, 0.95)',
            borderBottom: '1px solid rgba(45, 61, 82, 0.5)',
          },
          body: { background: 'rgba(26, 35, 50, 0.95)' },
          content: { background: 'rgba(26, 35, 50, 0.95)' },
        }}
      >
        {roleId ? (
          <Stack gap="md">
            <Paper
              p="md"
              radius="md"
              style={{
                background: 'rgba(15, 25, 35, 0.6)',
                border: `1px solid ${isWolfSide ? 'rgba(229, 83, 75, 0.25)' : 'rgba(70, 147, 212, 0.25)'}`,
              }}
            >
              <Stack gap={6}>
                <Text style={{ fontSize: '2.5rem' }}>{ROLE_EMOJI[roleId]}</Text>
                <Text size="lg" fw={800} c={isWolfSide ? 'red' : 'blue'}>
                  {ROLE_NAMES[roleId]}
                </Text>
                <Text size="sm" c="dimmed">
                  {ROLE_DESC[roleId]}
                </Text>
              </Stack>
            </Paper>
            <Text size="xs" c="dimmed" fs="italic">
              Chỉ bạn mới thấy thông tin này trên thiết bị của mình.
            </Text>
          </Stack>
        ) : (
          <Text size="sm" c="dimmed">
            Vai trò của bạn chưa sẵn sàng. Hãy chờ quản trò bắt đầu game.
          </Text>
        )}
      </Modal>
    </>
  )
}
