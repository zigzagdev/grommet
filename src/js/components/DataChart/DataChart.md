# DataChart — Potential Issues

## YAxis label-centering heuristic checks horizontal pad instead of vertical pad

**File:** `src/js/components/DataChart/YAxis.js:48-60`

**Defect:**
```js
const labelContainerProps = useMemo(() => {
  // 24px was chosen empirically as 48px is enough to show some simple text
  const centered =
    values.length !== 2 ||
    edgeToNum(padProp?.start || padProp?.horizontal, theme) >= 24;
  if (centered)
    return { basis: thickness || '1px', overflow: 'visible', justify: 'center' };
  return {};
}, [padProp, theme, thickness, values]);
```
This is copy-pasted from `XAxis.js` (which legitimately checks `padProp?.start || padProp?.horizontal` since XAxis lays out labels along the horizontal axis). `YAxis.js`'s own `pad` object only ever carries `top`/`bottom`/`vertical` keys (see `onlyVerticalPad` in the same file), so for YAxis this condition should check `padProp?.top || padProp?.vertical`. As written it inspects the wrong pad dimension entirely.

**Failure scenario:** Configure a `<DataChart>` where the computed vertical pad (`pad.vertical`, from series thickness) is small (e.g. < 24px) but the horizontal pad happens to be large (>= 24px) — a plausible combination once `offset`/thickness-driven padding is applied asymmetrically, or when a caller explicitly passes `pad={{ horizontal: 'large', vertical: 'xsmall' }}`. With exactly 2 Y-axis labels, `YAxis` will incorrectly decide `centered = true` (or `false` in the inverse mismatch) based on the horizontal padding value rather than the vertical one, producing an axis-label layout (basis/overflow/justify) that doesn't match the actual available vertical space.

## `Detail` component can throw when a mouse-leave fires without a prior mouse-over

**File:** `src/js/components/DataChart/Detail.js:65-79`

**Defect:**
```js
const onMouseLeave = useCallback((event) => {
  const rect = activeIndex.current.getBoundingClientRect();
  ...
}, []);
```
`activeIndex.current` (a `useRef()`, initial value `undefined`) is only assigned inside the per-item `onMouseOver` handler (line 184: `activeIndex.current = event.currentTarget`). `onMouseLeave` is wired both to each per-item hit-target `Box` (line 188) and to the `Drop` detail popup (line 221) with no guard for `activeIndex.current` being unset. `detailIndex`/the `Drop` can also be opened purely via keyboard (`Keyboard` `onLeft`/`onRight` handlers at lines 121-140), which call `setDetailIndex` without ever touching `activeIndex.current`.

**Failure scenario:** Focus the chart's detail control (it has `tabIndex={0}`) and press the Right arrow key to open the detail `Drop` via keyboard, without having moved the mouse over any per-item hit target first (`activeIndex.current` stays `undefined`). If the mouse cursor is already resting over the now-visible `Drop` (or moves onto and then off of it), the `Drop`'s `onMouseLeave={onMouseLeave}` fires and calls `activeIndex.current.getBoundingClientRect()` on `undefined`, throwing `TypeError: Cannot read properties of undefined (reading 'getBoundingClientRect')`.