# Calendar — Potential Issues

## Range-selection "end date" branch can crash when the prior range start is undefined

**File:** `Calendar/Calendar.js:594-617` (specifically line 611)

**Description:** `handleRange` has two symmetric branches for "selecting the start date" and "selecting the end date" of a range. The "start" branch guards against the other endpoint being undefined before calling `.getTime()` on it:

```js
else if (activeDate === 'start') {
  if (!priorRange) {
    result = [[selectedDate, undefined]];
  } else if (!priorRange[0][1]) {                      // <-- guard
    result = [[selectedDate, priorRange[0][1]]];
  } else if (selectedDate.getTime() < priorRange[0][1].getTime()) {
  ...
```

The "end" branch has no equivalent guard for `priorRange[0][0]` before dereferencing it:

```js
// selecting end date
else if (!priorRange) {
  result = [[undefined, selectedDate]];
  nextActiveDate = 'start';
} else if (selectedDate.getTime() < priorRange[0][0].getTime()) {   // <-- no guard
  result = [[selectedDate, undefined]];
  nextActiveDate = 'end';
} else if (selectedDate.getTime() > priorRange[0][0].getTime()) {
  result = [[priorRange[0][0], selectedDate]];
  nextActiveDate = 'start';
}
```

If `priorRange` is truthy but `priorRange[0][0]` (the range start) is `undefined`, `priorRange[0][0].getTime()` throws `TypeError: Cannot read properties of undefined (reading 'getTime')`.

**Failure scenario:** `Calendar` is used as a controlled range picker with `range` set and the caller controls `activeDate`/`date`/`dates` directly (as `DateInput` and similar consumers do). If the controlled state ever has `activeDate="end"` while the current range value has an undefined start but a defined, non-matching end (e.g. `date={[[undefined, someEndDate]]}` with `activeDate="end"`), clicking any day that is not exactly equal to `someEndDate` reaches the unguarded `priorRange[0][0].getTime()` call and throws, crashing the calendar. This is a real, documented input shape for `handleRange`/`normalizeRange` (range values support `[start, end]` pairs with either side possibly `undefined`), so this combination is reachable through the component's own public controlled-prop API, not just via internal misuse.

## Fragile, partially-guarded theme access when rendering the calendar header title

**File:** `Calendar/Calendar.js:696-701`

**Description:**

```js
const { container: containerTheme, ...textTheme } =
  theme.calendar[size]?.title || undefined;
...
<Header flex pad={containerTheme.pad}>
```

`theme.calendar[size]` is accessed with optional chaining before `.title`, but the overall expression is destructured directly. If `theme.calendar[size]?.title` evaluates to a falsy value (`undefined`, because `theme.calendar[size]` is missing, or because it exists but has no `title` key), the `|| undefined` does not prevent this — it still destructures `undefined`, which throws `TypeError: Cannot destructure property 'container' of 'undefined' as it is undefined`. Separately, if `title` exists but has no `container` key, `containerTheme` will be `undefined` and the later `containerTheme.pad` access on the next line throws.

**Failure scenario:** A custom theme merged with grommet's base theme defines `calendar.small`/`calendar.medium`/`calendar.large` but omits the `title` (or `title.container`) sub-object for one of the sizes actually used (the default theme happens to always provide this, so the bug is latent unless a custom theme diverges from that exact shape). Rendering `<Calendar size="..." />` (without a custom `header` render prop, so `renderCalendarHeader` executes) then throws and the whole component fails to render.