# Data — Potential Issues

## Selected-count check compares an array to a number instead of using its length

**File:** `src/js/components/Data/Data.js:59,90`

**Defect:**
```js
const [selected, setSelected] = useState([]);
...
announce(
  `${format({...})}${
    selected > 0
      ? `, ${format({ id: 'dataSummary.selected', ..., values: { selected } })}`
      : ''
  }`,
);
```
`selected` is an array (of selected row ids), not a number, but it is compared directly with `selected > 0`. JavaScript coerces the array to a primitive for this comparison via `Array.prototype.toString()`, then `Number(...)`:
- `[] > 0` → `Number('')` → `0 > 0` → `false` (works, but only by accident, and only for the empty case)
- `[id1, id2] > 0` (2+ items) → `Number('id1,id2')` → `NaN > 0` → always `false`
- `[id1] > 0` (1 item) → `Number(id1)`; this is `NaN > 0` (`false`) unless `id1` happens to be a purely numeric value/string.

So the "N items selected" portion of the screen-reader announcement is effectively dead for any realistic selection of more than one row, and unreliable for a single row. The intent was almost certainly `selected.length > 0`.

**Failure scenario:** In a `<Data>`-driven table/list where users can multi-select rows (`selected` populated with row ids like `['row-1', 'row-2']`), after selecting rows the live-region announcement never appends the "X items selected" message, because `['row-1','row-2'] > 0` evaluates to `NaN > 0` = `false`. Screen reader users get no confirmation of their selection count.