# Button — Potential Issues

## Custom-JSX badge sizing swaps width/height and omits units

**File:** `Button/Badge.js:69-74`

**Description:** In the `onResize` handler, when the caller supplies custom JSX as `content` (i.e. neither a number nor an object/boolean), the container is sized from the content's bounding box like this:

```js
} else {
  // caller has provided custom JSX
  containerRef.current.style.minHeight =
    contentRef.current.getBoundingClientRect().width;
  containerRef.current.style.minWidth =
    contentRef.current.getBoundingClientRect().height;
}
```

Two problems:
1. The assignment is swapped: `minHeight` is set from the content's **width**, and `minWidth` is set from the content's **height**, so the badge container is sized backwards relative to its content whenever width ≠ height.
2. `getBoundingClientRect()` returns unitless numbers, and unlike the sibling branch a few lines above (which explicitly builds `` `${...}px` `` strings), these are assigned directly to `style.minHeight`/`style.minWidth` without a unit. A CSS length property assigned a bare unitless non-zero number is invalid and browsers ignore it, so in practice this branch is close to a no-op — the container keeps whatever size it had before (from a prior `defaultBadgeDimension` assignment two lines above, which is itself immediately overwritten to `''` at the top of `onResize`).

**Failure scenario:** `<Button badge={{ ... }}>` — actually any usage where `Badge`'s `content` prop is custom JSX (e.g. `<Badge content={<CustomIcon/>}>` used internally when badge content isn't a number/boolean) — renders with a mis-sized (and, due to the missing unit, effectively unsized/default-sized) badge container. For non-square custom content this is visibly wrong (badge circle is too narrow/tall or clipped relative to its content) instead of the intended fit-to-content sizing.

## Explicit `plain={false}` is silently overridden when the button has children (kind/themed path only)

**File:** `Button/Button.js:536` (compare with `Button/Button.js:580-584`)

**Description:** When the theme defines `button.default` (so `kind` is set) and thus the `StyledButtonKind` branch is used, `plain` is computed as:

```js
plain={plain || Children.count(children) > 0}
```

This unconditionally forces `plain` to `true` whenever the button has children, even if the caller explicitly passed `plain={false}`.

The legacy non-kind branch (`StyledButton`, lines 580-584) handles the same situation correctly by checking whether `plain` was explicitly provided first:

```js
plain={
  typeof plain !== 'undefined'
    ? plain
    : Children.count(children) > 0 || (icon && !label)
}
```

**Failure scenario:** With a theme that defines `button.default` (the modern kind-based theme, e.g. the default grommet theme or hpe theme), rendering `<Button kind="primary" plain={false}>{someChildren}</Button>` (children supplied, e.g. a render-prop function or custom child node) results in the button being styled as `plain` regardless of the explicit `plain={false}`, producing an unstyled button when the caller clearly asked for a non-plain (bordered/background) primary button. The same call with the legacy (no `button.default`) theme behaves correctly and respects `plain={false}`.