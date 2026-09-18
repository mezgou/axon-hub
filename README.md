# axon-hub

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
