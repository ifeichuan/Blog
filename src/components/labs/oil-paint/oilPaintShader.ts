const OIL_COMMON = /* glsl */ `
uniform float uStrokeScale;
uniform float uStrokeDirection;
uniform float uStrokeAnisotropy;
uniform float uPaintThickness;
uniform float uDisplacement;
uniform float uCompare;
uniform float uViewMode;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 345.45));
  p += dot(p, p + 34.345);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.52;
  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = rot * p * 2.07 + 13.1;
    amp *= 0.5;
  }
  return value;
}

vec2 rotate2(vec2 p, float a) {
  float c = cos(a);
  float s = sin(a);
  return vec2(c * p.x - s * p.y, s * p.x + c * p.y);
}

vec2 strokeSpace(vec2 uv, float scale, float angle, float aniso) {
  vec2 p = rotate2(uv - 0.5, -angle);
  float along = scale / max(aniso, 1.0);
  float across = scale * aniso * 0.14;
  return p * vec2(along, across);
}

float directionalFbm(vec2 uv, float scale, float angle, float aniso) {
  return fbm(strokeSpace(uv, scale, angle, aniso));
}

// 厚度必须是团块，不能跟 smear 共用同一套拉长噪声，否则高度层就是条纹。
float paintHeightMacro(vec2 uv) {
  float angle = uStrokeDirection;
  float aniso = max(uStrokeAnisotropy, 1.0);
  float scale = max(uStrokeScale, 4.0);

  float blobA = fbm(uv * scale * 0.38 + 1.7);
  float blobB = fbm(uv * vec2(scale * 0.52, scale * 0.44) + 6.4);
  float blobs = max(blobA, blobB * 0.88);
  blobs = pow(smoothstep(0.34, 0.58, blobs), 0.85);

  float ridge = directionalFbm(uv, scale * 0.7, angle, aniso);
  ridge = pow(smoothstep(0.4, 0.7, 1.0 - abs(ridge * 2.0 - 1.0)), 1.4);

  return (blobs * 0.72 + ridge * 0.28) * uPaintThickness;
}
`

export const OIL_PAINT_VERTEX = /* glsl */ `
${OIL_COMMON}

varying vec2 vUv;

void main() {
  vUv = uv;
  float flatView = step(0.5, uCompare) + step(0.5, uViewMode) * step(uViewMode, 1.5);
  float h = paintHeightMacro(uv);

  vec3 pos = position;
  pos.z += h * uDisplacement * (1.0 - clamp(flatView, 0.0, 1.0));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`

/**
 * 四层油画。厚涂不再只靠一张平的 fake normal：
 * 顶点按宏高度隆起，fragment 再叠鬃毛细纹、谷底 AO、刮光高光。
 */
