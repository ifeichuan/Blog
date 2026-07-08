import { ScrollProvider } from './ScrollProvider'
import { StaggeredMenu } from './StaggeredMenu'
import { Hero } from './Hero'
import { BlobStretch } from './BlobStretch'
import { Manifesto } from './Manifesto'
import { OrbSection } from './OrbSection'
import { Works } from './Works'
import { Writing } from './Writing'
import { Strands } from './Strands'
import { ScrollMarquee } from './ScrollMarquee'
import { VariableProximity } from './VariableProximity'
import { Aurora } from './Aurora'
import { DotField } from './DotField'
import { Footer } from './Footer'
import { CustomCursor, ClickSpark } from './Cursor'

const menuItems = [
  { label: 'Posts', link: '/blogs', ariaLabel: 'Go to Posts' },
  { label: 'Labs', link: '/labs', ariaLabel: 'Go to Labs' },
  { label: 'Resumes', link: '/resumes', ariaLabel: 'Go to Resumes' },
]

const socialItems = [
  { label: 'GitHub', link: 'https://github.com' },
  { label: 'Email', link: 'mailto:hi@feichuan.dev' },
]

export function Homepage() {
  return (
    <ScrollProvider>
      <StaggeredMenu
        isFixed
        position="right"
        items={menuItems}
        socialItems={socialItems}
        colors={['#DA702C', '#4385BE']}
        accentColor="#DA702C"
        menuButtonColor="#CECDC3"
        openMenuButtonColor="#CECDC3"
      />
      <CustomCursor />
      <ClickSpark />
      <div className="fixed inset-0 z-[90] pointer-events-none opacity-[.035] bg-[url('data:image/svg+xml,%3Csvg%20viewBox=%220%200%20256%20256%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter%20id=%22n%22%3E%3CfeTurbulence%20type=%22fractalNoise%22%20baseFrequency=%22.85%22%20numOctaves=%224%22%20stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect%20width=%22100%25%22%20height=%22100%25%22%20filter=%22url(%23n)%22/%3E%3C/svg%3E')]" />
      <Hero />
      <BlobStretch />
      <Manifesto />
      <OrbSection />
      <Works />
      <Writing />
      <Aurora />
      <DotField />
      <Strands />
      <ScrollMarquee />
      <VariableProximity />
      <Footer />
    </ScrollProvider>
  )
}
