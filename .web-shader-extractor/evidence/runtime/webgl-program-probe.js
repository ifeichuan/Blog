(() => {
  window.__wseFrameCapture?.stop()

  const programs = new Map()
  const transitions = []
  const ids = new WeakMap()
  const originals = new Map()
  let nextId = 1
  let draws = 0
  let lastProgramId = null

  const objectId = (value) => {
    if (!value || (typeof value !== 'object' && typeof value !== 'function')) return value
    if (!ids.has(value)) ids.set(value, nextId++)
    return ids.get(value)
  }

  const serializable = (value) => {
    if (ArrayBuffer.isView(value)) return Array.from(value)
    if (Array.isArray(value)) return value.map(serializable)
    if (value && typeof value === 'object') return { objectId: objectId(value) }
    return value
  }

  const readUniforms = (gl, program, uniformInfo) => Object.fromEntries(uniformInfo.map((uniform) => {
    const location = gl.getUniformLocation(program, uniform.name)
    return [uniform.name, serializable(location ? gl.getUniform(program, location) : null)]
  }))

  const ensureProgram = (gl, program) => {
    const id = objectId(program)
    if (programs.has(id)) return programs.get(id)

    const shaders = (gl.getAttachedShaders(program) || []).map((shader) => {
      const source = gl.getShaderSource(shader) || ''
      return {
        type: gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.VERTEX_SHADER ? 'vertex' : 'fragment',
        length: source.length,
        prefix: source.slice(0, 1200),
      }
    })
    const attributes = []
    const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES)
    for (let index = 0; index < attributeCount; index++) {
      const info = gl.getActiveAttrib(program, index)
      if (info) attributes.push({ name: info.name, size: info.size, type: info.type })
    }
    const uniforms = []
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS)
    for (let index = 0; index < uniformCount; index++) {
      const info = gl.getActiveUniform(program, index)
      if (info) uniforms.push({ name: info.name, size: info.size, type: info.type })
    }

    const info = { id, shaders, attributes, uniformInfo: uniforms, draws: 0 }
    programs.set(id, info)
    return info
  }

  const captureDraw = (name, original) => function (...args) {
    const program = this.getParameter(this.CURRENT_PROGRAM)
    if (program && draws < 10000) {
      const info = ensureProgram(this, program)
      const programId = info.id
      draws++
      info.draws++
      info.call = name
      info.args = args.map(serializable)
      info.lastUniforms = readUniforms(this, program, info.uniformInfo)
      info.lastState = {
        viewport: Array.from(this.getParameter(this.VIEWPORT)),
        framebuffer: objectId(this.getParameter(this.FRAMEBUFFER_BINDING)),
        blend: this.isEnabled(this.BLEND),
        depthTest: this.isEnabled(this.DEPTH_TEST),
        cullFace: this.isEnabled(this.CULL_FACE),
        scissorTest: this.isEnabled(this.SCISSOR_TEST),
        depthMask: this.getParameter(this.DEPTH_WRITEMASK),
        colorMask: Array.from(this.getParameter(this.COLOR_WRITEMASK)),
      }
      if (programId !== lastProgramId) {
        transitions.push({ draw: draws, programId, framebuffer: info.lastState.framebuffer })
        lastProgramId = programId
      }
    }
    return original.apply(this, args)
  }

  for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
    const original = WebGL2RenderingContext.prototype[name]
    originals.set(name, original)
    WebGL2RenderingContext.prototype[name] = captureDraw(name, original)
  }

  window.__wseProgramCapture = {
    stop() {
      for (const [name, original] of originals) WebGL2RenderingContext.prototype[name] = original
    },
    export() {
      return JSON.stringify({ draws, transitions, programs: Array.from(programs.values()) })
    },
  }
})()
