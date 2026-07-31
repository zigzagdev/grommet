# Form — Potential Issues

## `buildValid` treats falsy-but-valid required field values (e.g. `0`) as missing

**File:** `src/js/components/Form/Form.js:268-282`

```js
const buildValid = useCallback(
  (nextErrors) => {
    let valid = false;
    valid = requiredFields.current
      .filter((n) => Object.keys(validationRulesRef.current).includes(n))
      .every(
        (field) =>
          value[field] && (value[field] !== '' || value[field] !== false),
      );

    if (Object.keys(nextErrors).length > 0) valid = false;
    return valid;
  },
  [value],
);
```

The `.every` predicate starts with `value[field] &&`, a plain truthiness
check. This means any falsy-but-legitimate value — most notably the number
`0` — is treated as "field not satisfied", even though such a value is a
perfectly valid answer for a required numeric field.

This is inconsistent with the actual per-field required-ness check used to
populate `errors` (`validateName`, `Form.js:139-146`), which correctly checks
only for `undefined`, `''`, `false`, or an empty array — `0` is explicitly
**not** treated as missing there:

```js
if (
  required &&
  (fieldValue === undefined ||
    fieldValue === '' ||
    fieldValue === false ||
    (Array.isArray(fieldValue) && !fieldValue.length))
) {
  validationResult = format({ id: 'form.required', messages });
}
```

So a required field with value `0` produces **no** entry in `errors`, but
`buildValid` still reports the overall form as invalid.

**Failure scenario:** A `Form` contains a required numeric `FormField`/
`TextInput` (e.g. "Number of dependents", `required`) and the user legitimately
enters `0`. No error is added to `validationResults.errors` for that field
(per `validateName`), yet `onValidate({..., valid: buildValid(nextErrors)})`
reports `valid: false` (or, on submit, `validationResults.valid` is `false`)
because `value[field]` (`0`) is falsy in `buildValid`'s check. Any caller that
uses the `valid` flag to enable/disable a submit button, or to decide the form
is complete, will incorrectly keep the form marked invalid even though there
are no visible errors.