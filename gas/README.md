# GAS（スプレッドシート→Web用キャッシュ生成 / JSONスナップショット出力）

このフォルダは、仕様書 `../仕様書.md` に基づく **Google Apps Script** 実装です。

## clasp 管理

- `gas/.clasp.json` に scriptId を設定済み
- `gas/` で `clasp push` / `clasp pull` を実行します

```bash
cd gas
clasp login
clasp push
```

## スプレッドシート参照（重要：rawとWebUI用は別）

Script Properties で参照先を分離します（設定は運用側で実施）。

- `SOURCE_SPREADSHEET_ID`: 元データ（rawがある）スプレッドシートID
- `WEBUI_SPREADSHEET_ID`: WebUI用（cache/notes/settings）スプレッドシートID
- `RAW_SHEET_NAME`（任意）: rawシート名（未設定なら `商品一元管理`）

## 動作確認（スモーク）

1. Script Properties を設定
2. `smokeTestCaches()` を実行
3. WebUI用スプレッドシートに `webui_products_cache` / `webui_skus_cache` が更新されることを確認

## GCSスナップショット出力

Script Properties:
- `GCS_BUCKET`（必須）
- `GCS_PREFIX`（任意）

手動実行: `exportSnapshotsToGcs()`

