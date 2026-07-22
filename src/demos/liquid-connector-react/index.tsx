import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AskUserQuestions,
  type AskUserAnswer,
  type AskUserQuestion,
} from "@/components/ui/ask-user-questions";
import {
  ArrowUpIcon,
  CheckIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
  MessageCircleMoreIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  ShieldXIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { LiquidConnector } from "./LiquidConnector";
import {
  type LiquidFrame,
  type LiquidPeelParameters,
  liquidPath,
} from "./liquid-path";

type Outcome = "allowed" | "denied" | null;
type DemoKind = "approval" | "askUser";
type PeelKey = "detachGap" | "transition" | "couplingRadius" | "pull";

const askQuestions: AskUserQuestion[] = [
  {
    id: "scope",
    title: "How should I scope this interaction pass?",
    options: [
      { id: "focused", title: "Focused pass", description: "Motion and core states" },
      { id: "complete", title: "Complete pass", description: "All states and responsive behavior" },
      { id: "prototype", title: "Prototype only", description: "Explore the interaction first" },
    ],
    layout: "stacked",
    skippable: true,
  },
  {
    id: "priorities",
    title: "What should the pass prioritize?",
    options: [
      { id: "motion", title: "Motion" },
      { id: "layout", title: "Responsive layout" },
      { id: "accessibility", title: "Accessibility" },
    ],
    multiSelect: true,
    allowOther: true,
    otherPlaceholder: "Add another priority…",
    skippable: true,
  },
  {
    id: "notes",
    title: "Anything else I should account for?",
    freeText: true,
    freeTextMultiline: true,
    freeTextPlaceholder: "Add constraints, edge cases, or acceptance criteria…",
    nextLabel: "Finish",
    skippable: true,
  },
];

const askOptionLabels = new Map(
  askQuestions.flatMap((question) =>
    (question.options ?? []).map((option) => [option.id ?? option.title, option.title] as const),
  ),
);

function summarizeAskAnswers(answers: Record<string, AskUserAnswer>) {
  const completed = Object.values(answers).filter((answer) => !answer.skipped);
  if (completed.length === 0) return "Skipped";

  const parts = completed.flatMap((answer) => [
    ...answer.selectedIds.map((id) => askOptionLabels.get(id) ?? id),
    ...(answer.otherText?.trim() ? [answer.otherText.trim()] : []),
  ]);
  return parts.join(" · ") || "Answered";
}

const peelControls: Array<{
  key: PeelKey;
  label: string;
  min: number;
  max: number;
  step: number;
  digits: number;
}> = [
  { key: "detachGap", label: "Detach", min: 6, max: 9.8, step: 0.05, digits: 2 },
  { key: "transition", label: "Transition", min: 1.5, max: 8, step: 0.05, digits: 2 },
  { key: "couplingRadius", label: "Coupling radius", min: 4, max: 48, step: 0.5, digits: 1 },
  { key: "pull", label: "Pull", min: 0, max: 8, step: 0.1, digits: 1 },
];

export default function LiquidConnectorReactDemo() {
  const reducedMotion = useReducedMotion() ?? false;
  const [outcome, setOutcome] = useState<Outcome>(null);
  const [kind, setKind] = useState<DemoKind>("approval");
  const [askAnswer, setAskAnswer] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [debug, setDebug] = useState(false);
  const [debugFrame, setDebugFrame] = useState<LiquidFrame | null>(null);
  const [manualGap, setManualGap] = useState<number>();
  const [peelParameters, setPeelParameters] = useState<Partial<LiquidPeelParameters>>(
    liquidPath.DEFAULT_PEEL_PARAMETERS,
  );
  const lastFrameUpdateRef = useRef(0);

  const resolve = useCallback((next: Exclude<Outcome, null>) => {
    setOutcome(next);
    requestAnimationFrame(() => setOpen(true));
  }, []);

  const reset = useCallback(() => {
    setManualGap(undefined);
    setOpen(false);
  }, []);
  const clearResolution = useCallback(() => {
    setOutcome(null);
    setAskAnswer(null);
  }, []);
  const handleFrame = useCallback((frame: LiquidFrame) => {
    const now = performance.now();
    if (now - lastFrameUpdateRef.current < 50 && frame.phase === debugFrame?.phase) return;
    lastFrameUpdateRef.current = now;
    setDebugFrame(frame);
  }, [debugFrame?.phase]);

  const scrubGap = useCallback((value: number) => {
    if (kind === "approval") setOutcome((current) => current ?? "allowed");
    else setAskAnswer((current) => current ?? "Complete pass");
    setOpen(true);
    setManualGap(value);
  }, [kind]);

  const togglePreview = useCallback(() => {
    const next = !open;
    setManualGap(undefined);
    if (next && kind === "approval") setOutcome((current) => current ?? "allowed");
    if (next && kind === "askUser") setAskAnswer((current) => current ?? "Complete pass");
    setOpen(next);
  }, [kind, open]);

  const switchKind = useCallback((next: DemoKind) => {
    setManualGap(undefined);
    setOpen(false);
    setOutcome(null);
    setAskAnswer(null);
    setKind(next);
  }, []);

  return (
    <div className="flex h-full min-h-[620px] flex-col overflow-auto bg-background">
      <header className="flex shrink-0 items-center justify-between border-b border-border py-4 pl-6 pr-32">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Human in the loop
          </p>
          <h1 className="mt-1 font-runde text-lg font-semibold text-foreground">
            Liquid receipt
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-muted p-0.5" role="group" aria-label="Interaction type">
            <button
              type="button"
              onClick={() => switchKind("approval")}
              disabled={open}
              aria-pressed={kind === "approval"}
              className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 ${
                kind === "approval"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShieldCheckIcon className="size-3.5" /> Approval
            </button>
            <button
              type="button"
              onClick={() => switchKind("askUser")}
              disabled={open}
              aria-pressed={kind === "askUser"}
              className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-2.5 text-[11px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-45 ${
                kind === "askUser"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageCircleMoreIcon className="size-3.5" /> Ask user
            </button>
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:pr-[260px] xl:pr-[320px]">
        <div className="w-full max-w-[640px]">
          <AnimatePresence initial={false}>
            {kind === "askUser" && askAnswer === null ? (
              <motion.div
                key="fluid-ask-user"
                initial={reducedMotion ? false : { opacity: 0, y: 10, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8, scale: 0.99 }}
                className="mx-auto w-full max-w-[520px]"
              >
                <AskUserQuestions
                  questions={askQuestions}
                  skipLabel="Skip"
                  onComplete={(answers) => {
                    setAskAnswer(summarizeAskAnswers(answers));
                    requestAnimationFrame(() => setOpen(true));
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="liquid-connector"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
              >
                <LiquidConnector
                  open={open}
                  debug={debug}
                  gap={manualGap}
                  peelParameters={peelParameters}
                  onFrame={handleFrame}
                  onCloseComplete={clearResolution}
                  ariaLabel="Interaction receipt separating from the composer"
                  upperContent={
                    <Receipt
                      kind={kind}
                      outcome={outcome}
                      askAnswer={askAnswer}
                      onReset={reset}
                    />
                  }
                  lowerContent={
                    <ComposerSurface
                      kind={kind}
                      outcome={outcome}
                      askAnswer={askAnswer}
                      draft={draft}
                      onDraftChange={setDraft}
                      onAllow={() => resolve("allowed")}
                      onDeny={() => resolve("denied")}
                      onReset={reset}
                      reducedMotion={reducedMotion}
                    />
                  }
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <DebugPanel
        debug={debug}
        frame={debugFrame}
        open={open}
        peelParameters={peelParameters}
        onDebugChange={setDebug}
        onGapChange={scrubGap}
        onPeelChange={(key, value) =>
          setPeelParameters((current) => ({ ...current, [key]: value }))
        }
        onPeelReset={() => setPeelParameters(liquidPath.DEFAULT_PEEL_PARAMETERS)}
        onToggle={togglePreview}
      />
    </div>
  );
}

type DebugPanelProps = {
  debug: boolean;
  frame: LiquidFrame | null;
  open: boolean;
  peelParameters: Partial<LiquidPeelParameters>;
  onDebugChange: (value: boolean) => void;
  onGapChange: (value: number) => void;
  onPeelChange: (key: PeelKey, value: number) => void;
  onPeelReset: () => void;
  onToggle: () => void;
};

function DebugPanel({
  debug,
  frame,
  open,
  peelParameters,
  onDebugChange,
  onGapChange,
  onPeelChange,
  onPeelReset,
  onToggle,
}: DebugPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const gap = frame?.gap ?? liquidPath.LIQUID_GEOMETRY.hiddenGap;

  return (
    <aside className="fixed inset-x-3 bottom-3 z-20 max-h-[calc(100dvh-24px)] overflow-auto rounded-lg border border-border bg-popover text-popover-foreground shadow-xl sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-[72px] sm:w-[240px] xl:w-[280px]">
      <header className="flex h-12 items-center justify-between px-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <SlidersHorizontalIcon className="size-4 text-muted-foreground" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold">Liquid path</h2>
            <p className="font-mono text-[9px] uppercase text-muted-foreground">
              {frame?.mode ?? "merged"} · {frame?.phase ?? "contained"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={collapsed ? "Expand debug panel" : "Collapse debug panel"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronDownIcon className="size-4" /> : <ChevronUpIcon className="size-4" />}
        </button>
      </header>

      {!collapsed && (
        <div className="border-t border-border">
          <section className="space-y-3 px-3.5 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase text-muted-foreground">
                Separation
              </h3>
              <output className="font-mono text-xs font-medium tabular-nums">
                {formatSigned(gap)} px
              </output>
            </div>
            <RangeControl
              label="Gap"
              value={gap}
              min={liquidPath.LIQUID_GEOMETRY.minGap}
              max={liquidPath.LIQUID_GEOMETRY.maxGap}
              step={0.1}
              hideValue
              onChange={onGapChange}
            />
            <div className="grid grid-cols-3 gap-2 font-mono text-[9px] text-muted-foreground">
              <Metric label="Face" value={formatSigned(frame?.faceGap ?? 0)} />
              <Metric label="Waist" value={(frame?.waistWidth ?? 0).toFixed(1)} />
              <Metric label="Stretch" value={(frame?.stretch ?? 0).toFixed(2)} />
            </div>
          </section>

          <section className="space-y-3 border-t border-border px-3.5 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold uppercase text-muted-foreground">Peel</h3>
              <button
                type="button"
                onClick={onPeelReset}
                className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Reset peel parameters"
              >
                <RotateCcwIcon className="size-3.5" />
              </button>
            </div>
            <div className="space-y-3">
              {peelControls.map((control) => (
                <RangeControl
                  key={control.key}
                  label={control.label}
                  value={Number(peelParameters[control.key] ?? 0)}
                  min={control.min}
                  max={control.max}
                  step={control.step}
                  digits={control.digits}
                  onChange={(value) => onPeelChange(control.key, value)}
                />
              ))}
            </div>
          </section>

          <section className="space-y-2 border-t border-border px-3.5 py-3.5">
            <button
              type="button"
              role="switch"
              aria-checked={debug}
              onClick={() => onDebugChange(!debug)}
              className="flex h-11 w-full items-center justify-between rounded-md bg-muted px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span>
                <strong className="block text-xs font-semibold">Path debug</strong>
                <small className="block text-[10px] text-muted-foreground">Geometry overlay</small>
              </span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  debug ? "bg-foreground" : "bg-border"
                }`}
                aria-hidden="true"
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-background transition-transform ${
                    debug ? "translate-x-[18px]" : "translate-x-0.5"
                  }`}
                />
              </span>
            </button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-foreground text-xs font-semibold text-background transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-popover"
            >
              <ChevronsUpDownIcon className="size-4" />
              {open ? "Collapse" : "Expand"}
            </button>
          </section>
        </div>
      )}
    </aside>
  );
}

type RangeControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  digits?: number;
  hideValue?: boolean;
  onChange: (value: number) => void;
};

function RangeControl({
  label,
  value,
  min,
  max,
  step,
  digits = 1,
  hideValue = false,
  onChange,
}: RangeControlProps) {
  const safeValue = Math.max(min, Math.min(max, value));
  const progress = ((safeValue - min) / (max - min)) * 100;
  return (
    <label className="block">
      <span className={hideValue ? "sr-only" : "mb-1.5 flex items-center justify-between"}>
        <span className="text-[11px] font-medium">{label}</span>
        {!hideValue && (
          <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
            {value.toFixed(digits)} px
          </span>
        )}
      </span>
      <input
        type="range"
        aria-label={label}
        value={safeValue}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-ew-resize appearance-none rounded-full accent-foreground"
        style={{
          background: `linear-gradient(to right, var(--foreground) 0 ${progress}%, var(--muted) ${progress}% 100%)`,
        }}
      />
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <span className="block truncate uppercase">{label}</span>
      <strong className="mt-0.5 block truncate text-[10px] font-medium text-foreground">{value}</strong>
    </div>
  );
}

function formatSigned(value: number) {
  const formatted = Math.abs(value).toFixed(1);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

type ReceiptProps = {
  kind: DemoKind;
  outcome: Outcome;
  askAnswer: string | null;
  onReset: () => void;
};

function Receipt({ kind, outcome, askAnswer, onReset }: ReceiptProps) {
  const askUser = kind === "askUser";
  const allowed = outcome === "allowed";
  const skipped = askAnswer === "Skipped";
  return (
    <div className="flex size-full items-center gap-3 px-5 text-foreground">
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          askUser
            ? skipped
              ? "bg-muted text-muted-foreground"
              : "bg-sky-500/12 text-sky-500"
            : allowed
              ? "bg-emerald-500/12 text-emerald-500"
              : "bg-rose-500/12 text-rose-500"
        }`}
      >
        {askUser ? (
          <MessageCircleMoreIcon className="size-4" />
        ) : allowed ? (
          <CheckIcon className="size-4" />
        ) : (
          <ShieldXIcon className="size-4" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">
            {askUser ? (skipped ? "Question skipped" : "Answer recorded") : `Bash ${allowed ? "allowed" : "denied"}`}
          </p>
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted-foreground">
            {askUser ? "ASK-12C8" : "APR-7F2A"}
          </span>
        </div>
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          {askUser ? askAnswer ?? "Complete pass" : "rm -rf ./dist && bun run build"}
        </p>
      </div>
      <button
        type="button"
        onClick={onReset}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Reset interaction"
      >
        <RotateCcwIcon className="size-3.5" />
      </button>
    </div>
  );
}

type ComposerSurfaceProps = {
  kind: DemoKind;
  outcome: Outcome;
  askAnswer: string | null;
  draft: string;
  onDraftChange: (value: string) => void;
  onAllow: () => void;
  onDeny: () => void;
  onReset: () => void;
  reducedMotion: boolean;
};

function ComposerSurface({
  kind,
  outcome,
  askAnswer,
  draft,
  onDraftChange,
  onAllow,
  onDeny,
  onReset,
  reducedMotion,
}: ComposerSurfaceProps) {
  const resolved = kind === "approval" ? outcome !== null : askAnswer !== null;
  return (
    <div className="relative size-full text-foreground">
      <AnimatePresence mode="wait" initial={false}>
        {!resolved && kind === "approval" ? (
          <motion.div
            key="approval"
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            className="flex size-full flex-col px-5 pb-4 pt-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-amber-500/10 text-amber-500">
                <ShieldCheckIcon className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">Bash requires approval</p>
                <p className="truncate font-mono text-[11px] text-muted-foreground">
                  rm -rf ./dist &amp;&amp; bun run build
                </p>
              </div>
              <SlidersHorizontalIcon className="size-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-auto flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onDeny}
                className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ShieldXIcon className="size-3.5" /> Deny
              </button>
              <button
                type="button"
                onClick={onAllow}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-foreground px-3.5 text-xs font-semibold text-background transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <CheckIcon className="size-3.5" /> Allow once
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="composer"
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex size-full flex-col px-5 pb-4 pt-4"
          >
            <textarea
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              rows={2}
              placeholder="Ask a follow-up…"
              className="min-h-0 flex-1 resize-none bg-transparent text-sm leading-5 outline-none placeholder:text-muted-foreground"
            />
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onReset}
                className="text-[11px] font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Close receipt
              </button>
              <button
                type="button"
                disabled={!draft.trim()}
                className="grid size-8 place-items-center rounded-full bg-foreground text-background disabled:opacity-20"
                aria-label="Send message"
              >
                <ArrowUpIcon className="size-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
