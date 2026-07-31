# DataSort — Potential Issues

## `options` prop is always overridden and never actually used

**File:** `DataSort.js:24-50` (the `selectProps` useMemo inside `Content`)

**Description:**
The `useMemo` that builds `selectProps` sets `props = { options: optionsArg }` when the
caller-supplied `options` prop (`optionsArg`) is present, but that assignment is not
part of an `if / else if` chain with the subsequent checks:

```js
if (optionsArg) {
  props = { options: optionsArg };
}
if (properties && Array.isArray(properties)) {
  props = { options: properties };
} else if (properties && typeof properties === 'object') {
  props = { options: Object.entries(properties)... };
} else {
  props = { options: (data.length > 0 && Object.keys(data[0]).sort()) || data };
}
```

Because the second `if` (and its `else if` / `else`) always run unconditionally, whatever
was assigned from `optionsArg` in the first `if` block is unconditionally replaced. The
final `else` branch (used when `properties` is falsy) also ignores `optionsArg` and
derives options from `data` instead. As written, there is no code path where the value
assigned from `optionsArg` survives to the returned `props`, so the `options` prop passed
to `<DataSort options={...} />` has no effect.

**Failure scenario:**
A caller renders `<DataSort options={['a', 'b', 'c']} />` expecting the sort-by `Select`
to offer exactly those options. Instead, whenever `DataContext.properties` is set (array or
object) the derived properties list is used, and when `properties` is not set the options
are instead derived from the shape of `DataContext.data[0]`. The explicitly supplied
`options` prop is silently discarded in all cases.
