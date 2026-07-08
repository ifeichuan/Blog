declare module './homepage/StaggeredMenu' {
  import { FC } from 'react'
  interface StaggeredMenuProps {
    position?: 'left' | 'right'
    colors?: string[]
    items?: { label: string; link: string; ariaLabel?: string }[]
    socialItems?: { label: string; link: string }[]
    displaySocials?: boolean
    displayItemNumbering?: boolean
    className?: string
    logoUrl?: string
    menuButtonColor?: string
    openMenuButtonColor?: string
    accentColor?: string
    changeMenuColorOnOpen?: boolean
    isFixed?: boolean
    closeOnClickAway?: boolean
    onMenuOpen?: () => void
    onMenuClose?: () => void
  }
  export const StaggeredMenu: FC<StaggeredMenuProps>
}
