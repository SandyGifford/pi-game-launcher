# pi-game-launcher

A game and application launcher UI for the Raspberry Pi, served by a small Node server and controlled with a gamepad.

## Requirements

| requirement | explanation                                                       |
| ----------: | :---------------------------------------------------------------- |
|     Node.js | v26 or newer, with npm; runs the server, startup, and build tools |
|         Git | `startup` fetches and pulls updates                               |

## Packages

| package       | purpose                                 | may import              |
| :------------ | :-------------------------------------- | :---------------------- |
| `client`      | React UI                                | `shared`                |
| `server`      | Express server, serves the built client | `shared`, `shared-node` |
| `startup`     | Updates the app, then starts the server | `shared`, `shared-node` |
| `shared-node` | Node-only helpers (git, npm, processes) | `shared`                |
| `shared`      | Code usable everywhere                  | nothing                 |

ESLint enforces these boundaries.
 
## Scripts

| command             | does                                         |
| :------------------ | :------------------------------------------- |
| `npm i`             | Install dependencies                         |
| `npm run dev`       | Run server and client with hot reload        |
| `npm run build`     | Build the client                             |
| `npm start`         | Run the server in the foreground             |
| `npm run startup`   | Update, then start the server under pm2      |
| `npm run pm2:*`     | `start`, `stop`, `logs`, `save`, `resurrect` |
| `npm test`          | Run tests                                    |
| `npm run typecheck` | Typecheck all packages                       |
| `npm run lint`      | Lint (`lint:fix` to autofix)                 |

## Startup

`npm run startup`:

1. `git fetch`, then `git pull` if behind.
2. `npm i` and `npm run build` if the pull brought changes, `client/dist` is missing, or `.built-sha` doesn't match `HEAD`.
3. Writes the built commit to `.built-sha` (gitignored).
4. `npm run pm2:start` (start or reload).

If the update fails, the error is logged and the current build still starts.

## Configuration

Defaults live in `.env.defaults`. Put local overrides in `.env` (gitignored).

|          variable | explanation                  |
| ----------------: | :--------------------------- |
|            `PORT` | Port the server listens on   |
| `GEFORCE_NOW_URL` | URL opened for GeForce NOW   |
