# Avatar — Potential Issues

## Component defined inline with `useCallback` causes the JSX-children subtree to remount on every render

**File:** `Avatar/Avatar.js:38-45, 84`

**Description:**

```js
const AvatarChildren = useCallback(
  () => (
    <StyledAvatar {...avatarProps} {...rest}>
      {children}
    </StyledAvatar>
  ),
  [avatarProps, children, rest],
);
...
return <AvatarChildren />;
```

`AvatarChildren` is a component defined inside the `Avatar` render body and instantiated via `useCallback`, then rendered as a JSX element (`<AvatarChildren />`). Because `rest` is produced by object-rest destructuring in the function's parameter list, it is a brand-new object reference on every render of `Avatar`, so the `useCallback` dependency array changes on virtually every render, producing a new function identity for `AvatarChildren` each time. React treats a changed component-type identity as a different component, so it unmounts the previous `StyledAvatar` subtree and mounts a new one instead of reconciling it in place.

**Failure scenario:** `<Avatar>{someJsxNode}</Avatar>` is used (i.e. `children` is not a plain string, and `src` is not set, so the code falls through to the `AvatarChildren` render path). Any re-render of the parent (e.g. unrelated state change elsewhere in the tree, a theme update, or the Avatar's own `rest` props changing) forces the whole `StyledAvatar`/children subtree to unmount and remount. This causes visible flicker, resets any state/animation/focus inside the custom child content, and is unnecessary work compared to normal reconciliation.