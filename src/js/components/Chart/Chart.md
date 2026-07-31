# Chart — Potential Issues

## `calcs()` applies `options.max` to the wrong axis when `options.direction` is set

**File:** `src/js/components/Chart/calcs.js:143-154`

**Defect:**
```js
if (options.min !== undefined) {
  if (options.direction) {
    if (horizontal) bounds.x.min = options.min;
    else bounds.y.min = options.min;
  } else bounds[1][0] = options.min;
}
if (options.max !== undefined) {
  if (options.direction) {
    if (horizontal) bounds.y.max = options.max;
    else bounds.x.max = options.max;
  } else bounds[1][1] = options.max;
}
```
`options.min` consistently maps to the value axis: `x` when `horizontal`, `y` otherwise. `options.max` is inconsistent with that rule — it maps to the *opposite* axis (`y` when `horizontal`, `x` otherwise). This looks like a copy/paste error where `x`/`y` were swapped relative to the `min` branch.

**Failure scenario:** Call the exported `calcs(values, { direction: 'horizontal', min: 0, max: 100 })` (the public, documented low-level API used directly in `Chart` stories such as `Window.stories.js`/`Scan.stories.js`, just without `direction` there). With `direction: 'horizontal'` and both `min`/`max` supplied, `min` correctly sets `bounds.x.min` (the value axis for a horizontal chart) but `max` sets `bounds.y.max` instead of `bounds.x.max`. The resulting `x` bounds keep an unclamped max while an unrelated `y` bound gets overwritten, producing an incorrectly scaled/clipped chart. The same swap happens in the vertical case (`max` incorrectly sets `bounds.x.max` instead of `bounds.y.max`).