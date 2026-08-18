export type OilPaintParams = {
  strokeScale: number
  strokeDirection: number
  strokeStrength: number
  strokeAnisotropy: number
  smearStrength: number
  smearLength: number
  paintThickness: number
  paintBump: number
  displacement: number
  canvasScale: number
  canvasBump: number
  roughness: number
  specular: number
  colorLevels: number
}

export type ViewMode =
  | 'final'
  | 'source'
  | 'stroke'
  | 'smear'
  | 'blocks'
  | 'thickness'
  | 'normal'
  | 'canvas'

export const VIEW_MODES: { id: ViewMode; label: string; hint: string }[] = [
  { id: 'final', label: '成画', hint: '四层叠完的结果' },
  { id: 'source', label: '原图', hint: '未经处理的照片' },
  { id: 'stroke', label: '笔触', hint: '拉长的方向噪声' },
  { id: 'smear', label: '拖拽', hint: '横向融化遮罩' },
  { id: 'blocks', label: '分色', hint: '颜料重新分块' },
  { id: 'thickness', label: '厚度', hint: '颜料堆积高度' },
  { id: 'normal', label: '法线', hint: '笔触 + 画布凹凸' },
  { id: 'canvas', label: '画布', hint: '底材纤维编织' },
]

export const VIEW_MODE_INDEX: Record<ViewMode, number> = {
  final: 0,
  source: 1,
  stroke: 2,
  smear: 3,
  blocks: 4,
  thickness: 5,
  normal: 6,
  canvas: 7,
}

export const DEFAULT_PARAMS: OilPaintParams = {
  strokeScale: 14,
  strokeDirection: 0,
  strokeStrength: 0.022,
  strokeAnisotropy: 6.4,
  smearStrength: 0.5,
  smearLength: 0.012,
  paintThickness: 1.7,
  paintBump: 2.7,
  displacement: 0.1,
  canvasScale: 160,
  canvasBump: 0.08,
  roughness: 0.34,
  specular: 0.32,
  colorLevels: 6,
}

export const PRESETS: { id: string; label: string; params: OilPaintParams }[] = [
  { id: 'reference', label: '参考', params: { ...DEFAULT_PARAMS } },
  {
    id: 'wash',
    label: '薄涂',
    params: {
      ...DEFAULT_PARAMS,
      strokeStrength: 0.014,
      smearStrength: 0.22,
      smearLength: 0.006,
      paintThickness: 0.22,
      paintBump: 0.5,
      displacement: 0.02,
      canvasBump: 0.22,
      specular: 0.04,
      colorLevels: 10,
    },
  },
  {
    id: 'impasto',
    label: '堆厚',
    params: {
      ...DEFAULT_PARAMS,
      strokeScale: 12,
      strokeStrength: 0.018,
      smearStrength: 0.32,
      smearLength: 0.008,
      paintThickness: 2.1,
      paintBump: 3.3,
      displacement: 0.14,
      canvasBump: 0.06,
      roughness: 0.3,
      specular: 0.36,
      colorLevels: 6,
    },
  },
  {
    id: 'melt',
    label: '融化',
    params: {
      ...DEFAULT_PARAMS,
      strokeScale: 38,
      strokeStrength: 0.04,
      smearStrength: 0.95,
      smearLength: 0.028,
      paintThickness: 0.7,
      paintBump: 1.2,
      displacement: 0.05,
      colorLevels: 6,
    },
  },
]

export type SliderDef = {
  key: keyof OilPaintParams
  label: string
  hint: string
  min: number
  max: number
  step: number
}

export const PARAM_GROUPS: { title: string; hint: string; controls: SliderDef[] }[] = [
  {
    title: '笔触',
    hint: '方向噪声，决定颜料被刷子拖开的方向',
    controls: [
      { key: 'strokeScale', label: '笔触大小', hint: '噪声频率。越大笔触越细。', min: 8, max: 70, step: 0.5 },
      { key: 'strokeDirection', label: '笔触方向', hint: '0° 是横向拖拽，90° 是竖向。', min: 0, max: 180, step: 1 },
      { key: 'strokeStrength', label: '笔触扭曲', hint: '沿笔触方向扰动 UV 的幅度。', min: 0, max: 0.08, step: 0.001 },
      { key: 'strokeAnisotropy', label: '笔触拉长', hint: 'X 低频 / Y 高频。越高越像刷痕。', min: 1, max: 14, step: 0.1 },
    ],
  },
  {
    title: '横向拖拽',
    hint: '比纹理本身更接近参考图的「融化」',
    controls: [
      { key: 'smearStrength', label: '融化程度', hint: '局部 smear 遮罩的整体强度。', min: 0, max: 1.2, step: 0.01 },
      { key: 'smearLength', label: '拖拽长度', hint: '每一拍采样的水平跨度。脸被拉成条纹。', min: 0, max: 0.04, step: 0.0005 },
    ],
  },
  {
    title: '厚涂',
    hint: '刀刮大块隆起 + 刷脊 + 鬃毛细纹，再被斜光刮出来',
    controls: [
      { key: 'paintThickness', label: '颜料堆量', hint: '高度场本身。越大块面越高。', min: 0, max: 2.4, step: 0.01 },
      { key: 'paintBump', label: '脊线陡度', hint: '法线倾斜。越大沟越深、脊越亮。', min: 0, max: 4, step: 0.02 },
      { key: 'displacement', label: '立体隆起', hint: '按画幅比例把网格顶起来，侧面能看见堆。', min: 0, max: 0.18, step: 0.002 },
    ],
  },
  {
    title: '画布',
    hint: '底材纤维，和颜料不是同一个尺度',
    controls: [
      { key: 'canvasScale', label: '纤维密度', hint: '亚麻编织的频率。', min: 40, max: 320, step: 2 },
      { key: 'canvasBump', label: '画布粗糙度', hint: '底材法线混进最终光照。', min: 0, max: 0.4, step: 0.005 },
    ],
  },
  {
    title: '光泽',
    hint: '厚颜料表面那一层很薄的 specular',
    controls: [
      { key: 'roughness', label: '油彩粗糙', hint: '越高高光越散，越像亚光颜料。', min: 0.15, max: 1, step: 0.01 },
      { key: 'specular', label: '油彩光泽', hint: '凸起笔触上的高光量。', min: 0, max: 0.4, step: 0.005 },
    ],
  },
  {
    title: '色彩',
    hint: '油画不是连续渐变，是重新分块的颜料',
    controls: [
      { key: 'colorLevels', label: '分色级数', hint: '亮度被切成几档。越少越像厚涂块面。', min: 3, max: 14, step: 1 },
    ],
  },
]
