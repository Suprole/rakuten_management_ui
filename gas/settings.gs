/**
 * settingsシート（key/value）から設定を読み込む。
 */
function loadSettings_(ss) {
  var cfg = getConfig_()
  var taxRate = cfg.defaults.taxRate
  var feeRate = cfg.defaults.feeRate
  var defaultPointRate = cfg.defaults.defaultPointRate
  var thresholds = {
    low_stock_threshold: 10,
    cv_high: 5,
    cv_very_high: 10,
    access_top_percent: 10,
    low_margin_threshold: 0.05,
  }
  var shippingCosts = [] // [{ shipping_type, shipping_cost_in_tax }]

  try {
    var sh = getSheetByName_(ss, cfg.sheets.settings)
    var v = sh.getDataRange().getValues()
    if (v.length < 2) {
      return {
        taxRate: taxRate,
        feeRate: feeRate,
        defaultPointRate: defaultPointRate,
        thresholds: thresholds,
        shippingCosts: shippingCosts,
      }
    }
    var hm = rawHeaderMap_(v[0])
    // 互換: old settings header ["key","value"] も、new header ["shipping_type","shipping_cost_in_tax","key","value"] も読む
    var kIdx = hm["key"] !== undefined ? hm["key"] : 0
    var valIdx = hm["value"] !== undefined ? hm["value"] : 1
    var shipTypeIdx = hm["shipping_type"] !== undefined ? hm["shipping_type"] : null
    var shipCostIdx = hm["shipping_cost_in_tax"] !== undefined ? hm["shipping_cost_in_tax"] : null
    var kv = {}
    for (var r = 1; r < v.length; r++) {
      // 送料テーブル（行単位）
      if (shipTypeIdx !== null && shipCostIdx !== null) {
        var st = String(v[r][shipTypeIdx] || "").trim()
        if (st) {
          shippingCosts.push({ shipping_type: st, shipping_cost_in_tax: normalizeNumber_(v[r][shipCostIdx]) })
        }
      }

      // key/value（行単位）
      var key = String(v[r][kIdx] || "").trim()
      if (key) {
        kv[key] = v[r][valIdx]
      }
    }

    if (kv["tax_rate"] !== undefined) taxRate = normalizeNumber_(kv["tax_rate"])
    if (kv["fee_rate"] !== undefined) feeRate = normalizeNumber_(kv["fee_rate"])
    if (kv["default_point_rate"] !== undefined) defaultPointRate = normalizeNumber_(kv["default_point_rate"])

    if (kv["low_stock_threshold"] !== undefined) thresholds.low_stock_threshold = normalizeNumber_(kv["low_stock_threshold"])
    if (kv["cv_high"] !== undefined) thresholds.cv_high = normalizeNumber_(kv["cv_high"])
    if (kv["cv_very_high"] !== undefined) thresholds.cv_very_high = normalizeNumber_(kv["cv_very_high"])
    if (kv["access_top_percent"] !== undefined) thresholds.access_top_percent = normalizeNumber_(kv["access_top_percent"])
    if (kv["low_margin_threshold"] !== undefined) thresholds.low_margin_threshold = normalizeNumber_(kv["low_margin_threshold"])

    if (kv["badge_thresholds_json"] !== undefined) {
      var raw = String(kv["badge_thresholds_json"] || "").trim()
      if (raw) {
        var parsed = JSON.parse(raw)
        thresholds = Object.assign(thresholds, parsed)
      }
    }
  } catch (e) {
    // settings未作成でも進める（defaultsで動く）
  }

  return { taxRate: taxRate, feeRate: feeRate, defaultPointRate: defaultPointRate, thresholds: thresholds, shippingCosts: shippingCosts }
}

