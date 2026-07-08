import { StaggeredMenu } from './homepage/StaggeredMenuMotion'
import { HeroSection } from './HeroSection'
import { FpsMeter } from './FpsMeter'

const menuItems = [
  { label: 'Posts', link: '/blogs', ariaLabel: 'Go to Posts' },
  { label: 'Labs', link: '/labs', ariaLabel: 'Go to Labs' },
  { label: 'Resumes', link: '/resumes', ariaLabel: 'Go to Resumes' },
]

const socialItems = [
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'Email', link: 'mailto:hi@feichuan.dev' },
]

export function IndexPage() {
  return (
    <>
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        colors={['#DA702C', '#4385BE']}
        accentColor="#DA702C"
        menuButtonColor="#141413"
        openMenuButtonColor="#141413"
        logoUrl="/feichuan-logo.svg"
      />
      <main className="relative min-h-screen flex items-center justify-center">
        <HeroSection />
      </main>
      <FpsMeter />
    </>
  )
}
