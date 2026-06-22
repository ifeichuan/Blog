import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAG = `#version 300 es
precision highp float;out vec4 fragColor;
uniform vec2 iResolution;uniform float iTime;uniform float u_audio;
const vec3 c1=vec3(.4,.6,1.),c2=vec3(0.,.8,.8);const float TAU=6.28318;
float rand(vec2 n){return fract(sin(dot(n,vec2(12.9898,4.1414)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),u=fract(p);u=u*u*(3.-2.*u);return mix(mix(rand(i),rand(i+vec2(1,0)),u.x),mix(rand(i+vec2(0,1)),rand(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*noise(p);a*=.5;p*=2.;}return s;}
vec3 pal(float t,vec3 a,vec3 b,vec3 c,vec3 d){return a+b*cos(TAU*(c*t+d));}
void main(){float mr=min(iResolution.x,iResolution.y);vec2 uv=(gl_FragCoord.xy*2.-iResolution.xy)/mr*1.5;
float ni=mix(1.,2.,u_audio);float l=dot(uv,uv);float sm=smoothstep(1.04,.96,l);
vec3 bg=vec3(.063,.055,.055);if(sm<=0.){fragColor=vec4(bg,1.);return;}
float d=sm*l*l*l*2.;float nx=fbm(uv*2.*ni+iTime*.4+25.69);float ny=fbm(uv*2.*ni+iTime*.4+86.31);
float n=fbm(uv*3.+2.*vec2(nx,ny));vec3 col=vec3(n*.5+.25);
float angle=atan(uv.y,uv.x)/TAU+iTime*.1;angle+=u_audio*sin(iTime*6.)*.1;
col*=pal(angle,c1*.5,vec3(.5),vec3(1.),c2*.7)*2.;
col=col*d+(col*.5+vec3(1.)-dot(col,vec3(.299,.587,.114)))*vec3(max(0.,pow(dot(normalize(vec3(uv,.7-d)),vec3(0,0,-1)),5.)*3.));
col*=1.+u_audio*.4;fragColor=vec4(mix(bg,col,sm),1.);}`;

const VERT = `#version 300 es\nin vec2 a_position;\nvoid main(){gl_Position=vec4(a_position,0,1);}`

const lines = ['帮我查一下上周的销售数据', '把这段文字润色一下，语气专业一点', '总结今天所有未读消息', '帮我写一封回复邮件，拒绝但不失礼貌']

export function OrbSection() {
  const runwayRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioRef = useRef(0)
  const [transcript, setTranscript] = useState('')
  const transcriptStarted = useRef(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const gl = canvas.getContext('webgl2', { antialias: true, alpha: false })
    if (!gl) return

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const vs = compile(gl.VERTEX_SHADER, VERT)
    const fs = compile(gl.FRAGMENT_SHADER, FRAG)
    const prog = gl.createProgram()!
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog); gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const pos = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(pos); gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
    const uRes = gl.getUniformLocation(prog, 'iResolution')
    const uTime = gl.getUniformLocation(prog, 'iTime')
    const uAudio = gl.getUniformLocation(prog, 'u_audio')
    const dpr = devicePixelRatio || 1
    canvas.width = 240 * dpr; canvas.height = 240 * dpr
    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.uniform2f(uRes, canvas.width, canvas.height)

    let active = false, raf = 0
    const loop = () => {
      if (!active) { raf = 0; return }
      const t = performance.now() * .001
      const target = .15 + .12 * Math.sin(t * .8) + .08 * Math.sin(t * 2.1)
      audioRef.current += (target - audioRef.current) * .06
      gl.uniform1f(uTime, t); gl.uniform1f(uAudio, audioRef.current)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      raf = requestAnimationFrame(loop)
    }
    const io = new IntersectionObserver(([e]) => { active = e.isIntersecting; if (active && !raf) loop() }, { threshold: .1 })
    io.observe(canvas)

    canvas.addEventListener('pointerenter', () => { audioRef.current = .5 })
    canvas.addEventListener('pointerleave', () => { audioRef.current = .15 })
    canvas.addEventListener('click', () => { audioRef.current = 1 })

    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [])

  useEffect(() => {
    if (!runwayRef.current) return
    const ctx = gsap.context(() => {
      gsap.to({}, {
        scrollTrigger: {
          trigger: runwayRef.current,
          start: 'top top', end: 'bottom bottom', scrub: true,
          onUpdate: (self) => {
            const p = self.progress
            if (canvasRef.current) {
              canvasRef.current.style.transform = `scale(${.3 + p * .7})`
            }
            if (p > .3 && !transcriptStarted.current) {
              transcriptStarted.current = true
              startTranscript()
            }
          }
        }
      })
    }, runwayRef)
    return () => ctx.revert()
  }, [])

  function startTranscript() {
    let li = 0, ci = 0
    const tick = () => {
      const w = lines[li]
      setTranscript(w.slice(0, ++ci))
      if (ci >= w.length) { ci = 0; li = (li + 1) % lines.length; setTimeout(tick, 2400) }
      else setTimeout(tick, 70 + Math.random() * 30)
    }
    tick()
  }

  return (
    <section ref={runwayRef} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-xs tracking-[.2em] uppercase text-[--tx3]">能摸得到的那种</p>
        <canvas ref={canvasRef} className="w-[240px] h-[240px] rounded-full cursor-pointer" style={{ transform: 'scale(.3)' }} />
        <p className="text-[clamp(16px,2vw,20px)] text-[--tx] font-medium text-center max-w-[480px] min-h-[1.5em]">
          {transcript}<span className="inline-block w-[2px] h-[1em] bg-[--orange] ml-1 align-[-0.1em] animate-blink" />
        </p>
        <span className="text-[11px] tracking-[.15em] text-[--tx3] uppercase">VoiceStream · 语音驱动一切</span>
      </div>
    </section>
  )
}
