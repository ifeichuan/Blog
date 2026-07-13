(function () {
  const stage = document.querySelector("#siri-stage");
  const surface = document.querySelector("#siri-surface");
  const backdrop = document.querySelector("#siri-backdrop");
  const canvas = document.querySelector("#siri-canvas");
  const hitTarget = document.querySelector("#siri-hit-target");
  const control = document.querySelector("#siri-control");
  const status = document.querySelector("#siri-status");
  const dialog = document.querySelector("#siri-dialog");
  const askForm = document.querySelector("#siri-ask");
  const askInput = document.querySelector("#siri-input");
  const answer = document.querySelector("#siri-answer");
  const renderer = new window.SiriRenderer(canvas);
  const state = new window.SiriState();
  const meter = new window.SiriAudioMeter();
  const LONG_PRESS_MS = 360;
  const DRAG_THRESHOLD = 7;
  const ORB_RADIUS = 84;
  const DEFAULT_REPLY = "这是 About 页面中的交互占位回复，后端知识库尚未接入。";
  let releaseTimer = 0;
  let pressTimer = 0;
  let pointerId = null;
  let clickArmed = false;
  let dragging = false;
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let offsetX = 0;
  let offsetY = 0;
  let lastFrame = performance.now();
  let startTime = performance.now();

  window.SIRI_RENDERER = renderer;
  window.SIRI_STATE = state;

  function responsiveDialogWidth() {
    const width = canvas.clientWidth || 460;
    const maxWidth = Math.max(1, width - 48);
    const tuned = window.SIRI_PARAMS && typeof window.SIRI_PARAMS.dialogWidth === "number"
      ? window.SIRI_PARAMS.dialogWidth
      : 460;
    const responsive = Math.min(Math.max(width * 0.44, 320), 560, maxWidth);
    return tuned === 460 ? responsive : Math.min(Math.max(tuned, 260), maxWidth);
  }

  function syncDialogLayout() {
    surface.style.setProperty("--dialog-inline", `${responsiveDialogWidth()}px`);
    const params = window.SIRI_PARAMS;
    if (params && typeof params.caretGlowSize === "number") {
      surface.style.setProperty("--caret-glow-size", `${params.caretGlowSize}px`);
    }
    if (params && typeof params.caretGlowAlpha === "number") {
      surface.style.setProperty("--caret-glow-alpha", `${params.caretGlowAlpha}`);
    }
  }

  function syncBackdropLayout(layout) {
    if (!layout) return;
    const dpr = renderer.dpr;
    const width = (layout.panelSize[0] - layout.margin * 2) / dpr;
    const height = (layout.panelSize[1] - layout.margin * 2) / dpr;
    [backdrop, hitTarget].forEach((element) => {
      element.style.left = `${(layout.panelOrigin[0] + layout.margin) / dpr}px`;
      element.style.top = `${(layout.panelOrigin[1] + layout.margin) / dpr}px`;
      element.style.width = `${width}px`;
      element.style.height = `${height}px`;
      element.style.borderRadius = `${layout.cornerRadius / dpr}px`;
    });
  }

  function setMessage(text, hiddenText) {
    control.textContent = text;
    status.textContent = hiddenText || text;
    control.dataset.active = String(state.mode !== "idle");
  }

  function setDialog(mode, text) {
    if (mode === "idle" && dialog.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    dialog.dataset.mode = mode;
    dialog.setAttribute("aria-hidden", String(mode === "idle"));
    answer.textContent = text || "";
  }

  function closeDialog() {
    window.clearTimeout(releaseTimer);
    meter.stop();
    state.select("idle");
    state.setPressed(false);
    setDialog("idle");
    setMessage("Hold to speak", "Idle. Drag the orb to reposition it.");
  }

  function openAsk() {
    window.clearTimeout(releaseTimer);
    meter.stop();
    state.select("dialog");
    state.setPressed(false);
    setDialog("ask");
    setMessage("Close", "Ask mode.");
    window.setTimeout(() => askInput.focus({ preventScroll: true }), 180);
  }

  function openReply(text) {
    state.select("dialog");
    state.setPressed(false);
    setDialog("reply", text);
    setMessage("Ask again", "Reply shown.");
  }

  function enterThinking(replyText) {
    meter.stop();
    state.select("thinking");
    state.setPressed(false);
    setDialog("idle");
    setMessage("Thinking...", "Thinking.");
    window.clearTimeout(releaseTimer);
    releaseTimer = window.setTimeout(() => openReply(replyText || DEFAULT_REPLY), 1200);
  }

  async function enterListening() {
    if (state.mode === "listening" || dragging) return;
    window.clearTimeout(releaseTimer);
    setDialog("idle");
    state.select("listening");
    state.setPressed(true);
    setMessage("Release to send", "Listening.");
    await meter.start();
  }

  function cancelListeningForDrag() {
    if (state.mode !== "listening") return;
    meter.stop();
    state.select("idle");
    state.setPressed(false);
    setMessage("Hold to speak", "Dragging the orb.");
  }

  function applyOffset(x, y) {
    const rect = stage.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.5;
    const centerY = rect.top + rect.height * 0.5;
    const minX = ORB_RADIUS - centerX;
    const maxX = window.innerWidth - ORB_RADIUS - centerX;
    const minY = ORB_RADIUS - centerY;
    const maxY = window.innerHeight - ORB_RADIUS - centerY;
    offsetX = Math.max(minX, Math.min(maxX, x));
    offsetY = Math.max(minY, Math.min(maxY, y));
    surface.style.setProperty("--orb-x", `${offsetX}px`);
    surface.style.setProperty("--orb-y", `${offsetY}px`);
  }

  function beginPress(event, canDrag) {
    if (pointerId !== null || dialog.contains(event.target)) return;
    event.preventDefault();
    pointerId = event.pointerId;
    clickArmed = true;
    dragging = false;
    startX = event.clientX;
    startY = event.clientY;
    originX = offsetX;
    originY = offsetY;
    if (canDrag) hitTarget.setPointerCapture(pointerId);
    window.clearTimeout(pressTimer);
    pressTimer = window.setTimeout(() => {
      clickArmed = false;
      enterListening();
    }, LONG_PRESS_MS);
  }

  function movePress(event) {
    if (event.pointerId !== pointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!dragging && Math.hypot(dx, dy) >= DRAG_THRESHOLD) {
      dragging = true;
      clickArmed = false;
      window.clearTimeout(pressTimer);
      cancelListeningForDrag();
      surface.dataset.dragging = "true";
      status.textContent = "Dragging the complete canvas surface.";
    }
    if (dragging) applyOffset(originX + dx, originY + dy);
  }

  function endPress(event) {
    if (event.pointerId !== pointerId) return;
    window.clearTimeout(pressTimer);
    if (hitTarget.hasPointerCapture(pointerId)) hitTarget.releasePointerCapture(pointerId);
    pointerId = null;
    delete surface.dataset.dragging;
    if (dragging) {
      dragging = false;
      status.textContent = "Idle. Orb repositioned.";
    } else if (state.mode === "listening") {
      enterThinking(DEFAULT_REPLY);
    } else if (clickArmed) {
      if (state.mode === "dialog") closeDialog();
      else openAsk();
    }
    clickArmed = false;
  }

  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;
    const audio = meter.sample();
    const channels = state.step(dt, audio);
    channels.audio = audio;
    renderer.setFrame(channels, (now - startTime) / 1000);
    syncBackdropLayout(renderer.render());
    requestAnimationFrame(frame);
  }

  askForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const question = askInput.value.trim();
    if (!question) return;
    askInput.blur();
    enterThinking(`关于“${question}”：${DEFAULT_REPLY}`);
  });
  ["pointerdown", "pointerup"].forEach((type) => {
    dialog.addEventListener(type, (event) => event.stopPropagation());
  });
  hitTarget.addEventListener("pointerdown", (event) => beginPress(event, true));
  hitTarget.addEventListener("pointermove", movePress);
  control.addEventListener("pointerdown", (event) => beginPress(event, false));
  window.addEventListener("pointerup", endPress);
  window.addEventListener("pointercancel", (event) => {
    if (event.pointerId !== pointerId) return;
    window.clearTimeout(pressTimer);
    cancelListeningForDrag();
    pointerId = null;
    clickArmed = false;
    dragging = false;
    delete surface.dataset.dragging;
  });
  hitTarget.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.mode === "dialog") closeDialog();
    if ((event.code === "Space" || event.code === "Enter") && !event.repeat && state.mode !== "dialog") {
      event.preventDefault();
      enterListening();
    }
  });
  hitTarget.addEventListener("keyup", (event) => {
    if ((event.code === "Space" || event.code === "Enter") && state.mode === "listening") {
      event.preventDefault();
      enterThinking(DEFAULT_REPLY);
    }
  });
  window.addEventListener("resize", () => {
    applyOffset(offsetX, offsetY);
    syncDialogLayout();
  }, { passive: true });
  window.addEventListener("siri-params-change", syncDialogLayout);

  renderer.init().then(() => {
    syncDialogLayout();
    setDialog("idle");
    setMessage("Hold to speak", "Idle. Drag the orb to reposition it.");
    startTime = performance.now();
    lastFrame = startTime;
    frame();
  }).catch((error) => {
    setMessage("WebGL unavailable", "WebGL renderer failed.");
    status.textContent = error.message;
    console.error(error);
  });
})();
