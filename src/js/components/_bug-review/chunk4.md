# Chunk 4 — DateInput, Diagram, Distribution, Drop, DropButton, FileInput, Footer, Form, FormField, Grid

問題なし: Diagram, DropButton, Footer
(Distribution: 負値エッジケースで再帰が理論上無限になりうるが、非典型的な入力が前提のため未報告)

## 問題ありでレポート作成済み

- **DateInput** ([DateInput/DateInput.md](../DateInput/DateInput.md))
  `valuesAreEqual`(utils.js:233-237)が `value1` の長さのみで `Array.prototype.every` 比較するため、短い配列(編集途中のパース結果など)を長い配列と誤って「等しい」と判定しうる。外部から `value` prop に end date が追加されても表示テキストが再同期されないケースがある。

- **Drop** ([Drop/Drop.md](../Drop/Drop.md))
  1. Drop.js:32-43、`!containerChildNodesLength.current` を「初期化済み」ガードとして使用しているが、コンテナの子要素が 0 個で始まる場合 falsy 判定が壊れ、StrictMode 等でポータルコンテナが重複しうる。
  2. StyledDrop.js:47、`if (!Object.keys(adjustedMargin))` は配列が常に truthy のため常に false。意図された `'none'` マージンのフォールバックがデッドコード化している。

- **FileInput** ([FileInput/FileInput.md](../FileInput/FileInput.md))
  複数回の browse 操作でファイルをマージする(`multiple` モード)際、ネイティブ `<input>` の `FileList` が同期されない。`removeFile` が古い `FileList` から `DataTransfer` を再構築するため、UI表示と実際のアップロード内容が乖離し、以前選択済みのファイルが静かに欠落する。

- **Form** ([Form/Form.md](../Form/Form.md))
  `buildValid`(Form.js:268-282)が `value[field] &&` という truthy 判定をしている。正当な入力値 `0` が必須フィールドを満たしていないと誤判定され、エラーが無いのに `onValidate` の `valid` フラグが `false` になる(検証済み)。
- 
- **Grid** ([Grid/Grid.md](../Grid/Grid.md))
  `areasStyle`(StyledGrid.js:189-213)が `columns`/`rows` が配列でない場合に `console.warn` するだけで処理を止めず、直後に `.map` を呼んで `TypeError` になる。propTypes はオブジェクト形式の `areas` と非配列の `columns`/`rows` の組み合わせを許容しているため、到達可能なクラッシュ(検証済み)。