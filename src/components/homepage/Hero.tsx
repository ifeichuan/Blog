import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const words = ['创意前端', '交互设计', '能玩的界面', 'Agent UI', 'VoiceStream']

export function Hero() {
  const containerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [typed, setTyped] = useState('')
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const w = words[wordIdx]
    const timeout = setTimeout(() => {
      if (!deleting) {
        setTyped(w.slice(0, charIdx + 1))
        if (charIdx + 1 >= w.length) {
          setTimeout(() => setDeleting(true), 1400)
        } else {
          setCharIdx(c => c + 1)
        }
      } else {
        setTyped(w.slice(0, charIdx))
        if (charIdx <= 0) {
          setDeleting(false)
          setWordIdx(i => (i + 1) % words.length)
          setCharIdx(0)
        } else {
          setCharIdx(c => c - 1)
        }
      }
    }, deleting ? 55 : 100)
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, wordIdx])

  useEffect(() => {
    if (!containerRef.current || !contentRef.current) return
    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        y: -120, opacity: 0,
        ease: 'none',
        scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: true }
      })
      gsap.to('.dapple-orb', {
        y: 80, ease: 'none',
        scrollTrigger: { trigger: containerRef.current, start: 'top top', end: 'bottom top', scrub: true }
      })
    }, containerRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={containerRef} className="relative h-[200vh]">
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="dapple-orb absolute w-[500px] h-[500px] rounded-full blur-[80px] opacity-45 mix-blend-screen bg-[#DA702C] left-[5%] top-[15%]" />
          <div className="dapple-orb absolute w-[400px] h-[400px] rounded-full blur-[80px] opacity-45 mix-blend-screen bg-[#4385BE] right-[8%] top-[25%]" />
          <div className="dapple-orb absolute w-[350px] h-[350px] rounded-full blur-[80px] opacity-45 mix-blend-screen bg-[#879A39] left-[30%] bottom-[5%]" />
        </div>
        <div ref={contentRef} className="relative z-10 max-w-[1080px] w-full px-6">
          <p className="text-[13px] tracking-[.3em] uppercase text-[--tx2] mb-6">你好，我是</p>
          <h1 className="text-[clamp(44px,8vw,96px)] leading-[1.02] font-bold tracking-tighter">
            扉川<br/>
            <span className="text-[--tx3] font-normal">我做 </span>
            <span className="text-[--orange]">
              {typed}
              <span className="inline-block w-[3px] h-[.9em] bg-[--orange] ml-1 align-[-0.05em] animate-blink" />
            </span>
          </h1>
          <p className="mt-8 text-[clamp(17px,2.2vw,22px)] text-[--tx2] max-w-[560px] opacity-85">
            大三在读，AI + 前端。比起把同一个组件写到第一百遍，我更想知道为什么这么设计。<br/>这个网站本身就是作品。
          </p>
        </div>
      </div>
    </section>
  )
}
