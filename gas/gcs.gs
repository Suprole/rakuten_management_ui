function getGcsConfig_() {
  var props = PropertiesService.getScriptProperties()
  var bucket = String(props.getProperty("GCS_BUCKET") || "").trim()
  var prefix = String(props.getProperty("GCS_PREFIX") || "").trim()
  if (!bucket) throw new Error("Missing Script Property: GCS_BUCKET")
  return { bucket: bucket, prefix: prefix }
}

function gcsObjectName_(prefix, name) {
  if (!prefix) return name
  var p = prefix.replace(/^\/+/, "").replace(/\/+$/, "")
  return p ? p + "/" + name : name
}

/**
 * GCSへJSON（media upload）をPUTする
 */
function putJsonToGcs_(bucket, objectName, jsonText) {
  var url =
    "https://storage.googleapis.com/upload/storage/v1/b/" +
    encodeURIComponent(bucket) +
    "/o?uploadType=media&name=" +
    encodeURIComponent(objectName)

  var res = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json; charset=utf-8",
    payload: jsonText,
    muteHttpExceptions: true,
    headers: {
      Authorization: "Bearer " + ScriptApp.getOAuthToken(),
    },
  })

  var code = res.getResponseCode()
  if (code < 200 || code >= 300) {
    throw new Error(
      "GCS upload failed: " +
        code +
        " object=" +
        objectName +
        " body=" +
        res.getContentText().slice(0, 500)
    )
  }
}

