import { useEffect, useRef, useState } from "react";
import {
  useIncremark,
  Incremark,
  IncremarkContent,
} from "@incremark/react";
import "@incremark/theme/styles.css";
import { AnimatePresence, motion } from "motion/react";
import { TicketCard } from "./ComposerFull";
import type { Ticket, Phase } from "./index";

type Props = {
  tickets: Ticket[];
  activeTicket: Ticket | null;
  phase: Phase;
  streamSegments: string[];
  onHandoffComplete: (ticket: Ticket) => void;
};

const MOCK_MESSAGES = [
  { id: "1", role: "assistant" as const, content: "好的，我来分析 `format.ts` 的结构并开始重构。" },
];

const STREAMING_CONTENT = "分析完成。`format.ts` 包含 3 个日期函数：\n\n- `formatDate()` — 基础格式化\n- `formatRelative()` — 相对时间\n- `formatRange()` — 日期范围\n\n准备拆分到 `src/utils/date/` 目录。";

export function Thread({ tickets, activeTicket, phase, streamSegments, onHandoffComplete }: Props) {
  const threadRef = useRef<HTMLDivElement>(null);
  const [streaming, setStreaming] = useState(true);
  const streamIdx = useRef(0);
  const [completedSegments, setCompletedSegments] = useState<string[]>([]);
  const [activeSegmentIdx, setActiveSegmentIdx] = useState(-1);
  const segmentStreamIdx = useRef(0);

  const im = useIncremark({
    gfm: true,
    typewriter: { enabled: true, charsPerTick: [2, 4], tickInterval: 20, effect: "fade-in" },
  });

  // Second incremark instance for post-ticket streaming
  const im2 = useIncremark({
    gfm: true,
    typewriter: { enabled: true, charsPerTick: [2, 4], tickInterval: 20, effect: "fade-in" },
  });

  // Initial streaming
  useEffect(() => {
    if (!streaming) return;
    const interval = setInterval(() => {
      const nextIdx = Math.min(streamIdx.current + 8, STREAMING_CONTENT.length);
      const delta = STREAMING_CONTENT.slice(streamIdx.current, nextIdx);
      if (delta) im.append(delta);
      streamIdx.current = nextIdx;
      if (nextIdx >= STREAMING_CONTENT.length) {
        im.finalize();
        setStreaming(false);
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stream new segments when they arrive
  useEffect(() => {
    if (streamSegments.length === 0) return;
    const newIdx = streamSegments.length - 1;
    if (newIdx <= activeSegmentIdx) return;

    // Finalize previous segment if any
    if (activeSegmentIdx >= 0) {
      im2.finalize();
      im2.typewriter.skip();
      setCompletedSegments((prev) => [...prev, streamSegments[activeSegmentIdx]]);
    }

    // Start new segment
    setActiveSegmentIdx(newIdx);
    im2.reset();
    segmentStreamIdx.current = 0;

    const content = streamSegments[newIdx];
    const interval = setInterval(() => {
      const nextIdx = Math.min(segmentStreamIdx.current + 8, content.length);
      const delta = content.slice(segmentStreamIdx.current, nextIdx);
      if (delta) im2.append(delta);
      segmentStreamIdx.current = nextIdx;
      if (nextIdx >= content.length) {
        im2.finalize();
        clearInterval(interval);
      }
    }, 30);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamSegments.length]);

  // Auto scroll on ticket phases
  useEffect(() => {
    if (phase === "printing" || phase === "handoff" || phase === "sending") {
      requestAnimationFrame(() => {
        threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: "auto" });
      });
    }
  }, [phase, tickets.length]);

  return (
    <motion.div
      ref={threadRef}
      layoutScroll
      className="flex-1 overflow-y-auto px-5 py-4 space-y-3"
    >
      {/* Static messages */}
      {MOCK_MESSAGES.map((msg) => (
        <motion.div layout key={msg.id} className="text-sm">
          <IncremarkContent content={msg.content} isFinished />
        </motion.div>
      ))}

      {/* Streaming message */}
      <motion.div layout className="text-sm">
        <Incremark incremark={im} showBlockStatus={false} />
      </motion.div>

      {/* Tickets in thread */}
      <AnimatePresence initial={false} mode="popLayout">
        {tickets.map((ticket) => {
          const isActive = ticket.id === activeTicket?.id;
          return (
            <motion.div
              layout
              key={ticket.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Reservation: hidden placeholder to pre-reserve space */}
              {isActive && phase === "printing" && (
                <div className="opacity-0 pointer-events-none" aria-hidden>
                  <TicketCard ticket={ticket} />
                </div>
              )}

              {/* Handoff: ticket flying in from composer via shared layoutId */}
              {isActive && phase === "handoff" && (
                <motion.div
                  layout="position"
                  layoutId={`ticket-${ticket.id}`}
                  onLayoutAnimationComplete={() => onHandoffComplete(ticket)}
                  style={{ zIndex: 40 }}
                >
                  <TicketCard ticket={ticket} />
                </motion.div>
              )}

              {/* Settled ticket */}
              {isActive && (phase === "sending" || phase === "idle") && (
                <motion.div layout>
                  <TicketCard ticket={ticket} />
                </motion.div>
              )}

              {/* Non-active tickets (already settled) */}
              {!isActive && (
                <motion.div layout>
                  <TicketCard ticket={ticket} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      {/* Post-ticket streaming segments */}
      {completedSegments.map((seg, i) => (
        <div key={`seg-${i}`} className="text-sm">
          <IncremarkContent content={seg} isFinished />
        </div>
      ))}
      {activeSegmentIdx >= 0 && (
        <div className="text-sm">
          <Incremark incremark={im2} showBlockStatus={false} />
        </div>
      )}
      <div className="h-4" aria-hidden />
    </motion.div>
  );
}
