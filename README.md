# axon-hub

The Vue SPA is the main migration target; see [Vue application](#vue-application)
for its launch commands. The original HTML version is retained until the final
browser accessibility checks are complete.

## Local resource API

With Node.js and npm installed, run from the repository root:

```sh
npm --prefix mock ci
npm --prefix mock start
```

Open http://127.0.0.1:3001/resources or http://127.0.0.1:3001/resources/1.
The API serves fictional resources on loopback only. Explore and resource detail
pages load API data. Open details from the catalog, or use `model.html?id=1` and
`dataset.html?id=4`. Login, registration and your profile use the local API;
stars, resource subscriptions and comments are saved through the API. After signing in, Your library
shows your account and public resources; a new account starts with an empty list.

Keep the API running and serve the repository over HTTP in a second terminal
(for example, with Python installed):

```sh
python -m http.server 8080 --bind 127.0.0.1
```

Open http://127.0.0.1:8080/index.html. Opening the HTML directly via `file://`
does not support the JavaScript modules. If the API is unavailable, Explore shows
an error and a Retry button.

Resource lists accept `userId` and `sourceResourceId` as positive integer
filters. Account endpoints `/login` and `/register` accept POST; direct user
collection access remains blocked. Authenticated `POST /resources` creates a
metadata fork with the current user as owner and a link to its source. Other
resource writes remain blocked. Fork metadata copies no files or social records;
the copy appears in Your library, and repeating the action opens your existing fork.
Stars support public `GET /stars?resourceId=1`, authenticated `POST /stars`,
and owner-only `DELETE /stars/:id`. Counts use distinct users.
Subscriptions support `GET /subscriptions?userId=1` or `?resourceId=1`,
authenticated `POST /subscriptions`, and owner-only `DELETE /subscriptions/:id`.
Your library lists subscribed resources and lets you unsubscribe. These are saved
resource links, not email or push notifications.
Discussions support public `GET /discussions?resourceId=1&_sort=createdAt&_order=asc`
and authenticated `POST /discussions`. Comments accept 1–1000 characters of plain
text. Owners can edit with `PATCH /discussions/:id` and delete with
`DELETE /discussions/:id`; deletion requires confirmation in the UI.
A failed post or edit keeps the draft in
the form; reload comments before retrying an uncertain request.

## Demo login

Use `alex@example.test` or `jamie@example.test` with password `AxonDemo2026!`.
These are fictional local accounts. Login stores a token and safe user fields
in sessionStorage for this browser tab; Log out clears them. Passwords are not
stored by the frontend. You can also create a fictional account through Sign up;
it is saved in the local database and signs you in automatically.

After updating from the resource-only mock, stop the API and run the reset
command below once to install the demo accounts. This discards local demo data.
The mock auth package uses a fixed demonstration signing key: keep this server
local and do not use real credentials. `jsonwebtoken` is pinned through an npm
override to 9.0.3 to replace the auth package's vulnerable 8.x dependency.

On first start, `mock/seed.json` is copied to ignored `mock/db.json`.
Restarting preserves that database. To discard local demo changes, stop the
server with Ctrl+C, then explicitly run:

```sh
npm --prefix mock run reset
```

## API tests

With the mock dependencies installed, run:

```sh
npm --prefix mock test
```

Tests use Node's built-in test runner and start their own server on loopback port
3002, which must be free. They create and remove a temporary database and verify
that `mock/db.json` stays unchanged. No running API or frontend server is needed.
The server accepts `AXON_DB_PATH` and `AXON_PORT` overrides for isolated testing;
normal startup still uses `mock/db.json` and port 3001.

## Vue application

Requires Node.js 22.18+ in the 22.x line, or 24.12+. Tested with Node.js 24.19.0.
From the repository root, install the locked dependencies:

```sh
npm --prefix mock ci
npm --prefix web ci
```

Start the API in one terminal:

```sh
npm --prefix mock start
```

Start Vue in a second terminal:

```sh
npm --prefix web run dev
```

Open http://127.0.0.1:5173/#/explore. Keep both terminals running; stop with Ctrl+C.
Vite proxies `/api` to the local mock on port 3001. No API keys or CORS changes
are needed. The fixed loopback host avoids localhost resolution differences.

The SPA includes search by name/description/tags, all resource filters, details,
registration/login, your library, stars, subscriptions, comment editing/deletion,
metadata forks, theme switching and the shared icon sprite. Guest actions link
to login with a validated return path. Sessions use sessionStorage; blocked
storage falls back to memory. Theme preference uses localStorage.

Routes: `#/explore`, `#/resources/:id`, `#/login`, `#/register`, `#/profile`.
Hash navigation supports direct links and refresh without server rewrites.
The original HTML version remains on port 8080 for the final comparison; it does
not share its browser session with the SPA on a different port.

For a production-build preview, keep the API running and use:

```sh
npm --prefix web run build
npm --prefix web run preview
```

Open http://127.0.0.1:4173/#/explore. Preview also proxies the API. A separate
static hosting service would need an equivalent `/api` reverse proxy. The local
mock is an educational backend, not a production authentication service.

```sh
npm --prefix web test
npm --prefix mock test
```

Frontend tests cover filter boundaries, session errors, duplicate action guards,
comment drafts, and component/API integration. Integration tests use a disposable
database on port 3004; mock tests use port 3002. The working `mock/db.json` is not
modified by either suite.

Code organization: `web/src/views` holds route pages; `components` contains shared
UI; `composables` contains reactive session, loading, actions and theme logic;
`services` contains Axios requests and filtering; `web/public` holds theme bootstrap,
the SVG sprite, demo manifest and licenses. UI strings and code are English.

`npm ci` restores the lockfile; use `npm install` only when deliberately changing
dependencies. Commit package.json and package-lock.json together. Do not commit
node_modules or dist. Complete the Firefox Accessibility Inspector and Lighthouse
checks before removing the original HTML implementation.
