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

import runServer from "./server.js";
import chalk from "chalk";

function info() {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "Thanasis, Andreas, Dionysis, Iasonas", "Nikolas",
    color: "#FF6600",
    head: "tongue",
    tail: "curled",
  };
}

function start(gameState) {
  console.log("GAME START");
}

function end(gameState) {
  console.log("GAME OVER\n");
}

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

function move(gameState) {
  let isMoveSafe = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {
    isMoveSafe.left = false;
  } else if (myNeck.x > myHead.x) {
    isMoveSafe.right = false;
  } else if (myNeck.y < myHead.y) {
    isMoveSafe.down = false;
  } else if (myNeck.y > myHead.y) {
    isMoveSafe.up = false;
  }

  // Step 1 - Prevent moving out of bounds
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;

  if (myHead.x + 1 >= boardWidth)  isMoveSafe.right = false;
  if (myHead.x - 1 < 0)           isMoveSafe.left  = false;
  if (myHead.y + 1 >= boardHeight) isMoveSafe.up    = false;
  if (myHead.y - 1 < 0)           isMoveSafe.down  = false;

  // Step 2 - Prevent colliding with own body
const myBody = gameState.you.body;
const myTail = myBody[myBody.length - 1];
const mySecondLast = myBody[myBody.length - 2];
const myAte = myTail.x === mySecondLast.x && myTail.y === mySecondLast.y;

for (const part of myBody) {
  // Skip tail if snake didn't eat (tail will move away)
  if (!myAte && part.x === myTail.x && part.y === myTail.y) continue;

  if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
  if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
  if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
  if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
}

// Step 3 - Prevent colliding with other snakes
const opponents = gameState.board.snakes;
for (const snake of opponents) {
  const theirTail = snake.body[snake.body.length - 1];
  const theirSecondLast = snake.body[snake.body.length - 2];
  const theirAte = theirTail.x === theirSecondLast.x && theirTail.y === theirSecondLast.y;

  for (const part of snake.body) {
    // Skip tail if opponent didn't eat (tail will move away)
    if (!theirAte && part.x === theirTail.x && part.y === theirTail.y) continue;

    if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
    if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
    if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
    if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
  }
}

  // Step 4 - Avoid head-to-head collisions with larger or equal snakes
  // For each opponent, find all cells their head could move into next turn.
  // If their length >= ours, moving into that cell risks a collision we'd lose.
  const myLength = gameState.you.length;
  for (const snake of opponents) {
    if (snake.id === gameState.you.id) continue; // skip ourselves
    if (snake.length < myLength) continue;       // we're bigger — they'd lose, not us

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

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key]);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Step 4 - Move towards closest food using Manhattan distance
  const food = gameState.board.food;
  const moveDeltas = {
    up:    { x: 0,  y: 1  },
    down:  { x: 0,  y: -1 },
    left:  { x: -1, y: 0  },
    right: { x: 1,  y: 0  },
  };

  let nextMove;

  if (food.length > 0) {
    const closestFood = food.reduce((closest, f) => {
      const distF       = Math.abs(f.x - myHead.x) + Math.abs(f.y - myHead.y);
      const distClosest = Math.abs(closest.x - myHead.x) + Math.abs(closest.y - myHead.y);
      return distF < distClosest ? f : closest;
    });

    nextMove = safeMoves.reduce((best, move) => {
      const distMove = Math.abs((myHead.x + moveDeltas[move].x) - closestFood.x)
                     + Math.abs((myHead.y + moveDeltas[move].y) - closestFood.y);
      const distBest = Math.abs((myHead.x + moveDeltas[best].x) - closestFood.x)
                     + Math.abs((myHead.y + moveDeltas[best].y) - closestFood.y);
      return distMove < distBest ? move : best;
    });
  } else {
    nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];
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
