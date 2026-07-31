# Chunk 3 — DataClearFilters, DataFilter, DataFilters, DataSearch, DataSort, DataSummary, DataTable, DataTableColumns, DataTableGroupBy, DataView

問題なし: DataClearFilters, DataFilter, DataSearch, DataSummary, DataTableGroupBy, DataView

## 問題ありでレポート作成済み

- **DataFilters** ([DataFilters/DataFilters.md](../DataFilters/DataFilters.md))
  フィルタバッジのカウントが boolean `false` の presence フィルタ(`view.properties.x = false`)を除外してしまう。falsy 値のため有効なフィルタとしてカウントされない。

- **DataSort** ([DataSort/DataSort.md](../DataSort/DataSort.md))
  `options` prop が常に上書きされ効果を持たない。if/else if/else の分岐が必ずいずれか実行されるため、`optionsArg`(prop 由来)が握り潰される(検証済み)。

- **DataTable** ([DataTable/DataTable.md](../DataTable/DataTable.md))
  1. 全選択チェックボックスの `a11yTitle` が `data.length` のみを参照する一方、`checked`/`indeterminate` は `contextTotal || data.length` や `groupBy.select` 分岐も見るため、サーバーページネーション/グループ化時に「全解除」とアナウンスしつつ実際は indeterminate、という不整合がありうる。
  2. リサイズ確定(ドラッグ終了)時に `width` 状態がクリアされ、直後の `aria-valuenow`/ピクセル値がセパレータから失われる。
  3. ピン留め列のオフセット計算が、先行するピン留め列の幅がまだ取得されていないタイミングで例外になりうる(要検証)。

- **DataTableColumns** ([DataTableColumns/DataTableColumns.md](../DataTableColumns/DataTableColumns.md))
  `filteredOptions` state が `options` prop から初回のみ設定され、検索ハンドラ内でのみ再同期される。検索せずに `options` が変わると stale なまま残る。