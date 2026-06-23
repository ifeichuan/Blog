import { useState } from 'react'
import { AppleHelloEffectEnglish } from './apple-hello-effect-english'
import { HeroSignature } from './HeroSignature'

export function HeroContent() {
  const [helloComplete, setHelloComplete] = useState(false)

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
