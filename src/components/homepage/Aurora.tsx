export function Aurora() {
  return (
    <div className="relative overflow-hidden py-[12vh] px-6">
      <div className="absolute inset-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_210deg,#DA702C,#4385BE,#879A39,#DA702C)] opacity-[.08] blur-[80px] animate-[auroraRotate_20s_linear_infinite]" />
      <div className="relative z-10 max-w-[1080px] mx-auto text-center">
        <h2 className="text-[clamp(32px,5vw,56px)] font-extrabold tracking-tighter">我能帮你做</h2>
        <div className="mt-5 h-[1.4em] overflow-hidden relative">
          {['滚动驱动的长叙事页', 'WebGL Shader 视觉', 'Agent UI 流式渲染', '有生命感的交互原型'].map((t, i) => (
            <span key={i} className="absolute w-full text-center text-[clamp(20px,3vw,32px)] font-medium text-[--orange] animate-[rotateWords_8s_infinite]" style={{ animationDelay: `${-i * 2}s` }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
