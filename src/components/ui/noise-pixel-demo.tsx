import { useScreenSize } from "@/hooks/use-screen-size"
import { PixelTrail } from "@/components/ui/pixel-trail"
import { GooeyFilter } from "@/components/ui/gooey-filter"

export default function NoisePixelDemo() {
  const screenSize = useScreenSize()

  return (
    <div className="relative w-full h-screen flex flex-col items-center justify-center gap-8 bg-black text-center text-pretty overflow-hidden">
      <img
        src="https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=1920&q=80"
        alt="dark abstract background"
        className="w-full h-full object-cover absolute inset-0 opacity-70"
      />

      <GooeyFilter id="gooey-filter-pixel-trail" strength={5} />

      <div
        className="absolute inset-0 z-0"
        style={{ filter: "url(#gooey-filter-pixel-trail)" }}
      >
        <PixelTrail
          pixelSize={screenSize.lessThan("md") ? 24 : 32}
          fadeDuration={0}
          delay={500}
          pixelClassName="bg-white"
        />
      </div>

      <p className="text-white text-5xl md:text-7xl z-10 w-3/4 md:w-1/2 font-bold tracking-tight leading-tight">
        Noise Pixel Trail
      </p>
      <p className="text-white/60 text-sm z-10">移动鼠标查看效果</p>
    </div>
  )
}
