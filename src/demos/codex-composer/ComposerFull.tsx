import { useRef, useState, useCallback } from "react";
import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  MicIcon,
  ArrowUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BrainIcon,
  SparklesIcon,
  CheckIcon,
  SettingsIcon,
  ShieldIcon,
  XIcon,
  ShieldCheckIcon,
  ShieldXIcon,
} from "lucide-react";
import type { Ticket, ComposerMode, Phase } from "./index";

type Provider = "claude" | "codex";
type Model = { id: string; label: string };
type Permission = "ask" | "auto-approve" | "full-access";

const PROVIDERS: Record<Provider, { label: string; models: Model[] }> = {
  claude: {
    label: "Claude",
    models: [
      { id: "opus-4", label: "Opus 4" },
      { id: "sonnet-4", label: "Sonnet 4" },
      { id: "haiku-4", label: "Haiku 4" },
    ],
  },
  codex: {
    label: "Codex",
    models: [
      { id: "o3", label: "o3" },
      { id: "o4-mini", label: "o4-mini" },
      { id: "gpt-4.1", label: "GPT-4.1" },
    ],
  },
};

const THINK_EFFORTS = ["low", "med", "high"] as const;
type ThinkEffort = (typeof THINK_EFFORTS)[number];

const PERMISSIONS: { id: Permission; label: string }[] = [
  { id: "ask", label: "Ask each time" },
  { id: "auto-approve", label: "Auto-approve" },
  { id: "full-access", label: "Full access" },
];

const PROVIDER_KEYS: Provider[] = ["claude", "codex"];

const BREAKPOINT = 520;

export type CodexComposerProps = {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
  width?: number;
};

const ASK_QUESTION = {
  prompt: "你希望用什么方式处理旧的 format.ts？",
  options: [
    { id: "reexport", label: "保留 re-export" },
    { id: "delete", label: "直接删除" },
    { id: "deprecate", label: "标记 deprecated" },
  ],
};
const APPROVAL_ACTION = { tool: "Bash", command: "rm -rf ./dist && bun run build" };

export type ComposerFullProps = {
  width?: number;
  mode: ComposerMode;
  phase: Phase;
  activeTicket: Ticket | null;
  onSubmitChat: (text: string) => void;
  onBeginTicket: (ticket: Ticket) => void;
  onStartHandoff: () => void;
};

const menuPopupClass = cn(
  "z-50 min-w-[160px] rounded-xl border border-border bg-popover p-1 shadow-lg",
  "origin-[var(--transform-origin)] transition-[transform,scale,opacity] data-[ending-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:scale-95 data-[starting-style]:opacity-0",
);

const menuItemClass =
  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none data-[highlighted]:bg-foreground/5 cursor-default";

const pillClass =
  "flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground cursor-default";

