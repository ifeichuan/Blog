(() => {
  const originalGetContext = HTMLCanvasElement.prototype.getContext
  window.__wseContexts = []

  HTMLCanvasElement.prototype.getContext = function (type, attributes) {
    const context = originalGetContext.call(this, type, attributes)
    if (context) {
      window.__wseContexts.push({
        canvas: this,
        type,
        attributes: attributes ?? null,
        stack: new Error().stack,
      })
    }
    return context
  }
})()
