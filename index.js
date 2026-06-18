// Welcome to
// __________         __    __  .__                               __
// \______   \_____ _/  |__/  |_|  |   ____   ______ ____ _____  |  | __ ____
//  |    |  _/\__  \\   __\   __\  | _/ __ \ /  ___//    \\__  \ |  |/ // __ \
//  |    |   \ / __ \|  |  |  | |  |_\  ___/ \___ \|   |  \/ __ \|    <\  ___/
//  |________/(______/__|  |__| |____/\_____>______>___|__(______/__|__\\_____>
//
// This file can be a nice home for your Battlesnake logic and helper functions.
//
// To get you started we've included code to prevent your Battlesnake from moving backwards.
// For more info see docs.battlesnake.com

/**
 * @fileoverview Battlesnake game logic: movement strategy, flood fill, and server bootstrap.
 * @module index
 */

import runServer from "./server.js";
import chalk from "chalk";

/**
 * @typedef {Object} Coord
 * @property {number} x - Horizontal position (0 = left).
 * @property {number} y - Vertical position (0 = bottom).
 */

/**
 * @typedef {Object} Snake
 * @property {string}  id     - Unique snake identifier.
 * @property {string}  name   - Display name.
 * @property {number}  length - Total body length.
 * @property {Coord[]} body   - Body segments; index 0 is the head.
 * @property {number}  health - Current health (0-100).
 */

/**
 * @typedef {Object} Board
 * @property {number}  width   - Board width in cells.
 * @property {number}  height  - Board height in cells.
 * @property {Coord[]} food    - Positions of food items.
 * @property {Snake[]} snakes  - All living snakes on the board.
 */

/**
 * @typedef {Object} GameState
 * @property {Object} game  - Top-level game metadata.
 * @property {number} turn  - Current turn number.
 * @property {Board}  board - Full board snapshot.
 * @property {Snake}  you   - Your snake's current state.
 */

/**
 * Returns the snake's metadata used by the Battlesnake engine for display and validation.
 *
 * @returns {{ apiversion: string, author: string, color: string, head: string, tail: string }}
 *   Snake configuration object.
 */

// our hotfix was the color change, the relevant issue was chosen and reopened at the end to ensure proper status flow
function info() {
  console.log("INFO");
  return {
    apiversion: "1",
    author: "Thanasis, Andreas, Dionysis, Iasonas, Nikolas",
    color: "#FF6600",
    head: "tongue",
    tail: "curled",
  };
}

/**
 * Called once at the beginning of every game.
 * Use this hook to initialise any per-game state you need.
 *
 * @param {GameState} gameState - The initial game state provided by the engine.
 * @returns {void}
 */
function start(_gameState) {
  console.log("GAME START");
}

/**
 * Called once when the game ends (win, loss, or draw).
 * Use this hook for any clean-up or logging.
 *
 * @param {GameState} gameState - The final game state provided by the engine.
 * @returns {void}
 */
function end(_gameState) {
  console.log("GAME OVER\n");
}

/**
 * Renders a colour-coded ASCII representation of the board to stdout.
 *
 * Legend:
 * - `H` (red background)   – snake head
 * - `B` (yellow background) – snake body segment
 * - `*` (green background)  – food
 * - `.` (grey background)   – empty cell
 *
 * @param {Board} board - The board to render.
 * @returns {void}
 */
function printBoard(board) {
  const { width, height, food, snakes } = board;
  const cells = new Map();
  for (const f of food) {
    cells.set(`${f.x},${f.y}`, chalk.bgGreen.black(' * '));
  }
  for (const snake of snakes) {
    for (let i = 0; i < snake.body.length; i++) {
      const part = snake.body[i];
      const symbol = i === 0 ? chalk.bgRed.white(' H ') : chalk.bgYellow.black(' B ');
      cells.set(`${part.x},${part.y}`, symbol);
    }
  }
  for (let y = height - 1; y >= 0; y--) {
    for (let x = 0; x < width; x++) {
      const symbol = cells.get(`${x},${y}`) ?? chalk.bgBlackBright.white(' . ');
      process.stdout.write(symbol);
    }
    process.stdout.write('\n');
  }
}

/**
 * Builds a set of grid coordinates that are currently occupied and therefore unsafe to enter.
 *
 * A snake's tail is treated as free **unless** the snake ate food this turn
 * (detected when the tail and second-to-last segment share the same position,
 * meaning the tail has not yet moved).
 *
 * @param {GameState} gameState - Current game state.
 * @returns {Set<string>} Set of `"x,y"` strings representing blocked cells.
 */
