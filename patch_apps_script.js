function doPost(e) {
  var payloadObj;
  try {
    payloadObj = JSON.parse(e.postData.contents);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', error: 'Invalid JSON' })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (payloadObj && payloadObj.action === "upload_image") {
    // ... image logic remains same
  }

  // Smart Merge Logic
  if (payloadObj.users) mergeObjectsToSheet("users", payloadObj.users);
  if (payloadObj.orders) mergeObjectsToSheet("orders", payloadObj.orders);
  if (payloadObj.deletedOrders) mergeObjectsToSheet("deletedOrders", payloadObj.deletedOrders);
  if (payloadObj.factories) mergeObjectsToSheet("factories", payloadObj.factories);
  if (payloadObj.factoryBills) mergeObjectsToSheet("factoryBills", payloadObj.factoryBills);
  if (payloadObj.expenses) mergeObjectsToSheet("expenses", payloadObj.expenses);
  
  // Categories are simple strings, just overwrite them (or merge them)
  if (payloadObj.categories) objectsToSheet("categories", payloadObj.categories);
  
  logHistory(payloadObj);
  
  return ContentService.createTextOutput(JSON.stringify({ status: 'success' })).setMimeType(ContentService.MimeType.JSON);
}
