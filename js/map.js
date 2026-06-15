/**
 * map.js
 * Defines the 21x21 maze layout and provides utility functions.
 *
 * Tile types:
 *  0 = wall
 *  1 = path
 */

const MapModule = (() => {

  // 21x21 Pac-Man style symmetric maze (verified: connected, all key positions are paths)
  // 1 = path, 0 = wall
  const TEMPLATE = [
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    [0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0],
    [0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,0,1,0],
    [0,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,0],
    [0,0,1,0,1,0,0,1,0,1,1,1,0,1,0,0,1,0,1,0,0],
    [0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
    [0,1,0,0,1,1,0,1,0,1,0,1,0,1,0,1,1,0,0,1,0],
    [0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],
    [0,1,0,0,1,0,0,1,1,1,1,1,1,1,0,0,1,0,0,1,0],
    [0,1,1,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,1,1,0],
    [0,0,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,0,0],
    [0,1,1,1,1,1,0,1,1,0,1,0,1,1,0,1,1,1,1,1,0],
    [0,1,0,0,1,0,0,1,1,1,1,1,1,1,0,0,1,0,0,1,0],
    [0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0,1,1,1,0],
    [0,1,0,0,1,1,0,1,0,1,0,1,0,1,0,1,1,0,0,1,0],
    [0,1,1,1,1,1,0,1,1,1,1,1,1,1,0,1,1,1,1,1,0],
    [0,0,1,0,1,0,0,1,0,1,1,1,0,1,0,0,1,0,1,0,0],
    [0,1,1,1,0,1,1,1,1,0,1,0,1,1,1,1,0,1,1,1,0],
    [0,1,0,0,1,1,0,0,1,0,1,0,1,0,0,1,1,0,0,1,0],
    [0,1,1,1,0,1,1,1,1,1,0,1,1,1,1,1,0,1,1,1,0],
    [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  ];

  const ROWS = 21;
  const COLS = 21;
  const TILE = 28; // pixel size of each tile

  function isPath(row, col) {
    if (row < 0 || row >= ROWS || col < 0 || col >= COLS) return false;
    return TEMPLATE[row][col] === 1;
  }

  /** Return all path tile coordinates */
  function getPathTiles() {
    const tiles = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (TEMPLATE[r][c] === 1) tiles.push({ r, c });
      }
    }
    return tiles;
  }

  /**
   * BFS to find nearest empty path tile (no letter, no player) from (row, col).
   * emptyCb(r,c) returns true if tile is suitable.
   */
  function bfsNearestEmpty(row, col, emptyCb) {
    const visited = Array.from({ length: ROWS }, () => new Array(COLS).fill(false));
    const queue = [{ r: row, c: col }];
    visited[row][col] = true;
    const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
    while (queue.length) {
      const { r, c } = queue.shift();
      if (isPath(r, c) && emptyCb(r, c)) return { r, c };
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && !visited[nr][nc] && TEMPLATE[nr][nc] === 1) {
          visited[nr][nc] = true;
          queue.push({ r: nr, c: nc });
        }
      }
    }
    return null;
  }

  return { TEMPLATE, ROWS, COLS, TILE, isPath, getPathTiles, bfsNearestEmpty };
})();
