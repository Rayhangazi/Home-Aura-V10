// ==========================================
// HOMEAURA COMPLETE SMART SYNC SCRIPT
// ==========================================

function doGet(e) {
  var data = {
    users: sheetToObjects("users"),
    orders: sheetToObjects("orders"),
    deletedOrders: sheetToObjects("deletedOrders"),
    categories: sheetToObjects("categories").map(function(c) { return Object.values(c).join(''); }),
    factories: sheetToObjects("factories"),
    factoryBills: sheetToObjects("factoryBills"),
    expenses: sheetToObjects("expenses"),
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // 1. Queue overlapping requests so they don't corrupt the database
  var lock = LockService.getScriptLock();
  lock.waitLock(15000); 
  
  try {
    var payloadObj;
    try {
      payloadObj = JSON.parse(e.postData.contents);
    } catch(err) {
      return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
    }

    if (payloadObj._connectionTest) {
      objectsToSheetAtomic("connectionTest", payloadObj._connectionTest);
      return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // --- 2. SMART ADDITIVE MERGE ---
    // This protects Admin A's changes from being wiped by Admin B.
    if (payloadObj.users) mergeObjectsById("users", payloadObj.users);
    if (payloadObj.orders) mergeObjectsById("orders", payloadObj.orders);
    if (payloadObj.deletedOrders) mergeObjectsById("deletedOrders", payloadObj.deletedOrders);
    if (payloadObj.factories) mergeObjectsById("factories", payloadObj.factories);
    if (payloadObj.factoryBills) mergeObjectsById("factoryBills", payloadObj.factoryBills);
    if (payloadObj.expenses) mergeObjectsById("expenses", payloadObj.expenses);
    
    if (payloadObj.categories) {
       // Categories are a simple array of strings, so we replace them atomically
       var catObjs = payloadObj.categories.map(function(c) { return { name: c }; });
       objectsToSheetAtomic("categories", catObjs);
    }
    
    logHistory(payloadObj);
    
    return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    // ALWAYS release the queue lock
    lock.releaseLock();
  }
}


// ---------------------------------------------
// HELPER FUNCTIONS (Do not delete)
// ---------------------------------------------

function mergeObjectsById(sheetName, incomingObjects) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  if (!incomingObjects || incomingObjects.length === 0) return;
  
  var existingObjects = sheetToObjects(sheetName);
  var map = {};
  
  // Load existing into map
  existingObjects.forEach(function(obj) {
    if (obj && obj.id) map[obj.id] = obj;
  });
  
  // Load incoming into map (Updates edited rows, adds new rows)
  incomingObjects.forEach(function(obj) {
    if (obj && obj.id) map[obj.id] = obj;
  });
  
  // Convert map back to array
  var merged = [];
  for (var key in map) merged.push(map[key]);
  
  objectsToSheetAtomic(sheetName, merged);
}


function sheetToObjects(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  
  var headers = data[0];
  var result = [];
  
  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      if (headers[j]) {
        obj[headers[j]] = row[j];
      }
    }
    result.push(obj);
  }
  return result;
}


function objectsToSheetAtomic(sheetName, objects) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  
  if (!objects || objects.length === 0) return;
  
  // Extract headers
  var headersMap = {};
  objects.forEach(function(obj) {
    for (var key in obj) {
      headersMap[key] = true;
    }
  });
  var headers = Object.keys(headersMap);
  
  // Create 2D array
  var rows = [headers];
  objects.forEach(function(obj) {
    var row = [];
    headers.forEach(function(header) {
      var val = obj[header];
      if (typeof val === 'object') val = JSON.stringify(val);
      row.push(val !== undefined ? val : '');
    });
    rows.push(row);
  });
  
  // Write atomically to prevent "blanking" while downloading
  var tempSheet = ss.insertSheet("TEMP_" + sheetName + "_" + new Date().getTime());
  tempSheet.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  
  ss.deleteSheet(sheet);
  tempSheet.setName(sheetName);
}


function logHistory(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var historySheet = ss.getSheetByName("History_Log");
  if (!historySheet) {
    historySheet = ss.insertSheet("History_Log");
    historySheet.appendRow(["Timestamp", "Data Hash", "Size (bytes)"]);
  }
  
  var payloadString = JSON.stringify(payload);
  var hash = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, payloadString);
  var hashString = hash.map(function(b) { return (b < 0 ? b + 256 : b).toString(16) }).join('');
  
  var lastRow = historySheet.getLastRow();
  var lastHash = "";
  if (lastRow > 1) {
    lastHash = historySheet.getRange(lastRow, 2).getValue();
  }
  
  // Only log if something actually changed
  if (hashString !== lastHash) {
    historySheet.appendRow([new Date().toISOString(), hashString, payloadString.length]);
  }
}
