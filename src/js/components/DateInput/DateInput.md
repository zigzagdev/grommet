# DateInput — Potential Issues

## `valuesAreEqual` does not check array length, only overlap of the shorter array

**File:** `src/js/components/DateInput/utils.js:233-237`

```js
export const valuesAreEqual = (value1, value2) =>
  (Array.isArray(value1) &&
    Array.isArray(value2) &&
    value1.every((d1, i) => d1 === value2[i])) ||
  value1 === value2;
```

`Array.prototype.every` only iterates over `value1`'s own length. If `value2` is
longer than `value1` but all of `value1`'s entries match the first N entries of
`value2`, the function returns `true` even though the arrays are not equal
(different length / extra trailing dates).

This is used in `DateInput.js` (around line 203-216) to decide whether the
displayed `textValue` needs to be resynchronized with an externally-changed
`value` prop for range dates:

```js
if (
  !valuesAreEqual(
    textToValue(textValue, schema, range, reference),
    textToValue(nextTextValue, schema, range, reference),
  ) ||
  (textValue === '' && nextTextValue !== '')
) {
  setTextValue(nextTextValue);
}
```

**Failure scenario:** In range mode, if the text currently in the input only
parses to a partial/short array (e.g. the user is mid-edit and only the start
date is parseable, yielding `['2024-01-01T...']`) and the caller then changes
the `value` prop to a full two-date range beginning with the same date, e.g.
`['2024-01-01T...', '2024-06-01T...']`, `valuesAreEqual` will report the two
as equal (since `.every` only checks index 0). As a result, `setTextValue` is
never called and the displayed text does not update to reflect the new
externally-supplied end date.
