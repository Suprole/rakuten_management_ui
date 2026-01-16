/**
 * "¥1,234" や "12.3%" などを数値へ正規化する。
 * 不正/空は 0 を返す（必要ならnull運用へ変更）
 */
function normalizeNumber_(v) {
  if (v === null || v === undefined) return 0
  if (typeof v === "number") return isFinite(v) ? v : 0
  var s = String(v).trim()
  if (!s) return 0
  s = s.replace(/[¥,%\s]/g, "").replace(/,/g, "")
  var n = Number(s)
  return isFinite(n) ? n : 0
}

function firstNonEmpty_(arr) {
  for (var i = 0; i < arr.length; i++) {
    var v = arr[i]
    if (v !== null && v !== undefined && String(v).trim() !== "") return v
  }
  return ""
}

