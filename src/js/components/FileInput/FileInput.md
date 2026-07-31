# FileInput — Potential Issues

## Native `<input>` FileList is never synced when files are added across multiple browse actions, causing `removeFile` to desync and drop files

**File:** `src/js/components/FileInput/FileInput.js:195-228` (`removeFile`) and
`FileInput.js:328-350` (`onChange` handler)

When `multiple` is enabled, the `onChange` handler merges newly-selected
files into the existing React `files` state:

```js
onChange={(event) => {
  ...
  const fileList = event.target.files;
  if (!fileList.length && files.length) return;
  const nextFiles = multiple ? [...files] : [];
  for (let i = 0; i < fileList.length; i += 1) {
    // avoid duplicates ...
    if (!existing) nextFiles.push(fileList[i]);
  }
  setFiles(nextFiles);
  ...
}}
```

This only updates React state (`setFiles(nextFiles)`) — it never updates
`inputRef.current.files` (the real, native `<input type="file">` element's
`FileList`). The native element's `files` is only ever rebuilt inside
`removeFile`:

```js
const removeFile = (index) => {
  ...
  const dt = new DataTransfer();
  const curFiles = inputRef.current.files; // native FileList
  ...
  for (let i = 0; i < curFiles.length; i += 1) {
    const curfile = curFiles[i];
    if (index !== i) dt.items.add(curfile);
  }
  ...
  nativeInputValueSetter.call(inputRef.current, dt.files);
  ...
};
```

Because native `<input type="file" multiple>` selection *replaces* (rather
than appends to) `event.target.files` on every browse action, after a second
separate browse/select action `inputRef.current.files` only contains the
files from that latest browse action — not the full merged set the React
`files` state (and the UI) is showing. `removeFile` builds its `DataTransfer`
from this stale/mismatched `inputRef.current.files`, using an index that was
computed against the (larger) React `files` array, so it removes the wrong
native file(s) and drops files that the UI still shows as selected.

**Failure scenario:**
1. `<FileInput multiple />` is rendered.
2. User clicks Browse, selects `a.txt`. Native `input.files = [a.txt]`, React
   `files = [a.txt]`.
3. User clicks Browse again, selects `b.txt`. The browser replaces the native
   FileList: `input.files = [b.txt]`. The `onChange` handler merges into React
   state: `files = [a.txt, b.txt]` (both shown in the UI).
4. User clicks the remove button for `a.txt` (index `0`). `removeFile(0)`
   reads `curFiles = inputRef.current.files` = `[b.txt]` (only 1 item, since
   step 3 never synced the native input). The loop only has `i = 0`, and
   since `index (0) !== i (0)` is `false`, `b.txt` is never added to `dt`.
   The native input ends up with **zero** files.
5. React state becomes `files = [b.txt]` after `splice(0, 1)`, so the UI still
   shows `b.txt` as selected — but the underlying native `<input>` (which is
   what an actual native form submission or any external code reading
   `inputRef.current.files` would use) has no files at all. `b.txt` is
   silently lost from the real upload payload despite appearing selected.