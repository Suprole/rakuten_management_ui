function sheetToObjects_(sh) {
  var values = sh.getDataRange().getValues()
  if (values.length === 0) return []
  var headers = values[0].map(function (h) {
    return String(h || "").trim()
  })
  var out = []
  for (var r = 1; r < values.length; r++) {
    var row = values[r]
    if (row.length === 0 || String(row[0] || "").trim() === "") continue
    var obj = {}
    for (var c = 0; c < headers.length; c++) {
      var key = headers[c]
      if (!key) continue
      obj[key] = row[c]
    }
    out.push(obj)
  }
  return out
}

function buildSnapshot_(webuiSs) {
  var cfg = getConfig_()
  var products = sheetToObjects_(getSheetByName_(webuiSs, cfg.sheets.productsCache))
  var skus = sheetToObjects_(getSheetByName_(webuiSs, cfg.sheets.skusCache))
  var notes = sheetToObjects_(getSheetByName_(webuiSs, cfg.sheets.productNotes))
  var settings = sheetToObjects_(getSheetByName_(webuiSs, cfg.sheets.settings))

  return {
    generated_at: new Date().toISOString(),
    products: products,
    skus: skus,
    notes: notes,
    settings: settings,
  }
}

