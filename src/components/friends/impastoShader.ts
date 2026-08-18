export const IMPASTO_VERTEX = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

/**
 * Foil flash-card + sandblast surface + organic noise reveal.
 *
 * Reveal keeps the original full-surface threshold approach. Its boundary is
 * produced by continuous, domain-warped, multi-scale noise — never quantized
 * cells — so the seam has concave bite-outs, detached islands and fine grit.
 */
export const IMPASTO_FRAGMENT = /* glsl */ `
precision highp float;

uniform sampler2D uAlbedo;
uniform sampler2D uHeight;
uniform vec2 uResolution;
uniform vec2 uLightUV;
uniform float uIntensity;
uniform float uBumpScale;
uniform float uTime;
uniform float uDapple;
uniform float uFoil;
uniform float uGlitter;
uniform float uGlitterDensity;
uniform float uGlitterSharpness;
uniform float uFrost;
uniform float uFrostSharpness;
uniform float uMicroGrain;
uniform float uMicroGrainScale;
uniform float uFoilSharpness;
uniform float uHoloBands;
uniform float uLightHeight;
uniform float uLightRadius;
uniform float uAmbient;
uniform float uKeyLight;

uniform float uReveal;
uniform float uBurnNoise;
uniform float uBurnDetailScale;
uniform float uBurnDetailMix;
uniform float uBurnBite;
uniform float uBurnBiteThreshold;
uniform float uBurnWarp;
uniform float uBurnDirection;
uniform float uBurnEdge;
uniform float uBurnGlow;
uniform float uBurnShadow;
uniform float uBurnGrain;
uniform float uBurnDrift;

varying vec2 vUv;

float sampleHeight(vec2 uv) {
  return texture2D(uHeight, uv).r;
}

vec3 heightNormal(vec2 uv, float scale) {
  vec2 texel = 1.0 / uResolution;
  float hL = sampleHeight(uv - vec2(texel.x * 1.5, 0.0));
  float hR = sampleHeight(uv + vec2(texel.x * 1.5, 0.0));
  float hD = sampleHeight(uv - vec2(0.0, texel.y * 1.5));
  float hU = sampleHeight(uv + vec2(0.0, texel.y * 1.5));
  return normalize(vec3((hL - hR) * scale, (hD - hU) * scale, 1.0));
}

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
  float amp = 0.56;
  mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 4; i++) {
    value += amp * noise(p);
    p = rot * p * 2.05 + 11.7;
    amp *= 0.5;
  }
  return value;
}

float fbm3(vec2 p) {
  float value = 0.0;
  float amp = 0.58;
  mat2 rot = mat2(0.82, -0.57, 0.57, 0.82);
  for (int i = 0; i < 3; i++) {
    value += amp * noise(p);
    p = rot * p * 2.08 + 7.9;
    amp *= 0.47;
  }
  return value;
}

// Two continuous samples are enough for satin grain and avoid square cells.
float fineGrain(vec2 p) {
  return noise(p * 2.1) * 0.66 + noise(p * 5.3 + 17.3) * 0.34;
}

vec3 foilHue(float t) {
  vec3 gold = vec3(1.0, 0.78, 0.34);
  vec3 silver = vec3(0.88, 0.91, 0.96);
  vec3 rose = vec3(1.0, 0.56, 0.46);
  vec3 cyan = vec3(0.5, 0.88, 0.9);
  vec3 violet = vec3(0.7, 0.56, 0.95);
  float u = fract(t);
  vec3 c = mix(gold, silver, smoothstep(0.42, 0.56, u));
  c = mix(c, rose, smoothstep(0.56, 0.68, u));
  c = mix(c, cyan, smoothstep(0.68, 0.80, u));
  c = mix(c, violet, smoothstep(0.80, 0.92, u));
  return mix(c, gold, smoothstep(0.92, 1.0, u));
}

void main() {
  vec4 albedo = texture2D(uAlbedo, vUv);
  if (albedo.a < 0.08) {
    gl_FragColor = vec4(0.0);
    return;
  }

  float intensity = clamp(uIntensity, 0.0, 1.0);
  float progress = clamp(uReveal, 0.0, 1.0);
  if (progress < 0.001) {
    gl_FragColor = vec4(albedo.rgb, albedo.a);
    return;
  }

  // ── Original reveal method, organic boundary ──────────────────────
  // Once reveal is complete this uniform branch skips all FBM work.
  float revealed = 1.0;
  float seam = 0.0;
  float innerSeam = 0.0;

  if (progress < 0.995) {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0) + 0.5;
    float drift = uTime * uBurnDrift;

    vec2 warp = vec2(
      fbm(p * uBurnNoise * 0.72 + vec2(1.7, 9.2) + drift * vec2(0.17, 0.11)),
      fbm(p * uBurnNoise * 0.72 + vec2(8.3, 2.8) - drift * vec2(0.09, 0.14))
    ) - 0.5;
    vec2 q = p + warp * uBurnWarp;

    float broad = fbm(q * uBurnNoise);
    float detail = fbm(q * uBurnDetailScale + warp * 2.7 + 4.1);
    float ridge = 1.0 - abs(detail * 2.0 - 1.0);
    float biteWindow = max(0.04, 1.0 - uBurnBiteThreshold);
    float bite = smoothstep(
      uBurnBiteThreshold,
      min(1.0, uBurnBiteThreshold + biteWindow * 0.72),
      ridge
    );
    float field = mix(broad, detail, uBurnDetailMix);
    field += (bite - 0.35) * uBurnBite;
    field += (vUv.x - 0.5) * uBurnDirection;
    field = clamp(field, 0.0, 1.0);

    float threshold = mix(-0.12, 1.12, progress);
    float edge = max(uBurnEdge, 0.002);
    float pixelGrain = hash(floor(vUv * uResolution * 0.82) + 19.7) - 0.5;
    float coarseGrain = noise(vUv * uResolution / 3.2 + 7.3) - 0.5;
    float grainOffset = (pixelGrain * 0.68 + coarseGrain * 0.32) * uBurnGrain * edge;
    float signedFront = threshold - field + grainOffset;
    revealed = smoothstep(-edge, edge, signedFront);

    float travel = smoothstep(0.015, 0.11, progress) *
      (1.0 - smoothstep(0.89, 0.995, progress));
    seam = (1.0 - smoothstep(edge * 0.15, edge * 1.75, abs(signedFront))) * travel;
    innerSeam = (1.0 - smoothstep(0.0, edge * 0.62, abs(signedFront))) * travel;
  }

  if (revealed < 0.001 && seam < 0.001) {
    gl_FragColor = vec4(albedo.rgb, albedo.a);
    return;
  }

  // ── Sandblasted foil material ─────────────────────────────────────
  float bump = mix(0.35, uBumpScale, intensity * revealed);
  vec3 N = heightNormal(vUv, bump);

  // A second, much finer isotropic microfacet layer gives satin detail
  // without increasing macro bump depth or creating embossing.
  vec2 microUv = vUv * uResolution * 0.012 * uMicroGrainScale;
  vec2 microSlope = vec2(
    fineGrain(microUv + vec2(17.1, 4.7)),
    fineGrain(microUv + vec2(8.2, 29.4))
  ) - 0.5;
  N = normalize(N + vec3(microSlope * uMicroGrain * intensity * revealed, 0.0));

  vec3 lightPos = vec3(uLightUV, uLightHeight);
  vec3 fragPos = vec3(vUv, 0.0);
  vec3 L = normalize(lightPos - fragPos);
  vec3 V = normalize(vec3(0.5 - vUv.x, 0.5 - vUv.y, 1.35));
  vec3 H = normalize(L + V);

  float lightDistance = distance(vUv, uLightUV);
  float spotRadius = max(uLightRadius, 0.015);
  float spot = 1.0 - smoothstep(spotRadius * 0.35, spotRadius * 1.35, lightDistance);
  spot = pow(spot, 1.35);

  float ndl = max(dot(N, L), 0.0);
  float ndh = max(dot(N, H), 0.0);
  float frosted = pow(ndh, max(uFrostSharpness, 2.0));
  float foilFlash = pow(ndh, max(uFoilSharpness, 2.0));
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  float grit = sampleHeight(vUv);
  float gritMask = mix(0.65, 1.2, grit);

  float phase =
    (vUv.x * 1.35 + vUv.y * 0.85) * uHoloBands +
    uLightUV.x * 1.1 - uLightUV.y * 0.7 +
    grit * 0.35 + uTime * 0.02;
  vec3 holo = foilHue(phase);

  float band = sin(((vUv.x * 7.0 + vUv.y * 3.5) * uHoloBands + uLightUV.x * 4.0) * 3.14159);
  band = smoothstep(0.15, 0.85, band * 0.5 + 0.5);

  vec2 glitterUv = vUv * uResolution * 0.018;
  float g = fineGrain(glitterUv + floor(uLightUV * 3.0));
  float glitterThreshold = mix(0.985, 0.72, clamp(uGlitterDensity, 0.0, 1.0));
  float sparkleField = smoothstep(glitterThreshold, min(0.999, glitterThreshold + 0.08), g);
  float spark = sparkleField * pow(ndh, max(uGlitterSharpness, 4.0));
  spark *= spot;

  vec3 lighting =
    vec3(uAmbient) +
    vec3(1.0, 0.98, 0.95) * ndl * uKeyLight * spot * gritMask;
  vec3 frostCol = vec3(1.0, 0.99, 0.97) * frosted * uFrost * intensity *
    mix(0.08, 1.0, spot) * gritMask;
  vec3 foilCol =
    holo * (foilFlash * 0.85 * spot + frosted * 0.18 * spot + fres * 0.12) *
    (0.35 + 0.65 * band) * uFoil * intensity * revealed * gritMask;
  vec3 glitterCol = vec3(1.0, 0.98, 1.0) * spark * uGlitter * intensity * revealed;
  glitterCol += holo * spark * 0.38 * intensity * revealed;

  float dappleAmt = uDapple * intensity * 0.58 * revealed;
  float dapple = 1.0;
  if (dappleAmt > 0.001) {
    vec2 dappleUv = vUv * vec2(uResolution.x / uResolution.y, 1.0);
    float dappleBroad = fbm3(dappleUv * 3.2 + uLightUV * 0.35 + uTime * 0.012);
    float dappleDetail = fbm3(dappleUv * 6.0 - uLightUV * 0.18 - uTime * 0.008);
    float dappleField = dappleBroad * 0.72 + dappleDetail * 0.38;
    float dapplePatches = smoothstep(0.57, 0.76, dappleField);
    dapple = mix(1.0, 0.90 + 0.16 * dapplePatches, dappleAmt);
  }

  vec3 lit = albedo.rgb * lighting * dapple + frostCol + foilCol + glitterCol;
  lit = mix(lit, lit + foilCol * 0.15, clamp(length(foilCol) * 1.2, 0.0, 0.35));
  vec3 color = mix(albedo.rgb, lit, revealed);

  if (seam > 0.001) {
    color *= 1.0 - seam * uBurnShadow;
    vec3 seamTint = mix(vec3(1.0, 0.67, 0.25), vec3(1.0, 0.94, 0.68), innerSeam);
    color += seamTint * seam * uBurnGlow;
  }

  gl_FragColor = vec4(color, albedo.a);
}
`
