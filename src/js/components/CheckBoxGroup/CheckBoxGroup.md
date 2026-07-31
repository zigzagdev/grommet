# CheckBoxGroup — Potential Issues

## Component crashes when `options` prop is omitted

**File:** `src/js/components/CheckBoxGroup/CheckBoxGroup.js:24,34`

**Defect:**
```js
options: optionsProp,
...
const options = optionsProp.map((option) => ...)
```
`optionsProp` has no default value in the destructured props, and `propTypes.js` does not mark `options` as `isRequired` (it is `PropTypes.oneOfType([...])` with no `.isRequired`), signaling it is meant to be optional. However the component unconditionally calls `.map()` on it with no null/undefined guard or fallback (e.g. `optionsProp = []`).

**Failure scenario:** Render `<CheckBoxGroup name="prefs" onChange={fn} />` without an `options` prop (e.g. options are still loading asynchronously, or the caller relies on default). This throws `TypeError: Cannot read properties of undefined (reading 'map')` and crashes the component/render tree instead of rendering an empty group.