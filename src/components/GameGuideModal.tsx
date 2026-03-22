import {
  Modal,
  Stack,
  Text,
  Title,
  Paper,
  Group,
  Badge,
  Accordion,
} from '@mantine/core'
import {
  ROLE_NAMES,
  ROLE_EMOJI,
  ROLE_DESC,
  CONFIGURABLE_ROLES,
} from '@/shared/constants'

interface Props {
  opened: boolean
  onClose: () => void
}

export function GameGuideModal({ opened, onClose }: Readonly<Props>) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Title order={3} component="span">
          📖 Hướng dẫn chơi Ma Sói Online
        </Title>
      }
      size="lg"
      centered
      styles={{
        header: {
          background: 'rgba(26, 35, 50, 0.95)',
          borderBottom: '1px solid rgba(45, 61, 82, 0.5)',
        },
        body: { background: 'rgba(26, 35, 50, 0.95)' },
        content: { background: 'rgba(26, 35, 50, 0.95)' },
      }}
    >
      <Stack gap="lg">
        {/* Overview */}
        <Paper
          p="md"
          radius="md"
          style={{
            background: 'rgba(15, 25, 35, 0.6)',
            border: '1px solid rgba(45, 61, 82, 0.3)',
          }}
        >
          <Text size="sm" fw={700} c="yellow" mb="xs">
            🎯 Mục tiêu
          </Text>
          <Text size="sm" c="dimmed">
            Ma Sói là trò chơi đối kháng giữa{' '}
            <strong style={{ color: 'var(--color-coral)' }}>Phe Sói</strong> và{' '}
            <strong style={{ color: 'var(--color-sky)' }}>Phe Dân</strong>. Phe
            Sói thắng khi số sói ≥ số dân. Phe Dân thắng khi loại bỏ hết Sói.
          </Text>
        </Paper>

        {/* How to use */}
        <Accordion
          variant="separated"
          radius="md"
          styles={{
            item: {
              background: 'rgba(15, 25, 35, 0.6)',
              border: '1px solid rgba(45, 61, 82, 0.3)',
            },
            control: { paddingBlock: 12 },
          }}
        >
          <Accordion.Item value="usage">
            <Accordion.Control>
              <Text fw={700} size="sm">
                📱 Cách sử dụng
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  <strong>1. Quản trò tạo phòng</strong> — Bấm "Tạo Phòng Mới".
                  Quản trò không tham gia chơi, chỉ điều phối trò chơi.
                </Text>
                <Text size="sm" c="dimmed">
                  <strong>2. Mời người chơi</strong> — Chia sẻ mã phòng 6 chữ số
                  hoặc cho người chơi quét mã QR hiển thị trên màn hình.
                </Text>
                <Text size="sm" c="dimmed">
                  <strong>3. Cấu hình vai trò</strong> — Quản trò chọn số lượng
                  các vai. Tổng vai phải bằng số người chơi. Dùng "Gợi ý nhanh"
                  để cấu hình nhanh.
                </Text>
                <Text size="sm" c="dimmed">
                  <strong>4. Bắt đầu game</strong> — Vai trò được phân tự động,
                  mỗi người xem vai riêng trên điện thoại.
                </Text>
                <Text size="sm" c="dimmed">
                  <strong>5. Quản trò điều phối</strong> — Mỗi bước (đêm, ngày,
                  thảo luận, bỏ phiếu) đều do quản trò bấm nút để chuyển tiếp.
                  Quản trò thấy toàn bộ hành động trong đêm.
                </Text>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="flow">
            <Accordion.Control>
              <Text fw={700} size="sm">
                🔄 Luồng chơi
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    1
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Phân vai</strong> — Mỗi người xem vai và bấm "Sẵn
                    sàng"
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    2
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Đêm</strong> — Các vai lần lượt thức dậy và hành
                    động trên điện thoại
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    3
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Bình minh</strong> — Công bố ai chết đêm qua
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    4
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Thảo luận</strong> — Mọi người bàn bạc ai là sói
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    5
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Đề cử & Bỏ phiếu</strong> — Đề cử nghi phạm → Giải
                    thích → Bỏ phiếu treo cổ
                  </Text>
                </Group>
                <Group gap="xs" wrap="nowrap">
                  <Badge color="indigo" variant="light" size="sm">
                    6
                  </Badge>
                  <Text size="sm" c="dimmed">
                    <strong>Lặp lại</strong> — Đêm tiếp theo cho đến khi một phe
                    thắng
                  </Text>
                </Group>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="roles-wolf">
            <Accordion.Control>
              <Text fw={700} size="sm">
                🐺 Phe Sói
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {CONFIGURABLE_ROLES.filter((r) => r.faction === 'wolf').map(
                  (r) => (
                    <Paper
                      key={r.id}
                      p="xs"
                      px="sm"
                      radius="sm"
                      style={{
                        background: 'rgba(229, 83, 75, 0.05)',
                        border: '1px solid rgba(229, 83, 75, 0.15)',
                      }}
                    >
                      <Group gap="xs">
                        <Text size="md">{ROLE_EMOJI[r.id]}</Text>
                        <Text size="sm" fw={700} c="red">
                          {ROLE_NAMES[r.id]}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        {ROLE_DESC[r.id]}
                      </Text>
                    </Paper>
                  ),
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="roles-villager">
            <Accordion.Control>
              <Text fw={700} size="sm">
                👥 Phe Dân
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                {CONFIGURABLE_ROLES.filter((r) => r.faction === 'villager').map(
                  (r) => (
                    <Paper
                      key={r.id}
                      p="xs"
                      px="sm"
                      radius="sm"
                      style={{
                        background: 'rgba(70, 147, 212, 0.05)',
                        border: '1px solid rgba(70, 147, 212, 0.15)',
                      }}
                    >
                      <Group gap="xs">
                        <Text size="md">{ROLE_EMOJI[r.id]}</Text>
                        <Text size="sm" fw={700} c="blue">
                          {ROLE_NAMES[r.id]}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed" mt={2}>
                        {ROLE_DESC[r.id]}
                      </Text>
                    </Paper>
                  ),
                )}
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="nightorder">
            <Accordion.Control>
              <Text fw={700} size="sm">
                🌙 Thứ tự đêm
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap={4}>
                {(
                  [
                    'disruptor',
                    'cupid',
                    'wolves',
                    'traitor',
                    'seer',
                    'guard',
                    'witch',
                    'hunter',
                  ] as const
                ).map((step, i) => (
                  <Group key={step} gap="xs">
                    <Badge
                      size="xs"
                      variant="light"
                      color="yellow"
                      w={22}
                      h={22}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {i + 1}
                    </Badge>
                    <Text size="sm" c="dimmed">
                      {ROLE_EMOJI[step === 'wolves' ? 'wolf' : step]}{' '}
                      {ROLE_NAMES[step === 'wolves' ? 'wolf' : step]}
                    </Text>
                  </Group>
                ))}
                <Text size="xs" c="dimmed" mt="xs" fs="italic">
                  * Chỉ những vai có trong game mới thức dậy. Vai đã chết sẽ
                  được giả vờ gọi.
                </Text>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="tips">
            <Accordion.Control>
              <Text fw={700} size="sm">
                💡 Mẹo chơi
              </Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  • <strong>Tiên tri</strong> nên giấu danh tính ban đầu. Tiết
                  lộ quá sớm sẽ bị sói ưu tiên cắn.
                </Text>
                <Text size="sm" c="dimmed">
                  • <strong>Bảo vệ</strong> nên đoán xem sói sẽ nhắm ai và bảo
                  vệ người đó. Không được bảo vệ cùng 1 người 2 đêm liên tiếp.
                </Text>
                <Text size="sm" c="dimmed">
                  • <strong>Sói</strong> nên chia phiếu khi bỏ phiếu ban ngày để
                  khó bị phát hiện.
                </Text>
                <Text size="sm" c="dimmed">
                  • <strong>Phù thủy</strong> cần cân nhắc kỹ trước khi dùng
                  bình cứu hoặc bình độc vì mỗi loại chỉ dùng 1 lần.
                </Text>
                <Text size="sm" c="dimmed">
                  • Ai <strong>nói nhiều</strong> nhất chưa chắc là dân. Ai{' '}
                  <strong>im lặng</strong> chưa chắc là sói!
                </Text>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Text size="xs" c="dimmed" ta="center" fs="italic">
          Dựa trên "The Werewolves of Millers Hollow" — Phiên bản Việt Nam
        </Text>
      </Stack>
    </Modal>
  )
}