export function ComposerFull({
  width = 680,
  mode,
  phase,
  activeTicket,
  onSubmitChat,
  onBeginTicket,
  onStartHandoff,
}: ComposerFullProps) {
  const [value, setValue] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider>("claude");
  const [modelId, setModelId] = useState("opus-4");
  const [effort, setEffort] = useState<ThinkEffort>("med");
  const [permission, setPermission] = useState<Permission>("full-access");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const compact = width < BREAKPOINT;

  const currentModels = PROVIDERS[provider].models;
  const currentModel = currentModels.find((m) => m.id === modelId) ?? currentModels[0];

  const handleProviderChange = useCallback((value: string) => {
    const v = value as Provider;
    setProvider(v);
    setModelId(PROVIDERS[v].models[0].id);
  }, []);

  const handleSubmit = useCallback(
    (e?: React.SyntheticEvent) => {
      e?.preventDefault();
      const trimmed = value.trim();
      if (!trimmed) return;
      onSubmitChat(trimmed);
      setValue("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    },
    [value, onSubmitChat],
  );

  const handleAsk = useCallback(
    (action: "accept" | "decline") => {
      const ticket: Ticket = {
        id: `ASK-${Date.now().toString(36).toUpperCase()}`,
        kind: "ASK",
        action,
        title: action === "accept" ? "用户已回答" : "用户关闭提问",
        rows: action === "accept" && selected
          ? [{ key: ASK_QUESTION.prompt, value: ASK_QUESTION.options.find((o) => o.id === selected)?.label ?? selected }]
          : [{ key: "result", value: "declined" }],
        status: "optimistic",
        createdAt: new Date().toISOString(),
      };
      onBeginTicket(ticket);
      setSelected(null);
    },
    [selected, onBeginTicket],
  );

  const handleApproval = useCallback(
    (action: "allow" | "deny") => {
      const ticket: Ticket = {
        id: `APR-${Date.now().toString(36).toUpperCase()}`,
        kind: "APPROVAL",
        action,
        title: `${APPROVAL_ACTION.tool} ${action === "allow" ? "allowed" : "denied"}`,
        rows: [{ key: "tool", value: APPROVAL_ACTION.tool }, { key: "command", value: APPROVAL_ACTION.command }],
        status: "optimistic",
        createdAt: new Date().toISOString(),
      };
      onBeginTicket(ticket);
    },
    [onBeginTicket],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, []);

  // --- Config Column View (used in compact mode) ---
  type ConfigView = "root" | "provider" | "model" | "effort" | "permission";
  const [configView, setConfigView] = useState<ConfigView>("root");
  const [configDirection, setConfigDirection] = useState(1);

  const enterCategory = useCallback((cat: ConfigView) => {
    setConfigDirection(1);
    setConfigView(cat);
  }, []);

  const backToRoot = useCallback(() => {
    setConfigDirection(-1);
    setConfigView("root");
  }, []);

  const categories = [
    { id: "provider" as const, label: "Provider", value: PROVIDERS[provider].label },
    { id: "model" as const, label: "Model", value: currentModel.label },
    { id: "effort" as const, label: "Think Effort", value: effort },
    { id: "permission" as const, label: "Permission", value: PERMISSIONS.find((p) => p.id === permission)?.label },
  ];

  const configPopover = (
    <Popover.Root onOpenChange={(open) => { if (!open) setConfigView("root"); }}>
      <Popover.Trigger
        className="flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground cursor-default"
        aria-label="Config"
      >
        <SettingsIcon className="size-4" />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8} align="end">
          <Popover.Popup className={cn(menuPopupClass, "w-[180px] overflow-hidden p-0")}>
            <div className="relative">
              <AnimatePresence mode="popLayout" initial={false} custom={configDirection}>
                {configView === "root" ? (
                  <motion.div
                    key="root"
                    custom={configDirection}
                    initial={{ x: configDirection > 0 ? "100%" : "-100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: configDirection > 0 ? "-100%" : "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="p-1"
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => enterCategory(cat.id)}
                        className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs text-foreground outline-none hover:bg-foreground/5 cursor-default"
                      >
                        <span>{cat.label}</span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <span>{cat.value}</span>
                          <ChevronRightIcon className="size-3" />
                        </span>
                      </button>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    key={configView}
                    custom={configDirection}
                    initial={{ x: "100%", opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    className="p-1"
                  >
                    {/* Back header */}
                    <button
                      type="button"
                      onClick={backToRoot}
                      className="flex w-full items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
                    >
                      <ChevronLeftIcon className="size-3" />
                      {categories.find((c) => c.id === configView)?.label}
                    </button>
                    <div className="mt-0.5 flex flex-col">
                      {configView === "provider" &&
                        PROVIDER_KEYS.map((p) => (
                          <button
                            key={p}
                            type="button"
                            onClick={() => handleProviderChange(p)}
                            className={menuItemClass}
                          >
                            <span className="flex size-4 items-center justify-center">
                              {provider === p && <CheckIcon className="size-3.5" />}
                            </span>
                            {PROVIDERS[p].label}
                          </button>
                        ))}
                      {configView === "model" &&
                        currentModels.map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => setModelId(m.id)}
                            className={menuItemClass}
                          >
                            <span className="flex size-4 items-center justify-center">
                              {modelId === m.id && <CheckIcon className="size-3.5" />}
                            </span>
                            {m.label}
                          </button>
                        ))}
                      {configView === "effort" &&
                        THINK_EFFORTS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            onClick={() => setEffort(e)}
                            className={menuItemClass}
                          >
                            <span className="flex size-4 items-center justify-center">
                              {effort === e && <CheckIcon className="size-3.5" />}
                            </span>
                            {e}
                          </button>
                        ))}
                      {configView === "permission" &&
                        PERMISSIONS.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => setPermission(p.id)}
                            className={menuItemClass}
                          >
                            <span className="flex size-4 items-center justify-center">
                              {permission === p.id && <CheckIcon className="size-3.5" />}
                            </span>
                            {p.label}
                          </button>
                        ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );

  // ===================== FORM =====================
  const springTransition = { type: "spring" as const, stiffness: 300, damping: 32, mass: 0.8, restDelta: 0.5 };
  const easeOut: [number, number, number, number] = [0.23, 1, 0.32, 1];

  return (
    <div
      className="overflow-hidden rounded-[20px] border border-border bg-background focus-within:border-foreground/12 focus-within:shadow-[0_0_0_1px_rgba(0,0,0,0.05)]"
    >
      <motion.div layout className="relative flex flex-col">
        <form
          onSubmit={handleSubmit}
          className="group relative flex flex-col"
        >
        {/* Interaction panel — ask/approval form */}
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "ask" && phase === "interacting" && (
            <motion.div key="ask-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.2, ease: easeOut }} className="px-4 pt-4 pb-2">
              <p className="text-sm font-medium text-foreground">{ASK_QUESTION.prompt}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ASK_QUESTION.options.map((opt) => (
                  <button key={opt.id} type="button" onClick={() => setSelected(selected === opt.id ? null : opt.id)} className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left", selected === opt.id ? "border-emerald-500 bg-emerald-500/5 text-foreground" : "border-border text-muted-foreground hover:bg-foreground/3")}>
                    <span className={cn("flex size-4 shrink-0 items-center justify-center rounded-full border", selected === opt.id ? "border-emerald-500 bg-emerald-500 text-white" : "border-border")}>
                      {selected === opt.id && <CheckIcon className="size-2.5" />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
          {mode === "approval" && phase === "interacting" && (
            <motion.div key="approval-form" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.2, ease: easeOut }} className="px-4 pt-4 pb-2">
              <p className="text-sm font-medium text-foreground">需要执行以下操作：</p>
              <div className="mt-2 rounded-lg bg-foreground/3 px-3 py-2">
                <p className="font-mono text-xs text-foreground">{APPROVAL_ACTION.tool}</p>
                <p className="font-mono text-xs text-muted-foreground">{APPROVAL_ACTION.command}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Printing ticket — shared layoutId for FLIP to thread */}
        {phase === "printing" && activeTicket && (
          <motion.div
            layout="position"
            layoutId={`ticket-${activeTicket.id}`}
            className="mx-3 my-2"
            initial={{ opacity: 0, y: 92, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 310, damping: 25, mass: 0.78, bounce: 0.18 }}
            onAnimationComplete={onStartHandoff}
            style={{ zIndex: 40 }}
          >
            <TicketCard ticket={activeTicket} />
          </motion.div>
        )}

        {/* Textarea + Action bar — animate in/out */}
        <AnimatePresence initial={false}>
          {phase !== "printing" && (
            <motion.div
              key="input-slot"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: easeOut }}
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder={mode === "ask" ? "Chat about this…" : "Ask a follow-up…"}
                disabled={phase === "handoff" || phase === "sending"}
                rows={1}
                spellCheck={false}
                className="w-full min-h-[38px] max-h-[200px] resize-none bg-transparent px-5 pt-4 pb-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action bar */}
        <motion.div layout="position" className="flex items-center gap-1 px-3 pb-3">
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Attach file"
          >
            <PlusIcon className="size-4" />
          </button>

          {/* Ask/Approval action buttons */}
          {mode === "ask" && phase === "interacting" && (
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => handleAsk("decline")} className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-foreground/5">
                <XIcon className="size-3.5" /> Decline
              </button>
              <button type="button" onClick={() => handleAsk("accept")} disabled={!selected} className={cn("flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium", selected ? "bg-emerald-500 text-white" : "bg-foreground/10 text-muted-foreground cursor-not-allowed")}>
                <CheckIcon className="size-3.5" /> Accept
              </button>
            </div>
          )}
          {mode === "approval" && phase === "interacting" && (
            <div className="ml-auto flex items-center gap-1">
              <button type="button" onClick={() => handleApproval("deny")} className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-foreground/5">
                <ShieldXIcon className="size-3.5" /> Deny
              </button>
              <button type="button" onClick={() => handleApproval("allow")} className="flex h-7 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-xs font-medium text-white">
                <ShieldCheckIcon className="size-3.5" /> Allow
              </button>
            </div>
          )}

          {/* Chat mode: Pills + Config + Mic + Send */}
          {mode === "chat" && (<>
          {/* Pills container */}
          <motion.div
            animate={{ width: compact ? 0 : "auto" }}
            transition={springTransition}
            className="ml-auto flex items-center gap-1 overflow-hidden"
            style={{ maskImage: "linear-gradient(to right, black calc(100% - 8px), transparent)" }}
          >
            <div className="shrink-0">
              <Menu.Root>
                <Menu.Trigger className={pillClass}>
                  <ShieldIcon className="size-3.5" />
                  {PERMISSIONS.find((p) => p.id === permission)?.label}
                  <ChevronDownIcon className="size-3" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="end">
                    <Menu.Popup className={menuPopupClass}>
                      <Menu.RadioGroup value={permission} onValueChange={(v) => setPermission(v as Permission)}>
                        {PERMISSIONS.map((p) => (
                          <Menu.RadioItem key={p.id} value={p.id} className={menuItemClass}>
                            <span className="flex size-4 items-center justify-center">
                              <Menu.RadioItemIndicator>
                                <CheckIcon className="size-3.5" />
                              </Menu.RadioItemIndicator>
                            </span>
                            {p.label}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>

            <div className="shrink-0">
              <Menu.Root>
                <Menu.Trigger className={pillClass}>
                  <BrainIcon className="size-3.5" />
                  {effort}
                  <ChevronDownIcon className="size-3" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="end">
                    <Menu.Popup className={menuPopupClass}>
                      <Menu.RadioGroup value={effort} onValueChange={(v) => setEffort(v as ThinkEffort)}>
                        {THINK_EFFORTS.map((e) => (
                          <Menu.RadioItem key={e} value={e} className={menuItemClass}>
                            <span className="flex size-4 items-center justify-center">
                              <Menu.RadioItemIndicator>
                                <CheckIcon className="size-3.5" />
                              </Menu.RadioItemIndicator>
                            </span>
                            {e}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>

            <div className="shrink-0">
              <Menu.Root>
                <Menu.Trigger className={pillClass}>
                  {currentModel.label}
                  <ChevronDownIcon className="size-3" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="end">
                    <Menu.Popup className={menuPopupClass}>
                      <Menu.RadioGroup value={modelId} onValueChange={setModelId}>
                        {currentModels.map((m) => (
                          <Menu.RadioItem key={m.id} value={m.id} className={menuItemClass}>
                            <span className="flex size-4 items-center justify-center">
                              <Menu.RadioItemIndicator>
                                <CheckIcon className="size-3.5" />
                              </Menu.RadioItemIndicator>
                            </span>
                            {m.label}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>

            <div className="shrink-0">
              <Menu.Root>
                <Menu.Trigger className={pillClass}>
                  <SparklesIcon className="size-3.5" />
                  {PROVIDERS[provider].label}
                  <ChevronDownIcon className="size-3" />
                </Menu.Trigger>
                <Menu.Portal>
                  <Menu.Positioner sideOffset={8} align="end">
                    <Menu.Popup className={menuPopupClass}>
                      <Menu.RadioGroup value={provider} onValueChange={handleProviderChange}>
                        {PROVIDER_KEYS.map((p) => (
                          <Menu.RadioItem key={p} value={p} className={menuItemClass}>
                            <span className="flex size-4 items-center justify-center">
                              <Menu.RadioItemIndicator>
                                <CheckIcon className="size-3.5" />
                              </Menu.RadioItemIndicator>
                            </span>
                            {PROVIDERS[p].label}
                          </Menu.RadioItem>
                        ))}
                      </Menu.RadioGroup>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.Root>
            </div>
          </motion.div>

          {/* Config — only in compact, fades in */}
          <motion.div
            animate={{ opacity: compact ? 1 : 0, scale: compact ? 1 : 0.8 }}
            transition={{ duration: 0.2 }}
            className={cn("shrink-0", !compact && "pointer-events-none w-0")}
          >
            {configPopover}
          </motion.div>
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-foreground/5 hover:text-foreground"
            aria-label="Dictation"
          >
            <MicIcon className="size-4" />
          </button>

          {/* Send button */}
          <button
            type="submit"
            disabled={!value.trim()}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full transition-colors",
              value.trim()
                ? "bg-foreground text-background hover:bg-foreground/90"
                : "bg-foreground/10 text-muted-foreground cursor-not-allowed",
            )}
            aria-label="Send"
          >
            <ArrowUpIcon className="size-4" />
          </button>
          </>)}
        </motion.div>
      </form>
      </motion.div>
    </div>
  );
}

// --- Ticket Card ---
export function TicketCard({ ticket }: { ticket: Ticket }) {
  const accepted = ticket.action === "accept" || ticket.action === "allow";
  const stamp = ticket.action === "accept" ? "ACCEPTED" : ticket.action === "allow" ? "ALLOWED" : ticket.action === "deny" ? "DENIED" : "DECLINED";
  return (
    <motion.article layout="position" className={cn("rounded-xl border p-3 text-xs", accepted ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950")} style={{ borderRadius: 12 }}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{ticket.kind} · {ticket.id}</span>
        <span className={cn("font-semibold", accepted ? "text-emerald-600" : "text-red-600")}>{stamp}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
      {ticket.rows.map((row) => (<p key={row.key} className="mt-0.5 text-muted-foreground"><span className="font-medium text-foreground">{row.key}</span> · {row.value}</p>))}
      <p className="mt-1.5 text-muted-foreground/60">{ticket.status}</p>
    </motion.article>
  );
}
