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
  leafFreq: number;   // 金箔褶皱的等值线密度
  leafAmp: number;    // 褶皱起伏（要浅，大褶皱会变蜥蜴皮）
  grit: number;       // 细喷砂强度
  inkRelief: number;  // UV 印刷墨层的凸起量
  foil: number;
  foilHue: number;
  gloss: number;
  printFade: number;
  shadow: number;
};

export const LOOKS: StampLook[] = [
  {
    key: "S1",
    name: "米纸细砂 · 金银粉",
    paper: [0.965, 0.961, 0.937],
    ink: [0.11, 0.11, 0.1],
    leafFreq: 11.0,
    leafAmp: 0.13,
    grit: 0.5,
    inkRelief: 0.5,
    foil: 1.0,
    foilHue: 0.02,
    gloss: 0.5,
    printFade: 0.12,
    shadow: 0.5,
  },
  {
    // 五彩斑斓的黑：票面本身是墨黑的，墨反过来是浅的，金只在褶皱上走
    key: "S2",
    name: "斑斓黑 · 强反射",
    paper: [0.078, 0.075, 0.07],
    ink: [0.86, 0.84, 0.78],
    leafFreq: 16.0,
    leafAmp: 0.07,
    grit: 0.78,
    inkRelief: 0.62,
    foil: 1.35,
    foilHue: 0.46,
    gloss: 0.86,
    printFade: 0.08,
    shadow: 0.95,
  },
  {
    key: "S3",
    name: "厚金箔 · 墨边烫金",
    paper: [0.976, 0.968, 0.941],
    ink: [0.1, 0.098, 0.088],
    leafFreq: 18.0,
    leafAmp: 0.2,
    grit: 0.62,
    inkRelief: 0.85,
    foil: 0.95,
    foilHue: 0.2,
    gloss: 0.62,
    printFade: 0.16,
    shadow: 0.42,
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
uniform vec4  uTilt[28];   // x = 绕 X 倾斜(rad), y = 绕 Y 倾斜(rad), zw = 备用
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

// 金箔的褶皱：低频等值线，大而缓 —— 金叶画的箔纹是成片的走向，不是密集鳞片
// 金箔的起伏：平滑、有方向的缓坡。
// 之前用 1 - abs(sin(...)) 折等值线，那个函数在脊线处不可导，梯度一放大就
// 变成高对比碎斑（迷彩），怎么调倍数都救不回来。这里直接用被拉伸过的 fbm，
// 到处可导，坡是缓的，金才能连成一片而不是碎点。
float leaf(vec2 p, float t) {
  // 不做各向异性拉伸 —— 这个细度下方向纹会读成毛毡/布纹。
  // 箔的"走向"交给低频那一层，细节层保持等向。
  float n = fbm(p * uLeafFreq + vec2(t * 0.012, -t * 0.008));
  // 一层很低频的大形，负责整片箔的明暗走向。
  // 权重要小 —— 大形一重，深底上就读成苔藓/矿石斑，谈不上 delicate。
  n += fbm(p * uLeafFreq * 0.18 + 4.0) * 0.5;
  return n;
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
vec4 shadeStamp(vec2 p, vec2 half2, vec2 slot, float hover, float lift, float seed, float scale, vec2 lp) {
  float sd = stampShape(p, half2, scale);
  float aa = 0.006 / scale;
  float inside = smoothstep(-aa, aa, sd);
  if (inside <= 0.001) return vec4(0.0);

  vec2 uv = (p + half2) / (half2 * 2.0);

  // ── 墨层：整张票面美术（含文字）来自图集 ──────────────
  vec2 cell = vec2(1.0) / uAtlasGrid;
  vec4 art = texture2D(uAtlas, (slot + clamp(uv, 0.0, 1.0)) * cell);

  // ── 高度场 = 金箔褶皱 + 细喷砂 + UV 印刷墨层 ────────────
  // 纹理坐标不跟着放大 —— 票凑近了看，砂粒和箔纹应该保持原来的细度
  vec2 tp = p / scale + vec2(seed * 7.3, seed * 3.1);
  float e = 0.0035;
  float hl  = leaf(tp, uTime) * uLeafAmp;
  float hlx = leaf(tp + vec2(e, 0.0), uTime) * uLeafAmp;
  float hly = leaf(tp + vec2(0.0, e), uTime) * uLeafAmp;

  // 细喷砂：高频、低幅，只扰法线不改大形
  // 喷砂要细到看不出单颗 —— 能数出颗粒就是砂砾，不是喷砂面
  float gs = 60.0;
  float g  = vnoise(tp * gs * 8.0);
  float gx = vnoise((tp + vec2(e, 0.0)) * gs * 8.0);
  float gy = vnoise((tp + vec2(0.0, e)) * gs * 8.0);

  // UV 印刷：墨的 alpha 直接是凸起，所以字和图是"摸得到"的
  float ia  = art.a;
  float iax = texture2D(uAtlas, (slot + clamp(uv + vec2(e, 0.0), 0.0, 1.0)) * cell).a;
  float iay = texture2D(uAtlas, (slot + clamp(uv + vec2(0.0, e), 0.0, 1.0)) * cell).a;

  // 两套法线：粗糙的那套（含喷砂）管高光，平滑的那套（只有箔纹+墨边）管金。
  // 混在一起的话喷砂会把金打成散沙 —— 噪点级的法线让金的走向每像素翻转。
  vec2 gFoil =
    vec2(hl - hlx, hl - hly) / e * 0.5 +
    vec2(ia - iax, ia - iay) / e * 0.04 * uInkRelief;
  vec3 nFoil = normalize(vec3(gFoil, 1.0));

  vec2 grad = gFoil + vec2(g - gx, g - gy) / e * 0.012 * uGrit;
  vec3 nrm = normalize(vec3(grad, 1.0));

  // ── 基色：纸 + 压进纸里的墨 ─────────────────────────
  vec3 paper = uPaper * (0.97 + 0.03 * clamp(hl / max(uLeafAmp, 0.001), 0.0, 1.0));
  // 墨色来自 look，不是图集 —— 图集只出黑+alpha，所以纸变深时墨要能反过来变浅。
  // （之前直接用 art.rgb 当墨色，纸一深字就整片糊掉了。）
  vec3 printed = mix(uInk, paper, uPrintFade);
  vec3 face = mix(paper, printed, ia * 0.94);

  // ── 光照 ──────────────────────────────────────────
  // 光源挂在光标上，悬在票面上方一点。默认（没悬停）退回一个固定斜向，
  // 否则鼠标不在票上时整片票会没有主光方向。
  vec3 rest = normalize(vec3(-0.4, 0.56, 0.72));
  vec3 toCursor = normalize(vec3(lp - p, 0.62));
  vec3 lightDir = normalize(mix(rest, toCursor, hover * 0.85));
  // 俯视时视线是斜的（票躺在桌上），抬到中央后变成正对着看
  vec3 viewDir = normalize(vec3(p * mix(0.34, 0.1, lift), 1.0));
  vec3 halfDir = normalize(lightDir + viewDir);
  float diff = max(dot(nrm, lightDir), 0.0);
  float spec = pow(max(dot(nrm, halfDir), 0.0), mix(20.0, 70.0, uGloss)) * (0.1 + 0.4 * uGloss);

  // 斑驳光：光标附近一块柔和的亮斑，边缘不能有硬边，否则像贴着的手电筒光圈。
  // 半径给到票宽的量级，让它更像"光从这个方向来"，而不是一个圆点。
  float dap = 1.0 - smoothstep(0.0, 0.95, length(lp - p));
  dap *= hover;

  vec3 lit = face * (0.97 + 0.12 * diff + 0.14 * dap) + spec * (0.55 + 0.45 * max(hover, lift));

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
  float lit01 = clamp(ridge, 0.0, 1.0);
  vec3 metal = mix(foilCol * 0.2, foilCol * 0.98, lit01);
  metal += foilCol * glint * 0.9;   // 打眼的高光点
  lit = mix(lit, metal, amount);

  // 金银粉撒在最上层。这个尺度上"闪"应该来自离散的箔片，而不是连续纹理 ——
  // 连续纹理放到这么细只会变成毛毡/布纹，粉才是抢眼的那一下。
  lit += powder(tp, sweepDir, lit01) * uFoil * boost * 2.6;

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
    float blur = 0.022 + hover * 0.03 + lift * 0.1;
    float sm = smoothstep(-blur, blur, ssd);
    float amount = 0.3 * uShadow * (1.0 + hover * 0.5 + lift * 0.9);
    col = mix(col, col * (1.0 - amount), sm * 0.92);

    vec4 st = shadeStamp(p, half2, vec2(meta.z, meta.w), hover, lift, lft.y, lft.z, lp);
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
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/**
 * 把一张彩色图压成纯黑 + 原 alpha。
 * shader 只吃 alpha（当 UV 印刷的高度场），rgb 用不上，但留着彩色会在
 * 双线性采样时把颜色渗到边缘外，所以先统一刷黑。
 */
function flatten(img: HTMLImageElement, w: number, h: number): HTMLCanvasElement {
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const c = cv.getContext("2d")!;
  c.drawImage(img, 0, 0, w, h);
  c.globalCompositeOperation = "source-in";
  c.fillStyle = "#000";
  c.fillRect(0, 0, w, h);
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
      ctx.globalAlpha = 0.92;
      ctx.drawImage(flatten(img, Math.round(w * 2), Math.round(h * 2)), (C - w) / 2, (C - h) / 2, w, h);
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
    gl.uniform1f(U("uInkRelief"), look.inkRelief);
    gl.uniform1f(U("uFoil"), look.foil);
    gl.uniform1f(U("uFoilHue"), look.foilHue);
    gl.uniform1f(U("uGloss"), look.gloss);
    gl.uniform1f(U("uPrintFade"), look.printFade);
    gl.uniform1f(U("uShadow"), look.shadow);
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
  const pointer = { x: -9999, y: -9999 };
  // 避开光标：光标那一侧压下去。7° 是上限，再大就从"被按住"变成"翻过去"
  const TILT_MAX = (7 * Math.PI) / 180;

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
      const hot = Math.abs(lx) <= hw && Math.abs(ly) <= hh;
      hovers[slotKey] += ((hot ? 1 : 0) - hovers[slotKey]) * 0.14;
      el.dataset.hot = hot ? "true" : "false";

      // 避开光标的倾斜：光标在票内的归一化位置直接当角度，符号取正 = 那一侧远离观者。
      // 抬到中央后归零 —— 平视的票不该还在歪。
      const nx = hot ? Math.max(-1, Math.min(1, lx / hw)) : 0;
      const ny = hot ? Math.max(-1, Math.min(1, ly / hh)) : 0;
      const k = 1 - lifts[slotKey];
      const wantY = nx * TILT_MAX * k;
      const wantX = -ny * TILT_MAX * k;
      tiltY[slotKey] += (wantY - tiltY[slotKey]) * 0.14;
      tiltX[slotKey] += (wantX - tiltX[slotKey]) * 0.14;
      tilt[i * 4 + 0] = tiltX[slotKey];
      tilt[i * 4 + 1] = tiltY[slotKey];

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
