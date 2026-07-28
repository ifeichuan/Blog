import { createRoot } from 'react-dom/client'
import { IndexPageV4 } from '@/components/homepage/IndexPageV4'

export function mountHomepage(target: HTMLElement) {
  createRoot(target).render(<IndexPageV4 />)
}
