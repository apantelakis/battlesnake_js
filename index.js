import runServer from "./server.js";
import chalk from "chalk";

function info() {
  console.log("INFO");

  return {
    apiversion: "1",
    author: "Thanasis, Andreas, Dionysis, Iasonas",
    color: "#00C853",
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
  for (const part of myBody) {
    if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
    if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
    if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
    if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
  }

  // Step 3 - Prevent colliding with other snakes
  const opponents = gameState.board.snakes;
  for (const snake of opponents) {
    for (const part of snake.body) {
      if (part.x === myHead.x + 1 && part.y === myHead.y) isMoveSafe.right = false;
      if (part.x === myHead.x - 1 && part.y === myHead.y) isMoveSafe.left  = false;
      if (part.y === myHead.y + 1 && part.x === myHead.x) isMoveSafe.up    = false;
      if (part.y === myHead.y - 1 && part.x === myHead.x) isMoveSafe.down  = false;
    }
  }

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

