const { copyFileSync } = require('node:fs');
const path = require('node:path');

// Run only after stopping the mock: this replaces all local demo data.
copyFileSync(path.join(__dirname, 'seed.json'), path.join(__dirname, 'db.json'));
console.log('Local mock database reset from seed.json.');
