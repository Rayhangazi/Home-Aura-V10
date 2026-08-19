import fs from 'fs';
let html = fs.readFileSync('index.html', 'utf8');

// Replace the v-model input so user can't edit it
html = html.replace(/<input v-model="appsScriptUrl"([^>]+)>/g, '<input :value="appsScriptUrl" readonly disabled $1>');

// Make sure the fetch calls don't use 'no-cors' for POST, because it's not needed and hides errors
html = html.replace(/mode: 'no-cors',/g, '');

fs.writeFileSync('index.html', html);
console.log('Patched input and cors mode');
