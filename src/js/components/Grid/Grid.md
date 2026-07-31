# Grid — Potential Issues

## `areasStyle` crashes when `columns`/`rows` are non-array values combined with the object-based `areas` format

**File:** `src/js/components/Grid/StyledGrid.js:189-213`

```js
const areasStyle = (props) => {
  // translate areas objects into grid-template-areas syntax
  if (!Array.isArray(props.rowsProp) || !Array.isArray(props.columns)) {
    console.warn('Grid `areas` requires `rows` and `columns` to be arrays.');
  }
  if (
    Array.isArray(props.areas) &&
    props.areas.every((area) => Array.isArray(area))
  ) {
    return `grid-template-areas: ${props.areas
      .map((area) => `"${area.join(' ')}"`)
      .join(' ')};`;
  }
  const cells = props.rowsProp.map(() => props.columns.map(() => '.'));
  props.areas.forEach((area) => {
    for (let row = area.start[1]; row <= area.end[1]; row += 1) {
      for (let column = area.start[0]; column <= area.end[0]; column += 1) {
        cells[row][column] = area.name;
      }
    }
  });
  return `grid-template-areas: ${cells
    .map((r) => `"${r.join(' ')}"`)
    .join(' ')};`;
};
```

When `props.rowsProp` or `props.columns` is not an array, the code only
`console.warn`s — it does not return/bail out. Execution continues to
`props.rowsProp.map(() => props.columns.map(() => '.'))`, which throws a
`TypeError` (`props.columns.map is not a function`) if `columns` (or
`rowsProp`) is a string or a `{ count, size }` object.

This is not a purely theoretical/invalid input: `Grid`'s own `propTypes.js`
explicitly allows `columns` to be a size string (e.g. `'small'`), one of the
named `sizes`, or a `{ count, size }` shape — not just an array — and it
allows `areas` to use the object form (`{ name, start, end }`), which is
exactly the branch that reaches the crashing line.

**Failure scenario:**

```jsx
<Grid
  rows={['small', 'small']}
  columns="medium" // valid per propTypes, but not an array
  areas={[{ name: 'main', start: [0, 0], end: [0, 1] }]}
>
  ...
</Grid>
```

Here `props.areas` is truthy and not in the array-of-arrays shape, so the
function falls through to `props.rowsProp.map(() => props.columns.map(...))`.
Since `props.columns` is the string `'medium'`, `.map` is not a function on
it, and the styled-components interpolation throws, crashing the render of
the `Grid` (and its parent tree) instead of degrading gracefully or issuing a
clear error before attempting to build the areas grid.