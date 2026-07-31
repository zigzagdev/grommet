# FormField — Potential Issues

## Reversed `.indexOf` substring checks can false-positive match unrelated components

**File:** `src/js/components/FormField/FormField.js:266-267` (also present at
line 326 and line 376)

```js
const readOnlyField = useMemo(() => {
  let readOnly = false;
  if (children) {
    Children.map(children, (child) => {
      if (
        (child?.props?.readOnly === true ||
          child?.props?.readOnlyCopy === true) &&
        child.type &&
        ('TextInput'.indexOf(child.type.displayName) !== -1 ||
          'DateInput'.indexOf(child.type.displayName) !== -1)
      ) {
        readOnly = true;
      }
    });
  }
  return readOnly;
}, [children]);
```

This checks whether `child.type.displayName` is a **substring of** the fixed
string `'TextInput'` / `'DateInput'` (`FIXED_STRING.indexOf(dynamicValue)`),
rather than checking equality or membership in a list (which is how the rest
of the file does these checks, e.g. `grommetInputNames.indexOf(child.type.displayName)`
at line 315). Because of this reversed order, the check also matches when
`child.type.displayName` happens to be any substring of `'TextInput'` or
`'DateInput'` — not just an exact match. For example, grommet's own `Text`
component has `displayName = 'Text'` (see `Text.js`), and `'TextInput'.indexOf('Text')`
is `0`, which is `!== -1`.

The same reversed pattern is used for the FileInput detection
(`'FileInput'.indexOf(child.type.displayName) !== -1`, line 376) and the
CheckBox pad detection (`'CheckBox'.indexOf(child.type.displayName) !== -1`,
line 326), which carry the same class of risk for any component whose
`displayName` is a substring of those strings.

**Failure scenario:** A `FormField` wraps a `Text` child that (perhaps
mistakenly, or via prop spreading from a shared config object) receives a
`readOnly` prop:

```jsx
<FormField label="Note">
  <Text readOnly>Some static content</Text>
</FormField>
```

`child.type.displayName` is `'Text'`, and `'TextInput'.indexOf('Text') !== -1`
is `true`, so `readOnlyField` becomes `true` even though the child is not a
`TextInput`/`DateInput` at all. This flips on the read-only background/border
theming (`themeContentProps.background = theme.global.input.readOnly?.background`,
`borderColor = theme.global.input?.readOnly?.border?.color`) for a field that
was never meant to render as a read-only input.