# List — Potential Issues

## Falsy item-key values (`0`, `''`) silently fall back to the render index, breaking `pinned`/`disabled` matching

**File:** `List.js:390` (also affects `List.js:402-404`, `List.js:483`)

**Description:**
```js
const key = getValue(item, index, itemKey) || index;
```

`getValue` returns the actual key value looked up via `itemKey` (e.g.
`item.id`). If that value is falsy — most notably `0` or an empty string,
both legitimate key values — the `||` fallback silently substitutes the
render `index` instead. This computed `key` is later used to test membership
in the caller-supplied `pinned` and `disabled` arrays (`pinned.includes(key)`,
`disabledItems?.includes(key)`), which contain the *real* key values, not
indices.

**Failure scenario:**
```jsx
<List
  data={[{ id: 5, name: 'A' }, { id: 0, name: 'B' }]}
  itemKey="id"
  pinned={[0]}
/>
```
For the second row (`index === 1`, `item.id === 0`), `getValue` returns `0`,
and `0 || 1` evaluates to `1` (the index), not `0`. `pinned.includes(1)` is
`false`, so the row the caller asked to pin (id `0`) is not pinned. The same
substitution breaks `disabled` matching for any item whose key resolves to
`0` or `''` at a non-zero index.

## `onDown` keyboard handler clamps to `data.length`, not the current page's item count, when paginated

**File:** `List.js:327-352`

**Description:**
```js
onDown={(event) => {
  if (onClickItem || onOrder) {
    event.preventDefault();
    if (orderableData && orderableData.length) {
      const min = onOrder ? 1 : 0;
      const max = onOrder
        ? orderableData.length * 2 - 2
        : data.length - 1;
      const focusedElementIndex =
        focused >= min ? Math.min(focused + 1, max) : min;
      handleFocus(focusedElementIndex);
      ...
```

When `onClickItem` is used without `onOrder`, `max` is derived from
`data.length` (the full, unpaginated data set), while the `focused`/`active`
state is a page-local index into the currently rendered items (`items`,
the paginated subset — see how `onSelectOption` converts `nextFocused` to a
global index using `paginationProps.page`). When `paginate` is enabled,
`items.length` is smaller than `data.length` for any page that isn't the
last one.

**Failure scenario:**
`<List data={oneHundredItems} paginate step={10} onClickItem={fn} />` on
page 1 (10 rendered `<li>` items, local indices `0-9`). Pressing the Down
arrow repeatedly moves `focused` up to `data.length - 1` (99), well past the
10 rendered items. Once `focused` exceeds `items.length - 1`, no rendered
item matches `focused === index`, so nothing is visually marked
active/focused and `listRef.current?.children[focusedElementIndex]` is
`undefined` (no scroll, no DOM focus update) — the roving-tabindex/focus
state becomes inconsistent with the DOM until enough Up presses bring
`focused` back into the range of items actually on the page.

## `focus` prop is destructured but never used

**File:** `List.js:124`

**Description:** `focus` is pulled out of props (so it is excluded from
`...rest` and never reaches the DOM or any internal logic) but no code
anywhere in the component reads it. It is also absent from `propTypes.js`
and `index.d.ts`. Passing a `focus` prop to `List` has no effect, which is
either dead code left over from an earlier implementation or a prop that
was never wired up — worth confirming intent.