# Drop — Potential Issues

## Falsy-zero check can cause `getNewContainer` to run more than once

**File:** `src/js/components/Drop/Drop.js:32-43`

```js
const containerChildNodesLength = useRef(null);
useEffect(() => {
  // we need this condition to prevent getNewContainer to run multiple times
  // in the event that the component gets created, destroyed, and recreated.
  // see https://reactjs.org/docs/strict-mode.html#ensuring-reusable-state
  if (!containerChildNodesLength?.current) {
    containerChildNodesLength.current = containerTarget.childNodes.length;
    setDropContainer(
      !inline ? getNewContainer(containerTarget) : undefined,
    );
  }
}, [containerTarget, inline]);
```

The guard is `!containerChildNodesLength.current`, but the value stored there
is `containerTarget.childNodes.length`, a legitimate value that can be `0`.
`!0` is `true`, so if `containerTarget` had zero children at the time this
effect first ran, the "already initialized" marker is indistinguishable from
"not yet initialized". If the effect fires again (e.g. React 18
StrictMode's mount → unmount → remount cycle, or `containerTarget`/`inline`
changing while the container still has 0 children), the guard passes a second
time and `getNewContainer(containerTarget)` runs again, appending a second
DOM container. The `dropContainer` state is overwritten with the new one, so
the previously appended container element becomes orphaned/leaked in the DOM
(only the current `dropContainer` gets removed on unmount, per the cleanup
effect at line 46-64).

**Failure scenario:** A caller supplies a `ContainerTargetContext` pointing to
a dedicated, otherwise-empty container element for drops/layers (a supported
pattern, not just `document.body`). Under React 18 StrictMode in development,
Drop mounts, unmounts, and remounts; because `containerTarget.childNodes.length`
was `0` on the first run, the second run's guard incorrectly re-executes,
creating and leaking an extra empty `<div>` in the DOM.

## `Object.keys(...)` used as an emptiness check always evaluates truthy

**File:** `src/js/components/Drop/StyledDrop.js:47`

```js
const marginStyle = (theme, align, data, responsive, marginProp) => {
  ...
  let adjustedMargin = {};
  ...
  if (theme.global.drop.intelligentMargin === true && !customCSS && typeof margin === 'string') {
    if (align.top === 'bottom') adjustedMargin.top = margin;
    else if (align.bottom === 'top') adjustedMargin.bottom = margin;
    if (align.right === 'left') adjustedMargin.left = `-${margin}`;
    else if (align.left === 'right') adjustedMargin.left = margin;
    if (!Object.keys(adjustedMargin)) adjustedMargin = 'none';
  } else { ... }
  return edgeStyle('margin', marginProp || adjustedMargin, ...);
};
```

`Object.keys(adjustedMargin)` always returns an array, and arrays are always
truthy in JavaScript — even an empty array (`![]` is `false`). So
`if (!Object.keys(adjustedMargin))` never executes, regardless of whether any
of the `top`/`bottom`/`left` branches above actually set a property. The
intended check is almost certainly `if (!Object.keys(adjustedMargin).length)`.

**Failure scenario:** With `theme.global.drop.intelligentMargin: true` and a
Drop aligned using the library default `align = { top: 'top', left: 'left' }`
(neither `align.top === 'bottom'`, `align.bottom === 'top'`,
`align.right === 'left'`, nor `align.left === 'right'` match), none of the
`adjustedMargin` branches fire, leaving `adjustedMargin` as `{}`. Instead of
falling back to the string `'none'` as intended, the empty object `{}` is
passed into `edgeStyle('margin', marginProp || adjustedMargin, ...)`, which is
a different input shape than the `'none'` string the code was clearly trying
to produce, so the "no adjustment needed" fallback path is effectively dead
code.