(function () {
  const overlay = document.getElementById('pixelate-overlay');
  const COLS = 20;
  let blockSize, rows, blocks;

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function buildGrid() {
    overlay.innerHTML = '';
    blockSize = window.innerWidth / COLS;
    rows = Math.ceil(window.innerHeight / blockSize);
    blocks = [];

    for (let col = 0; col < COLS; col++) {
      const shuffledIndexes = shuffle([...Array(rows)].map((_, i) => i));
      for (let row = 0; row < rows; row++) {
        const div = document.createElement('div');
        div.className = 'pixel-block';
        div.style.cssText = `left:${col * blockSize}px;top:${row * blockSize}px;width:${blockSize}px;height:${blockSize}px;`;
        overlay.appendChild(div);
        // delay = column position + shuffled row index → directional wave with randomness
        blocks.push({ el: div, openDelay: col + shuffledIndexes[row], closeDelay: (COLS - col) + shuffledIndexes[row] });
      }
    }
  }

  buildGrid();
  window.addEventListener('resize', buildGrid);

  function animateBlocks(type) {
    return new Promise(resolve => {
      const maxDelay = blocks.reduce((max, b) => Math.max(max, type === 'open' ? b.openDelay : b.closeDelay), 0);
      const DELAY_UNIT = 0.02; // seconds per index
      const totalDuration = maxDelay * DELAY_UNIT * 1000;

      blocks.forEach(b => {
        const delay = (type === 'open' ? b.openDelay : b.closeDelay) * DELAY_UNIT * 1000;
        setTimeout(() => {
          b.el.style.opacity = type === 'open' ? '1' : '0';
        }, delay);
      });

      setTimeout(resolve, totalDuration + 50);
    });
  }

  barba.init({
    transitions: [{
      leave(data) {
        overlay.style.display = 'block';
        return animateBlocks('open').then(() => {
          data.current.container.remove();
        });
      },
      enter() {
        return animateBlocks('close').then(() => {
          overlay.style.display = 'none';
        });
      }
    }]
  });
})();
