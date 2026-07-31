# Cards — Potential Issues

## Default item renderer never shows object item content

**File:** `src/js/components/Cards/Cards.js:208-210`

**Defect:**
```js
content = (
  <CardBody>
    {(typeof item === 'string' && item) ??
      (typeof item === 'object' && Object.values(item)[0]) ??
      index}
  </CardBody>
);
```
This chain uses `??` (nullish coalescing) to cascade between three fallback expressions, but `??` only falls through when the left operand is `null`/`undefined`. When `item` is not a string, `typeof item === 'string' && item` evaluates to the boolean `false` — which is not nullish — so `false ?? (…)` short-circuits to `false` and the object-handling branch (`Object.values(item)[0]`) is never evaluated. The intended cascading behavior only works if `||` is used instead of `??`.

**Failure scenario:** Render `<Cards data={[{ name: 'Alice' }, { name: 'Bob' }]} />` without providing a `children` render-prop function. Each default `<CardBody>` renders `false` (i.e. nothing is displayed) instead of the first value of the object (`'Alice'`, `'Bob'`), because the object branch of the `??` chain is unreachable dead code.
