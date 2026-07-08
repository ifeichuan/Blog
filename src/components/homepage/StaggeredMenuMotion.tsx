import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import './StaggeredMenu.css'

// GSAP power4.out ≈ cubic-bezier(0.25, 1, 0.5, 1)
// GSAP power3.in  ≈ cubic-bezier(0.5, 0, 0.75, 0)
const easeOut = [0.25, 1, 0.5, 1] as const
const easeIn = [0.5, 0, 0.75, 0] as const

// Original GSAP timeline staging:
// t=0.00        prelayer[0] starts
// t=0.07        prelayer[1] starts
// t=lastLayer+0.08  panel starts (≈0.15)
// t=panelStart + 0.65*0.15  items start (≈0.25)
// So panel needs delay relative to prelayers, items need delay relative to panel

const prelayerVariants = {
  closed: { x: '100%' },
  open: (i: number) => ({
    x: 0,
    transition: { duration: 0.5, ease: easeOut, delay: i * 0.07 }
  }),
  exit: {
    x: '100%',
    transition: { duration: 0.32, ease: easeIn }
  }
}

const panelVariants = {
  closed: { x: '100%' },
  open: {
    x: 0,
    transition: { duration: 0.65, ease: easeOut, delay: 0.15 }
  },
  exit: {
    x: '100%',
    transition: { duration: 0.32, ease: easeIn }
  }
}

const itemVariants = {
  closed: { y: '140%', rotate: 10 },
  open: (i: number) => ({
    y: 0,
    rotate: 0,
    transition: { duration: 1, ease: easeOut, delay: 0.25 + i * 0.1 }
  }),
  exit: { y: '140%', rotate: 10, transition: { duration: 0.2, ease: easeIn } }
}

const socialVariants = {
  closed: { y: 25, opacity: 0 },
  open: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 0.55, ease: [0.33, 1, 0.68, 1] as const, delay: 0.45 + i * 0.08 }
  }),
  exit: { y: 25, opacity: 0, transition: { duration: 0.15, ease: easeIn } }
}

interface MenuItem {
  label: string
  link: string
  ariaLabel?: string
}

interface SocialItem {
  label: string
  link: string
}

interface StaggeredMenuProps {
  position?: 'left' | 'right'
  colors?: string[]
  items?: MenuItem[]
  socialItems?: SocialItem[]
  displaySocials?: boolean
  displayItemNumbering?: boolean
  className?: string
  logoUrl?: string
  menuButtonColor?: string
  openMenuButtonColor?: string
  accentColor?: string
  isFixed?: boolean
  closeOnClickAway?: boolean
  onMenuOpen?: () => void
  onMenuClose?: () => void
}

