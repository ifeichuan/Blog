(function () {
  const canvas = document.getElementById('noise-overlay');
  const ctx = canvas.getContext('2d');
  const PIXEL_SIZE = 8;
  let cols, rows, shuffled;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.ceil(canvas.width / PIXEL_SIZE);
    rows = Math.ceil(canvas.height / PIXEL_SIZE);
    shuffled = buildShuffled();
  }

  function buildShuffled() {
    const arr = [];
    for (let i = 0; i < cols * rows; i++) arr.push(i);
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function drawProgress(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#1a1a1a';
    const count = Math.floor(progress * shuffled.length);
    for (let i = 0; i < count; i++) {
      const idx = shuffled[i];
      const x = (idx % cols) * PIXEL_SIZE;
      const y = Math.floor(idx / cols) * PIXEL_SIZE;
      ctx.fillRect(x, y, PIXEL_SIZE, PIXEL_SIZE);
    }
  }

  resize();
  window.addEventListener('resize', resize);

  barba.init({
    transitions: [{
      leave(data) {
        // ponytail: re-shuffle each transition for varied pattern
        shuffled = buildShuffled();
        const state = { progress: 0 };
        const tl = gsap.timeline();
        tl.to(state, {
          progress: 1,
          duration: 0.8,
          ease: 'power2.in',
          onUpdate: () => drawProgress(state.progress)
        });
        tl.call(() => { data.current.container.remove(); });
        return tl;
      },
      enter() {
        const state = { progress: 1 };
        return gsap.to(state, {
          progress: 0,
          duration: 0.8,
          ease: 'power2.out',
          onUpdate: () => drawProgress(state.progress)
        });
      }
    }]
  });
})();
