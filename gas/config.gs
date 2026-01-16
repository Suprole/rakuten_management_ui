/**
 * 設定
 */
function getConfig_() {
  var rawName = getRawSheetName_()
  return {
    sheets: {
      raw: rawName,
      productsCache: "webui_products_cache",
      skusCache: "webui_skus_cache",
      productNotes: "product_notes",
      settings: "settings",
    },
    // 仕様書: tax_rate=0.1, fee_rate=0.07, default_point_rate=0.01
    defaults: {
      taxRate: 0.1,
      feeRate: 0.07,
      defaultPointRate: 0.01,
    },
    // 更新頻度（運用方針）: 60分
    refreshMinutes: 60,
  }
}

/**
 * rawシート名は Script Properties で上書き可能（未設定ならデフォルト）
 * - RAW_SHEET_NAME（例: "商品一元管理"）
 */
function getRawSheetName_() {
  var props = PropertiesService.getScriptProperties()
  var v = String(props.getProperty("RAW_SHEET_NAME") || "").trim()
  return v || "商品一元管理"
}

/**
 * Script Properties でスプレッドシートIDを管理する。
 *
 * - SOURCE_SPREADSHEET_ID: 元データ（rawが入っている）スプレッドシート
 * - WEBUI_SPREADSHEET_ID: WebUI用（cache/notes/settingsがある）スプレッドシート
 */
function setSpreadsheetIds(sourceSpreadsheetId, webuiSpreadsheetId) {
  var props = PropertiesService.getScriptProperties()
  props.setProperty("SOURCE_SPREADSHEET_ID", String(sourceSpreadsheetId || "").trim())
  props.setProperty("WEBUI_SPREADSHEET_ID", String(webuiSpreadsheetId || "").trim())
}

function getSpreadsheetIds_() {
  var props = PropertiesService.getScriptProperties()
  var sourceId = String(props.getProperty("SOURCE_SPREADSHEET_ID") || "").trim()
  var webuiId = String(props.getProperty("WEBUI_SPREADSHEET_ID") || "").trim()
  if (!sourceId) throw new Error("Missing Script Property: SOURCE_SPREADSHEET_ID")
  if (!webuiId) throw new Error("Missing Script Property: WEBUI_SPREADSHEET_ID")
  return { sourceId: sourceId, webuiId: webuiId }
}

function getSourceSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetIds_().sourceId)
}

function getWebuiSpreadsheet_() {
  return SpreadsheetApp.openById(getSpreadsheetIds_().webuiId)
}

