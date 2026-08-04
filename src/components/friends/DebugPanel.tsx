import { DEFAULT_DEBUG, type DebugParams } from './debugParams'

type Props = {
  params: DebugParams
  onChange: (next: DebugParams) => void
}

type SliderDef = {
  key: keyof DebugParams
  label: string
  description: string
  min: number
  max: number
  step: number
  unit?: string
}

type Group = {
  title: string
  description: string
  controls: SliderDef[]
  open?: boolean
}

const GROUPS: Group[] = [
  {
    title: '票面材质',
    description: '控制喷砂颗粒、闪卡反射和斑驳高光。',
    open: true,
    controls: [
      {
        key: 'bumpScale',
        label: '喷砂起伏',
        description: '微法线强度。越大越粗糙；过大会重新变成浮雕。',
        min: 0,
        max: 5,
        step: 0.05,
      },
      {
        key: 'frost',
        label: '磨砂高光',
        description: '宽而柔的白色反光，决定喷砂膜的雾面感。',
        min: 0,
        max: 1.2,
        step: 0.01,
      },
      {
        key: 'frostSharpness',
        label: '磨砂锐度',
        description: '控制雾面高光的聚拢程度。低值柔散，高值更细、更集中。',
        min: 3,
        max: 60,
        step: 1,
      },
      {
        key: 'microGrain',
        label: '微表面强度',
        description: '叠加在高度图上的极细微法线。增加触感但不会造成立体浮雕。',
        min: 0,
        max: 0.65,
        step: 0.01,
      },
      {
        key: 'microGrainScale',
        label: '微表面密度',
        description: '细颗粒在票面上的密度。越高颗粒越小、越细腻。',
        min: 0.4,
        max: 3.5,
        step: 0.05,
      },
      {
        key: 'foil',
        label: '全息箔强度',
        description: '彩色闪卡反射的总体亮度。',
        min: 0,
        max: 2.5,
        step: 0.02,
      },
      {
        key: 'foilSharpness',
        label: '箔面锐度',
        description: '高光集中程度。数值大是窄闪光，数值小是大片泛光。',
        min: 4,
        max: 120,
        step: 1,
      },
      {
        key: 'holoBands',
        label: '色带密度',
        description: '全息颜色在票面重复的次数。',
        min: 0.2,
        max: 4,
        step: 0.02,
      },
      {
        key: 'glitter',
        label: '闪点强度',
        description: '离散亮点的亮度，不改变喷砂底纹。',
        min: 0,
        max: 2.5,
        step: 0.02,
      },
      {
        key: 'glitterDensity',
        label: '闪点密度',
        description: '闪点出现的概率。降低后更克制、更像细粉而非亮片。',
        min: 0,
        max: 1,
        step: 0.01,
      },
      {
        key: 'glitterSharpness',
        label: '闪点锐度',
        description: '闪点的尺寸与集中度。高值更小更尖，低值更大更软。',
        min: 8,
        max: 180,
        step: 1,
      },
      {
        key: 'dapple',
        label: '斑驳光',
        description: '用噪声打散均匀照明，让亮面更有机。',
        min: 0,
        max: 1.5,
        step: 0.02,
      },
    ],
  },
  {
    title: '灯光',
    description: '控制基础亮度与指针光源的形态。',
    controls: [
      {
        key: 'ambient',
        label: '环境光',
        description: '没有正面高光时仍保留的基础亮度。',
        min: 0.2,
        max: 1.4,
        step: 0.01,
      },
      {
        key: 'keyLight',
        label: '指针主光',
        description: '跟随鼠标移动的主光强度。',
        min: 0,
        max: 1.5,
        step: 0.01,
      },
      {
        key: 'lightHeight',
        label: '光源高度',
        description: '光源离票面的距离。低值更侧、更戏剧化；高值更均匀。',
        min: 0.2,
        max: 2,
        step: 0.02,
      },
      {
        key: 'lightRadius',
        label: '点光半径',
        description: '鼠标周围局部亮斑的范围。数值越小，点光越集中。',
        min: 0.04,
        max: 0.75,
        step: 0.01,
      },
    ],
  },
  {
    title: '缺口显影',
    description: '保留原来的显影方式，只调边界的凹口、断岛和毛边。',
    open: true,
    controls: [
      {
        key: 'burnDuration',
        label: '显影时长',
        description: 'Hover 后从平面印刷切到闪卡材质所需时间。',
        min: 0.1,
        max: 2,
        step: 0.02,
        unit: '秒',
      },
      {
        key: 'burnNoiseScale',
        label: '大轮廓尺度',
        description: '决定主要显影斑块大小。越小越大块，越大越碎。',
        min: 0.8,
        max: 12,
        step: 0.1,
      },
      {
        key: 'burnDetailScale',
        label: '小轮廓尺度',
        description: '控制缺口与断裂小岛的密度。',
        min: 2,
        max: 28,
        step: 0.1,
      },
      {
        key: 'burnDetailMix',
        label: '细节混合',
        description: '小轮廓参与主显影场的比例。高值会更碎。',
        min: 0,
        max: 0.75,
        step: 0.01,
      },
      {
        key: 'burnBite',
        label: '缺口深度',
        description: '边界向内凹陷的幅度；这是“被咬掉一块”的主旋钮。',
        min: 0,
        max: 0.8,
        step: 0.01,
      },
      {
        key: 'burnBiteThreshold',
        label: '缺口阈值',
        description: '只有超过阈值的噪声脊线才切出缺口。高值更少、更孤立。',
        min: 0.2,
        max: 0.92,
        step: 0.01,
      },
      {
        key: 'burnWarp',
        label: '轮廓扭曲',
        description: '弯曲整个噪声场，形成不对称凸起和内凹。',
        min: 0,
        max: 0.25,
        step: 0.005,
      },
      {
        key: 'burnDirection',
        label: '方向偏置',
        description: '让显影略偏向左→右。设为 0 时从全场随机显影。',
        min: -0.8,
        max: 0.8,
        step: 0.01,
      },
      {
        key: 'burnEdge',
        label: '边缘软度',
        description: '显影边界的过渡宽度。越低越硬，越高越像柔焦扩散。',
        min: 0.005,
        max: 0.25,
        step: 0.005,
      },
      {
        key: 'burnGrain',
        label: '边缘喷粒',
        description: '只在缺口边缘加入细砂点，避免轮廓过于光滑。',
        min: 0,
        max: 2,
        step: 0.02,
      },
      {
        key: 'burnGlow',
        label: '暖色亮边',
        description: '显影接缝上的浅金色亮度；不是实体火焰。',
        min: 0,
        max: 2,
        step: 0.02,
      },
      {
        key: 'burnShadow',
        label: '边缘暗缝',
        description: '亮边下方的轻微暗线，用于提高缺口可读性。',
        min: 0,
        max: 0.8,
        step: 0.01,
      },
      {
        key: 'burnDrift',
        label: '噪声漂移',
        description: '显影进行时轮廓缓慢流动的速度。设为 0 完全静止。',
        min: 0,
        max: 1,
        step: 0.01,
      },
    ],
  },
  {
    title: '空间动效',
    description: '控制聚焦、模糊与 3D 跟手感。',
    controls: [
      {
        key: 'tiltMax',
        label: '最大倾角',
        description: '鼠标移到票面边缘时的最大 3D 旋转角。',
        min: 0,
        max: 28,
        step: 0.5,
        unit: '°',
      },
      {
        key: 'focusScale',
        label: '聚焦放大',
        description: '当前邮票 Hover 后的整体缩放。',
        min: 1,
        max: 1.45,
        step: 0.01,
      },
      {
        key: 'dimBlur',
        label: '背景模糊',
        description: '当前票聚焦时，其他邮票的模糊半径。',
        min: 0,
        max: 30,
        step: 0.5,
        unit: 'px',
      },
      {
        key: 'springStiffness',
        label: '跟手刚度',
        description: '3D tilt 追赶鼠标的速度。越高越快、越直接。',
        min: 60,
        max: 700,
        step: 5,
      },
      {
        key: 'springDamping',
        label: '回弹阻尼',
        description: '抑制倾斜过冲。越低越弹，越高越稳。',
        min: 5,
        max: 60,
        step: 1,
      },
    ],
  },
]

