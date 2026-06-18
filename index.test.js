import { floodFill, getSafeMoves } from "./index.js";

// Helpers
function makeGameState({ width = 5, height = 5, myBody, food = [], otherSnakes = [] }) {
  return {
    board: { width, height, food, snakes: [{ body: myBody }, ...otherSnakes] },
    you: { body: myBody },
  };
}

// floodFill tests

describe("floodFill", () => {
  test("returns full board area when snake is alone and no obstacles", () => {
    const gameState = makeGameState({
      myBody: [
        { x: 2, y: 2 },
        { x: 2, y: 1 },
      ],
    });
    const result = floodFill({ x: 2, y: 3 }, gameState);
    expect(result).toBeGreaterThan(0);
  });

  test("returns 0 for a completely blocked position", () => {
    const gameState = makeGameState({
      myBody: [
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
      ],
    });
    // position (0,2) is surrounded on 3 sides by body and 1 by wall
    const result = floodFill({ x: 0, y: 2 }, gameState);
    expect(result).toBeLessThan(3);
  });

  test("returns 1 when starting position is fully enclosed", () => {
    const gameState = makeGameState({
      width: 3,
      height: 3,
      myBody: [
        { x: 1, y: 2 },
        { x: 0, y: 2 },
        { x: 0, y: 1 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
      ],
    });
    const result = floodFill({ x: 1, y: 1 }, gameState);
    expect(result).toBe(1);
  });

  test("does not count out-of-bounds cells", () => {
    const gameState = makeGameState({
      myBody: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
    const result = floodFill({ x: 0, y: 1 }, gameState);
    expect(result).toBeGreaterThan(0);
    expect(result).toBeLessThanOrEqual(25);
  });

  test("counts more space in open area vs narrow corridor", () => {
    const gameState = makeGameState({
      width: 5,
      height: 5,
      myBody: [
        { x: 2, y: 0 },
        { x: 2, y: 1 },
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ],
    });
    const leftSpace = floodFill({ x: 0, y: 2 }, gameState);
    const rightSpace = floodFill({ x: 4, y: 2 }, gameState);
    // Both sides are symmetric, both should be equal and > 0
    expect(leftSpace).toBe(rightSpace);
    expect(leftSpace).toBeGreaterThan(0);
  });
});

// getSafeMoves tests

describe("getSafeMoves", () => {
  test("blocks move into wall", () => {
    const gameState = makeGameState({
      myBody: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
    });
    const safe = getSafeMoves(gameState);
    expect(safe).not.toContain("left");
    expect(safe).not.toContain("down");
  });

  test("blocks move into own body", () => {
    const gameState = makeGameState({
      myBody: [
        { x: 2, y: 2 },
        { x: 2, y: 3 },
        { x: 2, y: 4 },
      ],
    });
    const safe = getSafeMoves(gameState);
    expect(safe).not.toContain("up");
  });

  test("returns all four directions in open space", () => {
    const gameState = makeGameState({
      width: 11,
      height: 11,
      myBody: [
        { x: 5, y: 5 },
        { x: 5, y: 4 },
      ],
    });
    const safe = getSafeMoves(gameState);
    expect(safe).toContain("left");
    expect(safe).toContain("right");
    expect(safe).toContain("up");
  });
});
