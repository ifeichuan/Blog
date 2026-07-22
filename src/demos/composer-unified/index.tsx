import { useState, useRef, useCallback } from "react";
import { LayoutGroup, MotionConfig } from "motion/react";
import { Thread } from "../codex-composer/Thread";
import { UnifiedComposer } from "../codex-composer/UnifiedComposer";
import type { Ticket, ComposerMode, Phase } from "../codex-composer/index";

export default function UnifiedComposerDemo() {
  const [width, setWidth] = useState(680);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const [mode, setMode] = useState<ComposerMode>("chat");
  const [phase, setPhase] = useState<Phase>("idle");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string | null>(null);
  const [streamSegments, setStreamSegments] = useState<string[]>([]);
  const sendStarted = useRef(new Set<string>());

  const activeTicket = tickets.find((t) => t.id === activeTicketId) ?? null;

  const beginTicket = useCallback((ticket: Ticket) => {
    setTickets((prev) => [...prev, ticket]);
    setActiveTicketId(ticket.id);
    setPhase("printing");
  }, []);

  const startHandoff = useCallback(() => { setPhase("handoff"); }, []);

  const completeHandoff = useCallback((ticket: Ticket) => {
    if (sendStarted.current.has(ticket.id)) return;
    sendStarted.current.add(ticket.id);
    setPhase("sending");
    setMode("chat");
    setTimeout(() => {
      setTickets((prev) => prev.map((t) => (t.id === ticket.id ? { ...t, status: "acked" } : t)));
      setActiveTicketId(null);
      setPhase("idle");
      if (ticket.kind === "ASK" && ticket.action === "accept") {
        setStreamSegments((prev) => [...prev, "好的，按照你的选择继续执行重构…"]);
      }
    }, 500);
  }, []);

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
    layout: { type: "spring" as const, stiffness: 285, damping: 27, mass: 0.82 },
  };

  return (
    <div className="flex h-full flex-col items-center justify-center p-8">
      <div className="mb-2 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{Math.round(width)}px</span>
        <div className="flex gap-1">
          {(["chat", "ask", "approval"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setPhase(m === "chat" ? "idle" : "interacting"); }} className={`rounded px-2 py-0.5 text-xs ${mode === m ? "bg-foreground text-background" : "bg-foreground/10"}`}>
              {m}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} className="relative flex flex-col border border-dashed border-border rounded-2xl bg-background overflow-hidden" style={{ width, height: 540 }}>
        <MotionConfig transition={transition}>
          <LayoutGroup id="composer-ticket">
            <Thread tickets={tickets} activeTicket={activeTicket} phase={phase} streamSegments={streamSegments} onHandoffComplete={completeHandoff} />
            <div className="shrink-0 p-2">
              <UnifiedComposer width={width - 16} mode={mode} phase={phase} activeTicket={activeTicket} onSubmitChat={(text) => console.log("chat:", text)} onBeginTicket={beginTicket} onStartHandoff={startHandoff} />
            </div>
          </LayoutGroup>
        </MotionConfig>
        <div onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize flex items-center justify-center hover:bg-foreground/5 rounded-r-2xl transition-colors">
          <div className="h-8 w-1 rounded-full bg-muted-foreground/30" />
        </div>
      </div>
    </div>
  );
}
