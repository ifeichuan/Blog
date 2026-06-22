import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const text = '我相信 长期持有 大于 短线投机 —— 对代码、 对手艺、 对人 都一样。 好的设计 是克制。 好的代码 是没写的代码。'
const emphasisWords = ['长期持有', '短线投机', '克制。', '没写的代码。']

export function Manifesto() {
  const ref = useRef<HTMLDivElement>(null)
  const wordsRef = useRef<HTMLSpanElement[]>([])

  useEffect(() => {
    if (!ref.current) return
    const words = wordsRef.current
    const ctx = gsap.context(() => {
      gsap.to({}, {
        scrollTrigger: {
          trigger: ref.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const litCount = Math.floor(self.progress * words.length * 1.3)
            words.forEach((w, i) => {
              w.style.opacity = i < litCount ? '1' : '.12'
            })
          }
        }
      })
    }, ref)
    return () => ctx.revert()
  }, [])

  const wordList = text.split(' ')

  return (
    <section ref={ref} className="relative min-h-[160vh]">
      <div className="sticky top-0 h-screen flex items-center px-6">
        <div className="max-w-[1080px] mx-auto w-full">
          {wordList.map((w, i) => (
            <span
              key={i}
              ref={el => { if (el) wordsRef.current[i] = el }}
              className={`inline text-[clamp(28px,4.5vw,52px)] leading-[1.4] font-semibold tracking-tight opacity-[.12] transition-opacity duration-100 ${emphasisWords.includes(w) ? 'text-[--orange]' : ''}`}
            >
              {w}{' '}
            </span>
          ))}
          <span className="block mt-9 text-[clamp(15px,1.8vw,18px)] text-[--tx2] font-normal opacity-0 manifesto-sub">
            （顺便：第一关到第三关我还是会的。面试官不要再学历挂我了。）
          </span>
        </div>
      </div>
    </section>
  )
}
