(() => {
  const records = []
  const programCache = new WeakMap()
  const ids = new WeakMap()
  const originals = new Map()
  let nextId = 1

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

  const programInfo = (gl, program) => {
    if (!program) return null
    if (programCache.has(program)) return programCache.get(program)

    const shaders = (gl.getAttachedShaders(program) || []).map((shader) => ({
      type: gl.getShaderParameter(shader, gl.SHADER_TYPE) === gl.VERTEX_SHADER ? 'vertex' : 'fragment',
      source: gl.getShaderSource(shader),
    }))
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

    const info = { id: objectId(program), shaders, attributes, uniforms }
    programCache.set(program, info)
    return info
  }

  const uniformValues = (gl, program, info) => {
    if (!program || !info) return {}
    return Object.fromEntries(info.uniforms.map((uniform) => {
      const location = gl.getUniformLocation(program, uniform.name)
      return [uniform.name, serializable(location ? gl.getUniform(program, location) : null)]
    }))
  }

  const captureDraw = (name, original) => function (...args) {
    if (records.length < 5000) {
      const program = this.getParameter(this.CURRENT_PROGRAM)
      const info = programInfo(this, program)
      records.push({
        sequence: records.length,
        call: name,
        args: args.map(serializable),
        program: info,
        uniforms: uniformValues(this, program, info),
        state: {
          viewport: Array.from(this.getParameter(this.VIEWPORT)),
          framebuffer: objectId(this.getParameter(this.FRAMEBUFFER_BINDING)),
          blend: this.isEnabled(this.BLEND),
          depthTest: this.isEnabled(this.DEPTH_TEST),
          cullFace: this.isEnabled(this.CULL_FACE),
          scissorTest: this.isEnabled(this.SCISSOR_TEST),
          depthMask: this.getParameter(this.DEPTH_WRITEMASK),
          colorMask: Array.from(this.getParameter(this.COLOR_WRITEMASK)),
          activeTexture: this.getParameter(this.ACTIVE_TEXTURE) - this.TEXTURE0,
          texture2D: objectId(this.getParameter(this.TEXTURE_BINDING_2D)),
          textureCube: objectId(this.getParameter(this.TEXTURE_BINDING_CUBE_MAP)),
        },
      })
    }
    return original.apply(this, args)
  }

  for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
    const original = WebGL2RenderingContext.prototype[name]
    originals.set(name, original)
    WebGL2RenderingContext.prototype[name] = captureDraw(name, original)
  }

  window.__wseFrameCapture = {
    records,
    stop() {
      for (const [name, original] of originals) WebGL2RenderingContext.prototype[name] = original
    },
    export() {
      return JSON.stringify({ records })
    },
  }
})()
