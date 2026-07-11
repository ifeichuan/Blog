import { createRoot } from 'react-dom/client'
import { IndexPage } from '@/components/IndexPage'

export function mountHomepage(target: HTMLElement) {
  createRoot(target).render(<IndexPage />)
}
