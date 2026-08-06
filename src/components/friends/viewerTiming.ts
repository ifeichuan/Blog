/**
 * 灯箱开关的共享时序 —— Lightbox（旧邮票渐隐）与 StampCard（原卡渐显）
 * 必须用同一组数字，落点交叉淡化才同步。
 *
 * 退出飞行是弹簧（stiffness 230 / damping 29 / mass 0.78），没有固定时长，
 * VIEWER_EXIT_S 是按该弹簧实测的近似落定时间。交叉淡化安排在飞行接近尾声时：
 * 旧邮票开始渐隐，墙上原卡同一时刻开始渐显 —— 放大态（带 shader/投影）和
 * 缩小态有颜色差、落点还可能叠着其他邮票，瞬时换卡会闪，交叉淡化则不会。
 */

/** 退出飞行 ≈ 0.54s */
export const VIEWER_EXIT_S = 0.54

/** 落点交叉淡化时长 */
export const SWAP_FADE_S = 0.2

/** 关闭动作后，交叉淡化开始的时间点（飞行接近尾声） */
export const SWAP_DELAY_S = VIEWER_EXIT_S - SWAP_FADE_S
