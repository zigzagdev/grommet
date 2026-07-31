# Heading — Potential Issues

## `overflowWrap` recalculation is not triggered by content changes

**File:** `Heading.js:39-54`

**Description:**
```js
useLayoutEffect(() => {
  const updateOverflowWrap = () => {
    let wrap;
    if (!overflowWrapProp && headingRef.current) {
      wrap =
        headingRef.current.scrollWidth > headingRef.current.offsetWidth
          ? 'anywhere'
          : 'break-word';
      setOverflowWrap(wrap);
    }
  };

  window.addEventListener('resize', updateOverflowWrap);
  updateOverflowWrap();
  return () => window.removeEventListener('resize', updateOverflowWrap);
}, [headingRef, overflowWrapProp]);
```

`updateOverflowWrap` measures `scrollWidth` vs `offsetWidth` to decide
whether to switch `overflow-wrap` to `anywhere`. It is invoked on mount and
on every `window` `resize` event, but the effect's dependency array is
`[headingRef, overflowWrapProp]` — it does not include `children`. When the
heading's text content changes without a corresponding window resize (e.g.
new `children` pushed in via state/props, i18n string swap, streaming text),
the measurement is not recomputed, so `overflowWrap` can remain stale
relative to the new (possibly longer/shorter) content.

**Failure scenario:**
Render `<Heading>{someShortText}</Heading>` (fits, so `overflow-wrap:
break-word`). Later, update `someShortText` to a much longer, unbreakable
string (e.g. a long URL/token) via a state update, with no window resize in
between. The heading keeps `overflow-wrap: break-word` even though the text
now overflows its container, instead of switching to `anywhere`, so the text
can visually overflow the layout.