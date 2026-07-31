# Box — Potential Issues

## `navigator.userAgent` accessed without an SSR guard in `ResponsiveContainerProvider`

**File:** `Box/ResponsiveContainerProvider.js:12`

**Description:**

```js
const [value, setValue] = useState(
  () =>
    deviceResponsive(navigator.userAgent, theme) ||
    theme?.global?.deviceBreakpoints.tablet,
);
```

The `useState` initializer runs synchronously during render (including server-side render), and it references the global `navigator` object with no `typeof navigator !== 'undefined'` guard. Unlike the `useEffect` further down (which correctly guards `window`/`window.ResizeObserver` and never executes during SSR), this initializer is not effect-gated.

This code path is reached whenever `Box` is rendered with `responsive="container"` and `supportsContainerQueries()` returns true (i.e. styled-components v6+ is in use, which does not itself check for a browser environment — it is purely a static API-shape check). `Box.js` renders `<ResponsiveContainerProvider>` under that condition without any additional `typeof window` check.

**Failure scenario:** An app using styled-components v6+ server-renders a page (e.g. Next.js `getServerSideProps`/App Router SSR, or any `ReactDOMServer.renderToString` call) that includes `<Box responsive="container">...</Box>`. During SSR, `navigator` is undefined in Node.js, so this line throws `ReferenceError: navigator is not defined`, crashing the server render.