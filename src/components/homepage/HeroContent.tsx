import { useState } from 'react'
import { AppleHelloEffectEnglish } from './apple-hello-effect-english'
import { HeroSignature } from './HeroSignature'

type HeroContentProps = {
  play?: boolean
}

export function HeroContent({ play = true }: HeroContentProps) {
  const [helloComplete, setHelloComplete] = useState(false)

  if (!play) {
    return <div className="flex flex-col items-center gap-6" />
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <AppleHelloEffectEnglish
        className="h-28 w-auto"
        onAnimationComplete={() => setHelloComplete(true)}
      />
      <HeroSignature play={helloComplete} />
    </div>
  )
}
