/**
 * 邮票墙滚动总线 —— 对 Haoqi / JOYCO 的简化：
 * 一个 rAF 读 scroll，所有票共享同一帧的位移和速度。
 * 不进 React state，避免滚动时整树重渲。
 * 静止后停帧，滚动或灯箱关闭时再唤醒。
 */

type ScrollSnapshot = {
  scrollY: number
  velocity: number
  activity: number
  direction: number
}

const snapshot: ScrollSnapshot = {
  scrollY: 0,
  velocity: 0,
  activity: 0,
  direction: 0,
}

const IDLE_ACTIVITY = 0.001
const IDLE_DELTA = 0.25

export const getStampScrollSnapshot = () => snapshot

function isViewerOpen() {
  return document.body.classList.contains('has-stamp-viewer')
}

function writeParallax(cards: HTMLElement[], par: string, curl: string) {
  for (const el of cards) {
    el.style.setProperty('--stamp-par', par)
    el.style.setProperty('--stamp-curl', curl)
  }
}

export function startStampScrollBus(stage: HTMLElement) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return () => {}
  }

  let prevY = window.scrollY
  let prevT = performance.now()
  let raf = 0
  let running = true
  let cards: HTMLElement[] = []

  const refreshCards = () => {
    cards = Array.from(stage.querySelectorAll<HTMLElement>('.stamp-card'))
  }

  const tick = (now: number) => {
    if (!running) return
    raf = 0
    if (isViewerOpen()) {
      writeParallax(cards, '0px', '0deg')
      return
    }

    const y = window.scrollY
    const dy = y - prevY
    const dt = Math.min(0.1, Math.max(1 / 240, (now - prevT) / 1000))
    const velocity = dy / dt
    prevY = y
    prevT = now

    const target = Math.min(1, Math.abs(velocity) / 900)
    const tau = target > snapshot.activity ? 0.03 : 0.16
    snapshot.activity += (target - snapshot.activity) * (1 - Math.exp(-dt / tau))
    snapshot.scrollY = y
    snapshot.velocity = velocity
    snapshot.direction = velocity === 0 ? snapshot.direction : Math.sign(velocity)

    if (snapshot.activity < IDLE_ACTIVITY && Math.abs(dy) < IDLE_DELTA) {
      snapshot.activity = 0
      snapshot.velocity = 0
      writeParallax(cards, '0px', '0deg')
      return
    }

    const activity = snapshot.activity
    const dir = snapshot.direction
    for (const el of cards) {
      const depth = Number(el.dataset.depth ?? 0)
      const par = depth * activity * dir * -16
      const curl = depth * activity * dir * -3.2
      el.style.setProperty('--stamp-par', `${par.toFixed(2)}px`)
      el.style.setProperty('--stamp-curl', `${curl.toFixed(2)}deg`)
    }

    raf = requestAnimationFrame(tick)
  }

  const kick = () => {
    if (!running || raf !== 0 || isViewerOpen()) return
    refreshCards()
    prevY = window.scrollY
    prevT = performance.now()
    raf = requestAnimationFrame(tick)
  }

  const onVisibility = () => {
    if (document.hidden) {
      running = false
      cancelAnimationFrame(raf)
      raf = 0
      return
    }
    if (!running) {
      running = true
      kick()
    }
  }

  const onBodyClass = () => {
    if (isViewerOpen()) {
      cancelAnimationFrame(raf)
      raf = 0
      writeParallax(cards, '0px', '0deg')
      return
    }
    kick()
  }

  refreshCards()
  document.addEventListener('visibilitychange', onVisibility)
  window.addEventListener('scroll', kick, { passive: true })
  const bodyWatch = new MutationObserver(onBodyClass)
  bodyWatch.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  kick()

  return () => {
    running = false
    cancelAnimationFrame(raf)
    raf = 0
    document.removeEventListener('visibilitychange', onVisibility)
    window.removeEventListener('scroll', kick)
    bodyWatch.disconnect()
  }
}