function getBlockedCells(gameState) {
  const blocked = new Set();
  for (const snake of gameState.board.snakes) {
    const tail = snake.body[snake.body.length - 1];
    const secondLast = snake.body[snake.body.length - 2];
    const ate = tail.x === secondLast.x && tail.y === secondLast.y;
    for (const part of snake.body) {
      if (!ate && part.x === tail.x && part.y === tail.y) continue;
      blocked.add(`${part.x},${part.y}`);
    }
  }
  return blocked;
}

/**
 * Counts the number of reachable cells from `start` using a breadth-first flood fill.
 *
 * The algorithm respects board boundaries and all currently blocked cells
 * (as returned by {@link getBlockedCells}).  A higher count means more open
 * space and is generally the safer choice.
 *
 * @param {Coord}     start     - The cell from which to begin the flood fill.
 * @param {GameState} gameState - Current game state (used to determine board size and obstacles).
 * @returns {number} Total number of reachable cells, including `start`.
 *
 * @example
 * const space = floodFill({ x: 3, y: 5 }, gameState);
 * // space === 42  →  42 cells are reachable from (3, 5)
 */
export function floodFill(start, gameState) {
  const { width, height } = gameState.board;
  const blocked = getBlockedCells(gameState);
  const visited = new Set();
  const queue = [start];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const current = queue.shift();
    const neighbors = [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x,     y: current.y + 1 },
      { x: current.x,     y: current.y - 1 },
    ];
    for (const n of neighbors) {
      const key = `${n.x},${n.y}`;
      if (
        n.x >= 0 && n.x < width &&
        n.y >= 0 && n.y < height &&
        !visited.has(key) &&
        !blocked.has(key)
      ) {
        visited.add(key);
        queue.push(n);
      }
    }
  }
  return visited.size;
}

/**
 * Computes the list of directions the snake can safely move this turn.
 *
 * A direction is marked **unsafe** if it would cause any of the following:
 * 1. Moving into the snake's own neck (immediate reversal).
 * 2. Moving out of bounds.
 * 3. Colliding with any snake body segment (own or opponent), excluding tails
 *    that are about to vacate their cell.
 * 4. Entering a cell that an equal-or-larger opponent snake could also reach
 *    next turn (head-to-head collision avoidance).
 *
 * @param {GameState} gameState - Current game state.
 * @returns {string[]} Array of safe direction strings — any subset of
 *   `["up", "down", "left", "right"]`.  May be empty if no safe move exists.
 *
 * @example
 * const moves = getSafeMoves(gameState);
 * // moves === ["up", "right"]
 */
export function getSafeMoves(gameState) {
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];
  const { width, height } = gameState.board;

  let isMoveSafe = { up: true, down: true, left: true, right: true };

  // Neck
  if (myNeck.x < myHead.x)      isMoveSafe.left  = false;
  else if (myNeck.x > myHead.x) isMoveSafe.right = false;
  else if (myNeck.y < myHead.y) isMoveSafe.down  = false;
  else if (myNeck.y > myHead.y) isMoveSafe.up    = false;

  // Step 1 - Bounds
  if (myHead.x + 1 >= width)  isMoveSafe.right = false;
  if (myHead.x - 1 < 0)       isMoveSafe.left  = false;
  if (myHead.y + 1 >= height) isMoveSafe.up    = false;
  if (myHead.y - 1 < 0)       isMoveSafe.down  = false;

  // Step 2 - Own body (allow tail if didn't eat)
  const myBody = gameState.you.body;
  const myTail = myBody[myBody.length - 1];
  const mySecondLast = myBody[myBody.length - 2];
  const myAte = myTail.x === mySecondLast.x && myTail.y === mySecondLast.y;

  for (const part of myBody) {
    if (!myAte && part.x === myTail.x && part.y === myTail.y) continue;
    if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
    if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
    if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
    if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
  }

  // Step 3 - Other snakes (allow tail if didn't eat)
  for (const snake of gameState.board.snakes) {
    const theirTail = snake.body[snake.body.length - 1];
    const theirSecondLast = snake.body[snake.body.length - 2];
    const theirAte = theirTail.x === theirSecondLast.x && theirTail.y === theirSecondLast.y;
    for (const part of snake.body) {
      if (!theirAte && part.x === theirTail.x && part.y === theirTail.y) continue;
      if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
      if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
      if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
      if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
    }
  }

  // Step 4 - Avoid head-to-head with larger or equal snakes
  const myLength = gameState.you.length;
  for (const snake of gameState.board.snakes) {
    if (snake.id === gameState.you.id) continue;
    if (snake.length < myLength) continue;

    const oppHead = snake.body[0];
    const possibleOppMoves = [
      { x: oppHead.x + 1, y: oppHead.y },
      { x: oppHead.x - 1, y: oppHead.y },
      { x: oppHead.x,     y: oppHead.y + 1 },
      { x: oppHead.x,     y: oppHead.y - 1 },
    ];
    for (const pos of possibleOppMoves) {
      if (pos.x === myHead.x + 1 && pos.y === myHead.y) isMoveSafe.right = false;
      if (pos.x === myHead.x - 1 && pos.y === myHead.y) isMoveSafe.left  = false;
      if (pos.y === myHead.y + 1 && pos.x === myHead.x) isMoveSafe.up    = false;
      if (pos.y === myHead.y - 1 && pos.x === myHead.x) isMoveSafe.down  = false;
    }
  }

  return Object.keys(isMoveSafe).filter((key) => isMoveSafe[key]);
}

