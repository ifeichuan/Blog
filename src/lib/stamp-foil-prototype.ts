// PROTOTYPE — 一次性代码，选定质感后重写。
//
// 一张铺满视口的共享 canvas 画所有邮票。票面美术（包括文字）先在 canvas 2D 里
// 排成一张图集，shader 再把它当 UV 印刷的墨层：alpha 进高度场 → 墨是凸起的，
// 金箔褶皱是低频大形，细喷砂是高频法线抖动，反射只在这两者的坡上出现。
// DOM 里的 <a> 只剩点击热区和读屏文本，位置由这里同步过去。

export type StampLook = {
  key: string;
  name: string;
  paper: [number, number, number];
  ink: [number, number, number];
  leafFreq: number;   // 喷砂颗粒的基准频率（越大颗越细）
  leafAmp: number;    // 颗粒深度。这是磨砂面，不是褶皱 —— 只能很浅，一大就成折纸
  grit: number;       // 中频砂粒强度（走法线，参与高光）
  fine: number;       // 细喷砂：逐像素加性颗粒，1 像素 1 颗，最细的那一档
  inkRelief: number;  // UV 印刷墨层的凸起量
  foil: number;
  foilHue: number;
  gloss: number;
  printFade: number;
  shadow: number;
  artColor: number;   // 0 = 图统一刷成墨色，1 = 完全用原图颜色
  dapReach: number;   // 斑驳光的作用半径（票短边的比例）
  dapAmt: number;     // 斑驳光强度
  dapFreq: number;    // 树冠频率（越大枝叶越碎）
  dapCut: number;     // 亮斑阈值（越大斑越少越散）
  tiltDeg: number;    // 悬停时避开光标的最大倾角
  defocus: number;    // 非焦点票的虚化强度
};

/** 面板要用的滑杆定义。key 必须和 StampLook 上的数值字段同名。 */
export const LOOK_CONTROLS: { key: keyof StampLook; label: string; min: number; max: number; step: number }[] = [
  // 上限一律给得比"合理值"宽很多 —— 面板是用来找手感的，越界的那一段
  // 本身就是信息：看清参数推到极端会坏成什么样，才知道往哪边收。
  { key: "leafFreq", label: "砂粒频率", min: 0.5, max: 120, step: 0.5 },
  { key: "leafAmp", label: "砂粒深度", min: 0, max: 1.2, step: 0.005 },
  { key: "grit", label: "砂粒强度", min: 0, max: 8, step: 0.02 },
  { key: "fine", label: "细砂颗粒", min: 0, max: 0.6, step: 0.002 },
  { key: "inkRelief", label: "墨层凸起", min: 0, max: 8, step: 0.02 },
  { key: "foil", label: "烫金量", min: 0, max: 8, step: 0.02 },
  { key: "foilHue", label: "烫金色相", min: 0, max: 1, step: 0.005 },
  { key: "gloss", label: "光泽", min: 0, max: 1, step: 0.005 },
  { key: "printFade", label: "墨色淡化", min: 0, max: 1, step: 0.005 },
  { key: "shadow", label: "阴影", min: 0, max: 4, step: 0.02 },
  { key: "artColor", label: "原图色", min: 0, max: 1, step: 0.005 },
  { key: "dapReach", label: "光斑范围", min: 0.02, max: 3, step: 0.01 },
  { key: "dapAmt", label: "光斑强度", min: 0, max: 4, step: 0.01 },
  { key: "dapFreq", label: "枝叶密度", min: 0.1, max: 40, step: 0.1 },
  { key: "dapCut", label: "枝叶阈值", min: 0.02, max: 0.98, step: 0.005 },
  { key: "tiltDeg", label: "倾斜角度", min: 0, max: 60, step: 0.5 },
  { key: "defocus", label: "背景虚化", min: 0, max: 4, step: 0.02 },
];

export const LOOKS: StampLook[] = [
  {
    key: "S1",
    name: "米纸细砂 · 金银粉",
    paper: [0.965, 0.961, 0.937],
    ink: [0.11, 0.11, 0.1],
    leafFreq: 9.0,
    leafAmp: 0.045,
    grit: 0.5,
    fine: 0.05,
    inkRelief: 0.5,
    foil: 1.0,
    foilHue: 0.02,
    gloss: 0.5,
    printFade: 0.12,
    shadow: 0.5,
    artColor: 1.0,
    dapReach: 0.34,
    dapAmt: 0.3,
    dapFreq: 3.4,
    dapCut: 0.6,
    tiltDeg: 7,
    defocus: 1.0,
  },
  {
    // 五彩斑斓的黑：票面本身是墨黑的，墨反过来是浅的，金只在褶皱上走
    key: "S2",
    name: "斑斓黑 · 强反射",
    paper: [0.078, 0.075, 0.07],
    ink: [0.86, 0.84, 0.78],
    leafFreq: 14.0,
    leafAmp: 0.03,
    grit: 0.78,
    fine: 0.06,
    inkRelief: 0.62,
    foil: 1.35,
    foilHue: 0.46,
    gloss: 0.86,
    printFade: 0.08,
    shadow: 0.95,
    artColor: 1.0,
    dapReach: 0.34,
    dapAmt: 0.42,
    dapFreq: 3.4,
    dapCut: 0.6,
    tiltDeg: 7,
    defocus: 1.0,
  },
  {
    key: "S3",
    name: "厚金箔 · 墨边烫金",
    paper: [0.976, 0.968, 0.941],
    ink: [0.1, 0.098, 0.088],
    leafFreq: 12.0,
    leafAmp: 0.055,
    grit: 0.62,
    fine: 0.055,
    inkRelief: 0.85,
    foil: 0.95,
    foilHue: 0.2,
    gloss: 0.62,
    printFade: 0.16,
    shadow: 0.42,
    artColor: 1.0,
    dapReach: 0.34,
    dapAmt: 0.3,
    dapFreq: 3.4,
    dapCut: 0.6,
    tiltDeg: 7,
    defocus: 1.0,
  },
];

