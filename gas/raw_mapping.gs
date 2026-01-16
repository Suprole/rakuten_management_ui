/**
 * rawシートのヘッダに基づく列マッピング
 */
function rawHeaderMap_(headers) {
  var map = {}
  for (var i = 0; i < headers.length; i++) {
    var key = String(headers[i] || "").trim()
    if (key) map[key] = i
  }
  return map
}

function idx_(map, name) {
  if (!(name in map)) {
    throw new Error("raw header not found: " + name)
  }
  return map[name]
}

