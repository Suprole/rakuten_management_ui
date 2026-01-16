function initSheets() {
  var ss = getWebuiSpreadsheet_()
  ensureSheet_(ss, getConfig_().sheets.productsCache, productsCacheHeaders_())
  ensureSheet_(ss, getConfig_().sheets.skusCache, skusCacheHeaders_())
  ensureSheet_(ss, getConfig_().sheets.productNotes, ["product_code", "rating", "memo", "updated_at"])
  ensureSheet_(ss, getConfig_().sheets.settings, ["key", "value"])
}

function regenerateCaches() {
  var ss = getWebuiSpreadsheet_()
  var cfg = getConfig_()
  var settings = loadSettings_(ss)

  var sourceSs = getSourceSpreadsheet_()
  var rawSheet = getSheetByName_(sourceSs, cfg.sheets.raw)
  var rawValues = rawSheet.getDataRange().getValues()
  if (rawValues.length < 2) throw new Error("raw has no data rows")

  var headers = rawValues[0]
  var m = rawHeaderMap_(headers)

  var IDX = {
    product_code: idx_(m, "商品管理番号"),
    sku_code: idx_(m, "SKU管理番号"),
    sku_no: idx_(m, "SKU番号"),
    rating: idx_(m, "商品評価"),
    product_name: idx_(m, "商品名"),
    shipping_type: idx_(m, "宅配種別"),
    cost_ex_tax: idx_(m, "仕入れ値"),
    stock: idx_(m, "在庫数"),
    stock0_days: idx_(m, "在庫0日日数"),
    price_in_tax: idx_(m, "設定販売価格"),
    access_lm: idx_(m, "先月アクセス人数"),
    access_m: idx_(m, "今月アクセス人数"),
    cv_lm: idx_(m, "先月転換率"),
    cv_m: idx_(m, "今月転換率"),
    orders_total_lm: idx_(m, "先月総購入件数"),
    orders_total_m: idx_(m, "今月総購入件数"),
    orders_new_lm: idx_(m, "先月新規購入件数"),
    orders_new_m: idx_(m, "今月新規購入件数"),
    orders_rep_lm: idx_(m, "先月リピート購入件数"),
    orders_rep_m: idx_(m, "今月リピート購入件数"),
    reviews_post_lm: idx_(m, "先月レビュー投稿数"),
    reviews_post_m: idx_(m, "今月レビュー投稿数"),
    reviews_total: idx_(m, "総レビュー数"),
    stay_lm: idx_(m, "先月平均滞在時間"),
    stay_m: idx_(m, "今月平均滞在時間"),
    bounce_lm: idx_(m, "先月離脱率"),
    bounce_m: idx_(m, "今月離脱率"),
    fav_add_lm: idx_(m, "先月お気に入り登録ユーザー数"),
    fav_add_m: idx_(m, "今月お気に入り登録ユーザー数"),
    fav_total: idx_(m, "お気に入り総ユーザー数"),
    sales_units_lm: idx_(m, "先月売上個数"),
    sales_units_m: idx_(m, "今月売上個数"),
    sales_amount_lm: idx_(m, "先月売上"),
    sales_amount_m: idx_(m, "今月売上"),
    profit_lm: idx_(m, "先月利益"),
    profit_m: idx_(m, "今月利益"),
    setting_unit_profit: idx_(m, "設定価格単利益"),
    setting_margin: idx_(m, "設定価格利益率"),
  }

  // product_notes（永続）を読み込み（存在しない/空でもOK）
  var notesMap = {}
  try {
    var notesSheet = getSheetByName_(ss, cfg.sheets.productNotes)
    var notesValues = notesSheet.getDataRange().getValues()
    if (notesValues.length >= 2) {
      var nh = notesValues[0]
      var nm = rawHeaderMap_(nh)
      var nIdx = {
        product_code: idx_(nm, "product_code"),
        rating: idx_(nm, "rating"),
        memo: idx_(nm, "memo"),
        updated_at: idx_(nm, "updated_at"),
      }
      for (var r = 1; r < notesValues.length; r++) {
        var row = notesValues[r]
        var pc = String(row[nIdx.product_code] || "").trim()
        if (!pc) continue
        notesMap[pc] = {
          rating: String(row[nIdx.rating] || "").trim() || null,
          memo: String(row[nIdx.memo] || ""),
          updated_at: row[nIdx.updated_at] ? String(row[nIdx.updated_at]) : null,
        }
      }
    }
  } catch (e) {}

  var skusRows = []
  var productsAgg = {}
  var nowIso = new Date().toISOString()

  for (var i = 1; i < rawValues.length; i++) {
    var rv = rawValues[i]
    var productCode = String(rv[IDX.product_code] || "").trim()
    if (!productCode) continue

    var skuCode = String(rv[IDX.sku_code] || "").trim()
    var skuNo = String(rv[IDX.sku_no] || "").trim()
    var skuKey = skuCode || skuNo || ""

    var shippingType = String(rv[IDX.shipping_type] || "").trim()
    var costExTax = normalizeNumber_(rv[IDX.cost_ex_tax])
    var stock = normalizeNumber_(rv[IDX.stock])
    var stock0Days = normalizeNumber_(rv[IDX.stock0_days])
    var priceInTax = normalizeNumber_(rv[IDX.price_in_tax])
    var salesUnitsM = normalizeNumber_(rv[IDX.sales_units_m])
    var salesUnitsLm = normalizeNumber_(rv[IDX.sales_units_lm])
    var salesAmountM = normalizeNumber_(rv[IDX.sales_amount_m])
    var profitM = normalizeNumber_(rv[IDX.profit_m])
    var settingUnitProfit = normalizeNumber_(rv[IDX.setting_unit_profit])
    var settingMargin = normalizeNumber_(rv[IDX.setting_margin])

    skusRows.push([
      productCode,
      skuKey,
      shippingType,
      costExTax,
      stock,
      stock0Days,
      priceInTax,
      salesUnitsM,
      salesUnitsLm,
      salesAmountM,
      profitM,
      settingUnitProfit,
      settingMargin,
      nowIso,
    ])

    if (!productsAgg[productCode]) {
      var rawRating = String(rv[IDX.rating] || "").trim() || null
      var rawProductName = String(rv[IDX.product_name] || "").trim()

      productsAgg[productCode] = {
        product_code: productCode,
        product_name: rawProductName,
        sku_count: 0,
        oos_sku_count: 0,
        shipping_type_counts: {},
        representative_sku: skuKey,
        representative_sku_sales_m: salesUnitsM,
        rating: rawRating,
        memo: "",
        note_updated_at: null,
        stock_sum: 0,
        sales_units_m: 0,
        sales_units_lm: 0,
        sales_amount_m: 0,
        sales_amount_lm: 0,
        profit_m: 0,
        profit_lm: 0,
        access_m: null,
        access_lm: null,
        cv_m: null,
        cv_lm: null,
        bounce_m: null,
        bounce_lm: null,
        stay_m: null,
        stay_lm: null,
        fav_add_m: null,
        fav_add_lm: null,
        fav_total: null,
        orders_total_m: null,
        orders_total_lm: null,
        orders_new_m: null,
        orders_new_lm: null,
        orders_rep_m: null,
        orders_rep_lm: null,
        reviews_post_m: null,
        reviews_post_lm: null,
        reviews_total: null,
        min_setting_margin: null,
        max_setting_margin: null,
        min_setting_unit_profit: null,
      }

      if (notesMap[productCode]) {
        productsAgg[productCode].rating = notesMap[productCode].rating
        productsAgg[productCode].memo = notesMap[productCode].memo
        productsAgg[productCode].note_updated_at = notesMap[productCode].updated_at
      }
    }

    var agg = productsAgg[productCode]
    agg.sku_count += 1
    if (stock === 0) agg.oos_sku_count += 1

    agg.shipping_type_counts[shippingType] = (agg.shipping_type_counts[shippingType] || 0) + 1

    agg.stock_sum += stock
    agg.sales_units_m += salesUnitsM
    agg.sales_units_lm += salesUnitsLm
    agg.sales_amount_m += salesAmountM
    agg.sales_amount_lm += normalizeNumber_(rv[IDX.sales_amount_lm])
    agg.profit_m += profitM
    agg.profit_lm += normalizeNumber_(rv[IDX.profit_lm])

    if (salesUnitsM > agg.representative_sku_sales_m) {
      agg.representative_sku_sales_m = salesUnitsM
      agg.representative_sku = skuKey
    }

    function setIfNull(key, value) {
      if (agg[key] === null) agg[key] = value
    }

    setIfNull("access_m", normalizeNumber_(rv[IDX.access_m]))
    setIfNull("access_lm", normalizeNumber_(rv[IDX.access_lm]))
    setIfNull("cv_m", normalizeNumber_(rv[IDX.cv_m]))
    setIfNull("cv_lm", normalizeNumber_(rv[IDX.cv_lm]))
    setIfNull("bounce_m", normalizeNumber_(rv[IDX.bounce_m]))
    setIfNull("bounce_lm", normalizeNumber_(rv[IDX.bounce_lm]))
    setIfNull("stay_m", normalizeNumber_(rv[IDX.stay_m]))
    setIfNull("stay_lm", normalizeNumber_(rv[IDX.stay_lm]))
    setIfNull("fav_add_m", normalizeNumber_(rv[IDX.fav_add_m]))
    setIfNull("fav_add_lm", normalizeNumber_(rv[IDX.fav_add_lm]))
    setIfNull("fav_total", normalizeNumber_(rv[IDX.fav_total]))
    setIfNull("orders_total_m", normalizeNumber_(rv[IDX.orders_total_m]))
    setIfNull("orders_total_lm", normalizeNumber_(rv[IDX.orders_total_lm]))
    setIfNull("orders_new_m", normalizeNumber_(rv[IDX.orders_new_m]))
    setIfNull("orders_new_lm", normalizeNumber_(rv[IDX.orders_new_lm]))
    setIfNull("orders_rep_m", normalizeNumber_(rv[IDX.orders_rep_m]))
    setIfNull("orders_rep_lm", normalizeNumber_(rv[IDX.orders_rep_lm]))
    setIfNull("reviews_post_m", normalizeNumber_(rv[IDX.reviews_post_m]))
    setIfNull("reviews_post_lm", normalizeNumber_(rv[IDX.reviews_post_lm]))
    setIfNull("reviews_total", normalizeNumber_(rv[IDX.reviews_total]))

    if (agg.min_setting_margin === null || settingMargin < agg.min_setting_margin) agg.min_setting_margin = settingMargin
    if (agg.max_setting_margin === null || settingMargin > agg.max_setting_margin) agg.max_setting_margin = settingMargin
    if (agg.min_setting_unit_profit === null || settingUnitProfit < agg.min_setting_unit_profit) {
      agg.min_setting_unit_profit = settingUnitProfit
    }
  }

  var productsRows = []
  var pHeaders = productsCacheHeaders_()

  var accessList = []
  for (var pc0 in productsAgg) accessList.push(productsAgg[pc0].access_m || 0)
  accessList.sort(function (a, b) { return a - b })
  var topPercent = settings.thresholds.access_top_percent || 0
  var cutoff = 0
  if (accessList.length > 0 && topPercent > 0) {
    var idxCut = Math.floor(accessList.length * (1 - topPercent / 100))
    if (idxCut < 0) idxCut = 0
    if (idxCut >= accessList.length) idxCut = accessList.length - 1
    cutoff = accessList[idxCut]
  }

  for (var pc in productsAgg) {
    var a = productsAgg[pc]
    var mode = ""
    var best = -1
    for (var st in a.shipping_type_counts) {
      var c = a.shipping_type_counts[st]
      if (c > best) {
        best = c
        mode = st
      }
    }

    var accessM = a.access_m || 0
    var accessLm = a.access_lm || 0
    var cvM = a.cv_m || 0
    var cvLm = a.cv_lm || 0

    var ordersTotalM = a.orders_total_m || 0
    var ordersNewM = a.orders_new_m || 0
    var ordersRepM = a.orders_rep_m || 0
    var newRatioM = ordersTotalM > 0 ? (ordersNewM / ordersTotalM) * 100 : 0
    var repRatioM = ordersTotalM > 0 ? (ordersRepM / ordersTotalM) * 100 : 0

    var badges = []
    if (a.stock_sum === 0) badges.push("欠品")
    if (a.stock_sum > 0 && a.stock_sum <= (settings.thresholds.low_stock_threshold || 0)) badges.push("低在庫")
    if (a.sales_units_m === 0) badges.push("売上0")
    if (a.profit_m < 0) badges.push("赤字")
    if (cvM - cvLm < 0) badges.push("CV低下")
    if (a.min_setting_margin !== null && a.min_setting_margin < (settings.thresholds.low_margin_threshold || 0)) badges.push("要注意")
    if (topPercent > 0 && accessM >= cutoff && accessM > 0) badges.push("人気商品")
    if (cvM >= (settings.thresholds.cv_very_high || 0)) badges.push("超高転換率")
    else if (cvM >= (settings.thresholds.cv_high || 0)) badges.push("高転換率")

    productsRows.push([
      a.product_code,
      a.product_name,
      a.representative_sku,
      a.sku_count,
      a.oos_sku_count,
      mode,
      a.rating,
      a.memo,
      a.note_updated_at,
      a.stock_sum,
      a.sales_units_m,
      a.sales_units_lm,
      a.sales_amount_m,
      a.sales_amount_lm,
      a.profit_m,
      a.profit_lm,
      accessM,
      accessLm,
      cvM,
      cvLm,
      a.bounce_m || 0,
      a.bounce_lm || 0,
      a.stay_m || 0,
      a.stay_lm || 0,
      a.fav_add_m || 0,
      a.fav_add_lm || 0,
      a.fav_total || 0,
      a.orders_total_m || 0,
      a.orders_total_lm || 0,
      a.orders_new_m || 0,
      a.orders_new_lm || 0,
      a.orders_rep_m || 0,
      a.orders_rep_lm || 0,
      a.reviews_post_m || 0,
      a.reviews_post_lm || 0,
      a.reviews_total || 0,
      a.min_setting_margin || 0,
      a.max_setting_margin || 0,
      a.min_setting_unit_profit || 0,
      accessM - accessLm,
      cvM - cvLm,
      a.sales_units_m - a.sales_units_lm,
      a.profit_m - a.profit_lm,
      newRatioM,
      repRatioM,
      JSON.stringify(badges),
    ])
  }

  var productsSheet = ensureSheet_(ss, cfg.sheets.productsCache, pHeaders)
  overwriteSheet_(productsSheet, pHeaders, productsRows)

  var skusHeaders = skusCacheHeaders_()
  var skusSheet = ensureSheet_(ss, cfg.sheets.skusCache, skusHeaders)
  overwriteSheet_(skusSheet, skusHeaders, skusRows)
}

