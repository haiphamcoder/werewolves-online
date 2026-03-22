import type {
  DeathReason,
  Faction,
  NightStep,
  RoleId,
  RolePreset,
} from './types'

// ── Role Names (Vietnamese) ─────────────────────────────────────────────────
export const ROLE_NAMES: Record<RoleId, string> = {
  wolf: 'Sói thường',
  'wolf-cub': 'Sói con',
  'cursed-wolf': 'Sói nguyền',
  villager: 'Dân thường',
  seer: 'Tiên tri',
  guard: 'Bảo vệ',
  witch: 'Phù thủy',
  hunter: 'Thợ săn',
  disruptor: 'Kẻ phá hoại',
  traitor: 'Kẻ phản bội',
  cupid: 'Thần tình yêu',
}

export const ROLE_EMOJI: Record<RoleId, string> = {
  wolf: '🐺',
  'wolf-cub': '🐺',
  'cursed-wolf': '😈',
  villager: '👤',
  seer: '🔮',
  guard: '🛡️',
  witch: '🧙',
  hunter: '🏹',
  disruptor: '🤫',
  traitor: '🎭',
  cupid: '💘',
}

export const ROLE_DESC: Record<RoleId, string> = {
  wolf: 'Mỗi đêm cùng bầy cắn 1 người dân.',
  'wolf-cub': 'Khi chết, đêm sau sói được cắn 2 người.',
  'cursed-wolf': 'Ban đầu là Dân. Khi bị cắn, chuyển sang phe Sói.',
  villager: 'Không có kỹ năng đặc biệt.',
  seer: 'Mỗi đêm soi 1 người: kết quả là Sói hay Dân.',
  guard: 'Mỗi đêm bảo vệ 1 người khỏi bị cắn.',
  witch: 'Có 1 bình cứu và 1 bình độc, dùng 1 lần mỗi loại.',
  hunter: 'Khi chết, người bị chỉ định cũng chết theo.',
  disruptor: 'Mỗi đêm cấm 1 người nói chuyện sáng hôm sau.',
  traitor: 'Biết ai là Sói, nhưng Sói không biết bạn. Thắng nếu phe Sói thắng.',
  cupid: 'Đêm 1: chọn 2 người yêu nhau. Nếu 1 người chết, người kia chết theo.',
}

export const ROLE_POINTS: Record<RoleId, number> = {
  wolf: -6,
  'wolf-cub': -8,
  'cursed-wolf': -4,
  villager: 1,
  seer: 3,
  guard: 3,
  witch: 4,
  hunter: 3,
  disruptor: -2,
  traitor: -6,
  cupid: -3,
}

export const NIGHT_CALL: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại hãy mở mắt và chọn người muốn cấm thảo luận.',
  cupid: 'Thần tình yêu hãy mở mắt và chọn 2 người yêu nhau.',
  wolves: 'Bầy sói hãy mở mắt và chọn người muốn cắn.',
  traitor: 'Kẻ phản bội hãy mở mắt.',
  seer: 'Tiên tri hãy mở mắt và chọn người muốn soi.',
  guard: 'Bảo vệ hãy mở mắt và chọn người muốn bảo vệ.',
  witch: 'Phù thủy hãy mở mắt.',
  hunter: 'Thợ săn hãy mở mắt và chọn người muốn chỉ định.',
}

export const NIGHT_SLEEP: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại hãy nhắm mắt.',
  cupid: 'Thần tình yêu hãy nhắm mắt.',
  wolves: 'Bầy sói hãy nhắm mắt.',
  traitor: 'Kẻ phản bội hãy nhắm mắt.',
  seer: 'Tiên tri hãy nhắm mắt.',
  guard: 'Bảo vệ hãy nhắm mắt.',
  witch: 'Phù thủy hãy nhắm mắt.',
  hunter: 'Thợ săn hãy nhắm mắt.',
}

export const STEP_LABELS: Record<NightStep, string> = {
  disruptor: 'Kẻ phá hoại',
  cupid: 'Thần tình yêu',
  wolves: 'Bầy Sói',
  traitor: 'Kẻ phản bội',
  seer: 'Tiên tri',
  guard: 'Bảo vệ',
  witch: 'Phù thủy',
  hunter: 'Thợ săn',
}

export const ROLE_STEP_MAP: Partial<Record<NightStep, RoleId | RoleId[]>> = {
  disruptor: 'disruptor',
  cupid: 'cupid',
  wolves: ['wolf', 'wolf-cub', 'cursed-wolf'],
  traitor: 'traitor',
  seer: 'seer',
  guard: 'guard',
  witch: 'witch',
  hunter: 'hunter',
}

// ── Configurable roles for UI ───────────────────────────────────────────────
export const CONFIGURABLE_ROLES: { id: RoleId; faction: Faction }[] = [
  { id: 'wolf', faction: 'wolf' },
  { id: 'wolf-cub', faction: 'wolf' },
  { id: 'cursed-wolf', faction: 'wolf' },
  { id: 'traitor', faction: 'wolf' },
  { id: 'villager', faction: 'villager' },
  { id: 'seer', faction: 'villager' },
  { id: 'guard', faction: 'villager' },
  { id: 'witch', faction: 'villager' },
  { id: 'hunter', faction: 'villager' },
  { id: 'disruptor', faction: 'villager' },
  { id: 'cupid', faction: 'villager' },
]

// ── Presets ─────────────────────────────────────────────────────────────────
export const PRESETS: RolePreset[] = [
  {
    label: '5 người',
    players: 5,
    config: { wolf: 1, villager: 2, seer: 1, guard: 1 },
  },
  {
    label: '6–7 người',
    players: 6,
    config: { wolf: 1, villager: 3, seer: 1, guard: 1 },
  },
  {
    label: '8–10 người',
    players: 8,
    config: { wolf: 2, villager: 4, seer: 1, guard: 1 },
  },
  {
    label: '11–14 người',
    players: 12,
    config: { wolf: 3, villager: 5, seer: 1, guard: 1, witch: 1, hunter: 1 },
  },
  {
    label: '15–20 người',
    players: 16,
    config: {
      wolf: 4,
      villager: 8,
      seer: 1,
      guard: 1,
      witch: 1,
      hunter: 1,
      disruptor: 1,
    },
  },
]

export const DEATH_REASON_LABELS: Record<DeathReason, string> = {
  wolf: 'Sói cắn',
  'witch-poison': 'Bình độc',
  'hunter-shot': 'Thợ săn bắn',
  hanged: 'Bị treo cổ',
  'lover-death': 'Chết theo người yêu',
}
