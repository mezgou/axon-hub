const { copyFileSync, constants } = require('node:fs');
const path = require('node:path');
const jsonServer = require('json-server');
const auth = require('json-server-auth');
const cors = require('cors');
const access = require('./access.cjs');

const databasePath = path.join(__dirname, 'db.json');
try {
  copyFileSync(path.join(__dirname, 'seed.json'), databasePath, constants.COPYFILE_EXCL);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
}

const app = jsonServer.create();
const router = jsonServer.router(databasePath);
app.db = router.db;
app.use(cors({ origin: ['http://127.0.0.1:8080', 'http://localhost:8080'],
  methods: ['GET', 'POST', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(jsonServer.bodyParser);
app.use(access);
app.use(auth.rewriter({ resources: 644, stars: 644, subscriptions: 644, discussions: 644 }));
app.use(auth);
app.use(router);
app.use((error, request, response, next) => {
  response.status(error.status === 400 ? 400 : 500).json({ message: 'Request could not be processed.' });
});

const server = app.listen(3001, '127.0.0.1', () => {
  console.log('AxonHub mock: http://127.0.0.1:3001/resources');
});
server.on('error', (error) => {
  console.error(`Mock server failed: ${error.message}`);
  process.exitCode = 1;
});
