
export type Shape = (number | string)[][];

export interface Tetromino {
  pos: { x: number; y: number };
  shape: Shape;
  collided: boolean;
  type: string;
}

export type BoardCell = string | 0;
export type BoardState = BoardCell[][];

export enum GameStatus {
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER',
  IDLE = 'IDLE'
}

export const TETROMINOS: Record<string, { shape: Shape; color: string }> = {
  I: {
    shape: [
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0],
      [0, 'I', 0, 0]
    ],
    color: 'cyan'
  },
  J: {
    shape: [
      [0, 'J', 0],
      [0, 'J', 0],
      ['J', 'J', 0]
    ],
    color: 'blue'
  },
  L: {
    shape: [
      [0, 'L', 0],
      [0, 'L', 0],
      [0, 'L', 'L']
    ],
    color: 'orange'
  },
  O: {
    shape: [
      ['O', 'O'],
      ['O', 'O']
    ],
    color: 'yellow'
  },
  S: {
    shape: [
      [0, 'S', 'S'],
      ['S', 'S', 0],
      [0, 0, 0]
    ],
    color: 'green'
  },
  T: {
    shape: [
      [0, 0, 0],
      ['T', 'T', 'T'],
      [0, 'T', 0]
    ],
    color: 'purple'
  },
  Z: {
    shape: [
      ['Z', 'Z', 0],
      [0, 'Z', 'Z'],
      [0, 0, 0]
    ],
    color: 'red'
  }
};
