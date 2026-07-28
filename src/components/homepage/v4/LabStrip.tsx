// lab 试验场引流：CSS 无限跑马灯（合成器动画），hover 暂停
const DEMOS = [
  'gooey',
  'blur 三件套',
  'texture-lab',
  'lenis × 5',
  'DappledLight',
  '打字动画',
  'braille loading',
  '液态玻璃',
]

export function LabStrip() {
  return (
    <section className="v4-lab" aria-label="Lab demos">
      <p className="v4-eyebrow">lab — 效果试验场</p>
      <a className="lab-clip" href="/labs">
        <div className="lab-track">
          {[...DEMOS, ...DEMOS].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <span className="lab-go">全部 demo →</span>
      </a>
    </section>
  )
}
