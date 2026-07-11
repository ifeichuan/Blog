# Section 2 Card Design

## Scope

Add the structural Section 2 card directly after the homepage hero. This change only creates the card shell and shared shape treatment; it does not implement the effects described in `PLAN-section2.md`.

## Structure

- Add `src/components/SectionTwo.tsx` as the isolated extension point for future Section 2 content.
- Render `HeroSection` and `SectionTwo` in a vertical homepage stack.
- Keep both cards centered with a `0.75rem` page inset and a `0.75rem` gap.

## Geometry

Both cards use the same fixed viewport-relative geometry:

- Width: `calc(100vw - 1.5rem)`
- Height: `calc(100vh - 1.5rem)`
- Corner radius: `1.5rem`
- Corner shape: `squircle`
- Overflow: clipped

The shared card class uses `corner-shape: squircle` with the radius as a fallback when the property is unsupported.

## Appearance

Section 2 starts as an empty `#faf9f5` surface. Content, Pixel Trail, avatar, transitions, theme controls, and scroll animation remain outside this change.

## Verification

- Confirm both cards have identical computed width, height, radius, and corner shape.
- Confirm the vertical inset and gap are `0.75rem`.
- Check desktop and mobile viewports for horizontal overflow.
- Run the production build.
