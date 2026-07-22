import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import {
  PlusIcon,
  MicIcon,
  ArrowUpIcon,
  CheckIcon,
  XIcon,
  ShieldCheckIcon,
  ShieldXIcon,
} from "lucide-react";
import type { Ticket, ComposerMode, Phase } from "./index";

type Props = {
  width: number;
  mode: ComposerMode;
  phase: Phase;
  activeTicket: Ticket | null;
  onSubmitChat: (text: string) => void;
  onBeginTicket: (ticket: Ticket) => void;
  onStartHandoff: () => void;
};

const ASK_QUESTION = {
  prompt: "你希望用什么方式处理旧的 format.ts？",
  options: [
    { id: "reexport", label: "保留 re-export" },
    { id: "delete", label: "直接删除" },
    { id: "deprecate", label: "标记 deprecated" },
  ],
};

const APPROVAL_ACTION = {
  tool: "Bash",
  command: "rm -rf ./dist && bun run build",
};

export function UnifiedComposer({
  width,
  mode,
  phase,
  activeTicket,
  onSubmitChat,
  onBeginTicket,
  onStartHandoff,
}: Props) {
  const [input, setInput] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  void width; // reserved for compact breakpoint

  const handleChat = useCallback(() => {
    const text = input.trim();
    if (!text) return;
    onSubmitChat(text);
    setInput("");
  }, [input, onSubmitChat]);

  const handleAsk = useCallback(
    (action: "accept" | "decline") => {
      const ticket: Ticket = {
        id: `ASK-${Date.now().toString(36).toUpperCase()}`,
        kind: "ASK",
        action,
        title: action === "accept" ? "用户已回答" : "用户关闭提问",
        rows:
          action === "accept" && selected
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
        rows: [
          { key: "tool", value: APPROVAL_ACTION.tool },
          { key: "command", value: APPROVAL_ACTION.command },
        ],
        status: "optimistic",
        createdAt: new Date().toISOString(),
      };
      onBeginTicket(ticket);
    },
    [onBeginTicket],
  );

  return (
    <div className="overflow-hidden rounded-[20px] border border-border bg-background">
      <motion.div layout="position" className="relative flex flex-col">
        {/* Interaction panel — ask/approval form */}
        <AnimatePresence mode="popLayout" initial={false}>
          {mode === "ask" && phase === "interacting" && (
            <motion.div
              key="ask-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="px-4 pt-4 pb-2"
            >
              <p className="text-sm font-medium text-foreground">{ASK_QUESTION.prompt}</p>
              <div className="mt-3 flex flex-col gap-1.5">
                {ASK_QUESTION.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelected(selected === opt.id ? null : opt.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors text-left",
                      selected === opt.id
                        ? "border-emerald-500 bg-emerald-500/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-foreground/3",
                    )}
                  >
                    <span className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected === opt.id ? "border-emerald-500 bg-emerald-500 text-white" : "border-border",
                    )}>
                      {selected === opt.id && <CheckIcon className="size-2.5" />}
                    </span>
                    {opt.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {mode === "approval" && phase === "interacting" && (
            <motion.div
              key="approval-form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              className="px-4 pt-4 pb-2"
            >
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
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onAnimationComplete={onStartHandoff}
            style={{ zIndex: 40 }}
          >
            <TicketCard ticket={activeTicket} />
          </motion.div>
        )}

        {/* Textarea — hidden during printing */}
        {phase !== "printing" && (
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                if (mode === "chat") handleChat();
              }
            }}
            placeholder={mode === "ask" ? "Chat about this…" : "Ask a follow-up…"}
            rows={1}
            spellCheck={false}
            className="w-full min-h-[38px] max-h-[200px] resize-none bg-transparent px-5 pt-4 pb-2 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
          />
        )}

        {/* Action bar */}
        <div className="flex items-center gap-1 px-3 pb-3">
          <button
            type="button"
            className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
          >
            <PlusIcon className="size-4" />
          </button>

          <div className="ml-auto flex items-center gap-1">
            {mode === "ask" && phase === "interacting" && (
              <>
                <button
                  onClick={() => handleAsk("decline")}
                  className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-foreground/5"
                >
                  <XIcon className="size-3.5" />
                  Decline
                </button>
                <button
                  onClick={() => handleAsk("accept")}
                  disabled={!selected}
                  className={cn(
                    "flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium",
                    selected ? "bg-emerald-500 text-white" : "bg-foreground/10 text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <CheckIcon className="size-3.5" />
                  Accept
                </button>
              </>
            )}

            {mode === "approval" && phase === "interacting" && (
              <>
                <button
                  onClick={() => handleApproval("deny")}
                  className="flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-foreground/5"
                >
                  <ShieldXIcon className="size-3.5" />
                  Deny
                </button>
                <button
                  onClick={() => handleApproval("allow")}
                  className="flex h-7 items-center gap-1 rounded-full bg-emerald-500 px-2.5 text-xs font-medium text-white"
                >
                  <ShieldCheckIcon className="size-3.5" />
                  Allow
                </button>
              </>
            )}

            {mode === "chat" && (
              <>
                <button
                  type="button"
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                >
                  <MicIcon className="size-4" />
                </button>
                <button
                  onClick={handleChat}
                  disabled={!input.trim()}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full",
                    input.trim()
                      ? "bg-foreground text-background"
                      : "bg-foreground/10 text-muted-foreground cursor-not-allowed",
                  )}
                >
                  <ArrowUpIcon className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Ticket card (shared between composer and thread) ---

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const accepted = ticket.action === "accept" || ticket.action === "allow";
  const stamp = ticket.action === "accept" ? "ACCEPTED" : ticket.action === "allow" ? "ALLOWED" : ticket.action === "deny" ? "DENIED" : "DECLINED";

  return (
    <div className={cn(
      "rounded-xl border p-3 text-xs",
      accepted ? "border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950" : "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950",
    )}>
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">{ticket.kind} · {ticket.id}</span>
        <span className={cn("font-semibold", accepted ? "text-emerald-600" : "text-red-600")}>{stamp}</span>
      </div>
      <p className="mt-1 text-sm font-medium text-foreground">{ticket.title}</p>
      {ticket.rows.map((row) => (
        <p key={row.key} className="mt-0.5 text-muted-foreground">
          <span className="font-medium text-foreground">{row.key}</span> · {row.value}
        </p>
      ))}
      <p className="mt-1.5 text-muted-foreground/60">{ticket.status}</p>
    </div>
  );
}