export const OIL_PAINT_FRAGMENT = /* glsl */ `
precision highp float;

${OIL_COMMON}

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uLightUV;
uniform float uStrokeStrength;
uniform float uSmearStrength;
uniform float uSmearLength;
uniform float uPaintBump;
uniform float uCanvasScale;
uniform float uCanvasBump;
uniform float uRoughness;
uniform float uSpecular;
uniform float uColorLevels;

varying vec2 vUv;

float luma(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

float quantizeSoft(float v, float levels) {
  float q = v * levels;
  float i = floor(q);
  float f = fract(q);
  return (i + smoothstep(0.32, 0.68, f)) / levels;
}

float canvasWeave(vec2 uv, float scale) {
  vec2 p = uv * scale;
  float warp = noise(p * 0.16) * 0.85;
  float threadU = noise(vec2(p.x * 0.11 + warp, p.y * 1.85));
  float threadV = noise(vec2(p.x * 1.85, p.y * 0.11 - warp));
  float fiber = noise(p * 2.35 + 9.2);
  return threadU * 0.4 + threadV * 0.4 + fiber * 0.2;
}

float sampleLuma(vec2 uv) {
  return luma(texture2D(uTexture, clamp(uv, 0.0, 1.0)).rgb);
}

float smearMask(vec2 uv, vec3 src) {
  float Y = luma(src);
  float sat = max(src.r, max(src.g, src.b)) - min(src.r, min(src.g, src.b));

  vec2 faceC = (uv - vec2(0.5, 0.42)) * vec2(1.12, 1.38);
  float face = exp(-dot(faceC, faceC) * 2.15);

  float left = smoothstep(0.95, 0.18, uv.x);
  float mid = smoothstep(0.08, 0.28, Y) * (1.0 - smoothstep(0.78, 0.96, Y));

  float edge = abs(sampleLuma(uv + vec2(0.018, 0.0)) - sampleLuma(uv - vec2(0.018, 0.0)));
  float n = fbm(uv * 5.4 + 2.7);

  float m =
    face * mix(0.45, 1.0, left) * mix(0.55, 1.0, mid) +
    edge * 1.8 +
    sat * 0.35 +
    n * 0.12;

  return clamp(m * uSmearStrength, 0.0, 1.0);
}

vec3 smearPaint(vec2 paintUV, float smear) {
  vec3 center = texture2D(uTexture, clamp(paintUV, 0.0, 1.0)).rgb;
  if (smear < 0.004 || uSmearLength < 0.0005) return center;

  vec3 acc = vec3(0.0);
  float wsum = 0.0;
  float stepX = uSmearLength * smear;
  float wave = (fbm(vec2(paintUV.y * 18.0, paintUV.x * 2.2)) - 0.5) * 0.01 * smear;

  for (int i = -8; i <= 8; i++) {
    float x = float(i);
    float w = exp(-x * x / 18.0);
    vec2 suv = paintUV + vec2(x * stepX, wave * (0.35 + abs(x) * 0.08));
    vec3 s = texture2D(uTexture, clamp(suv, 0.0, 1.0)).rgb;
    float sat = max(s.r, max(s.g, s.b)) - min(s.r, min(s.g, s.b));
    w *= 0.72 + sat * 0.9;
    acc += s * w;
    wsum += w;
  }

  vec3 dragged = acc / max(wsum, 1e-4);
  return mix(center, dragged, clamp(smear * 0.92, 0.0, 1.0));
}

vec3 blockColor(vec3 color) {
  float levels = max(uColorLevels, 2.0);
  float Y = luma(color);
  vec3 hsv = rgb2hsv(color);

  float qY = quantizeSoft(Y, levels);
  hsv.x = mix(hsv.x, floor(hsv.x * 11.0 + 0.5) / 11.0, 0.38);
  hsv.y = clamp(hsv.y * 1.14, 0.0, 1.0);
  hsv.z = mix(hsv.z, qY, 0.72);

  vec3 blocked = hsv2rgb(hsv);
  blocked *= mix(0.9, 1.1, qY);
  blocked = mix(blocked * vec3(0.93, 0.97, 1.06), blocked * vec3(1.06, 1.02, 0.94), qY);
  return blocked;
}

float paintHeight(vec2 uv) {
  float h = paintHeightMacro(uv);
  vec2 ss = strokeSpace(uv, uStrokeScale * 2.2, uStrokeDirection, uStrokeAnisotropy);
  float bristle = abs(sin(ss.y * 16.0 + fbm(ss * 0.5) * 3.8));
  bristle = pow(bristle, 3.1) * 0.16;
  float peak = pow(max(h / max(uPaintThickness, 0.001) - 0.22, 0.0), 1.35) * 0.32;
  return h + (bristle + peak) * uPaintThickness;
}

vec3 heightNormal(vec2 uv, float eps, float z) {
  float hL = paintHeight(uv + vec2(-eps, 0.0));
  float hR = paintHeight(uv + vec2( eps, 0.0));
  float hD = paintHeight(uv + vec2(0.0, -eps));
  float hU = paintHeight(uv + vec2(0.0,  eps));
  return normalize(vec3((hL - hR) * uPaintBump, (hD - hU) * uPaintBump, z));
}

void main() {
  vec2 uv = vUv;
  vec3 source = texture2D(uTexture, uv).rgb;

  if (uCompare > 0.5 || uViewMode > 0.5 && uViewMode < 1.5) {
    gl_FragColor = vec4(source, 1.0);
    return;
  }

  float angle = uStrokeDirection;
  float stroke = directionalFbm(uv, uStrokeScale, angle, uStrokeAnisotropy);
  float strokeB = directionalFbm(uv + 3.17, uStrokeScale * 0.55, angle + 0.35, max(uStrokeAnisotropy * 0.45, 1.5));

  vec2 paintUV = uv;
  vec2 dir = vec2(cos(angle), sin(angle));
  vec2 perp = vec2(-dir.y, dir.x);
  paintUV += dir * (stroke - 0.5) * uStrokeStrength;
  paintUV += perp * (strokeB - 0.5) * uStrokeStrength * 0.28;

  float smear = smearMask(uv, source);
  vec3 wet = smearPaint(paintUV, smear);
  vec3 blocked = blockColor(wet);

  float hC = paintHeight(uv);
  float chunkEps = 0.02;
  float fineEps = 2.2 / max(uResolution.x, 512.0);
  vec3 Nchunk = heightNormal(uv, chunkEps, 0.14);
  vec3 Nfine = heightNormal(uv, fineEps, 0.28);
  vec3 paintN = normalize(Nchunk * 0.86 + Nfine * 0.22);

  float hL = paintHeight(uv + vec2(-chunkEps, 0.0));
  float hR = paintHeight(uv + vec2( chunkEps, 0.0));
  float hD = paintHeight(uv + vec2(0.0, -chunkEps));
  float hU = paintHeight(uv + vec2(0.0,  chunkEps));
  float cavity = clamp((hL + hR + hD + hU) * 0.25 - hC, 0.0, 1.0);

  float cEps = fineEps * 0.5;
  float cL = canvasWeave(uv + vec2(-cEps, 0.0), uCanvasScale);
  float cR = canvasWeave(uv + vec2( cEps, 0.0), uCanvasScale);
  float cD = canvasWeave(uv + vec2(0.0, -cEps), uCanvasScale);
  float cU = canvasWeave(uv + vec2(0.0,  cEps), uCanvasScale);
  float cC = canvasWeave(uv, uCanvasScale);

  vec3 canvasN = normalize(vec3(
    (cL - cR) * uCanvasBump * 2.4,
    (cD - cU) * uCanvasBump * 2.4,
    1.0
  ));

  float canvasReveal = mix(0.12, 1.0, 1.0 - smoothstep(0.12, 0.55, hC));
  vec3 N = normalize(paintN + vec3(canvasN.xy * canvasReveal, 0.0));

  // 画廊刮光常驻，鼠标灯只是第二盏。没有斜光，堆颜读不出来。
  vec3 Lgallery = normalize(vec3(-0.62, 0.48, 0.16));
  vec3 Lmouse = normalize(vec3(uLightUV - uv, 0.2));
  vec3 V = normalize(vec3(0.5 - uv.x, 0.5 - uv.y, 1.05));
  vec3 H = normalize(Lgallery + V);

  float ndl = max(dot(N, Lgallery), 0.0);
  float ndlM = max(dot(N, Lmouse), 0.0);
  float specPow = mix(110.0, 18.0, clamp(uRoughness, 0.0, 1.0));
  float spec = pow(max(dot(N, H), 0.0), specPow);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 2.4);
  float valley = 1.0 - smoothstep(0.06, 0.48, hC);
  float peak = smoothstep(0.28, 0.88, hC);

  vec2 lxy = normalize(Lgallery.xy + 1e-4);
  float hAhead = paintHeight(uv + lxy * 0.018);
  float selfShadow = 1.0 - smoothstep(hC - 0.02, hC + 0.2, hAhead) * 0.6;

  vec3 color = blocked;
  color *= 0.58 + ndl * 0.5 + ndlM * 0.16;
  color *= 1.0 - valley * 0.22;
  color *= 1.0 - cavity * 0.38;
  color *= 0.9 + peak * 0.16;
  color *= mix(0.78, 1.0, selfShadow);
  color += spec * uSpecular * (0.08 + peak * 1.15) * vec3(1.0, 0.96, 0.86);
  color += fres * uSpecular * 0.1 * peak * vec3(0.95, 0.97, 1.0);
  color *= mix(vec3(1.0), vec3(0.96, 0.94, 0.88), cC * canvasReveal * 0.14);
  color += vec3(0.04, 0.034, 0.026) * cC * canvasReveal * (1.0 - luma(color));
  color *= vec3(1.02, 1.0, 0.97);

  if (uViewMode > 1.5 && uViewMode < 2.5) {
    color = vec3(stroke);
  } else if (uViewMode > 2.5 && uViewMode < 3.5) {
    color = vec3(smear);
  } else if (uViewMode > 3.5 && uViewMode < 4.5) {
    color = blocked;
  } else if (uViewMode > 4.5 && uViewMode < 5.5) {
    color = vec3(hC);
  } else if (uViewMode > 5.5 && uViewMode < 6.5) {
    color = N * 0.5 + 0.5;
  } else if (uViewMode > 6.5) {
    color = vec3(cC);
  }

  gl_FragColor = vec4(color, 1.0);
}
`
