import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRightIcon,
  CheckIcon,
  CircleAlertIcon,
  CommandIcon,
  MessageCircleMoreIcon,
  RotateCcwIcon,
  ShieldCheckIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react";
import { useId, useState } from "react";

export type ApprovalChoice = "once" | "session";
export type ApprovalStatus = "pending" | "allowed" | "denied";

export type ApprovalTicketProps = {
  tool?: string;
  command?: string;
  requestId?: string;
  onAllow?: (choice: ApprovalChoice) => void;
  onDeny?: () => void;
};

const approvalChoices: Array<{
  value: ApprovalChoice;
  label: string;
  description: string;
}> = [
  {
    value: "once",
    label: "Allow once",
    description: "Only for this command",
  },
  {
    value: "session",
    label: "Allow for session",
    description: "Remember until this run ends",
  },
];

export function ApprovalTicket({
  tool = "Bash",
  command = "rm -rf ./dist && bun run build",
  requestId = "APR-7F2A",
  onAllow,
  onDeny,
}: ApprovalTicketProps) {
  const reducedMotion = useReducedMotion();
  const [choice, setChoice] = useState<ApprovalChoice>("once");
  const [status, setStatus] = useState<ApprovalStatus>("pending");

  const resolveAllow = () => {
    setStatus("allowed");
    onAllow?.(choice);
  };

  const resolveDeny = () => {
    setStatus("denied");
    onDeny?.();
  };

  const reset = () => setStatus("pending");

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 330, damping: 27, mass: 0.8 }}
      className="relative isolate w-full overflow-hidden rounded-[26px] border border-amber-400/20 bg-[#151513] text-stone-100 shadow-[0_26px_80px_rgba(0,0,0,0.38)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(circle at 16% 0%, rgba(245,158,11,.15), transparent 32%), linear-gradient(120deg, transparent 0 72%, rgba(255,255,255,.025) 72% 73%, transparent 73%)",
        }}
      />

      <div className="relative grid md:grid-cols-[minmax(0,1fr)_148px]">
        <div className="min-w-0 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-amber-300/20 bg-amber-300/10 text-amber-300">
                <ShieldCheckIcon className="size-[18px]" />
              </span>
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-200/60">
                  Execution permit · {requestId}
                </p>
                <h2 className="mt-1 font-runde text-[17px] font-semibold tracking-[-0.02em] text-stone-50">
                  Approval required
                </h2>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-300/15 bg-amber-300/[0.07] px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider text-amber-200/75">
              <span className="size-1.5 rounded-full bg-amber-300 shadow-[0_0_0_3px_rgba(252,211,77,.12)]" />
              {status}
            </span>
          </header>

          <AnimatePresence mode="wait" initial={false}>
            {status === "pending" ? (
              <motion.div
                key="approval-form"
                initial={reducedMotion ? false : { opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                className="mt-6"
              >
                <div className="overflow-hidden rounded-[16px] border border-white/[0.07] bg-black/35">
                  <div className="flex items-center justify-between border-b border-white/[0.06] px-3.5 py-2 font-mono text-[10px] uppercase tracking-[0.15em] text-stone-500">
                    <span className="flex items-center gap-1.5">
                      <CommandIcon className="size-3" /> {tool}
                    </span>
                    <span>cwd · /workspace</span>
                  </div>
                  <pre className="overflow-x-auto px-3.5 py-4 font-mono text-[12px] leading-5 text-stone-300">
                    <code>{command}</code>
                  </pre>
                </div>

                <fieldset className="mt-4 grid gap-2 sm:grid-cols-2">
                  <legend className="sr-only">Permission duration</legend>
                  {approvalChoices.map((item) => {
                    const selected = choice === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setChoice(item.value)}
                        className={`flex items-start gap-3 rounded-[14px] border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70 ${
                          selected
                            ? "border-amber-300/35 bg-amber-300/10"
                            : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]"
                        }`}
                      >
                        <span
                          className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full border ${
                            selected
                              ? "border-amber-300 bg-amber-300 text-[#151513]"
                              : "border-stone-600"
                          }`}
                        >
                          {selected ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}
                        </span>
                        <span>
                          <span className="block text-xs font-medium text-stone-200">{item.label}</span>
                          <span className="mt-0.5 block text-[11px] leading-4 text-stone-500">
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </fieldset>

                <div className="mt-5 flex items-center justify-end gap-2 border-t border-dashed border-white/10 pt-4">
                  <button
                    type="button"
                    onClick={resolveDeny}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full px-4 text-xs font-medium text-stone-400 transition-colors hover:bg-white/5 hover:text-stone-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-500"
                  >
                    <XIcon className="size-3.5" /> Deny
                  </button>
                  <button
                    type="button"
                    onClick={resolveAllow}
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-amber-300 px-4 text-xs font-semibold text-stone-950 transition-colors hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151513]"
                  >
                    Allow command <ArrowRightIcon className="size-3.5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="approval-receipt"
                initial={reducedMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 flex min-h-[190px] flex-col items-center justify-center rounded-[18px] border border-dashed border-white/10 bg-black/20 px-5 text-center"
              >
                <span
                  className={`grid size-11 place-items-center rounded-full ${
                    status === "allowed"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : "bg-rose-400/10 text-rose-300"
                  }`}
                >
                  {status === "allowed" ? (
                    <CheckIcon className="size-5" />
                  ) : (
                    <XIcon className="size-5" />
                  )}
                </span>
                <p className="mt-3 font-runde text-base font-semibold text-stone-100">
                  Command {status === "allowed" ? "allowed" : "denied"}
                </p>
                <p className="mt-1 max-w-[330px] text-xs leading-5 text-stone-500">
                  {status === "allowed"
                    ? `${tool} can run ${choice === "once" ? "this command once" : "commands for this session"}.`
                    : "The command was not executed and the agent can continue safely."}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-medium text-stone-500 hover:text-stone-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/70"
                >
                  <RotateCcwIcon className="size-3" /> Reset ticket
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <aside className="relative flex min-h-[112px] items-center justify-between gap-4 border-t border-dashed border-amber-200/20 bg-amber-300/[0.055] px-6 py-5 md:min-h-full md:flex-col md:justify-center md:border-l md:border-t-0 md:px-4">
          <span className="absolute -left-3 -top-3 size-6 rounded-full border border-amber-400/20 bg-background md:left-[-13px] md:top-[-13px]" />
          <span className="absolute -bottom-3 -left-3 hidden size-6 rounded-full border border-amber-400/20 bg-background md:block" />
          <div className="text-left md:text-center">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-amber-200/45">Security class</p>
            <p className="mt-1 font-mono text-xs text-amber-100/80">FS · WRITE</p>
          </div>
          <div
            className={`rounded-[10px] border-2 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.16em] md:-rotate-6 ${
              status === "allowed"
                ? "border-emerald-300/60 text-emerald-300"
                : status === "denied"
                  ? "border-rose-300/60 text-rose-300"
                  : "border-amber-200/35 text-amber-200/55"
            }`}
          >
            {status === "pending" ? "Awaiting" : status}
          </div>
          <p className="hidden font-mono text-[9px] leading-4 text-amber-100/35 md:block md:[writing-mode:vertical-rl]">
            VERIFY BEFORE EXECUTION
          </p>
        </aside>
      </div>
    </motion.article>
  );
}

export type AskUserStatus = "pending" | "answered" | "skipped";

export type AskUserOption = {
  id: string;
  label: string;
  description?: string;
};

export type AskUserTicketProps = {
  question?: string;
  options?: AskUserOption[];
  requestId?: string;
  onAnswer?: (value: string) => void;
  onSkip?: () => void;
};

const defaultOptions: AskUserOption[] = [
  {
    id: "focused",
    label: "Focused pass",
    description: "Fix the approval flow first",
  },
  {
    id: "complete",
    label: "Complete pass",
    description: "Cover approval and AskUser together",
  },
  {
    id: "prototype",
    label: "Prototype only",
    description: "Keep it isolated from production code",
  },
];

export function AskUserTicket({
  question = "How should I scope this interaction pass?",
  options = defaultOptions,
  requestId = "ASK-12C8",
  onAnswer,
  onSkip,
}: AskUserTicketProps) {
  const reducedMotion = useReducedMotion();
  const inputId = useId();
  const [selected, setSelected] = useState(options[1]?.id ?? options[0]?.id ?? "");
  const [custom, setCustom] = useState("");
  const [status, setStatus] = useState<AskUserStatus>("pending");
  const answer = custom.trim() || options.find((option) => option.id === selected)?.label || "";

  const submit = () => {
    if (!answer) return;
    setStatus("answered");
    onAnswer?.(answer);
  };

  const skip = () => {
    setStatus("skipped");
    onSkip?.();
  };

  const reset = () => setStatus("pending");

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 330, damping: 27, mass: 0.8, delay: 0.06 }}
      className="relative isolate w-full overflow-hidden rounded-[26px] border border-sky-300/20 bg-[#11171a] text-slate-100 shadow-[0_26px_80px_rgba(0,0,0,0.38)]"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(circle at 100% 10%, rgba(56,189,248,.13), transparent 35%), linear-gradient(rgba(255,255,255,.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.018) 1px, transparent 1px)",
          backgroundSize: "auto, 24px 24px, 24px 24px",
        }}
      />

      <div className="relative">
        <header className="flex items-center justify-between gap-4 border-b border-dashed border-sky-200/15 px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-sky-300/20 bg-sky-300/10 text-sky-300">
              <MessageCircleMoreIcon className="size-4" />
            </span>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-sky-200/45">Agent question</p>
              <p className="mt-0.5 font-mono text-[11px] text-sky-100/65">{requestId} · 1 of 1</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5" aria-label="One question">
            <span className="h-1.5 w-7 rounded-full bg-sky-300" />
            <span className="size-1.5 rounded-full bg-white/10" />
            <span className="size-1.5 rounded-full bg-white/10" />
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          {status === "pending" ? (
            <motion.div
              key="ask-form"
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
              className="px-5 pb-5 pt-6 sm:px-6 sm:pb-6"
            >
              <div className="flex items-start gap-4">
                <span className="font-runde text-[38px] font-semibold leading-none tracking-[-0.08em] text-sky-300/25">Q</span>
                <div className="min-w-0 flex-1">
                  <h2 className="max-w-[520px] font-runde text-lg font-semibold leading-6 tracking-[-0.025em] text-slate-50">
                    {question}
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-slate-500">Choose one answer or write a short response.</p>
                </div>
              </div>

              <fieldset className="mt-5 grid gap-2">
                <legend className="sr-only">Answer options</legend>
                {options.map((option, index) => {
                  const active = selected === option.id && !custom.trim();
                  return (
                    <button
                      key={option.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setSelected(option.id);
                        setCustom("");
                      }}
                      className={`group grid grid-cols-[28px_1fr_auto] items-center gap-3 rounded-[14px] border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70 ${
                        active
                          ? "border-sky-300/35 bg-sky-300/10"
                          : "border-white/[0.07] bg-white/[0.025] hover:border-white/15 hover:bg-white/[0.045]"
                      }`}
                    >
                      <span
                        className={`grid size-7 place-items-center rounded-[9px] font-mono text-[10px] ${
                          active ? "bg-sky-300 text-sky-950" : "bg-white/[0.05] text-slate-500"
                        }`}
                      >
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span>
                        <span className="block text-xs font-medium text-slate-200">{option.label}</span>
                        {option.description ? (
                          <span className="mt-0.5 block text-[11px] leading-4 text-slate-500">{option.description}</span>
                        ) : null}
                      </span>
                      <span
                        className={`size-2 rounded-full transition-colors ${
                          active ? "bg-sky-300 shadow-[0_0_0_4px_rgba(125,211,252,.1)]" : "bg-white/10"
                        }`}
                      />
                    </button>
                  );
                })}
              </fieldset>

              <div className="relative my-4 flex items-center gap-3">
                <span className="h-px flex-1 bg-white/[0.07]" />
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-slate-600">or answer directly</span>
                <span className="h-px flex-1 bg-white/[0.07]" />
              </div>

              <label htmlFor={inputId} className="sr-only">Custom answer</label>
              <div className="flex items-center gap-2 rounded-[14px] border border-white/[0.08] bg-black/20 p-1.5 focus-within:border-sky-300/35 focus-within:ring-1 focus-within:ring-sky-300/15">
                <SparklesIcon className="ml-2 size-3.5 shrink-0 text-sky-300/55" />
                <input
                  id={inputId}
                  value={custom}
                  onChange={(event) => setCustom(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submit();
                  }}
                  placeholder="Chat about this…"
                  className="h-8 min-w-0 flex-1 bg-transparent text-xs text-slate-200 outline-none placeholder:text-slate-600"
                />
                <button
                  type="button"
                  aria-label="Submit answer"
                  onClick={submit}
                  disabled={!answer}
                  className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-sky-300 text-sky-950 transition-colors hover:bg-sky-200 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  <ArrowRightIcon className="size-3.5" />
                </button>
              </div>

              <footer className="mt-5 flex items-center justify-between border-t border-dashed border-sky-200/15 pt-4">
                <button
                  type="button"
                  onClick={skip}
                  className="text-[11px] font-medium text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
                >
                  Skip question
                </button>
                <button
                  type="button"
                  onClick={submit}
                  disabled={!answer}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-sky-300 px-4 text-xs font-semibold text-sky-950 transition-colors hover:bg-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-200 focus-visible:ring-offset-2 focus-visible:ring-offset-[#11171a] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Use this answer <CheckIcon className="size-3.5" />
                </button>
              </footer>
            </motion.div>
          ) : (
            <motion.div
              key="ask-receipt"
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex min-h-[390px] flex-col items-center justify-center px-6 py-10 text-center"
            >
              <span
                className={`grid size-12 place-items-center rounded-[16px] ${
                  status === "answered" ? "bg-sky-300/10 text-sky-300" : "bg-slate-400/10 text-slate-400"
                }`}
              >
                {status === "answered" ? <CheckIcon className="size-5" /> : <CircleAlertIcon className="size-5" />}
              </span>
              <p className="mt-4 font-runde text-base font-semibold text-slate-100">
                {status === "answered" ? "Answer recorded" : "Question skipped"}
              </p>
              <p className="mt-2 max-w-[420px] text-xs leading-5 text-slate-500">
                {status === "answered" ? `“${answer}”` : "The agent will continue without an explicit preference."}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-5 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/70"
              >
                <RotateCcwIcon className="size-3" /> Reset ticket
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <span className="absolute -left-3 top-[74px] size-6 rounded-full border border-sky-300/20 bg-background" />
        <span className="absolute -right-3 top-[74px] size-6 rounded-full border border-sky-300/20 bg-background" />
      </div>
    </motion.article>
  );
}
