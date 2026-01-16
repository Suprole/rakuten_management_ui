function installTriggers() {
  uninstallTriggers()
  ScriptApp.newTrigger("hourlyJob").timeBased().everyHours(1).create()
  Logger.log("[INFO] Triggers installed. hourlyJob every 1 hour.")
}

function uninstallTriggers() {
  var triggers = ScriptApp.getProjectTriggers()
  for (var i = 0; i < triggers.length; i++) {
    var t = triggers[i]
    if (t.getHandlerFunction() === "hourlyJob") {
      ScriptApp.deleteTrigger(t)
    }
  }
  Logger.log("[INFO] Triggers uninstalled (hourlyJob).")
}

function hourlyJob() {
  regenerateCaches()
  exportSnapshotsToGcs()
}

