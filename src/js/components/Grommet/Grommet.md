# Grommet — Potential Issues

## `themeMode="auto"` does not react to live OS color-scheme changes

**File:** `Grommet.js:68-75` (also see the `useMemo` dependency array at line 89)

**Description:**
The `dark` mode detection for `themeMode="auto"` is computed once inside the
`theme` `useMemo`:

```js
if (
  themeMode === 'auto' &&
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(prefers-color-scheme: dark)').matches
) {
  nextTheme.dark = true;
}
```

This `matchMedia(...).matches` check is only evaluated when the memo
recomputes, which only happens when `background`, `dir`, `themeMode`, or
`themeProp` change. No `change` event listener is attached to the
`MediaQueryList`, so the component never re-evaluates the OS preference on
its own.

**Failure scenario:**
Mount `<Grommet themeMode="auto">` while the OS is in light mode (theme
renders light). While the app stays open, the user switches their OS to dark
mode (e.g. macOS System Settings → Appearance). The app keeps rendering with
the light theme because nothing triggers a re-render/re-memoization of
`theme` — until some unrelated prop (`background`, `dir`, `themeMode`,
`themeProp`) happens to change. Users expect `themeMode="auto"` to track the
OS preference live.
