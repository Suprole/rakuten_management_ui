function getSheetByName_(ss, name) {
  var sh = ss.getSheetByName(name)
  if (sh) return sh

  // --- 切り分け用: 名前の正規化で再検索（括弧/前後スペース違いを吸収） ---
  var targetNorm = normalizeSheetName_(name)
  var sheets = ss.getSheets()
  for (var i = 0; i < sheets.length; i++) {
    var candidate = sheets[i].getName()
    if (normalizeSheetName_(candidate) === targetNorm) {
      Logger.log("[WARN] Sheet name normalized-match: requested='%s' actual='%s'", name, candidate)
      return sheets[i]
    }
  }

  // --- 見つからない場合: Spreadsheet情報と全シート名を含めてエラー ---
  var names = []
  for (var j = 0; j < sheets.length; j++) names.push(sheets[j].getName())
  var ssName = safe_(function () { return ss.getName() }, "(unknown)")
  var ssId = safe_(function () { return ss.getId() }, "(unknown)")
  var ssUrl = safe_(function () { return ss.getUrl() }, "(unknown)")
  throw new Error(
    "Sheet not found: '" +
      name +
      "' in Spreadsheet(name='" +
      ssName +
      "', id='" +
      ssId +
      "', url='" +
      ssUrl +
      "'). Existing sheets: [" +
      names.join(", ") +
      "]"
  )
}

function normalizeSheetName_(s) {
  return String(s || "")
    .trim()
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/\s+/g, " ")
}

function safe_(fn, fallback) {
  try {
    return fn()
  } catch (e) {
    return fallback
  }
}

function ensureSheet_(ss, name, headers) {
  var sh = ss.getSheetByName(name)
  if (!sh) sh = ss.insertSheet(name)
  if (headers && headers.length) {
    var current = sh.getRange(1, 1, 1, Math.max(1, sh.getLastColumn())).getValues()[0]
    var needInit = sh.getLastRow() === 0 || current.join("") === ""
    if (needInit) {
      sh.clearContents()
      sh.getRange(1, 1, 1, headers.length).setValues([headers])
    }
  }
  return sh
}

function overwriteSheet_(sh, headers, rows) {
  sh.clearContents()
  sh.getRange(1, 1, 1, headers.length).setValues([headers])
  if (rows.length > 0) {
    sh.getRange(2, 1, rows.length, headers.length).setValues(rows)
  }
}

