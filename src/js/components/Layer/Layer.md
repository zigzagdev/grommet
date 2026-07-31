# Layer — Potential Issues

## Cleanup-only `useLayoutEffect` fires on every dependency change, not just unmount

**File:** `Layer.js:59-115`

**Description:**
```js
useLayoutEffect(
  () =>
    () => {
      // ... restore focus, clone layerContainer for exit animation,
      // then setTimeout(() => { ...; layerContainer.remove(); }, animationDuration)
      // or, if no animation: containerTarget.removeChild(layerContainer)
    },
  [animate, animation, containerTarget, layerContainer, modal],
);
```

The comment says "just a few things to clean up when the Layer is
unmounted", but the pattern `useLayoutEffect(() => () => {...}, deps)` runs
the returned cleanup function whenever **any** listed dependency changes —
not only on unmount. The "setup" phase does nothing, so from the outside it
looks unmount-only, but React actually invokes this teardown logic (restore
focus, clone the DOM node for the exit animation, and ultimately call
`layerContainer.remove()` / `containerTarget.removeChild(layerContainer)`)
every time `animate`, `animation`, `containerTarget`, `layerContainer`, or
`modal` changes while the component is still mounted.

**Failure scenario:**
A `<Layer modal={someState}>` (or one whose `animate`/`animation` prop can
change) is open and the parent re-renders with a different `modal` (or
`animate`/`animation`) value while the Layer is still supposed to be open.
The stale-closure cleanup runs with the *previous* `layerContainer`/`modal`
values: since `animate`/`animation` are `undefined` by default (`!== false`),
it takes the "animate out" branch, clones the container, and schedules
`layerContainer.remove()` after `animationDuration`. That call detaches the
actual portal DOM node the Layer is still rendering into via
`createPortal`, so the Layer's content silently disappears from the page
even though React/application state still considers it open.

## `containerRef` is never populated when a `ref` is forwarded to `Layer`, breaking "focus already inside layer" detection

**File:** `LayerContainer.js:69, 106-118, 197`

**Description:**
```js
const containerRef = useRef();
...
<StyledContainer
  ref={ref || containerRef}
  ...
>
...
useEffect(() => {
  if (position !== 'hidden') {
    const node = layerRef.current || containerRef.current || ref.current;
    ...
    let element = document.activeElement;
    while (element) {
      if (element === containerRef.current) {
        // already have focus inside the container
        break;
      }
      element = element.parentElement;
    }
    if (modal && !element && focusSpanRef.current) {
      focusSpanRef.current.focus();
    }
  }
}, [modal, position, ref]);
```

`StyledContainer`'s DOM ref is `ref || containerRef` — when the caller
forwards a `ref` to `Layer` (e.g. `<Layer ref={myRef}>`), that `ref` becomes
the actual container ref and `containerRef.current` is left permanently
`undefined`. The "was focus already placed inside the container by the
caller" walk-up loop, however, only compares against `containerRef.current`,
never against `ref.current`. With `containerRef.current` always
`undefined`, the loop can never `break` early, `element` always ends up
`null`, and the "honor caller's existing focus" branch is effectively dead
whenever an external `ref` is supplied.

**Failure scenario:**
Render `<Layer ref={layerRef}><input autoFocus /></Layer>` (or any content
that focuses an element inside the layer on mount). Because a `ref` was
passed to `Layer`, `containerRef.current` stays `undefined`, so the effect
concludes focus is not inside the container and (when `modal` is true)
forcibly moves focus to the hidden `FocusSpan`, stealing focus away from the
element the caller intentionally auto-focused. The documented behavior
("If the caller put focus on an element already, we honor that") does not
hold whenever a ref is forwarded to `Layer`.

## Possible double invocation of `onClickOutside` for clicks on the modal overlay (worth verifying)

**File:** `LayerContainer.js:120-194, 234-241`

**Description:**
The modal backdrop is rendered as `<StyledOverlay onMouseDown={onClickOutside} .../>`
(a React synthetic handler), while a separate native `mousedown` listener is
registered on `document` in the same component (`onClickDocument`) to detect
clicks outside the Layer's portal. That native listener walks up
`event.target`'s ancestors looking for the `data-g-portal-id` attribute,
which is set only on `StyledContainer` — the overlay itself is a *sibling*
of `StyledContainer`, not a descendant, and carries no such attribute. As a
result, a `mousedown` on the overlay is classified by `onClickDocument` as
"outside the Layer" (`clickedPortalId === null`), so `onClickOutside` is
invoked a second time via the document listener in addition to the direct
`onMouseDown` on the overlay.

**Failure scenario:**
A modal `<Layer modal onClickOutside={fn} />` is open. The user clicks the
dimmed backdrop to dismiss it. `fn` may run twice for the single click (once
via `StyledOverlay`'s `onMouseDown`, once via the `document` `mousedown`
listener). If `onClickOutside` does something non-idempotent (e.g. pop a
navigation/history stack, close two stacked layers, decrement a counter),
a single backdrop click could produce a doubled effect. This depends on
where React's synthetic-event root sits relative to the portal target in
the real DOM, so it should be verified against the app's actual mount setup
before treating it as confirmed.