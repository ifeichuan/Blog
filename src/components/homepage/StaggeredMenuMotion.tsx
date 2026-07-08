import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import './StaggeredMenu.css'

const panelVariants = {
  closed: { x: '100%' },
  open: {
    x: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 30, mass: 0.8 }
  },
  exit: {
    x: '100%',
    transition: { duration: 0.28, ease: [0.4, 0, 1, 1] as const }
  }
}

const prelayerVariants = {
  closed: { x: '100%' },
  open: (i: number) => ({
    x: 0,
    transition: { type: 'spring' as const, stiffness: 320, damping: 28, mass: 0.7, delay: i * 0.06 }
  }),
  exit: {
    x: '100%',
    transition: { duration: 0.25, ease: [0.4, 0, 1, 1] as const }
  }
}

const itemVariants = {
  closed: { y: '140%', rotate: 10 },
  open: (i: number) => ({
    y: 0,
    rotate: 0,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 0.6, delay: 0.15 + i * 0.08 }
  }),
  exit: { y: '140%', rotate: 10, transition: { duration: 0.2 } }
}

const socialVariants = {
  closed: { y: 20, opacity: 0 },
  open: (i: number) => ({
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 200, damping: 20, delay: 0.3 + i * 0.06 }
  }),
  exit: { y: 20, opacity: 0, transition: { duration: 0.15 } }
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
          <span className="sm-toggle-textWrap" aria-hidden="true">
            <motion.span
              className="sm-toggle-textInner"
              animate={{ y: open ? '-50%' : '0%' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            >
              <span className="sm-toggle-line">Menu</span>
              <span className="sm-toggle-line">Close</span>
            </motion.span>
          </span>
          <motion.span
            className="sm-icon"
            aria-hidden="true"
            animate={{ rotate: open ? 225 : 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <span className="sm-icon-line" />
            <span className="sm-icon-line sm-icon-line-v" />
          </motion.span>
        </button>
      </header>

      <AnimatePresence>
        {open && (
          <>
            {preparedColors.map((c, i) => (
              <motion.div
                key={'prelayer-' + i}
                className="sm-prelayers"
                style={{ background: c, opacity: 1, zIndex: 5 + i }}
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
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default StaggeredMenu
