import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import './friend-form-dock.css'

const move = { type: 'spring' as const, bounce: 0, duration: 0.4 }
const fade = { duration: 0.18, ease: [0.2, 0, 0, 1] as const }

/**
 * 右下角友链入口。同一张卡用 layout 从 pill 长到 popover，
 * 内容只做透明度交叉淡化 —— 不拆两块 layoutId，避免投影叠闪。
 */
export function FriendFormDock() {
  const [open, setOpen] = useState(false)
  const reduce = useReducedMotion()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)
  const timing = reduce ? { duration: 0 } : move
  const fadeTiming = reduce ? { duration: 0 } : fade

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(() => firstFieldRef.current?.focus(), reduce ? 0 : 280)
    return () => window.clearTimeout(id)
  }, [open, reduce])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const close = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            className="friend-dock-backdrop"
            aria-label="关闭友链表单"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={fadeTiming}
            onClick={close}
          />
        )}
      </AnimatePresence>

      <div className="friend-dock">
        <motion.div
          layout
          className={`friend-dock-card${open ? ' is-open' : ''}`}
          initial={false}
          transition={timing}
          style={{ transformOrigin: 'bottom right' }}
        >
          <AnimatePresence initial={false} mode="wait">
            {open ? (
              <motion.div
                key="form"
                className="friend-dock-face"
                role="dialog"
                aria-labelledby="friend-form-title"
                aria-modal="true"
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTiming}
              >
                <FriendForm firstFieldRef={firstFieldRef} onClose={close} reduce={!!reduce} />
              </motion.div>
            ) : (
              <motion.button
                key="trigger"
                ref={triggerRef}
                type="button"
                className="friend-dock-trigger"
                aria-haspopup="dialog"
                aria-expanded={false}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTiming}
                whileHover={reduce ? undefined : { scale: 1.03 }}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                onClick={() => setOpen(true)}
              >
                也想贴一张
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  )
}

function FriendForm({
  firstFieldRef,
  onClose,
  reduce,
}: {
  firstFieldRef: RefObject<HTMLInputElement | null>
  onClose: () => void
  reduce: boolean
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState('')
  const [result, setResult] = useState('')
  const [mailto, setMailto] = useState('#')
  const [copied, setCopied] = useState(false)

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const form = formRef.current
    if (!form) return

    const fd = new FormData(form)
    const name = clean(String(fd.get('name') ?? ''))
    const url = toUrl(String(fd.get('url') ?? ''))
    const avatar = toUrl(String(fd.get('avatar') ?? ''))
    const desc = clean(String(fd.get('desc') ?? ''))
    const email = clean(String(fd.get('email') ?? ''))

    const errors: string[] = []
    if (!name) errors.push('站名不能为空')
    if (!url) errors.push('网址不能为空')
    else if (!isHttpUrl(url)) errors.push('网址需是完整的 http(s) 地址')
    if (!desc) errors.push('一句话不能为空')
    if (avatar && !isHttpUrl(avatar)) errors.push('头像地址需是完整的 http(s) 地址')

    if (errors.length > 0) {
      setResult('')
      setError(errors.join('；'))
      return
    }

    const lines = [
      `name   ${name}`,
      `url    ${url}`,
      avatar ? `avatar ${avatar}` : '',
      `desc   ${desc}`,
      email ? `email  ${email}` : '',
    ].filter(Boolean)
    const text = lines.join('\n')
    setError('')
    setResult(text)
    setMailto(
      `mailto:feichuan05@gmail.com?subject=${encodeURIComponent(`友链申请：${name}`)}&body=${encodeURIComponent(text)}`,
    )
  }

  const onCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = result
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      ta.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <form ref={formRef} className="friend-form" noValidate onSubmit={onSubmit}>
      <header className="friend-form-head">
        <div>
          <h2 id="friend-form-title">也想贴一张？</h2>
          <p>填好站名、地址和一句话，生成后复制或发邮件。</p>
        </div>
        <motion.button
          type="button"
          className="friend-form-close"
          aria-label="关闭"
          onClick={onClose}
          whileTap={reduce ? undefined : { scale: 0.96 }}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </motion.button>
      </header>

      <div className="form-grid">
        <label className="form-field">
          <span className="form-label">
            站名 <em className="req">必填</em>
          </span>
          <input
            ref={firstFieldRef}
            type="text"
            name="name"
            required
            maxLength={30}
            placeholder="如：Feichuan"
            autoComplete="off"
          />
        </label>
        <label className="form-field">
          <span className="form-label">
            网址 <em className="req">必填</em>
          </span>
          <input type="url" name="url" required placeholder="https://example.com" inputMode="url" />
        </label>
        <label className="form-field">
          <span className="form-label">头像</span>
          <input type="url" name="avatar" placeholder="https://example.com/avatar.webp" inputMode="url" />
        </label>
        <label className="form-field form-field-wide">
          <span className="form-label">
            一句话 <em className="req">必填</em>
          </span>
          <input type="text" name="desc" required maxLength={60} placeholder="用一句话介绍你的站点" />
        </label>
        <label className="form-field form-field-wide">
          <span className="form-label">邮箱（选填，用于回信）</span>
          <input type="email" name="email" placeholder="you@example.com" autoComplete="email" />
        </label>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <motion.button
          type="submit"
          className="form-submit"
          whileTap={reduce ? undefined : { scale: 0.96 }}
        >
          生成友链信息
        </motion.button>
        <span className="form-hint">只在你浏览器里，不经过服务器</span>
      </div>

      <AnimatePresence>
        {result ? (
          <motion.div
            className="form-result"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          >
            <pre className="form-result-code">{result}</pre>
            <div className="form-result-actions">
              <button type="button" onClick={onCopy}>
                {copied ? '已复制 ✓' : '复制'}
              </button>
              <a href={mailto}>用邮件发送</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </form>
  )
}

const clean = (v: string) => v.trim().replace(/\s+/g, ' ')
const toUrl = (v: string) => {
  const t = clean(v)
  if (!t) return ''
  return /^https?:\/\//i.test(t) ? t : `https://${t}`
}
const isHttpUrl = (v: string) => /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v)
