/**
 * 邮票数据 —— 友链版。
 *
 * 从 quickDemos/stamp-impasto 移植：布局/纹理结构原样保留，
 * 数据换成朋友与常读站点。票面美术是 5 种抽象画法（kind 决定），
 * 名字在悬停 pill 与灯箱里展示。
 */

export type FriendItem = {
  name: string
  url: string
  desc: string
  kind?: '互链' | '常读'
}

export type StampId = string

export type StampDef = {
  id: StampId
  /** 悬停 pill / 灯箱里显示的名字 */
  label: string
  /** 友链地址 */
  url: string
  /** 一句话简介 */
  desc: string
  /** Rest position as % of stage (x,y from top-left) */
  x: number
  y: number
  /** Degrees */
  rotation: number
  /** Relative size multiplier */
  scale: number
  /** Base z order at rest */
  z: number
  /** Portrait aspect: width / height of face art */
  aspect: number
  kind: 'new-craft' | 'kensho' | 'specimen' | 'gaoling' | 'motou'
}

/** 5 种票面画法按序循环 */
const KINDS: StampDef['kind'][] = ['new-craft', 'kensho', 'specimen', 'gaoling', 'motou']
const ASPECTS = [0.78, 0.82, 0.76, 0.8, 0.78]

/**
 * 俯视撒开的 11 个位置（票心 %）。手写死比随机可控：
 * 左上给页面头部留出呼吸，右侧和下方铺满。
 * rot/scale/z 交错避免呆板，z 大的在上。
 */
const SCATTER = [
  { x: 31, y: 26, rotation: -8, scale: 1.0, z: 3 },
  { x: 49, y: 20, rotation: 6, scale: 1.02, z: 5 },
  { x: 66, y: 24, rotation: -4, scale: 1.0, z: 2 },
  { x: 80, y: 40, rotation: 9, scale: 1.05, z: 4 },
  { x: 42, y: 44, rotation: -7, scale: 0.98, z: 6 },
  { x: 60, y: 44, rotation: 5, scale: 1.0, z: 1 },
  { x: 28, y: 62, rotation: 12, scale: 0.97, z: 3 },
  { x: 46, y: 66, rotation: -10, scale: 0.98, z: 5 },
  { x: 64, y: 62, rotation: 7, scale: 0.95, z: 2 },
  { x: 82, y: 62, rotation: -6, scale: 0.94, z: 4 },
  { x: 55, y: 80, rotation: -3, scale: 0.92, z: 1 },
]

/**
 * 由友链数据生成邮票定义。id 用 URL 保证稳定（纹理缓存按 id 存）。
 */
export function buildStamps(items: FriendItem[]): StampDef[] {
  return items.map((item, i) => {
    const slot = SCATTER[i % SCATTER.length]
    return {
      id: item.url,
      label: item.name,
      url: item.url,
      desc: item.desc,
      x: slot.x,
      y: slot.y,
      rotation: slot.rotation,
      scale: slot.scale,
      z: slot.z,
      aspect: ASPECTS[i % ASPECTS.length],
      kind: KINDS[i % KINDS.length],
    }
  })
}
