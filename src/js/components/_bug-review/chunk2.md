# Chunk 2 — CardHeader, Cards, Carousel, Chart, CheckBox, CheckBoxGroup, Clock, Collapsible, Data, DataChart

問題なし: CardHeader, Collapsible

## 問題ありでレポート作成済み

- **Cards** ([Cards/Cards.md](../Cards/Cards.md))
  デフォルトの item renderer が `??` を使用しているため、オブジェクト型 item が常に空表示になる(`||` であるべきフォールバックがデッドコード化)。

- **Carousel** ([Carousel/Carousel.md](../Carousel/Carousel.md))
  autoplay の `useEffect`(Carousel.js:148-169)が `children` に依存しており、親の再レンダリングのたびに `setInterval` が再生成される。親の再レンダリング頻度が再生間隔より高いと autoplay が実質動かなくなる。

- **Chart** ([Chart/Chart.md](../Chart/Chart.md))
  `calcs.js:143-154` で `options.direction` 指定時に `options.max`/`options.min` が反対の軸(x/y)にマッピングされ、クランプが誤った軸に適用される。

- **CheckBox** ([CheckBox/CheckBox.md](../CheckBox/CheckBox.md))
  `indeterminate` prop がカスタム SVG アイコンにしか反映されず、ネイティブ `input.indeterminate` DOM プロパティおよび `aria-checked="mixed"` が設定されない。スクリーンリーダーに mixed 状態が伝わらない。

- **Clock** ([Clock/Clock.md](../Clock/Clock.md))
  Clock.js:106-123、逆回転クロックが深夜0時をまたぐ際、`hours` が `0` に固定され `23` へのラップアラウンドが起きず時計が止まる。

- **Data** ([Data/Data.md](../Data/Data.md))
  Data.js:59,90、`selected`(配列)を `selected > 0` で比較しており、配列→数値の型強制により常に `false` 評価。「N件選択中」のスクリーンリーダー通知が発火しない(検証済み)。

- **DataChart** ([DataChart/DataChart.md](../DataChart/DataChart.md))
  - `YAxis.js:48-60` が `XAxis.js` のセンタリングロジックをそのまま流用しており、横方向 pad をチェックしている(縦方向であるべき)。縦横 pad が異なるとラベル配置がずれる。
  - `Detail.js:65-79` の `onMouseLeave` が null チェックなしに `activeIndex.current.getBoundingClientRect()` を参照。キーボード操作で detail popup を開いた場合(`activeIndex.current` が未設定)にマウスが離れると `TypeError`。