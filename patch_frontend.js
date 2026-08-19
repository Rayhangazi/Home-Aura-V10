const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

// Replace standard triggerAutoSync with one that updates _lastModified on EVERYTHING?
// No, we can just intercept JSON.stringify in backupToGoogleSheets!
