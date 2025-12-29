
import { BoardState, Tetromino, TETROMINOS } from './types';

export const STAGE_WIDTH = 10;
export const STAGE_HEIGHT = 20;

export const createStage = (): BoardState =>
  Array.from(Array(STAGE_HEIGHT), () => Array(STAGE_WIDTH).fill(0));

export const randomTetromino = () => {
  const keys = Object.keys(TETROMINOS);
  const randKey = keys[Math.floor(Math.random() * keys.length)];
  return {
    pos: { x: STAGE_WIDTH / 2 - 2, y: 0 },
    shape: TETROMINOS[randKey].shape,
    collided: false,
    type: randKey
  };
};

export const checkCollision = (
  player: Tetromino,
  stage: BoardState,
  { x: moveX, y: moveY }: { x: number; y: number }
) => {
  for (let y = 0; y < player.shape.length; y += 1) {
    for (let x = 0; x < player.shape[y].length; x += 1) {
      if (player.shape[y][x] !== 0) {
        const targetY = y + player.pos.y + moveY;
        const targetX = x + player.pos.x + moveX;

        // Check if the move is within the board's bounds (Y-axis)
        // Note: targetY < 0 is allowed for pieces spawning or rotating partially off-screen at the top
        if (targetY >= STAGE_HEIGHT) {
          return true;
        }

        // Check if the move is within the board's bounds (X-axis)
        if (targetX < 0 || targetX >= STAGE_WIDTH) {
          return true;
        }

        // Check if the target cell is already occupied
        // We only check if targetY is valid on the stage (>= 0)
        if (targetY >= 0 && stage[targetY][targetX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
};

export const rotate = (matrix: (number | string)[][], dir: number) => {
  const rotated = matrix.map((_, index) => matrix.map((col) => col[index]));
  if (dir > 0) return rotated.map((row) => row.reverse());
  return rotated.reverse();
};

export const getGhostPosition = (player: Tetromino, stage: BoardState) => {
  let ghostY = player.pos.y;
  while (!checkCollision(player, stage, { x: 0, y: ghostY - player.pos.y + 1 })) {
    ghostY += 1;
  }
  return { ...player.pos, y: ghostY };
};
