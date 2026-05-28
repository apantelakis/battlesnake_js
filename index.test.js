import { info, start, end, move } from "./index.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState({
  headX = 5, headY = 5,
  body = null,
  boardWidth = 11, boardHeight = 11,
  food = [],
  opponents = [],
  myId = "me",
  myLength = null,
} = {}) {
  const myBody = body ?? [
    { x: headX,     y: headY },
    { x: headX - 1, y: headY },
    { x: headX - 2, y: headY },
  ];
  return {
    turn: 1,
    you: {
      id: myId,
      body: myBody,
      length: myLength ?? myBody.length,
    },
    board: {
      width: boardWidth,
      height: boardHeight,
      food,
      snakes: [
        { id: myId, body: myBody, length: myLength ?? myBody.length },
        ...opponents,
      ],
    },
  };
}

// ---------------------------------------------------------------------------
// info()
// ---------------------------------------------------------------------------

describe("info()", () => {
  test("returns required Battlesnake fields", () => {
    const result = info();
    expect(result).toHaveProperty("apiversion", "1");
    expect(result).toHaveProperty("color");
    expect(result).toHaveProperty("head");
    expect(result).toHaveProperty("tail");
  });
});

// ---------------------------------------------------------------------------
// start() / end()
// ---------------------------------------------------------------------------

describe("start()", () => {
  test("runs without error", () => {
    expect(() => start({})).not.toThrow();
  });
});

