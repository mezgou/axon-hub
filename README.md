# axon-hub

## Local resource API

With Node.js and npm installed, run from the repository root:

```sh
npm --prefix mock ci
npm --prefix mock start
```

Open http://127.0.0.1:3001/resources or http://127.0.0.1:3001/resources/1.
The API serves fictional resources on loopback only. The static pages still use
their local previews; they are not connected to this API yet.

Only resource GET requests are enabled. Lists accept `userId` and
`sourceResourceId` as positive integer filters. Other collections and write
requests are blocked.

On first start, `mock/seed.json` is copied to ignored `mock/db.json`.
Restarting preserves that database. To discard local demo changes, stop the
server with Ctrl+C, then explicitly run:

```sh
npm --prefix mock run reset
```
