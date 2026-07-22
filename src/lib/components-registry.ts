import type { ComponentType } from "react";
import type { StickerMeta } from "@/components/sticker-forge/DescriptionPanel";

export type ComponentSlug =
  | "codex-composer"
  | "composer-standalone"
  | "composer-unified"
  | "liquid-connector-react"
  | "interaction-tickets"
  | "sticker-forge";

export type ComponentRegistryItem = StickerMeta & {
  slug: ComponentSlug;
  load: () => Promise<{ default: ComponentType }>;
  previewClassName?: string;
};

export const componentRegistry: ComponentRegistryItem[] = [
  {
    slug: "codex-composer",
    name: "Codex Composer",
    description:
      "Full composer with Thread, ask/approval tickets, and streaming markdown responses.",
    dependencies: [
      { name: "motion" },
      { name: "@base-ui/react" },
      { name: "@incremark/react" },
      { name: "lucide-react" },
    ],
    interaction:
      "Resize the stage, switch between chat/ask/approval modes, and watch ticket handoff into the thread.",
    usage: `import CodexComposerDemo from "@/demos/codex-composer";

export default function Page() {
  return <CodexComposerDemo />;
}`,
    props: [
      {
        name: "mode",
        type: '"chat" | "ask" | "approval"',
        description: "Composer interaction mode for chat, ask-user, or approval tickets.",
      },
      {
        name: "phase",
        type: '"idle" | "interacting" | "printing" | "handoff" | "sending"',
        description: "Lifecycle phase driving ticket printing and stream handoff.",
      },
    ],
    credits: ["Composer shell adapted from Rare UI codex-composer demo"],
    previewClassName: "bg-background",
    load: () => import("@/demos/codex-composer"),
  },
  {
    slug: "composer-standalone",
    name: "Composer Standalone",
    description:
      "CodexComposer action bar with pills, config popover, and width animation — no thread chrome.",
    dependencies: [
      { name: "motion" },
      { name: "@base-ui/react" },
      { name: "lucide-react" },
    ],
    interaction:
      "Open config popovers, switch providers/models, and submit from the floating action bar.",
    usage: `import CodexComposerStandaloneDemo from "@/demos/composer-standalone";

export default function Page() {
  return <CodexComposerStandaloneDemo />;
}`,
    props: [
      {
        name: "placeholder",
        type: "string",
        description: "Placeholder text for the composer input.",
      },
      {
        name: "onSubmit",
        type: "(value: string) => void",
        description: "Called when the composer submits a message.",
      },
    ],
    credits: ["Standalone shell adapted from Rare UI composer-standalone demo"],
    previewClassName: "bg-background",
    load: () => import("@/demos/composer-standalone"),
  },
  {
    slug: "composer-unified",
    name: "Composer Unified",
    description:
      "Original UnifiedComposer with ask/approval flows living inside the shell instead of floating pills.",
    dependencies: [
      { name: "motion" },
      { name: "lucide-react" },
      { name: "@incremark/react" },
    ],
    interaction:
      "Drive ask and approval tickets from a single unified composer shell and resolve them into the thread.",
    usage: `import ComposerUnifiedDemo from "@/demos/composer-unified";

export default function Page() {
  return <ComposerUnifiedDemo />;
}`,
    props: [
      {
        name: "mode",
        type: '"chat" | "ask" | "approval"',
        description: "Shared composer mode for chat, ask-user, and approval flows.",
      },
      {
        name: "tickets",
        type: "Ticket[]",
        description: "Optimistic ticket list printed into the thread during handoff.",
      },
    ],
    credits: ["Unified shell adapted from Rare UI composer-unified demo"],
    previewClassName: "bg-background",
    load: () => import("@/demos/composer-unified"),
  },
  {
    slug: "liquid-connector-react",
    name: "Liquid Connector React",
    description:
      "React-owned liquid card separation with arbitrary upper and lower content and peel geometry controls.",
    dependencies: [{ name: "motion" }, { name: "lucide-react" }],
    interaction:
      "Resolve the approval or ask flow to peel a compact receipt from the composer, then reset or scrub parameters.",
    usage: `import { LiquidConnector } from "@/demos/liquid-connector-react/LiquidConnector";

<LiquidConnector
  open={resolved}
  upperContent={<Receipt />}
  lowerContent={<Composer />}
/>`,
    props: [
      {
        name: "open",
        type: "boolean",
        required: true,
        description: "Separates the upper card from the lower surface when true.",
      },
      {
        name: "upperContent",
        type: "ReactNode",
        required: true,
        description: "React content rendered inside the separating card.",
      },
      {
        name: "lowerContent",
        type: "ReactNode",
        required: true,
        description: "React content rendered inside the composer surface.",
      },
    ],
    credits: [
      "Liquid path engine: zanwei/liquid-connector-web-component (MIT)",
      "Motion reference: Mikk Martin",
    ],
    previewClassName: "bg-background",
    load: () => import("@/demos/liquid-connector-react"),
  },
  {
    slug: "interaction-tickets",
    name: "Interaction Tickets",
    description:
      "Distinct Approval and AskUser tickets for human-in-the-loop agent interactions.",
    dependencies: [{ name: "motion" }, { name: "lucide-react" }],
    interaction:
      "Select an approval scope or answer option, then resolve the ticket into a receipt.",
    usage: `import {
  ApprovalTicket,
  AskUserTicket,
} from "@/demos/interaction-tickets/InteractionTickets";

<ApprovalTicket onAllow={(scope) => console.log(scope)} />
<AskUserTicket onAnswer={(answer) => console.log(answer)} />`,
    props: [
      {
        name: "onAllow",
        type: "(choice: ApprovalChoice) => void",
        description: "Called when an approval ticket is allowed.",
      },
      {
        name: "onDeny",
        type: "() => void",
        description: "Called when an approval ticket is denied.",
      },
      {
        name: "onAnswer",
        type: "(value: string) => void",
        description: "Called when an AskUser answer is submitted.",
      },
      {
        name: "onSkip",
        type: "() => void",
        description: "Called when the AskUser question is skipped.",
      },
    ],
    credits: ["Ticket study adapted from Rare UI interaction-tickets demo"],
    previewClassName: "bg-background",
    load: () => import("@/demos/interaction-tickets"),
  },
  {
    slug: "sticker-forge",
    name: "Sticker Forge",
    description:
      "Tactile WebGL die-cut sticker with a draggable peel edge, depth-aware shadow, and synthesized peel audio.",
    sourceUrl: "https://github.com/CatsJuice/sticker-forge",
    dependencies: [{ name: "three" }, { name: "react" }],
    interaction:
      "Grab the real die-cut edge and drag inward. The sticker curls in WebGL, reveals its satin back, and drives peel audio from pointer velocity.",
    usage: `import { StickerForgeStudio } from "@/components/sticker-forge/StickerForgeStudio";

export default function Page() {
  return <StickerForgeStudio />;
}`,
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
    previewClassName: "bg-[#e8e7e2]",
    load: async () => {
      const mod = await import("@/components/sticker-forge/StickerForgeStudio");
      return { default: mod.StickerForgeStudio };
    },
  },
];

export function componentBySlug(slug: string): ComponentRegistryItem | undefined {
  return componentRegistry.find((item) => item.slug === slug);
}