function formatValue(value: number, unit = '') {
  const number = Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')
  return `${number}${unit}`
}

export function DebugPanel({ params, onChange }: Props) {
  if (!params.panelOpen) {
    return (
      <button
        type="button"
        className="debug-fab"
        onClick={() => onChange({ ...params, panelOpen: true })}
      >
        调试参数
      </button>
    )
  }

  const set = <K extends keyof DebugParams>(key: K, value: DebugParams[K]) => {
    onChange({ ...params, [key]: value })
  }

  return (
    <aside className="debug-panel" aria-label="邮票效果调试面板">
      <header className="debug-head">
        <div>
          <h3>邮票效果调试</h3>
          <p>参数会实时应用；“缺口显影”是当前重点。</p>
        </div>
        <button
          type="button"
          className="debug-icon"
          onClick={() => set('panelOpen', false)}
          aria-label="关闭调试面板"
        >
          ×
        </button>
      </header>

      <section className="debug-preview">
        <label className="debug-check">
          <input
            type="checkbox"
            checked={params.previewEnabled}
            onChange={(event) => set('previewEnabled', event.target.checked)}
          />
          <span>
            <strong>冻结显影进度</strong>
            <small>保持在中间帧，专门观察缺口和边缘。</small>
          </span>
        </label>
        <label className={`debug-control ${params.previewEnabled ? '' : 'is-disabled'}`}>
          <span className="debug-control-head">
            <strong>显影进度</strong>
            <em>{formatValue(params.previewProgress * 100, '%')}</em>
          </span>
          <small>0% 是平面印刷，100% 是完整闪卡材质。</small>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={params.previewProgress}
            disabled={!params.previewEnabled}
            onChange={(event) => set('previewProgress', Number(event.target.value))}
          />
        </label>
      </section>

      {GROUPS.map((group) => (
        <details className="debug-group" key={group.title} open={group.open}>
          <summary>
            <span>{group.title}</span>
            <small>{group.description}</small>
          </summary>
          <div className="debug-group-body">
            {group.controls.map((control) => {
              const value = params[control.key] as number
              return (
                <label className="debug-control" key={control.key}>
                  <span className="debug-control-head">
                    <strong>{control.label}</strong>
                    <em>{formatValue(value, control.unit)}</em>
                  </span>
                  <small>{control.description}</small>
                  <input
                    type="range"
                    min={control.min}
                    max={control.max}
                    step={control.step}
                    value={value}
                    onChange={(event) =>
                      set(control.key, Number(event.target.value) as never)
                    }
                  />
                </label>
              )
            })}
          </div>
        </details>
      ))}

      <div className="debug-actions">
        <button
          type="button"
          onClick={() => onChange({ ...DEFAULT_DEBUG, panelOpen: true })}
        >
          恢复默认
        </button>
        <button
          type="button"
          onClick={() => {
            const { panelOpen: _panelOpen, ...rest } = params
            void navigator.clipboard?.writeText(JSON.stringify(rest, null, 2))
          }}
        >
          复制参数 JSON
        </button>
      </div>
    </aside>
  )
}
