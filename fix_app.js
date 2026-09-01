const fs = require('fs');

let appJs = fs.readFileSync('app.js', 'utf8');

// Global replacement for .doc(phone)
appJs = appJs.replace(/\.doc\(phone\)/g, ".doc(phone.replace(/\\s/g, ''))");
// Global replacement for .doc(decoded.phone)
appJs = appJs.replace(/\.doc\(decoded\.phone\)/g, ".doc(decoded.phone.replace(/\\s/g, ''))");

fs.writeFileSync('app.js', appJs);
console.log('Fixed .doc(phone) calls in app.js');