export const StaggeredMenu: React.FC<StaggeredMenuProps> = ({
  position = 'right',
  colors = ['#B497CF', '#5227FF'],
  items = [],
  socialItems = [],
  displaySocials = true,
  displayItemNumbering = true,
  className,
  logoUrl,
  menuButtonColor = '#fff',
  openMenuButtonColor = '#fff',
  accentColor = '#5227FF',
  isFixed = false,
  closeOnClickAway = true,
  onMenuOpen,
  onMenuClose
}) => {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) onMenuOpen?.()
    else onMenuClose?.()
  }

  useEffect(() => {
    if (!closeOnClickAway || !open) return
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        toggleRef.current && !toggleRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
        onMenuClose?.()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [closeOnClickAway, open, onMenuClose])

  const preparedColors = (() => {
    const raw = colors.length ? colors.slice(0, 4) : ['#1e1e22', '#35353c']
    const arr = [...raw]
    if (arr.length >= 3) arr.splice(Math.floor(arr.length / 2), 1)
    return arr
  })()

  return (
    <div
      ref={wrapperRef}
      className={(className ? className + ' ' : '') + 'staggered-menu-wrapper' + (isFixed ? ' fixed-wrapper' : '')}
      style={{ '--sm-accent': accentColor } as React.CSSProperties}
      data-position={position}
      data-open={open || undefined}
    >
      <header className="staggered-menu-header" aria-label="Main navigation header">
        <div className="sm-logo" aria-label="Logo">
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="sm-logo-img" draggable={false} width={110} height={24} />
          )}
        </div>
        <button
          ref={toggleRef}
          className="sm-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={toggle}
          type="button"
          style={{ color: open ? openMenuButtonColor : menuButtonColor }}
        >
          <svg width="30" height="30" viewBox="0 0 30 30" fill="none" aria-hidden="true">
            <motion.line
              x1="4" y1="8" x2="26" y2="8"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              animate={{ rotate: open ? 405 : 0, y: open ? 7 : 0 }}
              style={{ originX: '50%', originY: '50%', transformOrigin: '15px 8px' }}
              transition={{ duration: open ? 1 : 0.4, ease: easeOut }}
            />
            <motion.line
              x1="4" y1="15" x2="26" y2="15"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              animate={{ opacity: open ? 0 : 1, scaleX: open ? 0 : 1 }}
              style={{ originX: '50%', originY: '50%', transformOrigin: '15px 15px' }}
              transition={{ duration: 0.2 }}
            />
            <motion.line
              x1="4" y1="22" x2="26" y2="22"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              animate={{ rotate: open ? -405 : 0, y: open ? -7 : 0 }}
              style={{ originX: '50%', originY: '50%', transformOrigin: '15px 22px' }}
              transition={{ duration: open ? 1 : 0.4, ease: easeOut }}
            />
          </svg>
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            {preparedColors.map((c, i) => (
              <motion.div
                key={'prelayer-' + i}
                className="sm-prelayers"
                style={{
                  background: `radial-gradient(ellipse at ${i === 0 ? '30% 40%' : '70% 60%'}, ${c}ee, ${c}), url('/noise-bg.png')`,
                  backgroundBlendMode: 'overlay',
                  opacity: 1,
                  zIndex: 5 + i
                }}
                variants={prelayerVariants}
                custom={i}
                initial="closed"
                animate="open"
                exit="exit"
                aria-hidden="true"
              />
            ))}

            <motion.aside
              ref={panelRef}
              id="staggered-menu-panel"
              className="staggered-menu-panel"
              style={{ opacity: 1 }}
              variants={panelVariants}
              initial="closed"
              animate="open"
              exit="exit"
              aria-hidden={!open}
            >
              <div className="sm-panel-inner">
                <ul className="sm-panel-list" role="list" data-numbering={displayItemNumbering || undefined}>
                  {items.map((it, idx) => (
                    <li className="sm-panel-itemWrap" key={it.label + idx}>
                      <a className="sm-panel-item" href={it.link} aria-label={it.ariaLabel} data-index={idx + 1}>
                        <motion.span
                          className="sm-panel-itemLabel"
                          variants={itemVariants}
                          custom={idx}
                          initial="closed"
                          animate="open"
                          exit="exit"
                        >
                          {it.label}
                        </motion.span>
                      </a>
                    </li>
                  ))}
                </ul>
                {displaySocials && socialItems.length > 0 && (
                  <div className="sm-socials" aria-label="Social links">
                    <motion.h3
                      className="sm-socials-title"
                      variants={socialVariants}
                      custom={0}
                      initial="closed"
                      animate="open"
                      exit="exit"
                    >
                      Socials
                    </motion.h3>
                    <ul className="sm-socials-list" role="list">
                      {socialItems.map((s, i) => (
                        <li key={s.label + i} className="sm-socials-item">
                          <motion.a
                            href={s.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="sm-socials-link"
                            variants={socialVariants}
                            custom={i + 1}
                            initial="closed"
                            animate="open"
                            exit="exit"
                          >
                            {s.label}
                          </motion.a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {/* Mesh background at bottom with vertical fade */}
              <div className="sm-panel-mesh" aria-hidden="true" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaggeredMenu
