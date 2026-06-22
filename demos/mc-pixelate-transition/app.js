(function () {
  const canvas = document.getElementById('pixelate-canvas');
  const ctx = canvas.getContext('2d');
  const W = () => window.innerWidth;
  const H = () => window.innerHeight;

  // ponytail: pixelation by drawing at reduced size then scaling up
  // imageSmoothingEnabled=false in CSS (image-rendering: pixelated) handles the upscale
  function drawPixelated(sourceCanvas, pixelSize) {
    const w = W();
    const h = H();
    canvas.width = w;
    canvas.height = h;

    // Draw source at reduced resolution
    const reducedW = Math.max(1, Math.ceil(w / pixelSize));
    const reducedH = Math.max(1, Math.ceil(h / pixelSize));

    ctx.imageSmoothingEnabled = true;
    // Step 1: draw full image shrunk down into top-left corner
    ctx.drawImage(sourceCanvas, 0, 0, reducedW, reducedH);

    // Step 2: disable smoothing, scale that tiny image back up to full size
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(canvas, 0, 0, reducedW, reducedH, 0, 0, w, h);
  }

  function captureContainer(container) {
    return html2canvas(container, {
      backgroundColor: null,
      scale: 1,
      logging: false,
      useCORS: true
    });
  }

  barba.init({
    transitions: [{
      leave(data) {
        const tl = gsap.timeline();
        const state = { pixelSize: 1 };

        return captureContainer(data.current.container).then(screenshot => {
          canvas.style.display = 'block';
          // Show the captured screenshot pixelating
          return new Promise(resolve => {
            tl.to(state, {
              pixelSize: 120,
              duration: 0.8,
              ease: 'steps(8)',
              onUpdate: () => drawPixelated(screenshot, state.pixelSize),
              onComplete: () => {
                data.current.container.remove();
                resolve();
              }
            });
          });
        });
      },
      enter(data) {
        return captureContainer(data.next.container).then(screenshot => {
          const state = { pixelSize: 120 };
          return new Promise(resolve => {
            gsap.to(state, {
              pixelSize: 1,
              duration: 0.8,
              ease: 'steps(8)',
              onUpdate: () => drawPixelated(screenshot, state.pixelSize),
              onComplete: () => {
                ctx.clearRect(0, 0, W(), H());
                canvas.style.display = 'none';
                resolve();
              }
            });
          });
        });
      }
    }]
  });
})();
