# DataTable — Potential Issues

## 1. Select-all checkbox aria label is inconsistent with its visual/checked state

**File:** `Header.js:277-300`

**Description:**
The header "select all" `CheckBox` computes three related-but-independent values that
should agree with each other but don't:

```js
a11yTitle={
  totalSelected === data.length ? 'unselect all' : 'select all'
}
checked={
  groupBy?.select
    ? groupBy.select[''] === 'all'
    : totalSelected > 0 && data.length > 0 &&
      totalSelected === (contextTotal || data.length)
}
indeterminate={
  groupBy?.select
    ? groupBy.select[''] === 'some'
    : totalSelected > 0 && totalSelected < (contextTotal || data.length)
}
```

`checked`/`indeterminate` compare `totalSelected` against `contextTotal || data.length`
(falling back to the server/grand total when available) and special-case
`groupBy?.select`. `a11yTitle`, however, only ever compares against `data.length` and never
consults `contextTotal` or `groupBy?.select` at all.

**Failure scenario:**
With server-driven pagination (`Data` supplies `total`/`contextTotal` larger than the
current page, e.g. `contextTotal = 100`, `data.length = 10` for the current page), if a
user selects all 10 rows on the current page, `totalSelected (10) === data.length (10)` is
true, so the accessible label announces "unselect all." But `checked` evaluates
`10 === 100` → `false`, and `indeterminate` evaluates `10 < 100` → `true`, so the checkbox
is rendered/announced by AT as indeterminate (partially checked) while the text label says
"unselect all" — a screen-reader user is told the opposite of what clicking the control
will do (clicking triggers `onChangeSelection`, whose own `allSelected` calculation is also
page-scoped, so it would actually select the *remaining* pages, not deselect everything).
The same disagreement occurs whenever `groupBy?.select` is in use, since `a11yTitle` never
looks at `groupBy.select['']` at all.

---

## 2. Resizer clears reported width (and thus `aria-valuenow`) when a drag-resize ends

**File:** `Resizer.js:109-113`, used at `Resizer.js:212-215`

**Description:**
`onResizeEnd` resets local state:

```js
const onResizeEnd = useCallback(() => {
  setActive(false);
  setStart(undefined);
  setWidth(undefined);
});
```

`width` is used to compute the separator's accessible state:

```js
aria-valuenow={width}
aria-valuetext={width ? `${ariaLabel} ${Math.trunc(width)} pixels` : ariaLabel}
```

Because `onResizeEnd` sets `width` back to `undefined`, as soon as a mouse/touch drag
finishes, `aria-valuenow` disappears from the DOM (React omits `undefined` attributes) and
`aria-valuetext` falls back to the label without any pixel value — even though the column
now has a concrete, resized width. The width is only re-established on the next
interaction (`onResizeStart`, `onIncrease`, `onDecrease`, or a re-mount), not simply by
finishing the previous drag.

**Failure scenario:**
A screen-reader/keyboard user drags a column resizer (`role="separator"`) to widen a
column, then releases the mouse. Immediately after, inspecting or re-focusing the
separator reports no `aria-valuenow` and no pixel value in `aria-valuetext`, even though
the column has a specific new width — assistive tech loses the numeric feedback for the
just-completed action.

---

## 3. `set()` helper in `buildState.js` never creates arrays for numeric path segments

**File:** `buildState.js:4-18`

**Description:**
`set(obj, path, value)` is a generic dot/bracket-path setter used by `aggregate()` /
`buildFooterValues()` / `buildGroups()` to write (possibly nested) footer/aggregate values
back onto an object by property path. The intent (as in the common "lodash-lite" idiom this
is adapted from) is to create an array when the next path segment looks like a numeric
array index, otherwise an object:

```js
acc[item] = Math.abs(parts[index + 1]) > 0 === +parts[index + 1] ? [] : {};
```

The canonical version of this idiom uses the bitwise `>> 0` (which coerces the left side to
a *number*) so the two sides of `===` are both numbers. Here `> 0` is used instead, which
makes the left side a *boolean*. A boolean is never `===` a number in JavaScript (no type
coercion with strict equality), so `Math.abs(x) > 0 === +y` is always `false`, regardless of
whether the next path segment is numeric. As a result, `set()` always creates a plain
object (`{}`) for intermediate path segments, never an array (`[]`), even for numeric
segments.

**Failure scenario:**
`set({}, 'a.0', 'x')` produces `{ a: { '0': 'x' } }` instead of the expected
`{ a: ['x'] }`. Any DataTable `column.property` (or aggregate `footer` target) that uses a
numeric path segment intended to address an array element will silently receive an
object keyed by stringified indices instead of a real array, which can break consumers
downstream that expect `Array.isArray(...)` to be true (e.g. rendering, further
`.map`/`.forEach` on the aggregated footer value).

---

## 4. `onHeaderWidths` can throw if a pinned column's width hasn't been captured yet

**File:** `DataTable.js:252-285`

**Description:**
```js
pinnedProperties.forEach((property, index) => {
  const columnIndex = ...;
  if (columnWidths[columnIndex]) {
    nextPinnedOffset[property] = {
      width: columnWidths[columnIndex],
      left:
        index === 0
          ? 0
          : nextPinnedOffset[pinnedProperties[index - 1]].left +
            nextPinnedOffset[pinnedProperties[index - 1]].width,
    };
  }
});
```
For any `index > 0`, the `left` calculation unconditionally dereferences
`nextPinnedOffset[pinnedProperties[index - 1]]`. That entry is only populated when
`columnWidths[columnIndex]` was truthy for the *previous* pinned column. If a width for an
earlier pinned column has not yet been reported (e.g. `cellWidthsRef.current[property]` is
still `undefined`/`0` because that column's `onWidth` callback hasn't fired yet, or its
measured width is exactly `0`), `nextPinnedOffset[pinnedProperties[index - 1]]` is
`undefined` and `.left`/`.width` access throws `TypeError: Cannot read properties of
undefined`.

**Failure scenario (worth verifying):**
A `DataTable` with `resizeable` and two or more `pin: true` columns (plus a `select`/
`onSelect` column, which is always prepended to `pinnedProperties`) where column width
reporting is staggered (e.g. a column briefly renders at width `0` before layout settles,
or `handleWidths` fires while `cellWidthsRef.current` only has a subset of columns
populated). If a later pinned column's width is captured before an earlier one's, the
offset computation throws when building `nextPinnedOffset`.