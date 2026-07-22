import { useState } from "react";
import { motion } from "motion/react";
import {
  Check,
  Copy,
  ExternalLink,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

export interface StickerProp {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

export interface StickerMeta {
  name: string;
  description: string;
  sourceUrl?: string;
  dependencies: { name: string }[];
  interaction?: string;
  usage?: string;
  props?: StickerProp[];
  credits?: string[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-wider text-foreground/40">
      {children}
    </p>
  );
}

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md p-1.5 text-foreground/50 transition-colors hover:bg-muted hover:text-foreground"
      aria-label="Copy code"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-500" />
      ) : (
        <Copy className="size-3.5" />
      )}
    </button>
  );
}

export function DescriptionPanel({
  meta,
  open,
  onToggle,
}: {
  meta: StickerMeta;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close description" : "Open description"}
        className="fixed right-[430px] top-5 z-[55] inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/80 px-3 py-1.5 text-[11px] font-medium text-foreground/70 backdrop-blur transition-colors hover:text-foreground"
      >
        {open ? (
          <PanelRightClose className="size-3.5" />
        ) : (
          <PanelRightOpen className="size-3.5" />
        )}
        {open ? "Hide" : "Info"}
      </button>

      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : 440, opacity: open ? 1 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 32 }}
        className="absolute inset-y-0 right-0 z-40 w-[420px] overflow-hidden rounded-[28px] border-l border-border bg-background shadow-xl"
      >
        <div
          data-lenis-prevent
          className="h-full w-[420px] overflow-y-auto p-7 pt-16"
        >
          <div className="flex flex-col gap-10 text-left">
            <div className="flex flex-col gap-3">
              <SectionLabel>{meta.name}</SectionLabel>
              <p className="text-xl font-semibold leading-relaxed text-foreground/90">
                {meta.description}
              </p>
            </div>

            {meta.dependencies.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionLabel>Dependencies</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {meta.dependencies.map((dep) => (
                    <span
                      key={dep.name}
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 font-mono text-[11px] text-foreground/75"
                    >
                      {dep.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {meta.interaction && (
              <div className="flex flex-col gap-3">
                <SectionLabel>Interaction</SectionLabel>
                <p className="text-sm leading-relaxed text-foreground/70">
                  {meta.interaction}
                </p>
              </div>
            )}

            {meta.props && meta.props.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionLabel>Props</SectionLabel>
                <div className="flex flex-col">
                  <div className="flex gap-3 border-b border-border/50 px-1 pb-2 text-[10px] font-medium uppercase tracking-wider text-foreground/45">
                    <div className="w-20 shrink-0">Prop</div>
                    <div className="w-28 shrink-0">Type</div>
                    <div className="flex-1">Description</div>
                  </div>
                  {meta.props.map((prop) => (
                    <div
                      key={prop.name}
                      className="flex items-start gap-3 border-b border-border/40 px-1 py-3.5"
                    >
                      <div className="w-20 shrink-0">
                        <code className="whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground/75">
                          {prop.name}
                          {prop.required && (
                            <span className="text-orange-500">*</span>
                          )}
                        </code>
                      </div>
                      <div className="w-28 shrink-0 pt-0.5">
                        <code className="font-mono text-[11px] leading-relaxed text-foreground/55">
                          {prop.type}
                        </code>
                        {prop.default && (
                          <p className="mt-1 font-mono text-[10px] text-foreground/35">
                            {prop.default}
                          </p>
                        )}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p className="text-[13px] leading-relaxed text-foreground/85">
                          {prop.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {meta.usage && (
              <div className="flex flex-col gap-3">
                <SectionLabel>How to use</SectionLabel>
                <div className="relative rounded-lg bg-muted p-4">
                  <div className="absolute right-2 top-2">
                    <CopyButton value={meta.usage} />
                  </div>
                  <pre className="overflow-x-auto text-[11px] leading-relaxed text-foreground/80">
                    <code>{meta.usage}</code>
                  </pre>
                </div>
              </div>
            )}

            {meta.sourceUrl && (
              <div className="flex flex-col gap-3">
                <SectionLabel>Source</SectionLabel>
                <a
                  href={meta.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-fit items-center gap-1.5 text-sm text-foreground/70 transition-colors hover:text-foreground"
                >
                  <ExternalLink className="size-3.5" />
                  {meta.sourceUrl.replace("https://", "")}
                </a>
              </div>
            )}

            {meta.credits && meta.credits.length > 0 && (
              <div className="flex flex-col gap-3">
                <SectionLabel>Credits</SectionLabel>
                <ul className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/70">
                  {meta.credits.map((credit) => (
                    <li key={credit} className="flex gap-2">
                      <span className="text-foreground/40">•</span>
                      <span>{credit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </motion.aside>
    </>
  );
}
