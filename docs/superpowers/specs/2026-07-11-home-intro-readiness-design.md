# Home Intro Readiness Coordination

## Scope

Change only the homepage loading coordination. Keep the existing progress timing, blur values, Hero timeline, session behavior, and visual design.

## Readiness

- `HeroScene` reports ready after its first rendered WebGL frame.
- `PixelMouseScene` reports ready after the GLTF model request and sticker texture requests settle.
- Asset failures are treated as settled so the Intro cannot remain stuck.
- `IndexPage` dispatches `homepage:ready` only after both readiness signals arrive.

## Transition

- `HomeIntro` dispatches `Intro:exit` when its opacity transition begins.
- `IndexPage` starts the Hero timeline on `Intro:exit`.
- `Intro:end` remains the signal that the Intro DOM has been removed.

## Verification

- A cold load does not emit `homepage:ready` before the Hero background and mouse assets settle.
- Hero animation begins while the Intro is fading out.
- A same-tab reload still skips the full progress animation without getting stuck.
- Asset load failures still allow the homepage to appear.