export type StampItem = {
  /** 票面主图。原型阶段随便借了 public/ 里现成的图。 */
  src: string;
  /** 背景纹样，只是让每张票不一样 */
  pattern?: number;
};

export const VERT = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

// 每张票一个 vec4 存中心+尺寸，一个存旋转/悬停/图集槽位，一个存"飞到中央"的进度。
export const FRAG = `
precision highp float;

varying vec2 vUv;

uniform vec2  uRes;
uniform float uTime;
uniform vec2  uPointerPx;  // 光标，设备像素
uniform int   uCount;
uniform vec4  uRects[28];  // xy = 中心(px), zw = 尺寸(px)
uniform vec4  uMeta[28];   // x = 旋转(rad), y = hover, z = 图集列, w = 图集行
uniform vec4  uLift[28];   // x = 抬起进度 0..1, y = 随机种子, z = CSS 缩放, w = 备用
uniform vec4  uTilt[28];   // x = 绕 X 倾斜(rad), y = 绕 Y 倾斜(rad), z = 失焦 0..1, w = 备用
uniform sampler2D uAtlas;
uniform vec2  uAtlasGrid;

uniform vec3  uPaper;
uniform vec3  uInk;
uniform float uLeafFreq;
uniform float uLeafAmp;
uniform float uGrit;
uniform float uInkRelief;
uniform float uFoil;
uniform float uFoilHue;
uniform float uGloss;
uniform float uPrintFade;
uniform float uShadow;
uniform float uArtColor;
uniform float uFine;
uniform float uDapReach;
uniform float uDapAmt;
uniform float uDapFreq;
uniform float uDapCut;
uniform vec3  uBg;

const float TOOTH_R = 0.034;
const float TOOTH_PITCH = 0.1;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float sum = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 4; i++) {
    sum += amp * vnoise(p);
    p = rot * p * 2.03;
    amp *= 0.5;
  }
  return sum;
}

// 票面的微观起伏：喷砂面，不是褶皱。
//
// 之前这里是低频 fbm 当"箔的褶皱"，问题是低频 = 大起伏 = 折纸。喷砂面的定义
// 恰恰相反：宏观上完全平的，只有微米级的等向凹坑。所以这里只留高频，而且幅度
// 压到很低 —— 它的作用是把镜面反射打散成漫反射，不是造型。
// 一叠三层八度、频率翻倍，等向、无方向纹，任何一层都不足以在视觉上形成"面"。
// 频率必须停在采样率以内。之前这里是 uLeafFreq * 9/21/47，最高一层在票的本地
// 空间里周期只有 0.3 个设备像素 —— 亚像素的噪声每像素只采一个点，采出来的不是
// 细颗粒，是欠采样的莫尔斑。所以看起来反而更"粗"。真正的细腻要靠下面那条
// 逐像素 hash 的加性通道，那条锁在像素栅格上，不存在走样。
// 这一层只负责"面的起伏"，最高频到 3 像素一个周期就够了。
// 传进来的 p 已经是"设备像素"量纲（票的短边像素数乘过），所以下面的除数直接
// 就是颗粒周期的像素数。这是照 impasto 原型的 uv * uStamp 来的，好处有两个：
//  - 票放大时颗粒不变大，只变多 —— 喷砂面的物理事实，砂粒不会因为凑近看而膨胀
//  - 频率有了绝对标尺，可以确保最高那层停在 3 像素一个周期，不越过采样率
// uLeafFreq 现在是"细度倍率"：越大周期越短、颗越细。
float grain(vec2 p) {
  vec2 q = p * uLeafFreq * 0.08;
  float n = vnoise(q / 14.0);
  n += vnoise(q / 6.0) * 0.5;
  n += vnoise(q / 3.0) * 0.25;
  return n * 0.571;
}

// 叶隙光：参考 DappledLight.tsx 的做法 —— 两层 fbm 叠成树冠，
// 再用 smoothstep 阈值切出离散的亮斑。
// 阈值是关键：连续的 fbm 读起来是"云"，切过阈值才是"叶子缝里漏下来的光"。
// 频率给得高一点、阈值窗口窄一点，斑就更散、枝叶轮廓更清楚。
float canopy(vec2 p, float t) {
  vec2 driftA = vec2(t * 0.045, sin(t * 0.35) * 0.08);
  vec2 driftB = vec2(-t * 0.028, cos(t * 0.22) * 0.06);
  float a = fbm(p * uDapFreq + driftA);
  float b = fbm(p * uDapFreq * 1.94 + driftB);
  float m = a * 0.72 + b * 0.38;
  // 阈值窗口跟着阈值走，宽度固定：窗口一宽斑就化开成云
  float patches = smoothstep(uDapCut, uDapCut + 0.14, m);
  return pow(patches, 1.7);
}

// 单边一排齿孔，孔心落在边界线上
float toothRow(float along, float across, float span, float pitch, float r) {
  float count = max(floor(span / pitch), 3.0);
  float pp = span / count;
  float k = fract(along / pp) - 0.5;
  return length(vec2(k * pp, across)) - r;
}

// 邮票轮廓，等比空间（短边 = 1.0）里算，所以齿孔是圆的
// scale 参数让齿孔保持恒定物理大小：票放大时齿数变多，而不是每颗齿变大
float stampShape(vec2 p, vec2 half2, float scale) {
  vec2 q = p + half2;
  vec2 full = half2 * 2.0;
  float pitch = TOOTH_PITCH / scale;
  float r = TOOTH_R / scale;
  float body = min(min(q.x, full.x - q.x), min(q.y, full.y - q.y));
  float hole = 1e9;
  hole = min(hole, toothRow(q.x, q.y, full.x, pitch, r));
  hole = min(hole, toothRow(q.x, full.y - q.y, full.x, pitch, r));
  hole = min(hole, toothRow(q.y, q.x, full.y, pitch, r));
  hole = min(hole, toothRow(q.y, full.x - q.x, full.y, pitch, r));
  return min(body, hole);
}

// 烫金的色带：金 → 银 → 玫瑰 → 青 → 紫，一圈回到金
vec3 foilRamp(float t) {
  vec3 gold   = vec3(1.0, 0.78, 0.34);
  vec3 silver = vec3(0.88, 0.91, 0.96);
  vec3 rose   = vec3(1.0, 0.56, 0.46);
  vec3 cyan   = vec3(0.5, 0.88, 0.9);
  vec3 violet = vec3(0.7, 0.56, 0.95);
  // 金占一半带宽 —— 冷色是"泛"出来的，不是平分色环
  float u = fract(t);
  vec3 c = mix(gold, silver, smoothstep(0.42, 0.56, u));
  c = mix(c, rose,   smoothstep(0.56, 0.68, u));
  c = mix(c, cyan,   smoothstep(0.68, 0.8, u));
  c = mix(c, violet, smoothstep(0.8, 0.92, u));
  return mix(c, gold, smoothstep(0.92, 1.0, u));
}

// 把屏幕上的点反投影回一块倾斜的票面。
// 票是刚性平面，绕 X/Y 各转过一点角度：靠观者的那一边在屏幕上会变大、齿孔会拉开，
// 远的那一边收窄。这个透视差才是"3D"，单给整张票加 skew 的话看起来还是一张平的纸。
// 正投影没有闭式逆解，所以按 z 迭代几次 —— 角度很小，三次就收敛到看不出误差。
vec2 unproject(vec2 p, vec2 tilt) {
  float sx = sin(tilt.y);          // 绕 Y 转 → 左右两侧的深度差
  float sy = sin(tilt.x);          // 绕 X 转 → 上下两侧的深度差
  float cx = max(cos(tilt.y), 0.25);
  float cy = max(cos(tilt.x), 0.25);
  float invd = 0.62;               // 视距倒数，越大透视越猛
  vec2 q = p;
  for (int k = 0; k < 3; k++) {
    float z = q.x * sx - q.y * sy;
    float w = 1.0 - z * invd;
    q = vec2(p.x * w / cx, p.y * w / cy);
  }
  return q;
}

// 金银粉：撒在纸上的细箔片。每个格子一片，随机朝向，只有朝向对了才亮。
// 这是"粉"和"箔"的区别 —— 箔是成片的走向，粉是离散的点，各自闪各自的。
vec3 powder(vec2 p, vec2 sweep, float lit01) {
  float cell = 320.0;
  vec2 id = floor(p * cell);
  vec2 f = fract(p * cell) - 0.5;
  float h1 = hash(id);
  float h2 = hash(id + 37.0);
  // 只有一小部分格子里真的有一片粉
  if (h1 > 0.09) return vec3(0.0);
  // 片子随机朝向，和扫光方向对上才反光
  float a = h2 * 6.283;
  float align = dot(vec2(cos(a), sin(a)), sweep);
  float face = pow(max(align, 0.0), 6.0);
  // 片子本身很小，边缘要软，否则是马赛克
  float shape = 1.0 - smoothstep(0.12, 0.42, length(f));
  // 一半金一半银
  vec3 tint = h2 < 0.5 ? vec3(1.0, 0.82, 0.42) : vec3(0.92, 0.95, 1.0);
  return tint * shape * face * (0.4 + 0.6 * lit01);
}

// 一张票的着色。p 是以票心为原点、按短边归一化并已反旋转的坐标。
// lp = 光标在这张票本地空间里的位置（和 p 同一坐标系）。斑驳光和箔的走向都由它驱动。
vec4 shadeStamp(vec2 p, vec2 half2, vec2 slot, float hover, float lift, float seed, float scale, vec2 lp, float blurAmt, float sPx) {
  float sd = stampShape(p, half2, scale);
  // 失焦的票边缘要散开 —— 焦外的轮廓没有硬边，这是"虚"最直接的读法
  float aa = 0.006 / scale + blurAmt * 0.06;
  float inside = smoothstep(-aa, aa, sd);
  if (inside <= 0.001) return vec4(0.0);

  vec2 uv = (p + half2) / (half2 * 2.0);

  // ── 墨层：整张票面美术来自图集 ──────────────────────
  // 图集是 6×6 非二次幂，没法生 mipmap，所以失焦用几个抽样点自己糊。
  // 五点（中心 + 四个对角）在这个半径下够了 —— 焦外只需要"没有边"，
  // 不需要真正的高斯核。
  vec2 cell = vec2(1.0) / uAtlasGrid;
  vec2 auv = (slot + clamp(uv, 0.0, 1.0)) * cell;
  vec4 art = texture2D(uAtlas, auv);
  if (blurAmt > 0.01) {
    float r = blurAmt * 0.03;
    vec2 d1 = vec2(r, r) * cell;
    vec2 d2 = vec2(r, -r) * cell;
    art = (art
      + texture2D(uAtlas, auv + d1) + texture2D(uAtlas, auv - d1)
      + texture2D(uAtlas, auv + d2) + texture2D(uAtlas, auv - d2)) * 0.2;
  }

  // ── 高度场 = 喷砂面 + UV 印刷墨层 ──────────────────────
  // 砂纹坐标用设备像素，不是归一化坐标。之前是 p / scale，那样票放大时颗粒
  // 跟着一起放大 —— 凑近看砂粒会膨胀，读起来是"贴图拉伸了"。喷砂面的物理
  // 事实相反：砂粒是固定物理尺寸的，票放大只是看到更多颗。
  vec2 tp = p * sPx + vec2(seed * 311.0, seed * 173.0);
  // 归一化那套坐标还留着：斑驳光和金银粉都是"跟着票走"的大尺度图案，
  // 它们该跟着票一起缩放，和砂粒相反
  vec2 np = p / scale + vec2(seed * 7.3, seed * 3.1);
  // 差分步长 = 1 个设备像素。跟采样栅格对齐，差出来的才是真梯度；
  // 之前步长比噪声周期还大，两个不相关点相减，"梯度"其实是纯随机。
  float ep = 1.0;
  float hl  = grain(tp) * uLeafAmp;
  float hlx = grain(tp + vec2(ep, 0.0)) * uLeafAmp;
  float hly = grain(tp + vec2(0.0, ep)) * uLeafAmp;

  // 中频砂粒：还走法线，因为它要参与高光。周期锁在 3 像素 ——
  // 这是走法线通道的下限，比这更细的那一档交给下面 uFine 那条加性通道。
  float gf = uLeafFreq * 0.08 / 3.0;
  float g  = vnoise(tp * gf);
  float gx = vnoise((tp + vec2(ep, 0.0)) * gf);
  float gy = vnoise((tp + vec2(0.0, ep)) * gf);

  // 图集那边还在归一化的 uv 空间里，差分步长是另一套
  float e = 0.0035;

  // UV 印刷：墨的 alpha 直接是凸起，所以字和图是"摸得到"的
  float ia  = art.a;
  float iax = texture2D(uAtlas, (slot + clamp(uv + vec2(e, 0.0), 0.0, 1.0)) * cell).a;
  float iay = texture2D(uAtlas, (slot + clamp(uv + vec2(0.0, e), 0.0, 1.0)) * cell).a;

  // 两套法线：粗糙的那套（含喷砂）管高光，平滑的那套（只有箔纹+墨边）管金。
  // 混在一起的话喷砂会把金打成散沙 —— 噪点级的法线让金的走向每像素翻转。
  // 砂纹的梯度按像素步长算，尺度和归一化空间差了 sPx 倍，所以系数要乘回来
  vec2 gFoil =
    vec2(hl - hlx, hl - hly) / ep * sPx * 0.5 +
    vec2(ia - iax, ia - iay) / e * 0.04 * uInkRelief;
  vec3 nFoil = normalize(vec3(gFoil * (1.0 - blurAmt), 1.0));

  // 焦外的高频要一起收掉：糊掉的票上还留着清晰的砂粒会读成贴图坏了，而不是虚焦
  float sharp = 1.0 - blurAmt;
  vec2 grad = (gFoil + vec2(g - gx, g - gy) / ep * sPx * 0.012 * uGrit) * sharp;
  vec3 nrm = normalize(vec3(grad, 1.0));

  // ── 基色：纸 + 压进纸里的墨 ─────────────────────────
  vec3 paper = uPaper * (0.97 + 0.03 * clamp(hl / max(uLeafAmp, 0.001), 0.0, 1.0));
  // 墨色来自 look，不是图集 —— 图集只出黑+alpha，所以纸变深时墨要能反过来变浅。
  // （之前直接用 art.rgb 当墨色，纸一深字就整片糊掉了。）
  // 图集现在存的是原图颜色（预乘过），uArtColor 决定用原色还是统一刷成墨色。
  // 需要预乘是因为透明处的 rgb 无意义，直接采样会把黑渗进边缘。
  vec3 artCol = art.a > 0.004 ? art.rgb / art.a : uInk;
  vec3 printed = mix(uInk, paper, uPrintFade);
  vec3 colored = mix(artCol, paper, uPrintFade * 0.35);
  vec3 print = mix(printed, colored, uArtColor);
  vec3 face = mix(paper, print, ia * 0.94);

  // ── 光照 ──────────────────────────────────────────
  // 光源挂在光标上，悬在票面上方一点。默认（没悬停）退回一个固定斜向，
  // 否则鼠标不在票上时整片票会没有主光方向。
  vec3 rest = normalize(vec3(-0.4, 0.56, 0.72));
  vec3 toCursor = normalize(vec3(lp - p, 0.62));
  vec3 lightDir = normalize(mix(rest, toCursor, hover * 0.85));

  // 喷砂面是漫反射为主：镜面高光被微观凹坑打散，所以 diffuse 的权重要高，
  // specular 收得很窄。这是"磨砂"和"抛光"的分界，不靠调亮度调出来。
  // 俯视时视线是斜的（票躺在桌上），抬到中央后变成正对着看
  vec3 viewDir = normalize(vec3(p * mix(0.34, 0.1, lift), 1.0));
  vec3 halfDir = normalize(lightDir + viewDir);
  float diff = max(dot(nrm, lightDir), 0.0);
  float spec = pow(max(dot(nrm, halfDir), 0.0), mix(20.0, 70.0, uGloss)) * (0.1 + 0.4 * uGloss);

  // 斑驳光：不是一个圆形光晕，是树冠漏下来的一撮碎斑。
  // 作用范围只有票的三分之一 —— 之前给到整张票宽，鼠标一进来整片就亮了，
  // 光斑得比票小很多才读得出"一束光扫过去"，而不是"卡片被点亮了"。
  float reach = 1.0 - smoothstep(uDapReach * 0.15, uDapReach, length(lp - p));
  // 斑本身跟着光标平移，所以碎斑是"跟手走的一片"，不是钉在票面上的贴图
  // 斑驳光是大尺度的，用归一化坐标（tp 已经换成像素量纲了，不能拿来用）
  float dap = canopy(np * 1.6 - lp * 1.2, uTime) * reach * hover;

  vec3 lit = face * (0.97 + 0.16 * diff + uDapAmt * dap) + spec * (0.55 + 0.45 * max(hover, lift));

  // ── 烫金：只在坡上。墨边坡最陡，所以金天然沿着字走 ────
  float slope = length(nFoil.xy);
  // 扫光方向 = 从当前像素指向光标。所以亮箔是绕着光标转的，而不是整片一起偏 ——
  // 一张票上不同位置看到的金不一样，这才是"光在票面上走"。
  vec2 toL = lp - p;
  vec2 sweepDir = normalize(mix(vec2(0.6, -0.8), toL / max(length(toL), 0.05), hover * 0.9));
  float aniso = dot(nFoil.xy / max(slope, 0.001), sweepDir);

  // 金箔是各向异性的：只有朝向光的那一侧坡面反光，背光的坡是暗的。
  // 这一步把"整片淡晕"收成几道有走向的亮箔。
  // 不再用阈值把纸切成"是金/不是金"两块 —— 任何硬阈值乘在噪声坡度上都会
  // 变成斑块蒙版（荧光迷彩就是这么来的）。箔是满贴的一层，看起来有金有纸，
  // 是因为各处反射强度不同。所以这里算的是连续的反射强度，不是覆盖蒙版。
  // slope 的映射不能饱和：一饱和就到处是 1.0，看到的就是噪声的原始形状（树皮纹）。
  // 用 s/(s+k) 这种软饱和，坡再陡也只是逼近 1，中间段还有层次。
  float sr = slope / (slope + 0.35);
  float ridge = sr * (0.3 + 0.7 * (aniso * 0.5 + 0.5));
  // 窄高光：只有法线几乎正对扫光方向的那一小撮才打眼
  float glint = pow(max(aniso, 0.0), 10.0) * sr;

  // 色带只走一小段：一张票有一个主色调，坡度只让它在附近偏一点。
  // 扫过整圈的话每张票都是花的 —— 真的烫金是一整片金里泛出一点冷色。
  float band = uFoilHue + seed * 0.11 + aniso * 0.06 + (p.x - p.y) * 0.03 + uTime * 0.008;
  vec3 foilCol = foilRamp(band);
  float boost = 0.62 + 0.38 * max(hover, lift);
  // "墨边烫金"是沿着墨的轮廓走一圈金，不是把金填进字里。
  // 判据用墨的梯度而不是墨的浓度：实心处梯度为 0 → 保持干净的黑，
  // 只有笔画边缘那一两个像素梯度大 → 那圈才吃金。
  float inkEdge = smoothstep(0.25, 1.4, length(vec2(ia - iax, ia - iay)) / e);
  float solid = smoothstep(0.15, 0.6, ia);
  float bare = max(1.0 - solid, inkEdge * 0.9);
  // 覆盖率是常量（箔满贴），亮度交给上面的 ridge —— 两者混在一起就成蒙版了
  float amount = clamp(uFoil * 0.3, 0.0, 1.0) * bare * boost;

  // 关键：金是"替换"掉纸，不是"加"在纸上。
  // 之前一直用 lit += foil，纸本来就接近白，加什么都只能变更白 —— 那是发光，
  // 不是金属。金属的样子来自它自己的明暗范围：暗处是深赭，亮处才是亮金。
  // 金属和纸的区别不在色相，在明度跨度：金属的暗部比纸暗得多，亮部又过曝。
  // 但这个跨度必须由连续的 ridge 驱动，不能由阈值切出来。
  // 虚焦时把反射强度收向中间值，不是收向 0。
  // 上面为了消掉高频把法线压平了，副作用是 slope→0、ridge→0，金整片掉进暗赭 ——
  // 那读起来是"票变脏了"，不是"票在焦外"。模糊做的是求平均：方差消失，均值不变。
  float lit01 = mix(clamp(ridge, 0.0, 1.0), 0.52, blurAmt);
  vec3 metal = mix(foilCol * 0.2, foilCol * 0.98, lit01);
  metal += foilCol * glint * 0.9;   // 打眼的高光点
  lit = mix(lit, metal, amount);

  // 金银粉撒在最上层。这个尺度上"闪"应该来自离散的箔片，而不是连续纹理 ——
  // 连续纹理放到这么细只会变成毛毡/布纹，粉才是抢眼的那一下。
  // 粉是离散的点，虚焦时必须整个关掉 —— 点是最抗模糊的东西，留一点都会破坏景深
  lit += powder(np, sweepDir, lit01) * uFoil * boost * 2.6 * sharp * sharp;

  // ── 细喷砂：逐像素加性噪声 ──────────────────────────
  // 这条是"颗粒细腻"的真正来源，参考 impasto 原型里的 col += hash1(uv*uStamp)。
  // 关键有两点：
  //  1. 走颜色，不走法线。法线通道要先差分再做光照，任何一步的非线性都会把
  //     单像素的噪声放大成团；加在颜色上是纯线性的，一颗就是一颗。
  //  2. 频率锁在票的设备像素栅格上（p * sPx），不是任意频率。1 像素恰好 1 颗 ——
  //     这是"最细"的物理上限，再往上就是走样，反而变粗。
  // 也正因为锁在像素上，票放大时颗粒不跟着变大，而是变多，就像真的纸纤维。
  float fine = hash(floor(p * sPx) + seed * 131.0) - 0.5;
  // 金属面上砂粒更明显（镜面被凹坑打断），纸面上要收着
  lit += fine * uFine * (0.6 + 0.9 * amount) * sharp;

  // 切口一圈纸白
  // 切边一圈：纸被切开露出的纤维总是比票面亮一档，深色票上这圈尤其明显
  vec3 rim = mix(uPaper, vec3(1.0), 0.18);
  lit = mix(lit, rim, (1.0 - smoothstep(0.0, 0.014 / scale, sd)) * 0.45);
  lit *= 1.0 + max(hover, lift) * 0.06;

  return vec4(lit, inside);
}

void main() {
  vec2 frag = vec2(vUv.x, 1.0 - vUv.y) * uRes;
  vec3 col = uBg;

  for (int i = 0; i < 28; i++) {
    if (i >= uCount) break;
    vec4 rect = uRects[i];
    if (rect.z <= 0.0) continue;
    vec4 meta = uMeta[i];
    vec4 lft = uLift[i];
    vec2 tilt = uTilt[i].xy;

    float s = min(rect.z, rect.w);
    vec2 half2 = vec2(rect.z, rect.w) / s * 0.5;
    float rot = meta.x;
    float hover = meta.y;
    float lift = lft.x;

    // 反旋转到票的本地空间
    vec2 d = (frag - rect.xy) / s;
    float c = cos(-rot), sn = sin(-rot);
    vec2 pFlat = vec2(d.x * c - d.y * sn, d.x * sn + d.y * c);

    // 粗剔除在倾斜前做，包围盒放宽一点容纳透视变大的那一侧
    if (abs(pFlat.x) > half2.x + 0.6 || abs(pFlat.y) > half2.y + 0.6) continue;

    // 反投影到倾斜平面上：票面上的一切（齿孔、图、箔纹）都跟着透视走
    vec2 p = unproject(pFlat, tilt);

    // 光标也要落到同一个本地空间里，斑驳光才跟得准
    vec2 dc = (uPointerPx - rect.xy) / s;
    vec2 lp = unproject(vec2(dc.x * c - dc.y * sn, dc.x * sn + dc.y * c), tilt);

    // 投影：抬起时偏移更远、更散，形成"浮起来"的高度感
    // 影子落在桌面上，所以用未倾斜的轮廓 —— 倾斜是票离开桌面那一侧的事
    float h = 0.014 + (hover * 0.02) + lift * 0.09;
    vec2 sp = pFlat - vec2(-h * 0.7, h) / max(0.6, 1.0);
    float ssd = stampShape(sp, half2, lft.z);
    float defocus = uTilt[i].z;
    float blur = 0.022 + hover * 0.03 + lift * 0.1 + defocus * 0.08;
    float sm = smoothstep(-blur, blur, ssd);
    float amount = 0.3 * uShadow * (1.0 + hover * 0.5 + lift * 0.9) * (1.0 - defocus * 0.55);
    col = mix(col, col * (1.0 - amount), sm * 0.92);

    vec4 st = shadeStamp(p, half2, vec2(meta.z, meta.w), hover, lift, lft.y, lft.z, lp, defocus, s);
    col = mix(col, st.rgb, st.a);
  }

  gl_FragColor = vec4(col, 1.0);
}
`;

