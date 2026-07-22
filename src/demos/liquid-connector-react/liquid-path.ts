import "./liquid-path.vendor.js";

export type LiquidMode = "merged" | "detached";
export type LiquidPhase = "contained" | "neck" | "detached";

export type LiquidPeelParameters = {
  detachGap: number;
  transition: number;
  couplingRadius: number;
  pull: number;
  peelStart: number;
};

export type LiquidDebugGeometry = {
  topology: LiquidMode;
  phase: LiquidPhase;
  actualD: string;
  outputD: string;
  inputD: string;
  contactZoneD: string;
  contactBandD: string;
  waistD: string;
  conceptualGap: number;
  contactKind: "none" | "touch" | "bridge" | "overlap";
  overlap: number;
  separation: number;
  seamY: number | null;
  waistWidth: number;
};

export type LiquidGeometry = {
  viewWidth: number;
  viewHeight: number;
  x: number;
  width: number;
  outputHeight: number;
  inputY: number;
  inputHeight: number;
  outputRadius: number;
  inputRadius: number;
  sendSize: number;
  restGap: number;
  hiddenGap: number;
  minGap: number;
  maxGap: number;
  renderMinGap: number;
  renderMaxGap: number;
  mergeGap: number;
};

export type LiquidFrame = {
  d: string;
  edgeD: string;
  debug: LiquidDebugGeometry | null;
  mode: LiquidMode;
  phase: LiquidPhase;
  gap: number;
  peelParameters: LiquidPeelParameters;
  faceGap: number;
  inputContentHeight: number;
  inputContentScaleY: number;
  inputContentY: number;
  inputVisualHeight: number;
  inputVisualY: number;
  outputHeight: number;
  outputOpacity: number;
  outputScaleY: number;
  outputY: number;
  strain: number;
  stretch: number;
  waistWidth: number;
};

export type LiquidFrameOptions = {
  mode?: LiquidMode;
  peelParameters?: Partial<LiquidPeelParameters>;
  tearAge?: number;
  tearStrength?: number;
  closeAge?: number;
  openAge?: number;
  openStrength?: number;
  scrub?: boolean;
  debug?: boolean;
};

export type MeasuredTransition = {
  done: boolean;
  gap: number;
  velocity: number;
};

type LiquidPathApi = {
  DEFAULT_PEEL_PARAMETERS: Readonly<Omit<LiquidPeelParameters, "peelStart">>;
  LIQUID_GEOMETRY: Readonly<LiquidGeometry>;
  createLiquidFrame(
    gap: number,
    velocity?: number,
    options?: LiquidFrameOptions,
  ): LiquidFrame;
  openingTension(velocity: number): number;
  normalizePeelParameters(
    parameters?: Partial<LiquidPeelParameters>,
  ): Readonly<LiquidPeelParameters>;
  resolveLiquidMode(
    previousMode: LiquidMode | undefined,
    gap: number,
    velocity?: number,
    peelParameters?: Partial<LiquidPeelParameters>,
  ): LiquidMode;
  resolveScrubMode(
    previousMode: LiquidMode | undefined,
    gap: number,
    peelParameters?: Partial<LiquidPeelParameters>,
  ): LiquidMode;
  sampleMeasuredTransition(
    kind: "opening" | "closing",
    age: number,
    hiddenGap?: number,
    restGap?: number,
  ): MeasuredTransition;
};

declare global {
  // eslint-disable-next-line no-var
  var LiquidPath: LiquidPathApi;
}

export const liquidPath = globalThis.LiquidPath;
