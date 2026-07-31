# DataTableColumns — Potential Issues

## `filteredOptions` does not resync when the `options` prop changes

**File:** `DataTableColumns.js:47-108` (`Content`)

**Description:**
```js
const [filteredOptions, setFilteredOptions] = useState(options);
...
const onSearch = useCallback((nextSearch) => {
  let nextFilteredOptions = options;
  if (nextSearch) { ... }
  setSearch(nextSearch);
  setFilteredOptions(nextFilteredOptions);
}, [options]);
```

`filteredOptions` is initialized from the `options` prop only once (via `useState`'s lazy
initial value). It is only ever recomputed inside `onSearch`, which runs solely in response
to the search `TextInput`'s `onChange`. There is no `useEffect` that re-derives
`filteredOptions` (or resets the search text) when the `options` prop itself changes
identity/content on a subsequent render.

**Failure scenario:**
`DataTableColumns` is rendered with a dynamic `options` list (e.g. columns are added,
removed, or relabeled by the parent app after the columns-selector drop/panel has already
been opened once). Because `filteredOptions` was already initialized (and, once
`onSearch` fires at least once, is derived from a moment-in-time snapshot of `options`),
the `CheckBoxGroup` in `selectColumnsContent` continues to render the stale set of
options and will not show newly-added columns (or will keep showing removed ones) until
the user types into the search box again, forcing `onSearch` to recompute from the current
`options` prop. Toggling the drop closed/open does not create a new `Content` instance
if the parent doesn't unmount it, so the panel can be left showing outdated columns
indefinitely.