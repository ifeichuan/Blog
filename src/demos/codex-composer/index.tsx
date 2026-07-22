import { useState, useRef, useCallback } from "react";
import { LayoutGroup, MotionConfig } from "motion/react";
import { Thread } from "./Thread";
import { ComposerFull } from "./ComposerFull";

export type Ticket = {
  id: string;
  kind: "ASK" | "APPROVAL";
  action: "accept" | "decline" | "allow" | "deny";
  title: string;
  rows: { key: string; value: string }[];
  status: "optimistic" | "acked" | "failed";
  createdAt: string;
};

export type ComposerMode = "chat" | "ask" | "approval";
export type Phase = "idle" | "interacting" | "printing" | "handoff" | "sending";

export default function CodexComposerDemo() {
  const [width, setWidth] = useState(680);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  // Shared state
  const [mode, setMode] = useState<ComposerMode>("chat");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const sendStarted = useRef(new Set<string>());

  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  const beginTicket = useCallback((ticket: Ticket) => {
    setTickets((prev) => [...prev, ticket]);
    setActiveTicketId(ticket.id);
    setPhase("printing");
  }, []);

  const startHandoff = useCallback(() => {
    setMode("chat");
    setPhase("handoff");
  }, []);

  // Stream segments for Thread
  const [streamSegments, setStreamSegments] = useState<string[]>([]);

  const completeHandoff = useCallback((ticket: Ticket) => {
    if (sendStarted.current.has(ticket.id)) return;
    sendStarted.current.add(ticket.id);
    setPhase("sending");
    setMode("chat");
    // Simulate network
    setTimeout(() => {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: "acked" } : t)),
      );
      setActiveTicketId(null);
      setPhase("idle");
      // If ask was accepted, queue next streaming segment
      if (ticket.kind === "ASK" && ticket.action === "accept") {
        setStreamSegments((prev) => [
          ...prev,
          "好的，按照你的选择「" + ticket.rows[0]?.value + "」继续。\n\n开始执行重构：\n\n```bash\nmkdir -p src/utils/date\nmv src/utils/format.ts src/utils/date/index.ts\n```\n\n文件已移动，正在更新 import 路径…",
        ]);
      }
    }, 500);
  }, []);

  // Drag logic
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setWidth(Math.max(380, Math.min(e.clientX - rect.left, 900)));
  }, []);
  const handlePointerUp = useCallback(() => { dragging.current = false; }, []);

  const transition = {
    duration: 0.22,
    ease: [0.23, 1, 0.32, 1] as const,
    layout: { type: "spring" as const, stiffness: 285, damping: 27, mass: 0.82, bounce: 0.14 },
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{Math.round(width)}px</span>
        <div className="flex gap-1">
          {(["chat", "ask", "approval"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setMode(m);
                setPhase(m === "chat" ? "idle" : "interacting");
              }}
              className={`rounded px-2 py-0.5 text-xs ${mode === m ? "bg-foreground text-background" : "bg-foreground/10"}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative flex flex-col border border-dashed border-border rounded-[28px] bg-background overflow-hidden"
        style={{ width, height: 540 }}
      >
        <MotionConfig transition={transition}>
          <LayoutGroup id="composer-ticket">
            <Thread
              tickets={tickets}
              activeTicket={activeTicket}
              phase={phase}
              streamSegments={streamSegments}
              onHandoffComplete={completeHandoff}
            />
            <div className="shrink-0 p-2">
              <ComposerFull
                width={width - 16}
                mode={mode}
                phase={phase}
                activeTicket={activeTicket}
                onSubmitChat={(text) => console.log("chat:", text)}
                onBeginTicket={beginTicket}
                onStartHandoff={startHandoff}
              />
            </div>
          </LayoutGroup>
        </MotionConfig>
        {/* Drag handle */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-foreground/5 rounded-r-[28px] transition-colors"
        >
          <div className="h-8 w-1 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}