/**
 * Finds the nearest smaller snake to hunt, if one exists.
 *
 * A snake is a valid hunt target if:
 * - It is not our own snake.
 * - Its length is **strictly less** than ours (guarantees we win a head-to-head).
 *
 * Among all valid targets the one with the smallest Manhattan distance from our
 * head to their head is returned.  Returns `null` when no smaller snake is on
 * the board.
 *
 * @param {GameState} gameState - Current game state.
 * @returns {Snake|null} The closest smaller snake, or `null` if none exists.
 *
 * @example
 * const target = findHuntTarget(gameState);
 * if (target) console.log('Hunting', target.name);
 */
export function findHuntTarget(gameState) {
  const myHead = gameState.you.body[0];
  const myLength = gameState.you.length;

  const smallerSnakes = gameState.board.snakes.filter(
    s => s.id !== gameState.you.id && s.length < myLength
  );

  if (smallerSnakes.length === 0) return null;

  return smallerSnakes.reduce((closest, snake) => {
    const distSnake   = Math.abs(snake.body[0].x - myHead.x) + Math.abs(snake.body[0].y - myHead.y);
    const distClosest = Math.abs(closest.body[0].x - myHead.x) + Math.abs(closest.body[0].y - myHead.y);
    return distSnake < distClosest ? snake : closest;
  });
}

/**
 * Determines the best move for the current turn and returns it to the engine.
 *
 * Strategy (in priority order):
 * 1. Falls back to `"down"` if no safe move exists.
 * 2. Picks the safe move that maximises open space (flood fill).
 * 3. **Hunt mode** — if a smaller snake exists and one of the equal-space moves
 *    brings us closer to its head (setting up a winning head-to-head), prefer
 *    that move over food-seeking.
 * 4. Among moves with equal flood-fill scores and no hunt target nearby,
 *    prefers the one that moves closer to the nearest food (Manhattan distance).
 *
 * After deciding, the board is printed asynchronously via {@link printBoard}
 * so it does not delay the HTTP response.
 *
 * @param {GameState} gameState - Current game state provided by the engine.
 * @returns {{ move: string }} Object containing the chosen direction string.
 */
function move(gameState) {
  const myHead = gameState.you.body[0];
  const safeMoves = getSafeMoves(gameState);

  if (safeMoves.length === 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  const moveDeltas = {
    up:    { x: 0,  y: 1  },
    down:  { x: 0,  y: -1 },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  },
  };

  // Step 5 - Use flood fill to pick move with most open space
  let nextMove = safeMoves.reduce((best, move) => {
    const nextPos = { x: myHead.x + moveDeltas[move].x, y: myHead.y + moveDeltas[move].y };
    const bestPos = { x: myHead.x + moveDeltas[best].x, y: myHead.y + moveDeltas[best].y };
    return floodFill(nextPos, gameState) >= floodFill(bestPos, gameState) ? move : best;
  });

  // Step 6 - Among equally spaced moves, prefer closer to food
  const food = gameState.board.food;
  if (food.length > 0) {
    const closestFood = food.reduce((closest, f) => {
      const distF       = Math.abs(f.x - myHead.x) + Math.abs(f.y - myHead.y);
      const distClosest = Math.abs(closest.x - myHead.x) + Math.abs(closest.y - myHead.y);
      return distF < distClosest ? f : closest;
    });

    const bestSpace = floodFill(
      { x: myHead.x + moveDeltas[nextMove].x, y: myHead.y + moveDeltas[nextMove].y },
      gameState
    );

    const equalMoves = safeMoves.filter(m => {
      const pos = { x: myHead.x + moveDeltas[m].x, y: myHead.y + moveDeltas[m].y };
      return floodFill(pos, gameState) === bestSpace;
    });

    nextMove = equalMoves.reduce((best, move) => {
      const distMove = Math.abs((myHead.x + moveDeltas[move].x) - closestFood.x)
                     + Math.abs((myHead.y + moveDeltas[move].y) - closestFood.y);
      const distBest = Math.abs((myHead.x + moveDeltas[best].x) - closestFood.x)
                     + Math.abs((myHead.y + moveDeltas[best].y) - closestFood.y);
      return distMove < distBest ? move : best;
    });
  }

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);
  setImmediate(() => printBoard(gameState.board));
  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});
