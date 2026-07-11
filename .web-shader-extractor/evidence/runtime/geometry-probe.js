(() => {
  const original = WebGL2RenderingContext.prototype.drawElements

  const readAttribute = (gl, program, name) => {
    const location = gl.getAttribLocation(program, name)
    if (location < 0) return null
    const buffer = gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING)
    const previous = gl.getParameter(gl.ARRAY_BUFFER_BINDING)
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    const byteLength = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE)
    const values = new Float32Array(byteLength / 4)
    gl.getBufferSubData(gl.ARRAY_BUFFER, 0, values)
    gl.bindBuffer(gl.ARRAY_BUFFER, previous)
    return {
      location,
      size: gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_SIZE),
      stride: gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
      type: gl.getVertexAttrib(location, gl.VERTEX_ATTRIB_ARRAY_TYPE),
      values: Array.from(values),
    }
  }

  WebGL2RenderingContext.prototype.drawElements = function (...args) {
    if (!window.__wseGeometryCapture && args[1] === 2400) {
      const program = this.getParameter(this.CURRENT_PROGRAM)
      window.__wseGeometryCapture = {
        position: readAttribute(this, program, 'position'),
        uv: readAttribute(this, program, 'uv'),
      }
      WebGL2RenderingContext.prototype.drawElements = original
    }
    return original.apply(this, args)
  }
})()
