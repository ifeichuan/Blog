import { Suspense, lazy, useMemo, useState, type ComponentType } from "react";
import { motion } from "motion/react";
import { DescriptionPanel } from "@/components/sticker-forge/DescriptionPanel";
import {
  componentRegistry,
  type ComponentRegistryItem,
  type ComponentSlug,
} from "@/lib/components-registry";
import { ShapeProvider } from "@/lib/shape-context";
import { IconProvider } from "@/lib/icon-context";
import { cn } from "@/lib/utils";

function Sidebar({
  open,
  onToggle,
  activeSlug,
  onSelect,
  items,
}: {
  open: boolean;
  onToggle: () => void;
  activeSlug: ComponentSlug;
  onSelect: (slug: ComponentSlug) => void;
  items: ComponentRegistryItem[];
}) {
  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.slug === activeSlug),
  );

  return (
    <div className="pointer-events-none absolute inset-y-0 left-0 z-40">
      <button
        type="button"
        onClick={onToggle}
        aria-label={open ? "Close components sidebar" : "Open components sidebar"}
        className="pointer-events-auto absolute left-4 top-4 z-50 grid size-9 place-items-center rounded-lg bg-popover text-foreground/60 shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
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
          <span
            className="absolute left-2 size-1.5 rounded-full bg-[#FC4C01] transition-[top] duration-200"
            style={{ top: `${activeIndex * 32 + 12}px` }}
          />
          {items.map((item) => {
            const active = item.slug === activeSlug;
            return (
              <li key={item.slug}>
                <button
                  type="button"
                  onClick={() => onSelect(item.slug)}
                  className={cn(
                    "flex w-full rounded-lg p-1 text-left text-sm transition-colors",
                    active
                      ? "text-foreground"
                      : "text-foreground/55 hover:text-foreground",
                  )}
                >
                  {item.name}
                </button>
              </li>
            );
          })}
        </ul>
      </motion.aside>
    </div>
  );
}

function PreviewFallback({ name }: { name: string }) {
  return (
    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
      Loading {name}…
    </div>
  );
}

function LazyPreview({ item }: { item: ComponentRegistryItem }) {
  const LazyDemo = useMemo(
    () =>
      lazy(async () => {
        const mod = await item.load();
        return { default: mod.default as ComponentType };
      }),
    [item],
  );

  return (
    <Suspense fallback={<PreviewFallback name={item.name} />}>
      <LazyDemo />
    </Suspense>
  );
}

export default function ComponentsShowcase({
  initialSlug = "sticker-forge",
}: {
  initialSlug?: ComponentSlug;
}) {
  const [navOpen, setNavOpen] = useState(true);
  const [descOpen, setDescOpen] = useState(false);
  const [activeSlug, setActiveSlug] = useState<ComponentSlug>(initialSlug);

  const active =
    componentRegistry.find((item) => item.slug === activeSlug) ??
    componentRegistry[componentRegistry.length - 1];

  return (
    <ShapeProvider>
      <IconProvider>
        <div className="h-screen overflow-hidden bg-background p-2">
          <div className="relative flex h-full min-w-0 overflow-hidden">
            <Sidebar
              open={navOpen}
              onToggle={() => setNavOpen((value) => !value)}
              activeSlug={active.slug}
              onSelect={(slug) => {
                setActiveSlug(slug);
                setDescOpen(false);
              }}
              items={componentRegistry}
            />

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
                <div
                  className={cn(
                    "h-full overflow-auto rounded-[32px]",
                    active.previewClassName ?? "bg-background",
                  )}
                >
                  <LazyPreview key={active.slug} item={active} />
                </div>
              </div>
            </motion.div>

            <DescriptionPanel
              meta={active}
              open={descOpen}
              onToggle={() => setDescOpen((value) => !value)}
            />
          </div>
        </div>
      </IconProvider>
    </ShapeProvider>
  );
}
