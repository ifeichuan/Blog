import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// 全屏纸面 zoom-out 收成一张卡片（沉浸→揭示），随后逐词点亮
const TEXT =
  'I care less about whether it runs — and more about why it is built this way. Understand from zero, then reinvent.'
const EM = new Set(['why', 'zero,', 'reinvent.'])

export function ManifestoV4() {
  const sectionRef = useRef<HTMLElement>(null)
  const cardRef = useRef<HTMLElement>(null)
  const wordsRef = useRef<HTMLSpanElement[]>([])
  const tailRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const section = sectionRef.current
    const card = cardRef.current
    if (!section || !card) return

    const ctx = gsap.context(() => {
      let cover = 1
      const measure = () => {
        cover =
          Math.max(
            window.innerWidth / card.offsetWidth,
            window.innerHeight / card.offsetHeight,
          ) * 1.06
      }

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const st = ScrollTrigger.create({
          trigger: section,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          invalidateOnRefresh: true,
          onRefresh: measure,
          onUpdate: (self) => {
            const p = self.progress
            const shrink = Math.min(1, p / 0.3)
            const eased = 1 - Math.pow(1 - shrink, 3)
            gsap.set(card, { scale: cover + (1 - cover) * eased })
            card.style.setProperty('--flat', String(shrink))
            card.style.setProperty(
              '--txtin',
              String(Math.min(1, Math.max(0, (p - 0.22) / 0.1))),
            )
            const words = wordsRef.current
            const lit = Math.floor(
              Math.min(1, Math.max(0, (p - 0.34) / 0.5)) * words.length,
            )
            words.forEach((w, i) => w.classList.toggle('lit', i < lit))
            tailRef.current?.classList.toggle('in', p > 0.88)
          },
        })
        measure()
        return () => st.kill()
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.set(card, { scale: 1 })
        card.style.setProperty('--flat', '1')
        card.style.setProperty('--txtin', '1')
        wordsRef.current.forEach((w) => w.classList.add('lit'))
        tailRef.current?.classList.add('in')
      })
    }, section)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="v4-manifesto" aria-label="Manifesto">
      <div className="v4-pin">
        <figure className="mani-card" ref={cardRef}>
          <figcaption>manifesto</figcaption>
          <p>
            {TEXT.split(' ').map((w, i) => (
              <span
                key={i}
                ref={(el) => {
                  if (el) wordsRef.current[i] = el
                }}
                className={EM.has(w) ? 'em' : undefined}
              >
                {w}{' '}
              </span>
            ))}
          </p>
          <p className="mani-tail" ref={tailRef}>
            This page is the proof — keep scrolling.
          </p>
        </figure>
      </div>
    </section>
  )
}
