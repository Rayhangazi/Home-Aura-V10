function objectsToSheet(sheetName, objects) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  if (!objects || objects.length === 0) {
    sheet.clear();
    return;
  }
  
  // Extract dynamic headers (Columns)
  var keys = {};
  var isFlat = false;
  
  objects.forEach(function(obj) {
    if (obj !== null && typeof obj === 'object') {
      Object.keys(obj).forEach(function(k) { keys[k] = true; });
    } else {
      isFlat = true;
    }
  });
  
  var headers = Object.keys(keys);
  
  var rows = [];
  if (isFlat) {
    rows = [["Value"]];
    objects.forEach(function(val) {
       rows.push([val === undefined ? "" : val]);
    });
  } else {
    if (headers.length === 0) return;
    rows = [headers];
    objects.forEach(function(obj) {
      if (!obj) return;
      var row = headers.map(function(h) {
        var val = obj[h];
        if (typeof val === 'object' && val !== null) return JSON.stringify(val); 
        return val === undefined ? "" : val;
      });
      rows.push(row);
    });
  }
  
  // Efficiently overwrite the range (prevents race condition screen flickering)
  sheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  
  // Clean up any leftover old rows/columns
  var lastRow = sheet.getLastRow();
  if (lastRow > rows.length) sheet.getRange(rows.length + 1, 1, lastRow - rows.length, Math.max(sheet.getLastColumn(), 1)).clear();
  var lastCol = sheet.getLastColumn();
  if (lastCol > rows[0].length) sheet.getRange(1, rows[0].length + 1, Math.max(sheet.getLastRow(), 1), lastCol - rows[0].length).clear();
}
