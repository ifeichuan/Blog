import { useState } from "react";
import { motion } from "motion/react";
import { StickerForgeStudio } from "./StickerForgeStudio";
import { DescriptionPanel, type StickerMeta } from "./DescriptionPanel";

const COMPONENTS = [
  "Codex Composer",
  "Composer Standalone",
  "Composer Unified",
  "Liquid Connector React",
  "Interaction Tickets",
  "Sticker Forge",
];

const META: StickerMeta = {
  name: "Sticker Forge",
  description:
    "Tactile WebGL die-cut sticker with a draggable peel edge, depth-aware shadow, and synthesized peel audio.",
  sourceUrl: "https://github.com/CatsJuice/sticker-forge",
  dependencies: [{ name: "three" }, { name: "react" }],
  interaction:
    "Grab the real die-cut edge and drag inward. The sticker curls in WebGL, reveals its satin back, and drives peel audio from pointer velocity.",
  usage: `import { StickerForgeStudio } from "@/components/sticker-forge/StickerForgeStudio";

<StickerForgeStudio />`,
  props: [
    {
      name: "source",
      type: "StickerSource",
      description: "Text, rich text, image, or sanitized SVG artwork.",
    },
    {
      name: "outline",
      type: "{ width?; color? }",
      default: '{ width: 18, color: "#ffffff" }',
      description: "Die-cut border generated from the artwork alpha silhouette.",
    },
    {
      name: "peel",
      type: "StickerPeelOptions",
      default: '{ radius: 0.12, stiffness: 0.72, release: "snap" }',
      description: "Curl radius, stiffness, grab band, max angle, and release behavior.",
    },
    {
      name: "shadow",
      type: "StickerShadowOptions",
      description: "Depth-aware projected shadow color, opacity, blur, distance, and angle.",
    },
    {
      name: "back",
      type: "StickerBackOptions",
      description: "Back-surface color, gloss, and roughness.",
    },
    {
      name: "sound",
      type: "StickerSoundOptions",
      description: "Velocity-driven peel foley, custom source, enabled state, and volume.",
    },
  ],
  credits: [
    "Sticker engine and studio: CatsJuice/sticker-forge (MIT)",
    "Outer showcase pattern: Rare UI",
  ],
};

function Sidebar({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-40">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close components sidebar" : "Open components sidebar"}
        className="pointer-events-auto absolute left-4 top-4 z-50 grid size-9 place-items-center rounded-lg bg-popover text-foreground/60 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
          <path d="M9 4v16" fill="none" stroke="currentColor" strokeWidth="1.8" />
        </svg>
      </button>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : -320 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="pointer-events-auto h-full w-[300px] rounded-[28px] bg-card p-4 pl-6"
      >
        <h2 className="mt-16 text-sm font-semibold text-foreground">Components</h2>
        <ul className="relative mt-4 flex flex-col gap-1 pl-6">
          <span className="absolute left-2 top-[168px] size-1.5 rounded-full bg-[#FC4C01]" />
          {COMPONENTS.map((name) => (
            <li key={name}>
              <span
                className={
                  name === "Sticker Forge"
                    ? "flex rounded-lg p-1 text-sm text-foreground"
                    : "flex rounded-lg p-1 text-sm text-foreground/55"
                }
              >
                {name}
              </span>
            </li>
          ))}
        </ul>
      </motion.aside>
    </div>
  );
}

export default function StickerForgeShowcase() {
  const [navOpen, setNavOpen] = useState(true);
  const [descOpen, setDescOpen] = useState(false);

  return (
    <div className="h-screen overflow-hidden bg-background p-2">
      <div className="relative flex h-full min-w-0 overflow-hidden">
        <Sidebar open={navOpen} onToggle={() => setNavOpen((value) => !value)} />

        <motion.div
          initial={false}
          animate={{
            paddingLeft: navOpen ? 308 : 0,
            paddingRight: descOpen ? 440 : 0,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="h-full min-w-0 flex-1"
        >
          <div className="relative h-full overflow-hidden rounded-[45px] bg-card p-4">
            <div className="h-full overflow-hidden rounded-[32px] bg-[#e8e7e2]">
              <StickerForgeStudio />
            </div>
          </div>
        </motion.div>

        <DescriptionPanel
          meta={META}
          open={descOpen}
          onToggle={() => setDescOpen((value) => !value)}
        />
      </div>
    </div>
  );
}