function smokeTestCaches() {
  initSheets()
  debugSpreadsheetBindings()
  regenerateCaches()
  var ss = getWebuiSpreadsheet_()
  var cfg = getConfig_()
  var p = getSheetByName_(ss, cfg.sheets.productsCache)
  var s = getSheetByName_(ss, cfg.sheets.skusCache)
  Logger.log("products_cache rows=%s cols=%s", p.getLastRow(), p.getLastColumn())
  Logger.log("skus_cache rows=%s cols=%s", s.getLastRow(), s.getLastColumn())
  var ph = p.getRange(1, 1, 1, p.getLastColumn()).getValues()[0]
  var expected = productsCacheHeaders_()
  if (ph.join("|") !== expected.join("|")) throw new Error("products_cache header mismatch")
  Logger.log("OK: products_cache header matched")
}

function debugSpreadsheetBindings() {
  var ids = getSpreadsheetIds_()
  Logger.log("[DEBUG] SOURCE_SPREADSHEET_ID=%s", ids.sourceId)
  Logger.log("[DEBUG] WEBUI_SPREADSHEET_ID=%s", ids.webuiId)
  var source = getSourceSpreadsheet_()
  var webui = getWebuiSpreadsheet_()
  Logger.log("[DEBUG] SOURCE name=%s url=%s", safe_(function () { return source.getName() }, "(unknown)"), safe_(function () { return source.getUrl() }, "(unknown)"))
  Logger.log("[DEBUG] WEBUI  name=%s url=%s", safe_(function () { return webui.getName() }, "(unknown)"), safe_(function () { return webui.getUrl() }, "(unknown)"))
  var sheetNames = []
  var sheets = source.getSheets()
  for (var i = 0; i < sheets.length; i++) sheetNames.push(sheets[i].getName())
  Logger.log("[DEBUG] SOURCE sheets=%s", sheetNames.join(" | "))
}

function exportSnapshotsToGcs() {
  var webuiSs = getWebuiSpreadsheet_()
  var gcs = getGcsConfig_()
  var snapshot = buildSnapshot_(webuiSs)
  var json = JSON.stringify(snapshot)
  var objectName = gcsObjectName_(gcs.prefix, "snapshot.json")
  Logger.log("[INFO] Uploading snapshot to gs://%s/%s (bytes=%s)", gcs.bucket, objectName, json.length)
  putJsonToGcs_(gcs.bucket, objectName, json)
  Logger.log("[INFO] Uploaded snapshot: gs://%s/%s", gcs.bucket, objectName)
}

function onSettingsChanged() {
  regenerateCaches()
  exportSnapshotsToGcs()
}

