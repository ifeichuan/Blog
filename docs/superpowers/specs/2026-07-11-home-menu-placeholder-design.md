# Home Menu Placeholder Alignment

## Scope

Align the Astro placeholder with the closed Staggered Menu header without adding menu behavior or changing the Intro and Hero.

## Layout

- Use a fixed full-width header with `2rem` padding.
- Place the 48px logo at the top left.
- Place a semantic 30px button with the existing three-line icon at the top right.
- Keep the header non-blocking outside its two interactive controls.
- Preserve the existing `z-index: 40` stacking level.

## Responsive Behavior

Use the same geometry on desktop and mobile so replacing the placeholder with the final Astro menu does not cause a layout jump.

## Verification

- Desktop and mobile controls align to a 32px viewport inset.
- The logo and menu button occupy opposite sides of the header.
- The button has a stable 30px by 30px hit area.
- Production build succeeds without changing other homepage behavior.
