(function installLiquidPath(global) {
  "use strict";

  const KAPPA = 0.5522847498;

  const DEFAULT_PEEL_PARAMETERS = Object.freeze({
    detachGap: 6,
    transition: 6.5,
    couplingRadius: 5,
    pull: 2.5,
  });

  const PEEL_PARAMETER_LIMITS = Object.freeze({
    detachGap: Object.freeze({ min: 6, max: 9.8 }),
    transition: Object.freeze({ min: 1.5, max: 8 }),
    couplingRadius: Object.freeze({ min: 4, max: 48 }),
    pull: Object.freeze({ min: 0, max: 8 }),
  });

  const LIQUID_GEOMETRY = Object.freeze({
    viewWidth: 520,
    viewHeight: 300,
    x: 39,
    width: 444,
    outputHeight: 68,
    inputY: 135,
    inputHeight: 134,
    outputRadius: 34,
    inputRadius: 31,
    sendSize: 34,
    restGap: 10,
    hiddenGap: -54,
    minGap: -60,
    maxGap: 10,
    renderMinGap: -72,
    renderMaxGap: 24,
    mergeGap: 0,
  });

  const LIQUID_MOTION = Object.freeze({
    stiffness: 1200,
    damping: 38,
    settleDistance: 0.08,
    settleVelocity: 1,
    openContactStart: 0.061333,
    openBridgeStart: 0.073333,
    openPeelStart: 0.099,
    openTearTime: 0.105,
    peelEaseDuration: 0.023333,
    tearFaceApproach: 2.5,
  });

  const LIQUID_TRANSITIONS = Object.freeze({
    opening: Object.freeze([
      Object.freeze({ t: 0, gap: -54 }),
      Object.freeze({ t: 0.025, gap: -46 }),
      Object.freeze({ t: 0.048333, gap: -27 }),
      Object.freeze({ t: 0.073333, gap: 6 }),
      Object.freeze({ t: 0.098333, gap: 12 }),
      Object.freeze({ t: 0.121666, gap: 16 }),
      Object.freeze({ t: 0.171666, gap: 16 }),
      Object.freeze({ t: 0.195, gap: 15 }),
      Object.freeze({ t: 0.22, gap: 12 }),
      Object.freeze({ t: 0.245, gap: 11 }),
      Object.freeze({ t: 0.268333, gap: 9 }),
      Object.freeze({ t: 0.293333, gap: 9 }),
      Object.freeze({ t: 0.316666, gap: 10 }),
      Object.freeze({ t: 0.39, gap: 10 }),
    ]),
    closing: Object.freeze([
      Object.freeze({ t: 0, gap: 10 }),
      Object.freeze({ t: 0.023333, gap: 2 }),
      Object.freeze({ t: 0.048333, gap: -16 }),
      Object.freeze({ t: 0.073333, gap: -36 }),
      Object.freeze({ t: 0.096666, gap: -50 }),
      Object.freeze({ t: 0.121666, gap: -58 }),
      Object.freeze({ t: 0.146666, gap: -60 }),
      Object.freeze({ t: 0.171666, gap: -60 }),
      Object.freeze({ t: 0.195, gap: -59 }),
      Object.freeze({ t: 0.22, gap: -57 }),
      Object.freeze({ t: 0.245, gap: -55 }),
      Object.freeze({ t: 0.268333, gap: -54 }),
      Object.freeze({ t: 0.293333, gap: -53 }),
      Object.freeze({ t: 0.316666, gap: -53 }),
      Object.freeze({ t: 0.39, gap: -54 }),
    ]),
  });

  const CLOSING_START = LIQUID_TRANSITIONS.closing[0];
  const CLOSING_DESCENT_END = LIQUID_TRANSITIONS.closing.reduce(
    (lowest, key) => (key.gap < lowest.gap ? key : lowest),
    CLOSING_START,
  );

  const CLOSE_KEYS = Object.freeze([
    Object.freeze({ t: 0, compression: 0, expand: 0, content: 0, surface: 0, bottom: 0, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.025, compression: 9.5, expand: 0, content: 0, surface: 0, bottom: 0, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.038, compression: 13.76, expand: 1.5, content: 2.86, surface: 0.52, bottom: 2.86, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.05, compression: 20, expand: 1.5, content: 5.5, surface: 1, bottom: 5.5, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.073, compression: 18, expand: 1.5, content: 6, surface: 2, bottom: 6, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.098, compression: 9, expand: 1.5, content: 4, surface: 2, bottom: 4, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.122, compression: 5, expand: 1.25, content: 3, surface: 1.5, bottom: 3, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.147, compression: 4, expand: 0.75, content: 2, surface: 1, bottom: 2, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.172, compression: 3, expand: 0.25, content: 1, surface: 0.75, bottom: 1, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.197, compression: 2, expand: 0, content: 0.5, surface: 0.5, bottom: 0.5, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.222, compression: 1, expand: 0, content: 0, surface: 0.25, bottom: 0, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.247, compression: 0, expand: 0, content: 0, surface: 0, bottom: 0, sendOffset: 0, sendScale: 1 }),
    Object.freeze({ t: 0.3, compression: 0, expand: 0, content: 0, surface: 0, bottom: 0, sendOffset: 0, sendScale: 1 }),
  ]);

  // The supplied close sequence shows four consecutive strained content
  // states. Hold the layer nearly rigid until contact, then stretch the whole
  // input around its lower edge. Text width stays invariant; only Y changes.
  const CLOSE_CONTENT_SCALE_KEYS = Object.freeze([
    Object.freeze({ t: 0, value: 1 }),
    Object.freeze({ t: 0.02, value: 1.02 }),
    Object.freeze({ t: 0.022, value: 1.04 }),
    Object.freeze({ t: 0.023333, value: 1.22 }),
    Object.freeze({ t: 0.038333, value: 1.18 }),
    Object.freeze({ t: 0.061667, value: 1.08 }),
    Object.freeze({ t: 0.096666, value: 1 }),
    Object.freeze({ t: 0.3, value: 1 }),
  ]);

  // The button body changes real CSS height inside the strained parent.
  // Its arrow is compensated later, so the glyph remains optically fixed.
  const CLOSE_SEND_KEYS = Object.freeze([
    Object.freeze({ t: 0, offset: 0, scale: 1 }),
    Object.freeze({ t: 0.02, offset: 0, scale: 1 }),
    Object.freeze({ t: 0.022, offset: 0, scale: 1 }),
    Object.freeze({ t: 0.023333, offset: 0, scale: 1.02 }),
    Object.freeze({ t: 0.038333, offset: -0.5, scale: 1.005 }),
    Object.freeze({ t: 0.061667, offset: -0.2, scale: 0.992 }),
    Object.freeze({ t: 0.096666, offset: 0, scale: 1 }),
    Object.freeze({ t: 0.3, offset: 0, scale: 1 }),
  ]);

  const PEEL_CORRECTION_KEYS = Object.freeze([
    Object.freeze({ t: 0, inputTop: 0, inputBottom: 0, outputTop: 0, outputBottom: 0, content: 0 }),
    Object.freeze({ t: 0.023, inputTop: 2, inputBottom: 1, outputTop: 0, outputBottom: 0, content: 1.6 }),
    Object.freeze({ t: 0.073, inputTop: 2, inputBottom: 2, outputTop: 0, outputBottom: 0, content: 2.4 }),
    Object.freeze({ t: 0.097, inputTop: 2, inputBottom: 1, outputTop: 1, outputBottom: 0, content: 1.7 }),
    Object.freeze({ t: 0.122, inputTop: 1, inputBottom: 0, outputTop: 0, outputBottom: -2, content: 2.4 }),
    Object.freeze({ t: 0.147, inputTop: 0, inputBottom: -1, outputTop: 1, outputBottom: -1, content: 1.3 }),
    Object.freeze({ t: 0.17, inputTop: 0, inputBottom: 0, outputTop: 0, outputBottom: 0, content: 0 }),
  ]);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function finiteNumber(value, fallback = 0) {
    if (
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "")
    ) {
      return fallback;
    }
    const number = typeof value === "number" ? value : Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function normalizePeelParameters(parameters = {}) {
    const source =
      parameters && typeof parameters === "object"
        ? parameters
        : DEFAULT_PEEL_PARAMETERS;
    const detachGap = clamp(
      finiteNumber(
        source.detachGap,
        DEFAULT_PEEL_PARAMETERS.detachGap,
      ),
      PEEL_PARAMETER_LIMITS.detachGap.min,
      PEEL_PARAMETER_LIMITS.detachGap.max,
    );
    const transition = clamp(
      finiteNumber(
        source.transition,
        DEFAULT_PEEL_PARAMETERS.transition,
      ),
      PEEL_PARAMETER_LIMITS.transition.min,
      PEEL_PARAMETER_LIMITS.transition.max,
    );
    const couplingRadius = clamp(
      finiteNumber(
        source.couplingRadius,
        DEFAULT_PEEL_PARAMETERS.couplingRadius,
      ),
      PEEL_PARAMETER_LIMITS.couplingRadius.min,
      PEEL_PARAMETER_LIMITS.couplingRadius.max,
    );
    const pull = clamp(
      finiteNumber(source.pull, DEFAULT_PEEL_PARAMETERS.pull),
      PEEL_PARAMETER_LIMITS.pull.min,
      PEEL_PARAMETER_LIMITS.pull.max,
    );

    return Object.freeze({
      detachGap,
      transition,
      couplingRadius,
      pull,
      peelStart: detachGap - transition,
    });
  }

  const DEFAULT_NORMALIZED_PEEL_PARAMETERS =
    normalizePeelParameters(DEFAULT_PEEL_PARAMETERS);

  function resolvePeelParameters(parameters) {
    if (
      parameters &&
      Object.isFrozen(parameters) &&
      Number.isFinite(parameters.detachGap) &&
      Number.isFinite(parameters.transition) &&
      Number.isFinite(parameters.peelStart) &&
      Number.isFinite(parameters.couplingRadius) &&
      Number.isFinite(parameters.pull) &&
      parameters.detachGap >= PEEL_PARAMETER_LIMITS.detachGap.min &&
      parameters.detachGap <= PEEL_PARAMETER_LIMITS.detachGap.max &&
      parameters.transition >= PEEL_PARAMETER_LIMITS.transition.min &&
      parameters.transition <= PEEL_PARAMETER_LIMITS.transition.max &&
      parameters.couplingRadius >=
        PEEL_PARAMETER_LIMITS.couplingRadius.min &&
      parameters.couplingRadius <=
        PEEL_PARAMETER_LIMITS.couplingRadius.max &&
      parameters.pull >= PEEL_PARAMETER_LIMITS.pull.min &&
      parameters.pull <= PEEL_PARAMETER_LIMITS.pull.max &&
      Math.abs(
        parameters.peelStart -
          (parameters.detachGap - parameters.transition),
      ) < 1e-9
    ) {
      return parameters;
    }
    return parameters
      ? normalizePeelParameters(parameters)
      : DEFAULT_NORMALIZED_PEEL_PARAMETERS;
  }

  function lerp(a, b, progress) {
    return a + (b - a) * progress;
  }

  function smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const progress = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return progress * progress * (3 - 2 * progress);
  }

  function smootherstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const progress = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return (
      progress *
      progress *
      progress *
      (progress * (progress * 6 - 15) + 10)
    );
  }

  function transitionSlope(keys, index) {
    if (index <= 0 || index >= keys.length - 1) return 0;
    const previous = keys[index - 1];
    const current = keys[index];
    const next = keys[index + 1];
    const left = (current.gap - previous.gap) / (current.t - previous.t);
    const right = (next.gap - current.gap) / (next.t - current.t);
    if (left === 0 || right === 0 || Math.sign(left) !== Math.sign(right)) {
      return 0;
    }
    return (next.gap - previous.gap) / (next.t - previous.t);
  }

  function sampleMeasuredTransition(
    kind,
    age,
    hiddenGap = LIQUID_GEOMETRY.hiddenGap,
    restGap = LIQUID_GEOMETRY.restGap,
  ) {
    const safeHiddenGap = clamp(
      finiteNumber(hiddenGap, LIQUID_GEOMETRY.hiddenGap),
      LIQUID_GEOMETRY.renderMinGap,
      LIQUID_GEOMETRY.renderMaxGap,
    );
    const safeRestGap = clamp(
      finiteNumber(restGap, LIQUID_GEOMETRY.restGap),
      LIQUID_GEOMETRY.renderMinGap,
      LIQUID_GEOMETRY.renderMaxGap,
    );
    const keys = LIQUID_TRANSITIONS[kind];
    if (!keys) {
      return {
        done: true,
        gap: safeRestGap,
        velocity: 0,
      };
    }

    const safeAge = Math.max(0, finiteNumber(age, 0));
    const last = keys[keys.length - 1];
    if (safeAge >= last.t) {
      return {
        done: true,
        gap: kind === "opening" ? safeRestGap : safeHiddenGap,
        velocity: 0,
      };
    }

    let index = 1;
    while (index < keys.length && safeAge > keys[index].t) index += 1;
    const previous = keys[index - 1];
    const next = keys[index];
    const duration = next.t - previous.t;
    const progress = clamp((safeAge - previous.t) / duration, 0, 1);
    const progress2 = progress * progress;
    const progress3 = progress2 * progress;
    const previousSlope = transitionSlope(keys, index - 1);
    const nextSlope = transitionSlope(keys, index);
    const h00 = 2 * progress3 - 3 * progress2 + 1;
    const h10 = progress3 - 2 * progress2 + progress;
    const h01 = -2 * progress3 + 3 * progress2;
    const h11 = progress3 - progress2;
    const rawGap =
      h00 * previous.gap +
      h10 * duration * previousSlope +
      h01 * next.gap +
      h11 * duration * nextSlope;
    const rawVelocity =
      ((6 * progress2 - 6 * progress) * previous.gap) / duration +
      (3 * progress2 - 4 * progress + 1) * previousSlope +
      ((-6 * progress2 + 6 * progress) * next.gap) / duration +
      (3 * progress2 - 2 * progress) * nextSlope;
    const rangeScale =
      (safeRestGap - safeHiddenGap) /
      (LIQUID_GEOMETRY.restGap - LIQUID_GEOMETRY.hiddenGap);

    return {
      done: false,
      gap:
        safeHiddenGap +
        (rawGap - LIQUID_GEOMETRY.hiddenGap) * rangeScale,
      velocity: rawVelocity * rangeScale,
    };
  }

  function f(value) {
    return Number(value.toFixed(3));
  }

  function revealProgress(gap) {
    return clamp(
      (gap - LIQUID_GEOMETRY.hiddenGap) /
        (LIQUID_GEOMETRY.restGap - LIQUID_GEOMETRY.hiddenGap),
      0,
      1,
    );
  }

  function baseOutputY(gap) {
    return (
      LIQUID_GEOMETRY.inputY -
      (LIQUID_GEOMETRY.outputHeight + LIQUID_GEOMETRY.restGap) *
        revealProgress(gap)
    );
  }

  function openingTension(velocity) {
    return clamp((finiteNumber(velocity) - 80) / 640, 0, 1);
  }

  function openingContentPull(gap, velocity) {
    if (velocity <= 0) return 0;
    const motion = smoothstep(80, 500, velocity);
    return -20 * Math.sin(Math.PI * revealProgress(gap)) * motion;
  }

  function resolveLiquidMode(
    previousMode,
    gap,
    velocity = 0,
    peelParameters,
  ) {
    const peel = resolvePeelParameters(peelParameters);
    const safeGap = clamp(
      finiteNumber(gap, LIQUID_GEOMETRY.hiddenGap),
      LIQUID_GEOMETRY.renderMinGap,
      LIQUID_GEOMETRY.renderMaxGap,
    );
    const mergeLead = clamp(-finiteNumber(velocity) * 0.006, 0, 2.1);

    if (previousMode === "detached") {
      return safeGap < LIQUID_GEOMETRY.mergeGap + mergeLead
        ? "merged"
        : "detached";
    }
    if (previousMode === "merged") {
      return safeGap > peel.detachGap ? "detached" : "merged";
    }
    return safeGap > peel.detachGap ? "detached" : "merged";
  }

  function roundedPanelPath({
    x,
    y,
    width,
    height,
    topRx,
    topRy = topRx,
    bottomRx,
    bottomRy = bottomRx,
  }) {
    const right = x + width;
    const bottom = y + height;
    const trX = clamp(topRx, 0, width / 2);
    const trY = clamp(topRy, 0, height / 2);
    const brX = clamp(bottomRx, 0, width / 2);
    const brY = clamp(bottomRy, 0, height / 2);

    return [
      `M ${f(x + trX)} ${f(y)}`,
      `H ${f(right - trX)}`,
      `C ${f(right - trX + KAPPA * trX)} ${f(y)} ${f(right)} ${f(y + trY - KAPPA * trY)} ${f(right)} ${f(y + trY)}`,
      `V ${f(bottom - brY)}`,
      `C ${f(right)} ${f(bottom - brY + KAPPA * brY)} ${f(right - brX + KAPPA * brX)} ${f(bottom)} ${f(right - brX)} ${f(bottom)}`,
      `H ${f(x + brX)}`,
      `C ${f(x + brX - KAPPA * brX)} ${f(bottom)} ${f(x)} ${f(bottom - brY + KAPPA * brY)} ${f(x)} ${f(bottom - brY)}`,
      `V ${f(y + trY)}`,
      `C ${f(x)} ${f(y + trY - KAPPA * trY)} ${f(x + trX - KAPPA * trX)} ${f(y)} ${f(x + trX)} ${f(y)}`,
      "Z",
    ].join(" ");
  }

  function tangentCircleBridgePath({
    outputX,
    outputY,
    outputWidth,
    outputHeight,
    outputRadius,
    inputX,
    inputY,
    inputWidth,
    inputHeight,
    inputRadius,
    couplingRadius,
  }) {
    const outputRight = outputX + outputWidth;
    const outputBottom = outputY + outputHeight;
    const inputRight = inputX + inputWidth;
    const inputBottom = inputY + inputHeight;
    const requestedRadius = Math.max(
      0.01,
      finiteNumber(
        couplingRadius,
        DEFAULT_PEEL_PARAMETERS.couplingRadius,
      ),
    );

    function couplingGeometry(topCenter, lowerCenter, side) {
      const dx = lowerCenter.x - topCenter.x;
      const dy = lowerCenter.y - topCenter.y;
      const distance = Math.max(0.0001, Math.hypot(dx, dy));
      const minimumRadius = Math.max(
        0.01,
        (distance - outputRadius - inputRadius) / 2 + 0.001,
      );
      const radius = Math.max(requestedRadius, minimumRadius);
      const topDistance = outputRadius + radius;
      const lowerDistance = inputRadius + radius;
      const along =
        (topDistance * topDistance -
          lowerDistance * lowerDistance +
          distance * distance) /
        (2 * distance);
      const perpendicular = Math.sqrt(
        Math.max(0, topDistance * topDistance - along * along),
      );
      const unitX = dx / distance;
      const unitY = dy / distance;
      const baseX = topCenter.x + along * unitX;
      const baseY = topCenter.y + along * unitY;
      const candidateA = {
        x: baseX - unitY * perpendicular,
        y: baseY + unitX * perpendicular,
      };
      const candidateB = {
        x: baseX + unitY * perpendicular,
        y: baseY - unitX * perpendicular,
      };
      const center =
        side === "right"
          ? candidateA.x > candidateB.x
            ? candidateA
            : candidateB
          : candidateA.x < candidateB.x
            ? candidateA
            : candidateB;
      const topRatio = outputRadius / topDistance;
      const lowerRatio = inputRadius / lowerDistance;

      return {
        center,
        radius,
        topCenter,
        lowerCenter,
        topTangent: {
          x: topCenter.x + (center.x - topCenter.x) * topRatio,
          y: topCenter.y + (center.y - topCenter.y) * topRatio,
        },
        lowerTangent: {
          x:
            lowerCenter.x +
            (center.x - lowerCenter.x) * lowerRatio,
          y:
            lowerCenter.y +
            (center.y - lowerCenter.y) * lowerRatio,
        },
        waistX:
          side === "right"
            ? center.x - radius
            : center.x + radius,
      };
    }

    const rightCoupling = couplingGeometry(
      {
        x: outputRight - outputRadius,
        y: outputBottom - outputRadius,
      },
      {
        x: inputRight - inputRadius,
        y: inputY + inputRadius,
      },
      "right",
    );
    const leftCoupling = couplingGeometry(
      {
        x: outputX + outputRadius,
        y: outputBottom - outputRadius,
      },
      {
        x: inputX + inputRadius,
        y: inputY + inputRadius,
      },
      "left",
    );
    const rt = rightCoupling.topTangent;
    const rb = rightCoupling.lowerTangent;
    const lb = leftCoupling.lowerTangent;
    const lt = leftCoupling.topTangent;

    const d = [
      `M ${f(outputX + outputRadius)} ${f(outputY)}`,
      `H ${f(outputRight - outputRadius)}`,
      `C ${f(outputRight - outputRadius + KAPPA * outputRadius)} ${f(outputY)} ${f(outputRight)} ${f(outputY + outputRadius - KAPPA * outputRadius)} ${f(outputRight)} ${f(outputY + outputRadius)}`,
      `V ${f(outputBottom - outputRadius)}`,
      `A ${f(outputRadius)} ${f(outputRadius)} 0 0 1 ${f(rt.x)} ${f(rt.y)}`,
      `A ${f(rightCoupling.radius)} ${f(rightCoupling.radius)} 0 0 0 ${f(rb.x)} ${f(rb.y)}`,
      `A ${f(inputRadius)} ${f(inputRadius)} 0 0 1 ${f(inputRight)} ${f(inputY + inputRadius)}`,
      `V ${f(inputBottom - inputRadius)}`,
      `C ${f(inputRight)} ${f(inputBottom - inputRadius + KAPPA * inputRadius)} ${f(inputRight - inputRadius + KAPPA * inputRadius)} ${f(inputBottom)} ${f(inputRight - inputRadius)} ${f(inputBottom)}`,
      `H ${f(inputX + inputRadius)}`,
      `C ${f(inputX + inputRadius - KAPPA * inputRadius)} ${f(inputBottom)} ${f(inputX)} ${f(inputBottom - inputRadius + KAPPA * inputRadius)} ${f(inputX)} ${f(inputBottom - inputRadius)}`,
      `V ${f(inputY + inputRadius)}`,
      `A ${f(inputRadius)} ${f(inputRadius)} 0 0 1 ${f(lb.x)} ${f(lb.y)}`,
      `A ${f(leftCoupling.radius)} ${f(leftCoupling.radius)} 0 0 0 ${f(lt.x)} ${f(lt.y)}`,
      `A ${f(outputRadius)} ${f(outputRadius)} 0 0 1 ${f(outputX)} ${f(outputBottom - outputRadius)}`,
      `V ${f(outputY + outputRadius)}`,
      `C ${f(outputX)} ${f(outputY + outputRadius - KAPPA * outputRadius)} ${f(outputX + outputRadius - KAPPA * outputRadius)} ${f(outputY)} ${f(outputX + outputRadius)} ${f(outputY)}`,
      "Z",
    ].join(" ");

    return {
      d,
      couplingRadius:
        (leftCoupling.radius + rightCoupling.radius) / 2,
      leftCoupling,
      rightCoupling,
      leftWaistX: leftCoupling.waistX,
      rightWaistX: rightCoupling.waistX,
      seamY:
        (leftCoupling.center.y + rightCoupling.center.y) / 2,
      waistWidth:
        rightCoupling.waistX - leftCoupling.waistX,
    };
  }

  function sampleClosePose(age) {
    if (!(age >= 0)) {
      return {
        compression: 0,
        expand: 0,
        content: 0,
        surface: 0,
        bottom: 0,
        sendOffset: 0,
        sendScale: 1,
      };
    }

    const safeAge = finiteNumber(age, 0);
    for (let index = 1; index < CLOSE_KEYS.length; index += 1) {
      const next = CLOSE_KEYS[index];
      if (safeAge > next.t) continue;
      const previous = CLOSE_KEYS[index - 1];
      const progress = (safeAge - previous.t) / (next.t - previous.t);
      return {
        compression: lerp(previous.compression, next.compression, progress),
        expand: lerp(previous.expand, next.expand, progress),
        content: lerp(previous.content, next.content, progress),
        surface: lerp(previous.surface, next.surface, progress),
        bottom: lerp(previous.bottom, next.bottom, progress),
        sendOffset: lerp(
          previous.sendOffset,
          next.sendOffset,
          progress,
        ),
        sendScale: lerp(
          previous.sendScale,
          next.sendScale,
          progress,
        ),
      };
    }

    return {
      compression: 0,
      expand: 0,
      content: 0,
      surface: 0,
      bottom: 0,
      sendOffset: 0,
      sendScale: 1,
    };
  }

  function sampleCloseContentScale(age) {
    if (!(age >= 0)) return 1;

    const safeAge = finiteNumber(age, 0);
    for (
      let index = 1;
      index < CLOSE_CONTENT_SCALE_KEYS.length;
      index += 1
    ) {
      const next = CLOSE_CONTENT_SCALE_KEYS[index];
      if (safeAge > next.t) continue;
      const previous = CLOSE_CONTENT_SCALE_KEYS[index - 1];
      const progress =
        (safeAge - previous.t) / (next.t - previous.t);
      return lerp(previous.value, next.value, progress);
    }

    return 1;
  }

  // Manual gap scrubbing has no elapsed transition time. Invert the monotonic
  // closing descent (10 -> -60) so shell compression, melt geometry, content
  // strain, and the send control all reuse the same measured closing pose.
  function closeAgeForGap(gap) {
    const safeGap = clamp(
      finiteNumber(gap, LIQUID_GEOMETRY.restGap),
      CLOSING_DESCENT_END.gap,
      CLOSING_START.gap,
    );
    if (safeGap >= CLOSING_START.gap) return CLOSING_START.t;
    if (safeGap <= CLOSING_DESCENT_END.gap) {
      return CLOSING_DESCENT_END.t;
    }

    let lowerAge = CLOSING_START.t;
    let upperAge = CLOSING_DESCENT_END.t;
    for (let iteration = 0; iteration < 24; iteration += 1) {
      const middleAge = (lowerAge + upperAge) / 2;
      const middleGap = sampleMeasuredTransition(
        "closing",
        middleAge,
      ).gap;
      if (middleGap > safeGap) {
        lowerAge = middleAge;
      } else {
        upperAge = middleAge;
      }
    }
    return (lowerAge + upperAge) / 2;
  }

  function resolveScrubMode(previousMode, gap, peelParameters) {
    const scrubAge = closeAgeForGap(gap);
    const scrubVelocity = sampleMeasuredTransition(
      "closing",
      scrubAge,
    ).velocity;
    return resolveLiquidMode(
      previousMode,
      gap,
      scrubVelocity,
      peelParameters,
    );
  }

  function sampleCloseSendPose(age) {
    if (!(age >= 0)) return { offset: 0, scale: 1 };

    const safeAge = finiteNumber(age, 0);
    for (let index = 1; index < CLOSE_SEND_KEYS.length; index += 1) {
      const next = CLOSE_SEND_KEYS[index];
      if (safeAge > next.t) continue;
      const previous = CLOSE_SEND_KEYS[index - 1];
      const progress = (safeAge - previous.t) / (next.t - previous.t);
      return {
        offset: lerp(previous.offset, next.offset, progress),
        scale: lerp(previous.scale, next.scale, progress),
      };
    }

    return { offset: 0, scale: 1 };
  }

  function samplePeelCorrection(age) {
    const empty = {
      inputTop: 0,
      inputBottom: 0,
      outputTop: 0,
      outputBottom: 0,
      content: 0,
    };
    if (!(age >= 0)) return empty;

    const safeAge = finiteNumber(age, 0);
    for (
      let index = 1;
      index < PEEL_CORRECTION_KEYS.length;
      index += 1
    ) {
      const next = PEEL_CORRECTION_KEYS[index];
      if (safeAge > next.t) continue;
      const previous = PEEL_CORRECTION_KEYS[index - 1];
      const progress = (safeAge - previous.t) / (next.t - previous.t);
      return {
        inputTop: lerp(previous.inputTop, next.inputTop, progress),
        inputBottom: lerp(
          previous.inputBottom,
          next.inputBottom,
          progress,
        ),
        outputTop: lerp(previous.outputTop, next.outputTop, progress),
        outputBottom: lerp(
          previous.outputBottom,
          next.outputBottom,
          progress,
        ),
        content: lerp(previous.content, next.content, progress),
      };
    }

    return empty;
  }

  function effectiveCloseExpand(expand) {
    const safeExpand = Math.max(0, finiteNumber(expand, 0));
    return Math.max(
      0,
      safeExpand - smoothstep(1.5, 2.5, safeExpand),
    );
  }

  function containedPath(gap, velocity, closePose) {
    const {
      x,
      width,
      inputY,
      inputHeight,
      outputRadius,
      inputRadius,
    } = LIQUID_GEOMETRY;
    const reveal = revealProgress(gap);
    const lift = velocity > 0 ? 8 * openingTension(velocity) : 0;
    const closeExpand = effectiveCloseExpand(closePose.expand);
    const panelX = x - closeExpand;
    const panelWidth = width + closeExpand * 2;
    const top = baseOutputY(gap) - lift + closePose.compression;
    const bottom = inputY + inputHeight + closePose.bottom;
    const topRadius = inputRadius + (outputRadius - inputRadius) * reveal;
    const surfaceY = inputY + closePose.surface;
    const contentPull = openingContentPull(gap, velocity);
    const contentY = inputY + contentPull + closePose.content;
    const conceptualOutputBottom = top + LIQUID_GEOMETRY.outputHeight;
    const overlapTop = Math.min(surfaceY, conceptualOutputBottom);
    const overlapBottom = Math.max(surfaceY, conceptualOutputBottom);
    const overlapInset = Math.max(topRadius, inputRadius);
    const debugContactBandD =
      conceptualOutputBottom > surfaceY
        ? [
            `M ${f(panelX + overlapInset)} ${f(overlapTop)}`,
            `H ${f(panelX + panelWidth - overlapInset)}`,
            `V ${f(overlapBottom)}`,
            `H ${f(panelX + overlapInset)}`,
            "Z",
          ].join(" ")
        : "";

    return {
      d: roundedPanelPath({
        x: panelX,
        y: top,
        width: panelWidth,
        height: bottom - top,
        topRx: topRadius,
        bottomRx: inputRadius,
      }),
      inputBottom: bottom,
      inputContentY: contentY,
      inputHeight: bottom - surfaceY,
      inputWidth: panelWidth,
      inputX: panelX,
      inputY: surfaceY,
      lift,
      notch: 0,
      outputHeight: LIQUID_GEOMETRY.outputHeight,
      outputTopRadius: topRadius,
      outputWidth: panelWidth,
      outputX: panelX,
      outputY: top,
      phase: "contained",
      sendOffsetY: 0.3 * contentPull + closePose.sendOffset,
      sendScaleY: Math.max(
        1 + 0.009 * Math.abs(contentPull),
        closePose.sendScale,
      ),
      strain: Math.max(lift, closePose.compression),
      tension: openingTension(velocity),
      debugContactBandD,
      debugContactZoneD: "",
      debugWaistD: "",
      seamY: null,
      waistWidth: panelWidth,
    };
  }

  function mergedPath(
    gap,
    velocity,
    closePose,
    closeAge,
    openAge,
    openStrength,
    manualScrub,
    peelParameters,
  ) {
    const peel = resolvePeelParameters(peelParameters);
    const {
      x,
      width,
      outputHeight,
      inputY: baseInputY,
      inputHeight,
      outputRadius,
      inputRadius,
    } = LIQUID_GEOMETRY;
    const phase = smoothstep(-18, 6, gap);
    const motionTension =
      velocity > 0 ? openingTension(velocity) * phase : 0;
    const safeOpenStrength = clamp(
      finiteNumber(openStrength, 0),
      0,
      1,
    );
    // The final fused span is the envelope of three tangent circles per side:
    // output corner, coupling circle, and input corner. There is no central
    // ligament. Gap changes the circle centres continuously; detach only
    // changes topology after the last valid coupled envelope.
    const measuredSeamRelease =
      closeAge < 0
        ? smoothstep(
            LIQUID_MOTION.openPeelStart,
            LIQUID_MOTION.openTearTime,
            finiteNumber(openAge, -1),
          )
        : 0;
    const springSeamRelease =
      closeAge < 0 && openAge < 0 && velocity > 0
        ? smootherstep(
            peel.detachGap - 0.6,
            peel.detachGap,
            gap,
          )
        : 0;
    const seamRelease = Math.max(
      measuredSeamRelease,
      springSeamRelease,
    );
    const sourceTension = motionTension * (1 - seamRelease);
    const peelTarget = sampleDynamicPeelPose(
      0,
      safeOpenStrength,
      peel,
    );
    const baseTopRadius =
      inputRadius +
      (outputRadius - inputRadius) * revealProgress(gap);
    const scrubPeelProgress = manualScrub
      ? smootherstep(
          peel.peelStart,
          peel.detachGap,
          gap,
        )
      : 0;
    const lockDistance = clamp(
      peel.transition * 0.32,
      1,
      2,
    );
    const manualShapeLock = manualScrub
      ? smootherstep(
          peel.peelStart - lockDistance,
          peel.peelStart,
          gap,
        )
      : 0;
    const measuredShapeLock =
      closeAge < 0 && openAge >= 0
        ? smootherstep(
            LIQUID_MOTION.openContactStart - 0.018,
            LIQUID_MOTION.openContactStart,
            openAge,
          )
        : 0;
    const springShapeLock =
      closeAge < 0 && openAge < 0 && velocity > 0
        ? smootherstep(
            peel.peelStart - lockDistance,
            peel.peelStart,
            gap,
          )
        : 0;
    const shapeLock = Math.max(
      manualShapeLock,
      measuredShapeLock,
      springShapeLock,
    );
    const scrubShellRelease = scrubPeelProgress;
    const scrubFaceApproach =
      manualScrub
        ? peel.pull * scrubPeelProgress
        : 0;
    const shapeTension = Math.max(
      sourceTension,
      0.8 * scrubPeelProgress,
    );
    const closeExpand =
      effectiveCloseExpand(closePose.expand) *
      (1 - scrubShellRelease);
    const absorb =
      closeAge >= 0 ? smoothstep(0.025, 0.038, closeAge) : 0;
    const topExpand = closeExpand * absorb;
    const peelPanelX = x + peelTarget.inset;
    const peelPanelRight = x + width - peelTarget.inset;
    const rawTopX = lerp(
      x + sourceTension - topExpand,
      peelPanelX,
      seamRelease,
    );
    const rawTopRight = lerp(
      x + width - sourceTension + topExpand,
      peelPanelRight,
      seamRelease,
    );
    const topX = lerp(rawTopX, x, shapeLock);
    const topRight = lerp(
      rawTopRight,
      x + width,
      shapeLock,
    );
    const bottomX = lerp(
      x + sourceTension - closeExpand,
      peelPanelX,
      seamRelease,
    );
    const bottomRight = lerp(
      x + width - sourceTension + closeExpand,
      peelPanelRight,
      seamRelease,
    );
    const baseY = baseOutputY(gap);
    const sourceOutputY =
      baseY -
      10 * sourceTension +
      closePose.compression * (1 - scrubShellRelease);
    const targetOutputY =
      baseY -
      peelTarget.strain +
      peelTarget.correction.outputTop;
    const outputY = lerp(
      sourceOutputY,
      targetOutputY,
      seamRelease,
    );
    const targetOutputHeight =
      outputHeight +
      peelTarget.outputHeightStretch +
      peelTarget.faceApproach +
      peelTarget.correction.outputBottom -
      peelTarget.correction.outputTop;
    const rawOutputHeight =
      lerp(
        outputHeight,
        targetOutputHeight,
        seamRelease,
      ) + scrubFaceApproach;
    const currentOutputHeight = lerp(
      rawOutputHeight,
      outputHeight,
      shapeLock,
    );
    const sourceInputY =
      baseInputY + closePose.surface * (1 - scrubShellRelease);
    const targetInputY =
      baseInputY +
      peelTarget.inputTopPush -
      peelTarget.faceApproach +
      peelTarget.correction.inputTop;
    const inputY = lerp(
      sourceInputY,
      targetInputY,
      seamRelease,
    ) - scrubFaceApproach;
    const sourceInputBottom =
      baseInputY +
      inputHeight +
      closePose.bottom * (1 - scrubShellRelease) +
      6 * sourceTension;
    const targetInputBottom =
      baseInputY +
      peelTarget.inputTopPush +
      inputHeight +
      peelTarget.inputHeightStretch +
      peelTarget.correction.inputBottom;
    const inputBottom = lerp(
      sourceInputBottom,
      targetInputBottom,
      seamRelease,
    );
    const topRadius = lerp(
      baseTopRadius,
      outputRadius,
      shapeLock,
    );
    const contentPull = openingContentPull(gap, velocity);
    const sourceInputContentY =
      sourceInputY +
      contentPull -
      6 * sourceTension +
      closePose.content;
    const targetInputContentY =
      baseInputY +
      peelTarget.inputTopPush +
      peelTarget.strain * 0.18 +
      peelTarget.correction.content;
    const inputContentY = lerp(
      sourceInputContentY,
      targetInputContentY,
      seamRelease,
    );
    const sendOffsetY = lerp(
      -6 * sourceTension + closePose.sendOffset,
      peelTarget.sendOffsetY,
      seamRelease,
    );
    const sendScaleY = lerp(
      Math.max(
        1 + 0.15 * sourceTension,
        closePose.sendScale,
      ),
      Math.max(peelTarget.sendScaleY, closePose.sendScale),
      seamRelease,
    );
    const strain = Math.max(
      lerp(
        Math.max(10 * sourceTension, closePose.compression),
        peelTarget.strain,
        seamRelease,
      ),
      closePose.compression,
    );

    {
      // The construction circle is a geometric primitive, not an easing
      // proxy. A fixed radius gives an exact tangent solution at every gap.
      const currentCouplingRadius = peel.couplingRadius;
      const bridge = tangentCircleBridgePath({
        outputX: topX,
        outputY,
        outputWidth: topRight - topX,
        outputHeight: currentOutputHeight,
        outputRadius: topRadius,
        inputX: bottomX,
        inputY,
        inputWidth: bottomRight - bottomX,
        inputHeight: inputBottom - inputY,
        inputRadius,
        couplingRadius: currentCouplingRadius,
      });
      const circlePath = (center, radius) => [
        `M ${f(center.x + radius)} ${f(center.y)}`,
        `A ${f(radius)} ${f(radius)} 0 1 0 ${f(center.x - radius)} ${f(center.y)}`,
        `A ${f(radius)} ${f(radius)} 0 1 0 ${f(center.x + radius)} ${f(center.y)}`,
        "Z",
      ].join(" ");
      const debugContactZoneD = [
        circlePath(
          bridge.leftCoupling.center,
          bridge.leftCoupling.radius,
        ),
        circlePath(
          bridge.rightCoupling.center,
          bridge.rightCoupling.radius,
        ),
      ].join(" ");
      const debugContactBandD =
        `M ${f(bridge.leftWaistX)} ${f(bridge.seamY)} ` +
        `H ${f(bridge.rightWaistX)}`;
      const debugOutputD = [
        circlePath(bridge.leftCoupling.topCenter, topRadius),
        circlePath(bridge.rightCoupling.topCenter, topRadius),
      ].join(" ");
      const debugInputD = [
        circlePath(bridge.leftCoupling.lowerCenter, inputRadius),
        circlePath(bridge.rightCoupling.lowerCenter, inputRadius),
      ].join(" ");

      return {
        d: bridge.d,
        edgeD: bridge.d,
        debugInputD,
        debugOutputD,
        inputBottom,
        inputContentY,
        inputFaceRx: inputRadius,
        inputFaceRy: inputRadius,
        inputHeight: inputBottom - inputY,
        inputWidth: bottomRight - bottomX,
        inputX: bottomX,
        inputY,
        notch:
          (topRight - topX - bridge.waistWidth) / 2,
        outputHeight: currentOutputHeight,
        outputFaceRx: topRadius,
        outputFaceRy: topRadius,
        outputTopRadius: topRadius,
        outputWidth: topRight - topX,
        outputX: topX,
        outputY,
        phase: "neck",
        sendOffsetY,
        sendScaleY,
        seamY: bridge.seamY,
        strain,
        tension: shapeTension,
        debugContactBandD,
        debugContactZoneD,
        debugWaistD:
          `M ${f(bridge.leftWaistX)} ${f(bridge.seamY)} ` +
          `H ${f(bridge.rightWaistX)}`,
        waistWidth: bridge.waistWidth,
      };
    }

  }

  function peelStrain(age, strength) {
    const safeAge = clamp(finiteNumber(age, -1), -1, 1);
    const safeStrength = clamp(finiteNumber(strength, 0), 0, 1);
    if (safeAge <= 0 || safeStrength <= 0) return 0;
    const peakAge = LIQUID_MOTION.peelEaseDuration;
    const rise = smoothstep(0, peakAge, safeAge);
    const decay =
      safeAge <= peakAge
        ? 1
        : Math.exp(-(safeAge - peakAge) / 0.065);
    return 26 * safeStrength * rise * decay;
  }

  function easedPeelAge(elapsed) {
    const safeElapsed = Math.max(0, finiteNumber(elapsed, 0));
    const duration = LIQUID_MOTION.peelEaseDuration;
    if (safeElapsed >= duration) return safeElapsed;
    const progress = safeElapsed / duration;
    // Position and first derivative meet the identity map at `duration`,
    // while the first detached frame starts with zero peel velocity.
    return duration * progress * progress * (2 - progress);
  }

  function sampleDynamicPeelPose(
    tearAge,
    tearStrength,
    peelParameters,
  ) {
    const peel = resolvePeelParameters(peelParameters);
    const elapsed = clamp(finiteNumber(tearAge, -1), -1, 1);
    const strength = clamp(finiteNumber(tearStrength, 0), 0, 1);
    const dynamic = elapsed >= 0 && strength > 0;
    const age = dynamic ? easedPeelAge(elapsed) : 0;
    const strain = dynamic ? peelStrain(age, strength) : 0;
    const correction = samplePeelCorrection(dynamic ? age : -1);
    const faceApproach = dynamic
      ? peel.pull *
        strength *
        (1 - smoothstep(0, LIQUID_MOTION.peelEaseDuration, age))
      : 0;
    const inset =
      strain * 0.16 +
      (dynamic ? 0.5 * smoothstep(2, 5, strain) : 0);
    const outputHeightStretch =
      strain * (0.08 + 0.52 * Math.exp(-age / 0.018));
    const inputTopPush =
      strain * 0.35 * (1 - Math.exp(-age / 0.012));
    const inputHeightStretch =
      strain * (0.3 + 0.55 * Math.exp(-age / 0.018));

    return {
      age,
      correction,
      dynamic,
      faceApproach,
      inset,
      inputHeightStretch,
      inputTopPush,
      outputHeightStretch,
      sendOffsetY: dynamic
        ? -0.3 * strain * Math.exp(-age / 0.03)
        : 0,
      sendScaleY: dynamic
        ? 1 + 0.1 * (strain / 26)
        : 1,
      strain,
    };
  }

  function detachedPath(
    gap,
    tearAge,
    tearStrength,
    manualScrub,
    peelParameters,
  ) {
    const peel = resolvePeelParameters(peelParameters);
    const {
      x,
      width,
      outputHeight,
      inputY,
      inputHeight,
      outputRadius,
      inputRadius,
    } = LIQUID_GEOMETRY;
    const peelPose = sampleDynamicPeelPose(
      tearAge,
      tearStrength,
      peel,
    );
    const {
      correction,
      faceApproach,
      inset,
      inputHeightStretch,
      inputTopPush,
      sendOffsetY,
      sendScaleY,
      strain,
    } = peelPose;
    const scrubResidual = manualScrub
      ? gap <= peel.detachGap
        ? smootherstep(
            peel.peelStart,
            peel.detachGap,
            gap,
          )
        : 1 -
          smootherstep(
            peel.detachGap,
            LIQUID_GEOMETRY.restGap,
            gap,
          )
      : 0;
    // Downward hysteresis keeps two subpaths alive below the tear threshold.
    // A two-sided envelope releases their attraction before the merge point,
    // preventing detached panels from crossing through one another.
    const scrubApproachResidual =
      manualScrub && gap <= peel.detachGap
        ? smoothstep(
            peel.peelStart,
            peel.detachGap,
            gap,
          )
        : scrubResidual;
    const scrubFaceApproach =
      peel.pull * scrubApproachResidual;
    const totalFaceApproach =
      faceApproach + scrubFaceApproach;
    const inputPanelX = x + inset;
    const inputPanelWidth = width - inset * 2;
    const rawOutputY = baseOutputY(gap) - strain;
    const outputY = rawOutputY + correction.outputTop;
    const outputBottom = outputY + outputHeight;
    const currentOutputHeight = outputHeight;
    const rawInputY =
      inputY + inputTopPush - totalFaceApproach;
    const rawInputBottom =
      inputY + inputTopPush + inputHeight + inputHeightStretch;
    const currentInputY = rawInputY + correction.inputTop;
    const inputBottom = rawInputBottom + correction.inputBottom;
    const currentInputHeight = inputBottom - currentInputY;
    const inputContentY =
      inputY +
      inputTopPush +
      strain * 0.18 +
      correction.content;
    // Detachment keeps the same standard corner radii used by the two blue
    // construction circles; only the coupled envelope changes topology.
    const outputFaceRx = outputRadius;
    const inputFaceRx = inputRadius;
    const outputFaceRy = outputRadius;
    const inputFaceRy = inputRadius;

    const outputD = roundedPanelPath({
      x,
      y: outputY,
      width,
      height: currentOutputHeight,
      topRx: outputRadius,
      bottomRx: outputFaceRx,
      bottomRy: outputFaceRy,
    });
    const inputD = roundedPanelPath({
      x: inputPanelX,
      y: currentInputY,
      width: inputPanelWidth,
      height: currentInputHeight,
      topRx: inputFaceRx,
      topRy: inputFaceRy,
      bottomRx: inputRadius,
    });

    return {
      d: [outputD, inputD].join(" "),
      debugInputD: inputD,
      debugOutputD: outputD,
      faceTension: 0.8 * scrubResidual,
      inputFaceRx,
      inputFaceRy,
      inputBottom,
      inputContentY,
      inputHeight: currentInputHeight,
      inputWidth: inputPanelWidth,
      inputX: inputPanelX,
      inputY: currentInputY,
      outputHeight: currentOutputHeight,
      outputFaceRx,
      outputFaceRy,
      outputTopRadius: outputRadius,
      outputWidth: width,
      outputX: x,
      outputY,
      phase: "detached",
      sendOffsetY,
      sendScaleY,
      strain,
      debugContactBandD: "",
      debugContactZoneD: "",
      debugWaistD: "",
      seamY: null,
      waistWidth: 0,
    };
  }

  function createLiquidFrame(gap, velocity = 0, options = {}) {
    const peel = resolvePeelParameters(options.peelParameters);
    const safeGap = clamp(
      finiteNumber(gap, LIQUID_GEOMETRY.hiddenGap),
      LIQUID_GEOMETRY.renderMinGap,
      LIQUID_GEOMETRY.renderMaxGap,
    );
    const safeVelocity = finiteNumber(velocity, 0);
    const mode =
      options.mode === "merged" || options.mode === "detached"
        ? options.mode
        : resolveLiquidMode(
            undefined,
            safeGap,
            safeVelocity,
            peel,
          );
    const tearAge = finiteNumber(options.tearAge, -1);
    const tearStrength = clamp(
      finiteNumber(options.tearStrength, 0),
      0,
      1,
    );
    const closeAge = finiteNumber(options.closeAge, -1);
    const openAge = finiteNumber(options.openAge, -1);
    const openStrength = clamp(
      finiteNumber(options.openStrength, 0),
      0,
      1,
    );
    const closingScrub = options.scrub === true && closeAge < 0;
    const effectiveCloseAge = closingScrub
      ? closeAgeForGap(safeGap)
      : closeAge;
    const closePose = sampleClosePose(effectiveCloseAge);
    const closeSend = sampleCloseSendPose(effectiveCloseAge);
    const closingContained =
      effectiveCloseAge >= 0 &&
      (safeGap <= -8 || effectiveCloseAge >= 0.038);
    const merged =
      mode === "merged"
        ? safeGap <= -18 || closingContained
          ? containedPath(safeGap, safeVelocity, closePose)
          : mergedPath(
              safeGap,
              safeVelocity,
              closePose,
              effectiveCloseAge,
              openAge,
              openStrength,
              closingScrub,
              peel,
            )
        : null;
    const detached =
      mode === "detached"
        ? detachedPath(
            safeGap,
            tearAge,
            tearStrength,
            closingScrub,
            peel,
          )
        : null;
    const frame = merged || detached;
    const outputExitPhase =
      effectiveCloseAge >= 0
        ? smoothstep(0.021, 0.045, effectiveCloseAge)
        : 0;
    const outputSmearPhase =
      effectiveCloseAge >= 0
        ? smoothstep(0.008, 0.027, effectiveCloseAge)
        : 0;
    const outputBlur =
      effectiveCloseAge >= 0
        ? 2.2 * smoothstep(0.008, 0.023333, effectiveCloseAge) +
          1.8 * smoothstep(0.023333, 0.038, effectiveCloseAge) +
          1.75 * smoothstep(0.038, 0.048333, effectiveCloseAge) +
          1.25 * smoothstep(0.048333, 0.061667, effectiveCloseAge)
        : 0;
    const closingFade = 1 - 0.82 * outputExitPhase;
    const inputBottom =
      frame.inputBottom ?? frame.inputY + frame.inputHeight;
    const inputContentY = frame.inputContentY ?? frame.inputY;
    const scrubVisualRelease = closingScrub
      ? smootherstep(
          peel.peelStart,
          peel.detachGap,
          safeGap,
        )
      : 0;
    const inputVisualY =
      effectiveCloseAge >= 0 && mode === "merged"
        ? closingScrub
          ? lerp(
              frame.outputY,
              frame.inputY,
              scrubVisualRelease,
            )
          : frame.outputY
        : frame.inputY;
    const inputContentScaleY =
      sampleCloseContentScale(effectiveCloseAge);
    const sendScaleY =
      effectiveCloseAge >= 0
        ? closeSend.scale
        : frame.sendScaleY ?? 1;
    const sendHeight = LIQUID_GEOMETRY.sendSize * sendScaleY;
    const sendRadiusY = Math.min(
      sendHeight / 2,
      LIQUID_GEOMETRY.sendSize / 2 / inputContentScaleY,
    );
    const outputHeight =
      frame.outputHeight ?? LIQUID_GEOMETRY.outputHeight;
    const outputFaceRx =
      frame.outputFaceRx ?? LIQUID_GEOMETRY.outputRadius;
    const outputFaceRy =
      frame.outputFaceRy ?? outputFaceRx;
    const inputFaceRx =
      frame.inputFaceRx ?? LIQUID_GEOMETRY.inputRadius;
    const inputFaceRy =
      frame.inputFaceRy ?? inputFaceRx;
    const outputX = frame.outputX ?? LIQUID_GEOMETRY.x;
    const outputWidth = frame.outputWidth ?? LIQUID_GEOMETRY.width;
    const inputX = frame.inputX ?? LIQUID_GEOMETRY.x;
    const inputWidth = frame.inputWidth ?? LIQUID_GEOMETRY.width;
    const conceptualGap =
      frame.inputY - (frame.outputY + outputHeight);
    const phase =
      frame.phase ?? (mode === "detached" ? "detached" : "neck");
    const debugEnabled = options.debug === true;
    const contactKind =
      mode === "detached"
        ? "none"
        : Math.abs(conceptualGap) < 0.001
          ? "touch"
          : conceptualGap > 0
            ? "bridge"
            : "overlap";
    const debug = debugEnabled
      ? {
          topology: mode,
          phase,
          actualD: frame.d,
          outputD:
            frame.debugOutputD ??
            roundedPanelPath({
              x: outputX,
              y: frame.outputY,
              width: outputWidth,
              height: outputHeight,
              topRx:
                frame.outputTopRadius ??
                LIQUID_GEOMETRY.outputRadius,
              bottomRx: outputFaceRx,
              bottomRy: outputFaceRy,
            }),
          inputD:
            frame.debugInputD ??
            roundedPanelPath({
              x: inputX,
              y: frame.inputY,
              width: inputWidth,
              height: frame.inputHeight,
              topRx: inputFaceRx,
              topRy: inputFaceRy,
              bottomRx: LIQUID_GEOMETRY.inputRadius,
            }),
          contactZoneD: frame.debugContactZoneD ?? "",
          contactBandD: frame.debugContactBandD ?? "",
          waistD: frame.debugWaistD ?? "",
          conceptualGap,
          contactKind,
          overlap: Math.max(0, -conceptualGap),
          separation: Math.max(0, conceptualGap),
          seamY: frame.seamY,
          waistWidth: frame.waistWidth ?? 0,
        }
      : null;

    return {
      d: frame.d,
      edgeD: frame.edgeD ?? frame.d,
      debug,
      mode,
      phase,
      gap: safeGap,
      peelParameters: peel,
      faceGap: conceptualGap,
      inputBottom,
      inputContentHeight: Math.max(1, inputBottom - inputContentY),
      inputContentScaleY,
      inputContentY,
      inputFaceRx,
      inputFaceRy,
      inputHeight: frame.inputHeight,
      inputY: frame.inputY,
      inputVisualHeight: Math.max(1, inputBottom - inputVisualY),
      inputVisualY,
      notch: frame.notch ?? 0,
      outputHeight,
      outputFaceRx,
      outputFaceRy,
      outputOpacity:
        smoothstep(-18, 1, safeGap) * closingFade,
      outputBlur,
      outputScaleY: 1 - 0.25 * outputExitPhase,
      outputSmear:
        outputSmearPhase * smoothstep(-18, 1, safeGap),
      outputY: frame.outputY,
      sendArrowScaleY: 1 / inputContentScaleY,
      sendHeight,
      sendOffsetY:
        effectiveCloseAge >= 0
          ? closeSend.offset
          : frame.sendOffsetY ?? 0,
      sendRadiusY,
      sendScaleY,
      seamY: frame.seamY,
      strain: frame.strain ?? 0,
      stretch: Math.max(
        frame.tension ?? 0,
        frame.faceTension ?? 0,
        (frame.strain ?? 0) / 26,
      ),
      waistWidth: frame.waistWidth ?? 0,
    };
  }

  global.LiquidPath = Object.freeze({
    DEFAULT_PEEL_PARAMETERS,
    PEEL_PARAMETER_LIMITS,
    LIQUID_GEOMETRY,
    LIQUID_MOTION,
    LIQUID_TRANSITIONS,
    clamp,
    closeAgeForGap,
    createLiquidFrame,
    easedPeelAge,
    finiteNumber,
    normalizePeelParameters,
    openingContentPull,
    openingTension,
    resolveLiquidMode,
    resolveScrubMode,
    sampleClosePose,
    sampleMeasuredTransition,
    samplePeelCorrection,
    smoothstep,
    smootherstep,
  });
})(globalThis);
