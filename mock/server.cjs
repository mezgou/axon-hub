const { copyFileSync, constants } = require('node:fs');
const path = require('node:path');
const jsonServer = require('json-server');
const access = require('./access.cjs');

const databasePath = path.join(__dirname, 'db.json');
try {
  copyFileSync(path.join(__dirname, 'seed.json'), databasePath, constants.COPYFILE_EXCL);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}

const app = jsonServer.create();
const router = jsonServer.router(databasePath);
// Keep the default static middleware behind the API allowlist.
app.use(access);
app.use(jsonServer.defaults());
app.use(router);

const server = app.listen(3001, '127.0.0.1', () => {
  console.log('AxonHub mock: http://127.0.0.1:3001/resources');
});
server.on('error', (error) => {
  console.error(`Mock server failed: ${error.message}`);
  process.exitCode = 1;
});