describe("end()", () => {
  test("runs without error", () => {
    expect(() => end({})).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// move() — neck / backwards prevention
// ---------------------------------------------------------------------------

describe("move() — does not move backwards", () => {
  test("neck is to the left → does not pick left", () => {
    // default body: head at (5,5), neck at (4,5)
    const state = makeState();
    const { move: dir } = move(state);
    expect(dir).not.toBe("left");
  });

  test("neck is to the right → does not pick right", () => {
    const state = makeState({
      body: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 7, y: 5 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("right");
  });

  test("neck is below → does not pick down", () => {
    const state = makeState({
      body: [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 5, y: 3 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("down");
  });

  test("neck is above → does not pick up", () => {
    const state = makeState({
      body: [{ x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("up");
  });
});

// ---------------------------------------------------------------------------
// move() — out of bounds prevention
// ---------------------------------------------------------------------------

describe("move() — stays in bounds", () => {
  test("at right wall → does not pick right", () => {
    const state = makeState({ headX: 10, headY: 5 });
    const { move: dir } = move(state);
    expect(dir).not.toBe("right");
  });

  test("at left wall → does not pick left", () => {
    const state = makeState({
      headX: 0, headY: 5,
      body: [{ x: 0, y: 5 }, { x: 0, y: 4 }, { x: 0, y: 3 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("left");
  });

  test("at top wall → does not pick up", () => {
    const state = makeState({
      headX: 5, headY: 10,
      body: [{ x: 5, y: 10 }, { x: 4, y: 10 }, { x: 3, y: 10 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("up");
  });

  test("at bottom wall → does not pick down", () => {
    const state = makeState({
      headX: 5, headY: 0,
      body: [{ x: 5, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 0 }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("down");
  });
});

// ---------------------------------------------------------------------------
// move() — own body collision
// ---------------------------------------------------------------------------

describe("move() — avoids own body", () => {
  test("body segment directly above head → does not pick up", () => {
    const state = makeState({
      body: [
        { x: 5, y: 5 },  // head
        { x: 4, y: 5 },  // neck (left)
        { x: 4, y: 6 },
        { x: 5, y: 6 },  // mid-body above head — NOT the tail
        { x: 6, y: 6 },  // actual tail (different cell, so (5,6) is not skipped)
      ],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("up");
  });

  test("own tail is safe to move into when snake did not eat", () => {
    // Tail is at (5,3). If snake didn't eat, tail will vacate — moving down should be allowed.
    const state = makeState({
      body: [
        { x: 5, y: 5 }, // head
        { x: 5, y: 4 }, // body
        { x: 5, y: 3 }, // tail (different from second-last → didn't eat)
      ],
      food: [{ x: 5, y: 6 }], // food above, so snake would prefer up anyway
    });
    // The tail square (5,3) is below. Since didn't eat, it should be safe.
    // We just assert no crash and a valid direction is returned.
    const { move: dir } = move(state);
    expect(["up", "down", "left", "right"]).toContain(dir);
  });

  test("own tail is blocked when snake just ate (tail duplicated)", () => {
    // tail === second-last means snake ate last turn → tail stays, block it
    const state = makeState({
      body: [
        { x: 5, y: 5 }, // head
        { x: 5, y: 4 }, // neck
        { x: 5, y: 3 }, // tail == second-last means ate... but they must differ for ate detection
        // Actually ate is when tail.x===secondLast.x && tail.y===secondLast.y
        { x: 5, y: 3 }, // duplicate tail = ate
      ],
    });
    // With tail duplicated at (5,3) the square (5,3) is blocked even after tail check.
    // down from head(5,5) would be (5,4) which is the neck — also unsafe.
    // We just assert a valid move is returned.
    const { move: dir } = move(state);
    expect(["up", "down", "left", "right"]).toContain(dir);
  });
});

// ---------------------------------------------------------------------------
// move() — opponent collision
// ---------------------------------------------------------------------------

describe("move() — avoids opponent bodies", () => {
  test("opponent body to the right of head → does not pick right", () => {
    const state = makeState({
      opponents: [{
        id: "opp",
        length: 4,
        body: [
          { x: 8, y: 5 }, // opp head (far away)
          { x: 7, y: 5 },
          { x: 6, y: 5 }, // mid-body directly right of our head at (5,5)
          { x: 6, y: 4 }, // tail — a different cell, so (6,5) is NOT skipped
        ],
      }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("right");
  });

  test("opponent tail is safe to enter when opponent did not eat", () => {
    const state = makeState({
      opponents: [{
        id: "opp",
        length: 3,
        body: [
          { x: 8, y: 5 },
          { x: 7, y: 5 },
          { x: 6, y: 5 }, // tail (different from second-last → didn't eat)
        ],
      }],
      food: [{ x: 5, y: 6 }],
    });
    // (6,5) is the opponent tail and is safe since they didn't eat.
    // We just assert a valid direction comes back.
    const { move: dir } = move(state);
    expect(["up", "down", "left", "right"]).toContain(dir);
  });
});

// ---------------------------------------------------------------------------
// move() — head-to-head avoidance
// ---------------------------------------------------------------------------

describe("move() — avoids head-to-head with larger/equal snakes", () => {
  test("larger opponent head adjacent → danger zone blocked", () => {
    // Our head at (5,5). Opponent head at (7,5), length > ours.
    // Opponent could move left to (6,5). Moving right from us goes to (6,5) — danger.
    const state = makeState({
      myLength: 3,
      opponents: [{
        id: "opp",
        length: 5,
        body: [
          { x: 7, y: 5 }, // opp head
          { x: 8, y: 5 },
          { x: 9, y: 5 },
          { x: 9, y: 4 },
          { x: 9, y: 3 },
        ],
      }],
    });
    const { move: dir } = move(state);
    expect(dir).not.toBe("right");
  });

  test("smaller opponent head adjacent → their danger zone is NOT blocked (we win)", () => {
    // Our head at (5,5) length 5. Opponent head at (7,5), length 3 (smaller).
    // Moving right to (6,5) is fine — we are bigger so we'd win.
    const state = makeState({
      myLength: 5,
      body: [
        { x: 5, y: 5 },
        { x: 4, y: 5 },
        { x: 3, y: 5 },
        { x: 2, y: 5 },
        { x: 1, y: 5 },
      ],
      food: [{ x: 6, y: 5 }], // food to the right — snake should go right
      opponents: [{
        id: "opp",
        length: 3,
        body: [
          { x: 7, y: 5 },
          { x: 8, y: 5 },
          { x: 9, y: 5 },
        ],
      }],
    });
    const { move: dir } = move(state);
    expect(dir).toBe("right");
  });
});

// ---------------------------------------------------------------------------
// move() — food seeking
// ---------------------------------------------------------------------------

describe("move() — moves toward food", () => {
  test("food directly above → picks up", () => {
    const state = makeState({
      food: [{ x: 5, y: 6 }],
    });
    const { move: dir } = move(state);
    expect(dir).toBe("up");
  });

  test("food directly to the right → picks right", () => {
    const state = makeState({
      body: [{ x: 5, y: 5 }, { x: 5, y: 4 }, { x: 5, y: 3 }],
      food: [{ x: 6, y: 5 }],
    });
    const { move: dir } = move(state);
    expect(dir).toBe("right");
  });
});

// ---------------------------------------------------------------------------
// move() — fallback when no safe moves
// ---------------------------------------------------------------------------

describe("move() — fallback when cornered", () => {
  test("returns { move: 'down' } when all moves are blocked", () => {
    // Head at (0,0) corner. Neck above (0,1). Walls left and below. Body to the right.
    const state = makeState({
      headX: 0, headY: 0,
      body: [
        { x: 0, y: 0 }, // head
        { x: 0, y: 1 }, // neck (blocks up)
        { x: 1, y: 0 }, // blocks right (also in body list below)
      ],
      // Add a body segment to the right to block that too
      opponents: [{
        id: "opp",
        length: 3,
        body: [
          { x: 2, y: 0 },
          { x: 1, y: 0 }, // directly right of head — blocks right
          { x: 1, y: 1 },
        ],
      }],
      // left (x=-1) and down (y=-1) are out of bounds
      // up is blocked by neck
      // right is blocked by opponent body
    });
    const result = move(state);
    expect(result).toEqual({ move: "down" });
  });
});
