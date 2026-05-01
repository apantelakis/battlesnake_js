import runServer from "./server.js";
import chalk from "chalk";

// info is called when you create your Battlesnake on play.battlesnake.com
// and controls your Battlesnake's appearance
// TIP: If you open your Battlesnake URL in a browser you should see this data
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

// start is called when your Battlesnake begins a game
function start(gameState) {
  console.log("GAME START");
}

// end is called when your Battlesnake finishes a game
function end(gameState) {
  console.log("GAME OVER\n");
}

// printBoard takes the board object and prints it to the console.
// Symbols:
//   ' . ' = empty cell       (dark background)
//   ' * ' = food             (green background)
//   ' H ' = snake head       (red background)
//   ' B ' = snake body       (yellow background)
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

// move is called on every turn and returns your next move
// Valid moves are "up", "down", "left", or "right"
// See https://docs.battlesnake.com/api/example-move for available data
function move(gameState) {
  let isMoveSafe = {
    up: true,
    down: true,
    left: true,
    right: true,
  };

  // We've included code to prevent your Battlesnake from moving backwards
  const myHead = gameState.you.body[0];
  const myNeck = gameState.you.body[1];

  if (myNeck.x < myHead.x) {
    // Neck is left of head, don't move left
    isMoveSafe.left = false;
  } else if (myNeck.x > myHead.x) {
    // Neck is right of head, don't move right
    isMoveSafe.right = false;
  } else if (myNeck.y < myHead.y) {
    // Neck is below head, don't move down
    isMoveSafe.down = false;
  } else if (myNeck.y > myHead.y) {
    // Neck is above head, don't move up
    isMoveSafe.up = false;
  }

  // Step 1 - Prevent moving out of bounds
  const boardWidth = gameState.board.width;
  const boardHeight = gameState.board.height;

  if (myHead.x + 1 >= boardWidth) isMoveSafe.right = false;
  if (myHead.x - 1 < 0)          isMoveSafe.left  = false;
  if (myHead.y + 1 >= boardHeight) isMoveSafe.up   = false;
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

  // Are there any safe moves left?
  const safeMoves = Object.keys(isMoveSafe).filter((key) => isMoveSafe[key]);
  if (safeMoves.length == 0) {
    console.log(`MOVE ${gameState.turn}: No safe moves detected! Moving down`);
    return { move: "down" };
  }

  // Choose a random move from the safe moves
  const nextMove = safeMoves[Math.floor(Math.random() * safeMoves.length)];

  // TODO: Step 4 - Move towards food instead of random, to regain health and survive longer
  // food = gameState.board.food;

  console.log(`MOVE ${gameState.turn}: ${nextMove}`);

  // Print the board after sending the response
  setImmediate(() => printBoard(gameState.board));

  return { move: nextMove };
}

runServer({
  info: info,
  start: start,
  move: move,
  end: end,
});

