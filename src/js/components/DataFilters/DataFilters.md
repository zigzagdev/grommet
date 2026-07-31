# DataFilters — Potential Issues

## Filter badge undercounts boolean "false" filters

**File:** `DataFilters.js:77-92` (view→touched sync effect) and `DataFilters.js:97-102` (badge calculation)

**Description:**
When the controlled filter control (`drop`/`layer`) syncs `touched` from
`view.properties`:

```js
const nextTouched = { ...view.properties };
Object.keys(nextTouched).forEach((k) => { ... delete nextTouched[k]; ... });
setTouched(nextTouched);
```

and the badge count is computed as:

```js
const badge = useMemo(
  () =>
    (controlled && Object.keys(touched).filter((k) => touched[k]).length) ||
    undefined,
  [controlled, touched],
);
```

`Object.keys(touched).filter((k) => touched[k])` treats any *falsy* touched value as "not
an active filter." `Data`'s underlying filter engine (`Data/filter.js`) explicitly supports
a boolean "presence" filter: `typeof filterValue === 'boolean'` is matched directly against
truthy/falsy data values. So a legitimate, currently-applied filter whose value is the
boolean `false` (e.g. `view.properties = { active: false }`, filtering for rows where
`active` is falsy) is excluded from the badge count because `touched.active === false` is
falsy.

**Failure scenario:**
An app sets `view` (directly, or via `defaultView`/a named view in `views`) to
`{ properties: { active: false } }` to show only inactive records, and renders
`<DataFilters drop />`. The data is correctly filtered (via `Data/filter.js`), but the
filter control's badge does not appear (or, if other truthy filters are also active,
undercounts by one), because the `active: false` entry is filtered out of the badge
tally even though it is an active, applied filter.