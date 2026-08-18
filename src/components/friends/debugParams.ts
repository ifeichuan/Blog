export type DebugParams = {
  /** 喷砂微法线强度 */
  bumpScale: number
  /** 全息箔反射强度 */
  foil: number
  /** 离散闪点强度 */
  glitter: number
  /** 离散闪点密度 */
  glitterDensity: number
  /** 离散闪点锐度 */
  glitterSharpness: number
  /** 斑驳光调制量 */
  dapple: number
  /** 磨砂宽高光强度 */
  frost: number
  /** 磨砂高光锐度 */
  frostSharpness: number
  /** 高频微表面法线强度 */
  microGrain: number
  /** 高频微表面颗粒密度 */
  microGrainScale: number
  /** 箔面高光锐度 */
  foilSharpness: number
  /** 全息色带密度 */
  holoBands: number
  /** 光源离票面的高度 */
  lightHeight: number
  /** 指针点光半径 */
  lightRadius: number
  /** 环境光强度 */
  ambient: number
  /** 指针主光强度 */
  keyLight: number

  /** Hover 最大倾角 */
  tiltMax: number
  /** 聚焦缩放 */
  focusScale: number
  /** 兄弟元素模糊 */
  dimBlur: number
  /** 3D tilt 弹簧刚度 */
  springStiffness: number
  /** 3D tilt 弹簧阻尼 */
  springDamping: number

  /** 斑驳显影时长（秒） */
  burnDuration: number
  /** 大斑块频率 */
  burnNoiseScale: number
  /** 小斑块频率 */
  burnDetailScale: number
  /** 小斑块混合量 */
  burnDetailMix: number
  /** 缺口切入深度 */
  burnBite: number
  /** 产生缺口的脊线阈值 */
  burnBiteThreshold: number
  /** UV 液态扭曲强度 */
  burnWarp: number
  /** 显影方向偏置 */
  burnDirection: number
  /** 斑块边缘软度 */
  burnEdge: number
  /** 边界暖光强度 */
  burnGlow: number
  /** 边界暗缝强度 */
  burnShadow: number
  /** 边缘喷砂颗粒量 */
  burnGrain: number
  /** 噪声场缓慢漂移速度 */
  burnDrift: number
  /** 是否手动冻结显影进度 */
  previewEnabled: boolean
  /** 手动显影进度 */
  previewProgress: number

  /** 是否展示调试面板 */
  panelOpen: boolean
}

export const DEFAULT_DEBUG: DebugParams = {
  bumpScale: 1.55,
  foil: 0.88,
  glitter: 0.7,
  glitterDensity: 0.33,
  glitterSharpness: 71,
  dapple: 1.5,
  frost: 0.18,
  frostSharpness: 15,
  microGrain: 0.26,
  microGrainScale: 2.75,
  foilSharpness: 34,
  holoBands: 4,
  lightHeight: 0.76,
  lightRadius: 0.25,
  ambient: 0.9,
  keyLight: 0.05,

  tiltMax: 12,
  focusScale: 1.2,
  dimBlur: 6,
  springStiffness: 320,
  springDamping: 26,

  burnDuration: 0.92,
  burnNoiseScale: 4.6,
  burnDetailScale: 9,
  burnDetailMix: 0.24,
  burnBite: 0.26,
  burnBiteThreshold: 0.62,
  burnWarp: 0.115,
  burnDirection: 0.08,
  burnEdge: 0.052,
  burnGlow: 0.42,
  burnShadow: 0.14,
  burnGrain: 0.48,
  burnDrift: 0.12,
  previewEnabled: false,
  previewProgress: 0.5,

  panelOpen: true,
}
