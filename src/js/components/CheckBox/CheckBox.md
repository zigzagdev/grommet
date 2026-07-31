# CheckBox — Potential Issues

## `indeterminate` state is not exposed to assistive technology or the native checkbox

**File:** `src/js/components/CheckBox/CheckBox.js` (whole component; see props at lines 54, 101, 135-162, and the native `<input>` at lines 174-199)

**Defect:** The `indeterminate` prop only affects which custom SVG icon is drawn inside the visual box (lines 135-162). It never:
1. sets the native DOM property `inputRef.current.indeterminate = true` on the underlying `<input type="checkbox">` (the HTML `indeterminate` state has no attribute — it must be set imperatively via JS/ref), nor
2. sets `aria-checked="mixed"` on the input.

Neither `CheckBox.js` nor `StyledCheckBox.js` reference `element.indeterminate` or `aria-checked` anywhere in the component.

**Failure scenario:** Render `<CheckBox indeterminate label="Select all" />`. Sighted users see the custom dash icon, but a screen reader user tabbing to the checkbox hears only "not checked" (or "checked", depending on `checked`) rather than the expected "partially checked"/mixed state, because the underlying native input's `indeterminate` IDL property and `aria-checked` are never set. This is a real accessibility regression for the indeterminate feature.