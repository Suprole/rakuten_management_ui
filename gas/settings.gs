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

  try {
    var sh = getSheetByName_(ss, cfg.sheets.settings)
    var v = sh.getDataRange().getValues()
    if (v.length < 2) return { taxRate: taxRate, feeRate: feeRate, defaultPointRate: defaultPointRate, thresholds: thresholds }
    var hm = rawHeaderMap_(v[0])
    var kIdx = hm["key"] !== undefined ? hm["key"] : 0
    var valIdx = hm["value"] !== undefined ? hm["value"] : 1
    var kv = {}
    for (var r = 1; r < v.length; r++) {
      var key = String(v[r][kIdx] || "").trim()
      if (!key) continue
      kv[key] = v[r][valIdx]
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

  return { taxRate: taxRate, feeRate: feeRate, defaultPointRate: defaultPointRate, thresholds: thresholds }
}

