# axon-hub

## Local resource API

With Node.js and npm installed, run from the repository root:

```sh
npm --prefix mock ci
npm --prefix mock start
```

Open http://127.0.0.1:3001/resources or http://127.0.0.1:3001/resources/1.
The API serves fictional resources on loopback only. Explore loads this catalog;
the other pages still show local previews.

Keep the API running and serve the repository over HTTP in a second terminal
(for example, with Python installed):

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/index.html. Opening the HTML directly via `file://`
does not support the JavaScript modules. If the API is unavailable, Explore shows
an error and a Retry button.

Only resource GET requests are enabled. Lists accept `userId` and
`sourceResourceId` as positive integer filters. Other collections and write
requests are blocked.

On first start, `mock/seed.json` is copied to ignored `mock/db.json`.
Restarting preserves that database. To discard local demo changes, stop the
server with Ctrl+C, then explicitly run:

```sh
npm --prefix mock run reset
```