const MAX_STAMPS = 28;
const ATLAS_GRID = 6;
const ATLAS_CELL = 256;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "sync";
    // 外链图必须带 CORS：不带的话画进 canvas 会污染它，texImage2D 直接抛安全错误，
    // 整个图集连带九张票一起没了。加载失败就当没这张图，票面只剩底纹。
    if (/^https?:/i.test(src)) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * 把图缩到目标尺寸，保留原色。
 * canvas 2D 的合成结果本来就是预乘的，shader 端除回 alpha 取原色 ——
 * 不预乘的话双线性采样会把透明像素的黑渗到轮廓外，图周围一圈脏边。
 * alpha 仍然兼任 UV 印刷的高度场，所以彩图的轮廓照样是凸起的、边上吃金。
 */
function fitImage(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  c.imageSmoothingQuality = "high";
  c.drawImage(img, 0, 0, w, h);
  return cv;
}

/** 雕刻底纹：同心车花。真邮票的底纹就是这种连续细线，也给箔提供走向。 */
function guilloche(ctx: CanvasRenderingContext2D, C: number, kind: number) {
  ctx.save();
  ctx.translate(C * 0.5, C * 0.5);
  ctx.strokeStyle = "#000";
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = C * 0.0045;
  const petals = 5 + (kind % 4);
  for (let ring = 0; ring < 14; ring++) {
    const base = C * (0.1 + ring * 0.021);
    ctx.beginPath();
    for (let a = 0; a <= 180; a++) {
      const t = (a / 180) * Math.PI * 2;
      const r = base * (1 + 0.075 * Math.sin(t * petals + ring * 0.42));
      const x = Math.cos(t) * r;
      const y = Math.sin(t) * r;
      if (a === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * 票面 = 雕刻底纹 + 一张主图，没有任何文字。
 * 只出黑墨 + alpha，颜色和浮雕都由 shader 决定 —— 墨的 alpha 直接当
 * UV 印刷的高度场，所以图的轮廓天然是凸起的、边上会吃到金。
 */
export async function buildAtlas(items: StampItem[]): Promise<HTMLCanvasElement> {
  const size = ATLAS_GRID * ATLAS_CELL;
  const cv = document.createElement("canvas");
  cv.width = size;
  cv.height = size;
  const ctx = cv.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);

  const imgs = await Promise.all(items.map((it) => loadImage(it.src)));

  items.forEach((item, i) => {
    if (i >= ATLAS_GRID * ATLAS_GRID) return;
    const ox = (i % ATLAS_GRID) * ATLAS_CELL;
    const oy = Math.floor(i / ATLAS_GRID) * ATLAS_CELL;
    const C = ATLAS_CELL;

    ctx.save();
    ctx.beginPath();
    ctx.rect(ox, oy, C, C);
    ctx.clip();
    ctx.translate(ox, oy);

    guilloche(ctx, C, item.pattern ?? i);

    // 内框：一圈细线，把图框住，也是一道明确的墨边给金走
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = C * 0.008;
    ctx.strokeRect(C * 0.11, C * 0.11, C * 0.78, C * 0.78);

    const img = imgs[i];
    if (img) {
      // 等比塞进内框，留一点边距
      const box = C * 0.56;
      const ar = img.naturalWidth / Math.max(img.naturalHeight, 1);
      const w = ar >= 1 ? box : box * ar;
      const h = ar >= 1 ? box / ar : box;
      ctx.globalAlpha = 1.0;
      ctx.drawImage(fitImage(img, Math.round(w * 2), Math.round(h * 2)), (C - w) / 2, (C - h) / 2, w, h);
    }

    ctx.restore();
  });

  return cv;
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(sh) ?? "shader compile failed");
  }
  return sh;
}

export type StampRenderer = {
  setLook: (look: StampLook) => void;
  destroy: () => void;
};

export function mountStampField(
  canvas: HTMLCanvasElement,
  getTargets: () => HTMLElement[],
  atlas: HTMLCanvasElement,
  initialLook: StampLook,
  bg: [number, number, number]
): StampRenderer {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
  if (!gl) throw new Error("no webgl");

  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(prog) ?? "link failed");
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, atlas);
  gl.uniform1i(gl.getUniformLocation(prog, "uAtlas"), 0);
  gl.uniform2f(gl.getUniformLocation(prog, "uAtlasGrid"), ATLAS_GRID, ATLAS_GRID);
  gl.uniform3f(gl.getUniformLocation(prog, "uBg"), bg[0], bg[1], bg[2]);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U("uRes");
  const uTime = U("uTime");
  const uPointerPx = U("uPointerPx");
  const uCount = U("uCount");
  const uRects = U("uRects");
  const uMeta = U("uMeta");
  const uLift = U("uLift");
  const uTilt = U("uTilt");

  let look = initialLook;
  const applyLook = () => {
    gl.uniform3f(U("uPaper"), look.paper[0], look.paper[1], look.paper[2]);
    gl.uniform3f(U("uInk"), look.ink[0], look.ink[1], look.ink[2]);
    gl.uniform1f(U("uLeafFreq"), look.leafFreq);
    gl.uniform1f(U("uLeafAmp"), look.leafAmp);
    gl.uniform1f(U("uGrit"), look.grit);
    gl.uniform1f(U("uFine"), look.fine);
    gl.uniform1f(U("uInkRelief"), look.inkRelief);
    gl.uniform1f(U("uFoil"), look.foil);
    gl.uniform1f(U("uFoilHue"), look.foilHue);
    gl.uniform1f(U("uGloss"), look.gloss);
    gl.uniform1f(U("uPrintFade"), look.printFade);
    gl.uniform1f(U("uShadow"), look.shadow);
    gl.uniform1f(U("uArtColor"), look.artColor);
    gl.uniform1f(U("uDapReach"), look.dapReach);
    gl.uniform1f(U("uDapAmt"), look.dapAmt);
    gl.uniform1f(U("uDapFreq"), look.dapFreq);
    gl.uniform1f(U("uDapCut"), look.dapCut);
  };
  applyLook();

  const rects = new Float32Array(MAX_STAMPS * 4);
  const meta = new Float32Array(MAX_STAMPS * 4);
  const lift = new Float32Array(MAX_STAMPS * 4);
  const tilt = new Float32Array(MAX_STAMPS * 4);
  const hovers = new Float32Array(MAX_STAMPS);
  const lifts = new Float32Array(MAX_STAMPS);
  // 倾斜是低通跟随的，所以状态要留到下一帧；按 slot 存，不按绘制顺序
  const tiltX = new Float32Array(MAX_STAMPS);
  const tiltY = new Float32Array(MAX_STAMPS);
  // 失焦：有票被悬停/选中时，其余的票虚化。只糊不压暗。
  const blurs = new Float32Array(MAX_STAMPS);
  const pointer = { x: -9999, y: -9999 };

  let dpr = 1;
  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height);
  };
  resize();

  const onMove = (e: PointerEvent) => {
    pointer.x = e.clientX * dpr;
    pointer.y = e.clientY * dpr;
  };
  const onLeave = () => {
    pointer.x = -9999;
    pointer.y = -9999;
  };
  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerleave", onLeave);
  window.addEventListener("resize", resize);

  // 记一次未放大的宽度，之后 rect 宽度 / 它就是当前 CSS scale
  const measureBase = () => {
    getTargets().forEach((el) => {
      if (el.dataset.lifted === "true") return;
      el.dataset.baseW = String(el.getBoundingClientRect().width);
    });
  };
  measureBase();
  window.addEventListener("resize", measureBase);

  let raf = 0;
  const t0 = performance.now();
  // 谁在焦点上，上一帧算出来的。差一帧无所谓 —— 失焦本身是插值过去的，
  // 这样就不用为了先知道焦点而把循环拆成两趟。
  let focusSlot = -1;
  let focusStrength = 0;

  // shader 按数组顺序叠画，所以绘制顺序就是 z 序：抬起的票必须排到最后，
  // 否则它放大了却还是被后面那些小票盖住。
  const zOf = (el: HTMLElement) => {
    if (el.dataset.lifted === "true") return 1000;
    if (el.dataset.hot === "true") return 500;
    return Number(el.style.zIndex || 0);
  };

  const frame = () => {
    const targets = getTargets()
      .slice(0, MAX_STAMPS)
      .sort((a, b) => zOf(a) - zOf(b));
    rects.fill(0);
    meta.fill(0);
    lift.fill(0);
    tilt.fill(0);
    let nextFocus = -1;
    let nextStrength = 0;
    // DOM 那层模糊按"是选中还是只是悬停"分档，不看强度数值 ——
    // 强度可以被面板调到 0，那时两档会撞在一起
    let nextMode: "none" | "hover" | "lift" = "none";

    // 先裁决命中者，再进主循环。票是散乱叠放的，重合处必须只有最上面那张响应，
    // 否则悬停会穿透 —— 一次悬停同时点亮两张，倾斜和光斑都会打架。
    // targets 已按 z 序升序排过，所以从后往前第一个几何命中的就是最上层。
    let topHot: HTMLElement | null = null;
    for (let i = targets.length - 1; i >= 0; i--) {
      const el = targets[i];
      const r = el.getBoundingClientRect();
      const rot = (Number(el.dataset.rot ?? 0) * Math.PI) / 180;
      const dx = pointer.x - (r.left + r.width / 2) * dpr;
      const dy = pointer.y - (r.top + r.height / 2) * dpr;
      const c = Math.cos(-rot);
      const s = Math.sin(-rot);
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      if (Math.abs(lx) <= r.width * dpr * 0.5 && Math.abs(ly) <= r.height * dpr * 0.5) {
        topHot = el;
        break;
      }
    }

    targets.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      // DOM 元素本身不旋转（旋转会让 rect 变大），角度单独传给 shader
      rects[i * 4 + 0] = (r.left + r.width / 2) * dpr;
      rects[i * 4 + 1] = (r.top + r.height / 2) * dpr;
      rects[i * 4 + 2] = r.width * dpr;
      rects[i * 4 + 3] = r.height * dpr;

      // 插值状态存在元素上，不能存数组下标 —— 绘制顺序每帧会变
      const slotKey = Number(el.dataset.slot ?? i);
      const isLifted = el.dataset.lifted === "true";
      lifts[slotKey] += ((isLifted ? 1 : 0) - lifts[slotKey]) * 0.12;

      // 命中测试也要反旋转，否则悬停区和视觉不对位
      const rot = (Number(el.dataset.rot ?? 0) * Math.PI) / 180;
      const dx = pointer.x - rects[i * 4 + 0];
      const dy = pointer.y - rects[i * 4 + 1];
      const c = Math.cos(-rot);
      const s = Math.sin(-rot);
      const lx = dx * c - dy * s;
      const ly = dx * s + dy * c;
      const hw = r.width * dpr * 0.5;
      const hh = r.height * dpr * 0.5;
      // 命中判定不能只看几何：票是叠着的，两张重合处会同时"在票内"，
      // 悬停就穿透到下面那张。所以只有最上层的那一张算命中（topHot 是上面预判的）。
      const hot = el === topHot;
      hovers[slotKey] += ((hot ? 1 : 0) - hovers[slotKey]) * 0.14;
      el.dataset.hot = hot ? "true" : "false";

      // 避开光标的倾斜：光标在票内的归一化位置直接当角度，符号取正 = 那一侧远离观者。
      // 抬到中央后归零 —— 平视的票不该还在歪。
      const nx = hot ? Math.max(-1, Math.min(1, lx / hw)) : 0;
      const ny = hot ? Math.max(-1, Math.min(1, ly / hh)) : 0;
      const k = 1 - lifts[slotKey];
      // 避开光标：光标那一侧压下去。角度从 look 来，面板可以现调
      const tiltMax = (look.tiltDeg * Math.PI) / 180;
      const wantY = nx * tiltMax * k;
      const wantX = -ny * tiltMax * k;
      tiltY[slotKey] += (wantY - tiltY[slotKey]) * 0.14;
      tiltX[slotKey] += (wantX - tiltX[slotKey]) * 0.14;
      tilt[i * 4 + 0] = tiltX[slotKey];
      tilt[i * 4 + 1] = tiltY[slotKey];

      // 焦点票自己永远是清晰的，其余按当前焦点强度虚化
      const want = slotKey === focusSlot ? 0 : focusStrength;
      blurs[slotKey] += (want - blurs[slotKey]) * 0.1;
      tilt[i * 4 + 2] = blurs[slotKey];

      if (isLifted || hot) {
        nextFocus = slotKey;
        // 选中比悬停更"独占"：悬停只是轻轻推开背景，选中是真的清场
        nextStrength = Math.max(nextStrength, look.defocus * (isLifted ? 1 : 0.55));
        if (isLifted) nextMode = "lift";
        else if (nextMode !== "lift") nextMode = "hover";
      }

      // 抬起时旋转回正，就是"落下的票飞到中央变成平视"
      meta[i * 4 + 0] = rot * (1 - lifts[slotKey]);
      meta[i * 4 + 1] = hovers[slotKey];
      meta[i * 4 + 2] = slotKey % ATLAS_GRID;
      meta[i * 4 + 3] = Math.floor(slotKey / ATLAS_GRID);

      lift[i * 4 + 0] = lifts[slotKey];
      lift[i * 4 + 1] = Number(el.dataset.seed ?? i);
      // CSS scale 已经反映在 rect 里，用基准宽度反推倍率给 shader
      lift[i * 4 + 2] = r.width / Number(el.dataset.baseW || r.width);
    });

    focusSlot = nextFocus;
    // 强度插值，焦点归属瞬时切换 —— 在两张票之间移动时不该有"全体回焦"的闪烁
    focusStrength += (nextStrength - focusStrength) * 0.14;
    // 台面是纯色，糊它没有意义；真正要虚化的是页面上的 DOM 文字。
    // canvas 管票，CSS 管 DOM，这里只负责把焦点状态说出去。
    if (document.body.dataset.stampFocus !== nextMode) document.body.dataset.stampFocus = nextMode;

    gl.uniform1f(uTime, (performance.now() - t0) / 1000);
    gl.uniform2f(uPointerPx, pointer.x, pointer.y);
    gl.uniform1i(uCount, targets.length);
    gl.uniform4fv(uRects, rects);
    gl.uniform4fv(uMeta, meta);
    gl.uniform4fv(uLift, lift);
    gl.uniform4fv(uTilt, tilt);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  return {
    setLook(next) {
      look = next;
      applyLook();
    },
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("resize", resize);
    },
  };
}
