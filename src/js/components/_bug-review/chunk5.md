# Chunk 5 — Grommet, Header, Heading, Image, InfiniteScroll, Keyboard, Layer, List, Main, Markdown

問題なし: Header, Image, InfiniteScroll, Keyboard, Main, Markdown

## 問題ありでレポート作成済み

- **Grommet** ([Grommet/Grommet.md](../Grommet/Grommet.md))
  `themeMode="auto"` が `matchMedia` を `theme` の `useMemo` 内で1回しかチェックしておらず、`change` リスナーが無い。マウント中の OS ダーク/ライト切替にライブ反応しない(要検証寄り)。

- **Heading** ([Heading/Heading.md](../Heading/Heading.md))
  overflowWrap の再計算(`useLayoutEffect`)が mount/resize 時のみ発火し、`children` の内容変化では走らない。動的にテキストが更新されると `overflow-wrap` が古い値のまま残る。

- **Layer** ([Layer/Layer.md](../Layer/Layer.md))
  1. クリーンアップ専用の `useLayoutEffect`(Layer.js:59-115)が `modal`/`animate`/`animation`/`containerTarget` の変化のたびに「アンマウント時処理」(アニメーションアウト+DOM除去)を発火させてしまう。開いている Layer がこれらの prop 変更だけで視覚的に消えることがある(検証済み・実在バグ)。
  2. LayerContainer.js、`ref` が Layer に転送された場合 `containerRef.current` が populate されず、「フォーカスが既に layer 内にあるか」の判定が壊れ、オートフォーカスされた子要素からフォーカスが強制的に奪われる。
  3. オーバーレイに `data-g-portal-id` 属性が無いため、document レベルの click-outside リスナーにより `onClickOutside` が二重発火する可能性(要検証)。

- **List** ([List/List.md](../List/List.md))
  1. `key = getValue(...) || index` が `0`/`''` のような正当な falsy 値を index にすり替えてしまい、`pinned`/`disabled` 配列とのマッチングが壊れる。
  2. `paginate` 有効時、`onDown` キーボードハンドラが現在ページの表示件数ではなく `data.length` でクランプされ、`focused` が実際に描画されていない項目を指しうる。
  3. `focus` prop が分割代入されているが未使用(デッドprop、ドキュメント化もされていない)。