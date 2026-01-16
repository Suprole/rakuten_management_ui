/**
 * WebApp endpoint for fast product_notes persistence.
 *
 * Deploy as Web App:
 * - Execute as: Me
 * - Who has access: Anyone (or Anyone within domain)
 *
 * Security:
 * - Require Script Property: WEBAPP_TOKEN
 * - Client must send header `x-webapp-token` or JSON field `token`
 *
 * Supported actions:
 * - POST { action: "saveNote", product_code, rating, memo }
 *   -> writes to product_notes sheet and (optionally) exports snapshot to GCS
 */

function doPost(e) {
  try {
    var body = {}
    if (e && e.postData && e.postData.contents) {
      body = JSON.parse(e.postData.contents)
    }

    var token = ""
    try {
      token = String((e && e.parameter && e.parameter.token) || "")
    } catch (e2) {}
    if (!token) {
      try {
        token = String((e && e.postData && e.postData.contents && JSON.parse(e.postData.contents).token) || "")
      } catch (e3) {}
    }
    // Prefer header token if provided
    try {
      if (e && e.headers && e.headers["x-webapp-token"]) token = String(e.headers["x-webapp-token"])
    } catch (e4) {}

    var props = PropertiesService.getScriptProperties()
    var expected = String(props.getProperty("WEBAPP_TOKEN") || "").trim()
    if (!expected) {
      return json_(500, { error: "Missing Script Property: WEBAPP_TOKEN" })
    }
    if (!token || token !== expected) {
      return json_(401, { error: "Unauthorized" })
    }

    var action = String(body.action || "").trim()
    if (!action) return json_(400, { error: "action is required" })

    if (action === "saveNote") {
      var productCode = String(body.product_code || "").trim()
      if (!productCode) return json_(400, { error: "product_code is required" })

      var ratingRaw = body.rating === null || body.rating === undefined ? "" : String(body.rating).trim()
      var memo = body.memo === null || body.memo === undefined ? "" : String(body.memo)

      // rating: S/A/B/C/D/E or empty(null)
      var rating = ""
      if (ratingRaw) {
        var allowed = { S: 1, A: 1, B: 1, C: 1, D: 1, E: 1 }
        if (!allowed[ratingRaw]) return json_(400, { error: "invalid rating" })
        rating = ratingRaw
      }

      var updatedAt = new Date().toISOString()
      var ss = getWebuiSpreadsheet_()
      var cfg = getConfig_()
      var sh = ensureSheet_(ss, cfg.sheets.productNotes, ["product_code", "rating", "memo", "updated_at"])

      // Find existing row by product_code in column A (excluding header)
      var lastRow = sh.getLastRow()
      if (lastRow < 1) lastRow = 1
      var found = null
      if (lastRow >= 2) {
        var finder = sh.getRange(2, 1, lastRow - 1, 1).createTextFinder(productCode).matchEntireCell(true)
        found = finder.findNext()
      }

      if (found) {
        var row = found.getRow()
        sh.getRange(row, 2, 1, 3).setValues([[rating || "", memo, updatedAt]])
      } else {
        sh.getRange(lastRow + 1, 1, 1, 4).setValues([[productCode, rating || "", memo, updatedAt]])
      }

      // Speed strategy: update snapshot immediately so reads stay on the fast path (GCS)
      var exportSnapshot = body.export_snapshot === false ? false : true
      if (exportSnapshot) {
        exportSnapshotsToGcs()
      }

      return json_(200, {
        product_code: productCode,
        rating: rating || null,
        memo: memo,
        updated_at: updatedAt,
        exported_snapshot: exportSnapshot,
      })
    }

    return json_(400, { error: "unknown action" })
  } catch (err) {
    return json_(500, { error: String(err && err.message ? err.message : err) })
  }
}

function json_(status, obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON).setStatusCode(status)
}


