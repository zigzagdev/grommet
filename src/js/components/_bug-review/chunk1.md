# Chunk 1 — Accordion, AccordionPanel, Anchor, Avatar, Box, Button, Calendar, Card, CardBody, CardFooter

問題なし: Accordion, Anchor, Card, CardBody, CardFooter

## 問題ありでレポート作成済み

- **AccordionPanel** ([AccordionPanel/AccordionPanel.md](../AccordionPanel/AccordionPanel.md))
  `theme.accordion.hover.color` をガードなしで参照(AccordionPanel.js:53付近)。カスタムテーマで `accordion.hover` が未定義だと例外になる。周辺の他の参照はガードされており不整合。

- **Avatar** ([Avatar/Avatar.md](../Avatar/Avatar.md))
  `useCallback` で定義された `AvatarChildren`(Avatar.js:38-45)が毎レンダリングで新しい identity を持ち、カスタム JSX 子要素が不要にアンマウント/再マウントされる。

- **Box** ([Box/Box.md](../Box/Box.md))
  `ResponsiveContainerProvider.js:12` で `navigator.userAgent` を SSR ガードなしで参照。`Box responsive="container"` を styled-components v6+ と併用した場合、SSR でクラッシュする(検証済み)。

- **Button** ([Button/Button.md](../Button/Button.md))
  - Badge.js:69-74 カスタム JSX コンテンツでバッジをサイズ調整する際、width/height が入れ替わり px 単位も欠落する。
  - Button.js:536 kind/テーマ経路で children がある場合、明示的な `plain={false}` が無視される(legacy 非 kind 経路とは挙動が異なる)。

- **Calendar** ([Calendar/Calendar.md](../Calendar/Calendar.md))
  - `handleRange`(Calendar.js:611)で終了日側に開始日側と同様の null ガードがなく、`.getTime()` で `TypeError` の可能性。
  - ヘッダタイトルのテーマ参照(Calendar.js:696-701)が脆弱で、`calendar[size].title`/`.container` を欠くカスタムテーマでクラッシュしうる。