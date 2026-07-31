# Carousel — Potential Issues

## Autoplay timer restarts on every parent re-render because `children` is a dependency

**File:** `src/js/components/Carousel/Carousel.js:148-169`

**Defect:**
```js
useEffect(() => {
  if (play && (wrap !== false || activeIndex < lastIndex)) {
    const timer = setInterval(() => { ... }, play);
    timerRef.current = timer;
    return () => { clearTimeout(timer); };
  }
  return () => {};
}, [activeIndex, play, children, lastIndex, onChildChange, wrap]);
```
The autoplay effect's dependency array includes `children`. React children passed as JSX (e.g. `<Carousel>{items.map(...)}</Carousel>`) are a new array/element reference on every render of the parent, even when the actual slide content hasn't changed. Because `children` is a dependency, any parent re-render (for reasons unrelated to the carousel, e.g. unrelated state elsewhere in the tree, context updates, etc.) tears down and re-creates the `setInterval`, restarting the autoplay countdown from zero.

**Failure scenario:** Render `<Carousel play={5000}>{children}</Carousel>` inside a parent that re-renders more frequently than every 5 seconds (e.g. due to a ticking clock, polling data, or any sibling state update causing the parent to re-render and recreate the `children` array). The autoplay interval keeps getting cleared and restarted before it ever fires, so the carousel silently never advances automatically even though `play` is set.