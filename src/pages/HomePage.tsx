import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Container,
  Title,
  Text,
  Anchor,
  TextInput,
  Button,
  Stack,
  Paper,
  Badge,
  Tabs,
  Alert,
  Box,
  PinInput,
} from '@mantine/core'
import {
  IconMoon,
  IconUsers,
  IconDoorEnter,
  IconPlus,
  IconAlertCircle,
  IconBook,
} from '@tabler/icons-react'
import { useGameContext } from '@/hooks/GameContext'
import { GameGuideModal } from '@/components/GameGuideModal'

const MAX_PLAYER_NAME_LEN = 32
const ROOM_CODE_MAX_LEN = 6

function sanitizePlayerName(raw: string): string {
  return raw.replaceAll('\u0000', '').slice(0, MAX_PLAYER_NAME_LEN)
}

function clipRoomCode(raw: string): string {
  return raw.slice(0, ROOM_CODE_MAX_LEN)
}

function useCompactPin(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = globalThis.matchMedia('(max-width: 25rem)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return compact
}

export function HomePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { state, actions } = useGameContext()
  const [playerName, setPlayerName] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [activeTab, setActiveTab] = useState<string | null>('create')
  const [guideOpened, setGuideOpened] = useState(false)

  const roomFromUrl = searchParams.get('room')

  const compactPin = useCompactPin()

  useEffect(() => {
    if (!roomFromUrl) return
    const code = clipRoomCode(roomFromUrl)
    queueMicrotask(() => {
      setRoomCode(code)
      setActiveTab('join')
    })
  }, [roomFromUrl])

  const handlePlayerNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPlayerName(sanitizePlayerName(e.currentTarget.value))
    },
    [],
  )

  const handleCreate = () => {
    actions.createRoom()
  }

  const handleJoin = () => {
    const name = playerName.trim()
    if (!name || roomCode.length !== 6) return
    actions.joinRoom(roomCode, name)
  }

  useEffect(() => {
    if (!state.roomId || !state.isConnected) return
    navigate(`/room/${state.roomId}`)
  }, [state.roomId, state.isConnected, navigate])

  return (
    <Box
      style={{
        minHeight: '100dvh',
        paddingTop: 'max(0.75rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
        background:
          'radial-gradient(ellipse at top, #1a2332 0%, #0f1923 50%, #0a0f14 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decoration — scales down on narrow viewports */}
      <Box
        aria-hidden
        style={{
          position: 'absolute',
          top: '8%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(90vw, 600px)',
          height: 'min(90vw, 600px)',
          maxHeight: '55vh',
          background:
            'radial-gradient(circle, rgba(229, 83, 75, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <Container size="xs" px="md" py={{ base: 'xl', sm: '5rem' }}>
        <Stack align="center" gap="xl">
          {/* Logo & Title */}
          <Stack align="center" gap="xs" maw="100%">
            <Text lh={1} fz={{ base: 'clamp(2.5rem, 14vw, 4rem)' }}>
              🐺
            </Text>
            <Title
              order={1}
              ta="center"
              fz={{ base: 'clamp(1.5rem, 6vw, 2.5rem)', sm: '2.5rem' }}
              fw={900}
              style={{
                background: 'linear-gradient(135deg, #e5534b 0%, #d4a72c 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              Ma Sói Online
            </Title>
            <Text c="dimmed" ta="center" size="sm" maw={360} px="xs">
              Tạo phòng, mời bạn bè và bắt đầu cuộc chơi — ngay trên trình
              duyệt.
            </Text>
          </Stack>

          {/* Connection badge */}
          <Badge
            variant="dot"
            color={state.isConnected ? 'green' : 'red'}
            size="sm"
          >
            {state.isConnected ? 'Đã kết nối' : 'Đang kết nối...'}
          </Badge>

          {/* Main Card */}
          <Paper
            p={{ base: 'md', sm: 'xl' }}
            radius="lg"
            maw="100%"
            style={{
              width: '100%',
              background: 'rgba(26, 35, 50, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(45, 61, 82, 0.5)',
            }}
          >
            <Stack gap="md">
              {/* Tabs */}
              <Tabs value={activeTab} onChange={setActiveTab}>
                <Tabs.List grow>
                  <Tabs.Tab
                    value="create"
                    leftSection={<IconPlus size={14} />}
                    fz={{ base: 'xs', sm: 'sm' }}
                    style={{ fontWeight: 600 }}
                  >
                    Tạo Phòng
                  </Tabs.Tab>
                  <Tabs.Tab
                    value="join"
                    leftSection={<IconDoorEnter size={14} />}
                    fz={{ base: 'xs', sm: 'sm' }}
                    style={{ fontWeight: 600 }}
                  >
                    Tham Gia
                  </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="create" pt="md">
                  <Stack gap="md">
                    <Text size="sm" c="dimmed">
                      Bạn sẽ là{' '}
                      <strong style={{ color: 'var(--color-amber)' }}>
                        Quản trò
                      </strong>{' '}
                      — cấu hình vai trò, bắt đầu game và điều phối trò chơi.
                      Không cần nhập tên vì bạn không tham gia chơi.
                    </Text>
                    <Button
                      fullWidth
                      size="lg"
                      variant="gradient"
                      gradient={{ from: '#e5534b', to: '#d4a72c', deg: 135 }}
                      leftSection={<IconMoon size={20} />}
                      disabled={!state.isConnected}
                      onClick={handleCreate}
                      style={{ fontWeight: 700, letterSpacing: '0.02em' }}
                    >
                      Tạo Phòng Mới
                    </Button>
                  </Stack>
                </Tabs.Panel>

                <Tabs.Panel value="join" pt="md">
                  <Stack gap="md">
                    <TextInput
                      label="Tên của bạn"
                      placeholder="Nhập tên hiển thị..."
                      value={playerName}
                      onChange={handlePlayerNameChange}
                      size="md"
                      maxLength={MAX_PLAYER_NAME_LEN}
                      autoComplete="username"
                      spellCheck={false}
                      lang="vi"
                      leftSection={<IconUsers size={16} />}
                      styles={{
                        input: {
                          background: 'rgba(15, 25, 35, 0.8)',
                          border: '1px solid rgba(45, 61, 82, 0.8)',
                          color: 'var(--color-text-primary)',
                        },
                        label: {
                          color: 'var(--color-text-secondary)',
                          marginBottom: 6,
                        },
                      }}
                    />
                    <Stack gap="xs" w="100%">
                      <Text size="sm" fw={500} c="var(--color-text-secondary)">
                        Mã phòng
                      </Text>
                      <Box
                        w="100%"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          maxWidth: '100%',
                          overflowX: 'auto',
                          overflowY: 'hidden',
                          WebkitOverflowScrolling: 'touch',
                          paddingBottom: 2,
                        }}
                      >
                        <PinInput
                          length={ROOM_CODE_MAX_LEN}
                          type="number"
                          value={roomCode}
                          onChange={(v) => setRoomCode(clipRoomCode(v))}
                          size={compactPin ? 'sm' : 'md'}
                          gap={compactPin ? 'xs' : 'sm'}
                          oneTimeCode={false}
                          placeholder="○"
                          ariaLabel="Chữ số mã phòng"
                          styles={{
                            root: { flexShrink: 0 },
                            input: {
                              background: 'rgba(15, 25, 35, 0.8)',
                              border: '1px solid rgba(45, 61, 82, 0.8)',
                              color: 'var(--color-text-primary)',
                              fontWeight: 700,
                            },
                          }}
                        />
                      </Box>
                    </Stack>
                    <Button
                      fullWidth
                      size="lg"
                      variant="gradient"
                      gradient={{ from: '#e5534b', to: '#d4a72c', deg: 135 }}
                      leftSection={<IconDoorEnter size={20} />}
                      disabled={
                        !playerName.trim() ||
                        roomCode.length < 6 ||
                        !state.isConnected
                      }
                      onClick={handleJoin}
                      style={{ fontWeight: 700 }}
                    >
                      Tham Gia Phòng
                    </Button>
                    <Text size="xs" c="dimmed" ta="center" fs="italic">
                      Bạn cũng có thể quét mã QR từ quản trò để tự động điền mã
                      phòng.
                    </Text>
                  </Stack>
                </Tabs.Panel>
              </Tabs>

              {state.error && (
                <Alert
                  icon={<IconAlertCircle size={16} />}
                  title="Lỗi"
                  color="red"
                  variant="light"
                  radius="md"
                >
                  {state.error}
                </Alert>
              )}
            </Stack>
          </Paper>

          {/* Guide button */}
          <Button
            variant="subtle"
            color="gray"
            size="sm"
            leftSection={<IconBook size={16} />}
            onClick={() => setGuideOpened(true)}
            style={{ fontWeight: 600 }}
          >
            Hướng dẫn chơi & Luật chơi
          </Button>

          {/* Footer */}
          <Text size="xs" c="dimmed" ta="center">
            The Werewolves of Millers Hollow — Phiên bản Việt Nam
            <br />
            Mã nguồn:{' '}
            <Anchor
              href="https://github.com/haiphamcoder/werewolves-online"
              target="_blank"
              rel="noreferrer"
              c="dimmed"
              style={{ textDecorationColor: 'rgba(255,255,255,0.25)' }}
            >
              GitHub
            </Anchor>
          </Text>

          <GameGuideModal
            opened={guideOpened}
            onClose={() => setGuideOpened(false)}
          />
        </Stack>
      </Container>
    </Box>
  )
}
