(function () {
  const COLS = 5;
  const ROWS = 4;
  const overlay = document.querySelector('.grid-overlay');

  for (let i = 0; i < COLS * ROWS; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    overlay.appendChild(cell);
  }

  const cells = overlay.querySelectorAll('.cell');

  barba.init({
    transitions: [{
      leave(data) {
        const tl = gsap.timeline();
        // 网格铺满
        tl.to(cells, {
          scaleY: 1,
          duration: 0.5,
          ease: 'power2.in',
          stagger: { amount: 0.4, from: 'start', grid: [ROWS, COLS] }
        });
        // 盖住后移除旧容器（文档推荐：data.current.container.remove()）
        tl.call(() => { data.current.container.remove(); });
        return tl;
      },
      enter() {
        return gsap.to(cells, {
          scaleY: 0,
          duration: 0.5,
          ease: 'power2.out',
          stagger: { amount: 0.4, from: 'end', grid: [ROWS, COLS] }
        });
      }
    }]
  });
})();
