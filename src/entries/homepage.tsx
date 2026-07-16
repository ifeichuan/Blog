import { createRoot } from 'react-dom/client'
import { IndexPage } from '@/components/homepage/IndexPage'

export function mountHomepage(target: HTMLElement) {
  createRoot(target).render(<IndexPage />)
}
