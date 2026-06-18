/**
 * @fileoverview Express HTTP server that wires Battlesnake handler functions to the engine's API endpoints.
 * @module server
 */

import express from "express";

/**
 * @typedef {Object} BattlesnakeHandlers
 * @property {function(): Object}         info  - Returns snake metadata (colour, head, tail, etc.).
 * @property {function(Object): void}     start - Called once when a new game begins.
 * @property {function(Object): {move: string}} move - Called every turn; must return a move direction.
 * @property {function(Object): void}     end   - Called once when the game ends.
 */

/**
 * Creates and starts an Express server that implements the Battlesnake HTTP API.
 *
 * Registered routes:
 * - `GET  /`       → {@link BattlesnakeHandlers.info}  (snake metadata)
 * - `POST /start`  → {@link BattlesnakeHandlers.start} (game start hook)
 * - `POST /move`   → {@link BattlesnakeHandlers.move}  (per-turn move decision)
 * - `POST /end`    → {@link BattlesnakeHandlers.end}   (game end hook)
 *
 * The server listens on `0.0.0.0` and the port defined by the `PORT`
 * environment variable, defaulting to `8000`.
 *
 * @param {BattlesnakeHandlers} handlers - Object containing the four required handler functions.
 * @returns {void}
 *
 * @example
 * import runServer from './server.js';
 * runServer({ info, start, move, end });
 */
export default function runServer(handlers) {
  const app = express();
  app.use(express.json());

  app.get("/", (req, res) => {
    res.send(handlers.info());
  });

  app.post("/start", (req, res) => {
    handlers.start(req.body);
    res.send("ok");
  });

  app.post("/move", (req, res) => {
    res.send(handlers.move(req.body));
  });

  app.post("/end", (req, res) => {
    handlers.end(req.body);
    res.send("ok");
  });

  app.use(function (req, res, next) {
    res.set("Server", "battlesnake/github/starter-snake-javascript");
    next();
  });

  const host = "0.0.0.0";
  const port = process.env.PORT || 8000;

  app.listen(port, host, () => {
    console.log(`Running Battlesnake at http://${host}:${port}...`);
  });
}
