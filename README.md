# battlesnake_js

A Battlesnake AI written in JavaScript (Node.js + Express). The snake uses flood fill and food-seeking heuristics to decide its next move each turn.

## Authors

Thanasis, Andreas, Dionysis, Iasonas, Nikolas

---

## Project Structure

```
battlesnake_js/
├── index.js        # Snake logic: move strategy, flood fill, game hooks
├── server.js       # Express HTTP server wiring the Battlesnake API endpoints
├── jsdoc.json      # JSDoc configuration
└── docs/           # Auto-generated HTML documentation (from JSDoc)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm

### Install dependencies

```bash
npm install
```

### Run the server

```bash
npm start
```

The server listens on `http://0.0.0.0:8000` by default. Set the `PORT` environment variable to change this.

---

## API Endpoints

| Method | Path     | Description                                       |
| ------ | -------- | ------------------------------------------------- |
| GET    | `/`      | Returns snake metadata (colour, head, tail, etc.) |
| POST   | `/start` | Called by the engine when a game begins           |
| POST   | `/move`  | Called every turn; returns the next move          |
| POST   | `/end`   | Called by the engine when a game ends             |

---

## Move Strategy

1. **Avoid self & walls**, eliminates out-of-bounds and own-body collisions.
2. **Avoid other snakes**, blocks cells occupied by any snake body, respecting tails that are about to vacate.
3. **Head-to-head avoidance**, marks cells reachable by an equal-or-larger opponent's head as unsafe.
4. **Flood fill**, among the remaining safe moves, picks the one leading to the most open space.
5. **Food seeking**, when multiple moves tie on flood-fill score, prefers the one moving closer to the nearest food (Manhattan distance).

---

## System Documentation

Full API documentation is auto-generated from JSDoc comments in the source code.

### Viewing the docs

Open `docs/index.html` in your browser after cloning the repo.

### Regenerating the docs

```bash
npm install --save-dev jsdoc
npx jsdoc -c jsdoc.json
```

This will rebuild the `docs/` folder from the JSDoc comments in `index.js` and `server.js`.

### Documented symbols

| Symbol                        | File        | Description                           |
| ----------------------------- | ----------- | ------------------------------------- |
| `info()`                      | `index.js`  | Returns snake metadata                |
| `start(gameState)`            | `index.js`  | Game start hook                       |
| `end(gameState)`              | `index.js`  | Game end hook                         |
| `printBoard(board)`           | `index.js`  | Renders the board to stdout           |
| `getBlockedCells(gameState)`  | `index.js`  | Builds the set of occupied cells      |
| `floodFill(start, gameState)` | `index.js`  | Counts reachable cells via BFS        |
| `getSafeMoves(gameState)`     | `index.js`  | Returns valid move directions         |
| `move(gameState)`             | `index.js`  | Picks and returns the best move       |
| `runServer(handlers)`         | `server.js` | Creates and starts the Express server |

---

## Running Tests

```bash
npm test
```

---

## Docker

```bash
docker build -t battlesnake_js .
docker run -p 8000:8000 battlesnake_js
```
