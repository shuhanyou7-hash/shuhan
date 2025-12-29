
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  createStage, 
  randomTetromino, 
  checkCollision, 
  rotate, 
  STAGE_WIDTH, 
  STAGE_HEIGHT,
  getGhostPosition
} from './gameLogic';
import { useInterval } from './hooks/useInterval';
import { BoardState, Tetromino, GameStatus, BoardCell } from './types';
import { getStrategicAdvice } from './services/geminiService';
import Cell from './components/Cell';

const App: React.FC = () => {
  const [dropTime, setDropTime] = useState<number | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [stage, setStage] = useState<BoardState>(createStage());
  const [player, setPlayer] = useState<Tetromino>(randomTetromino());
  const [nextPiece, setNextPiece] = useState<Tetromino>(randomTetromino());
  const [score, setScore] = useState(0);
  const [rows, setRows] = useState(0);
  const [level, setLevel] = useState(0);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [aiAdvice, setAiAdvice] = useState<string>("Ready to play? Let's see your moves.");
  const [isAiLoading, setIsAiLoading] = useState(false);

  const gameContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === GameStatus.PLAYING && gameContainerRef.current) {
      gameContainerRef.current.focus();
    }
  }, [status]);

  const updatePlayerPos = ({ x, y, collided }: { x: number; y: number; collided: boolean }) => {
    setPlayer(prev => ({
      ...prev,
      pos: { x: prev.pos.x + x, y: prev.pos.y + y },
      collided,
    }));
  };

  const resetGame = () => {
    setStage(createStage());
    setPlayer(randomTetromino());
    setNextPiece(randomTetromino());
    setGameOver(false);
    setScore(0);
    setRows(0);
    setLevel(0);
    setDropTime(800);
    setStatus(GameStatus.PLAYING);
    setAiAdvice("Focus on the foundations. Keep it flat.");
  };

  const fetchAdvice = useCallback(async (currentBoard: BoardState, currentScore: number, currentLevel: number, currentRows: number) => {
    setIsAiLoading(true);
    const advice = await getStrategicAdvice(currentBoard, currentScore, currentLevel, currentRows);
    setAiAdvice(advice);
    setIsAiLoading(false);
  }, []);

  const playerRotate = (stage: BoardState, dir: number) => {
    const clonedPlayer = JSON.parse(JSON.stringify(player));
    clonedPlayer.shape = rotate(clonedPlayer.shape, dir);

    const pos = clonedPlayer.pos.x;
    let offset = 1;
    while (checkCollision(clonedPlayer, stage, { x: 0, y: 0 })) {
      clonedPlayer.pos.x += offset;
      offset = -(offset + (offset > 0 ? 1 : -1));
      if (Math.abs(offset) > clonedPlayer.shape[0].length) {
        return; // Rotation not possible
      }
    }
    setPlayer(clonedPlayer);
  };

  const movePlayer = (dir: number) => {
    if (!checkCollision(player, stage, { x: dir, y: 0 })) {
      updatePlayerPos({ x: dir, y: 0, collided: false });
    }
  };

  const drop = () => {
    if (!checkCollision(player, stage, { x: 0, y: 1 })) {
      updatePlayerPos({ x: 0, y: 1, collided: false });
    } else {
      if (player.pos.y < 1) {
        setGameOver(true);
        setDropTime(null);
        setStatus(GameStatus.GAME_OVER);
        setAiAdvice("Game over! Don't let the blocks bury your spirit. Try again?");
      } else {
        updateStage();
      }
    }
  };

  const updateStage = () => {
    const newStage = stage.map(row => [...row]);

    player.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + player.pos.y;
          const boardX = x + player.pos.x;
          if (newStage[boardY] && newStage[boardY][boardX] !== undefined) {
            newStage[boardY][boardX] = value as BoardCell;
          }
        }
      });
    });

    let rowsClearedCount = 0;
    const finalStage = newStage.reduce((acc, row) => {
      if (row.every(cell => cell !== 0)) {
        rowsClearedCount += 1;
        acc.unshift(new Array(STAGE_WIDTH).fill(0));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as BoardState);

    if (rowsClearedCount > 0) {
      const linePoints = [0, 40, 100, 300, 1200];
      const newScore = score + linePoints[rowsClearedCount] * (level + 1);
      const newRows = rows + rowsClearedCount;
      const newLevel = Math.floor(newRows / 10);
      
      setScore(newScore);
      setRows(newRows);
      
      if (newLevel > level) {
        setLevel(newLevel);
        const newDropTime = Math.max(100, 800 - (newLevel * 50));
        setDropTime(newDropTime);
        fetchAdvice(finalStage, newScore, newLevel, newRows);
      } else if (Math.random() > 0.8) {
        fetchAdvice(finalStage, newScore, newLevel, newRows);
      }
    }

    setStage(finalStage);
    setPlayer(nextPiece);
    setNextPiece(randomTetromino());
  };

  const hardDrop = () => {
    let currentY = 0;
    while (!checkCollision(player, stage, { x: 0, y: currentY + 1 })) {
      currentY += 1;
    }
    
    // Position piece at bottom
    const finalPlayer = {
        ...player,
        pos: { ...player.pos, y: player.pos.y + currentY }
    };

    // Commit to stage immediately
    const newStage = stage.map(row => [...row]);
    finalPlayer.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value !== 0) {
          const boardY = y + finalPlayer.pos.y;
          const boardX = x + finalPlayer.pos.x;
          if (newStage[boardY] && newStage[boardY][boardX] !== undefined) {
            newStage[boardY][boardX] = value as BoardCell;
          }
        }
      });
    });

    // Handle line clears for hard drop
    let rowsClearedCount = 0;
    const finalStage = newStage.reduce((acc, row) => {
      if (row.every(cell => cell !== 0)) {
        rowsClearedCount += 1;
        acc.unshift(new Array(STAGE_WIDTH).fill(0));
        return acc;
      }
      acc.push(row);
      return acc;
    }, [] as BoardState);

    const linePoints = [0, 40, 100, 300, 1200];
    const newScore = score + linePoints[rowsClearedCount] * (level + 1) + currentY; // Small bonus for hard drop depth
    const newRows = rows + rowsClearedCount;
    const newLevel = Math.floor(newRows / 10);

    setScore(newScore);
    setRows(newRows);
    if (newLevel > level) setLevel(newLevel);

    setStage(finalStage);
    setPlayer(nextPiece);
    setNextPiece(randomTetromino());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (gameOver || status !== GameStatus.PLAYING) return;
    
    if ([32, 37, 38, 39, 40].includes(e.keyCode)) {
      e.preventDefault();
    }

    if (e.keyCode === 37) movePlayer(-1); 
    else if (e.keyCode === 39) movePlayer(1); 
    else if (e.keyCode === 40) drop(); 
    else if (e.keyCode === 38) playerRotate(stage, 1); 
    else if (e.keyCode === 32) hardDrop(); 
    else if (e.keyCode === 80) togglePause(); 
  };

  const togglePause = () => {
    if (status === GameStatus.PLAYING) {
      setDropTime(null);
      setStatus(GameStatus.PAUSED);
    } else if (status === GameStatus.PAUSED) {
      const currentLevelSpeed = Math.max(100, 800 - (level * 50));
      setDropTime(currentLevelSpeed);
      setStatus(GameStatus.PLAYING);
    }
  };

  useInterval(() => {
    drop();
  }, dropTime);

  const ghostPos = getGhostPosition(player, stage);

  return (
    <div 
      className="flex flex-col items-center justify-center min-h-screen bg-[#020617] p-4 sm:p-8 font-sans outline-none focus:outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={gameContainerRef}
    >
      <div className="flex flex-col lg:flex-row gap-8 w-full max-w-6xl items-start justify-center">
        
        {/* Left Side: AI Coach */}
        <div className="flex-1 w-full order-2 lg:order-1 max-w-sm lg:max-w-xs">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-700 p-6 rounded-2xl shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(99,102,241,0.6)]">
                <i className="fa-solid fa-robot text-white text-lg"></i>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">Gemini Strategist</h2>
            </div>
            <div className="relative min-h-[100px] bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              {isAiLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-400"></div>
                </div>
              ) : (
                <p className="text-slate-300 leading-relaxed italic">"{aiAdvice}"</p>
              )}
            </div>
            <button 
              onClick={() => fetchAdvice(stage, score, level, rows)}
              className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Refresh Strategy
            </button>
          </div>
          
          <div className="mt-4 grid grid-cols-2 gap-4">
             <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest mb-1">Score</span>
                <span className="text-2xl font-mono text-cyan-400">{score}</span>
             </div>
             <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase tracking-widest mb-1">Level</span>
                <span className="text-2xl font-mono text-purple-400">{level}</span>
             </div>
          </div>
        </div>

        {/* Center: The Board */}
        <div className="relative order-1 lg:order-2">
          <div className="p-1.5 bg-gradient-to-br from-indigo-500 via-purple-500 to-cyan-500 rounded-lg shadow-[0_0_30px_rgba(99,102,241,0.3)]">
            <div 
              className="grid bg-slate-950 overflow-hidden rounded-md"
              style={{
                gridTemplateColumns: `repeat(${STAGE_WIDTH}, 1fr)`,
                gridTemplateRows: `repeat(${STAGE_HEIGHT}, 1fr)`,
                width: 'min(70vw, 320px)',
                height: 'min(140vw, 640px)'
              }}
            >
              {stage.map((row, y) => 
                row.map((cell, x) => {
                  let type: BoardCell = cell;
                  let isGhost = false;

                  if (type === 0 && player) {
                    player.shape.forEach((pRow, py) => {
                      pRow.forEach((pValue, px) => {
                        if (pValue !== 0 && py + ghostPos.y === y && px + ghostPos.x === x) {
                          type = pValue as BoardCell;
                          isGhost = true;
                        }
                      });
                    });
                  }

                  if (player) {
                    player.shape.forEach((pRow, py) => {
                      pRow.forEach((pValue, px) => {
                        if (pValue !== 0 && py + player.pos.y === y && px + player.pos.x === x) {
                          type = pValue as BoardCell;
                          isGhost = false;
                        }
                      });
                    });
                  }

                  return <Cell key={`${x}-${y}`} type={type} isGhost={isGhost} />;
                })
              )}
            </div>
          </div>

          {(gameOver || status === GameStatus.IDLE || status === GameStatus.PAUSED) && (
            <div className="absolute inset-0 z-10 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg border-2 border-indigo-500/30">
              {gameOver ? (
                <>
                  <h2 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">System Offline</h2>
                  <p className="text-slate-400 mb-8">Final Score: {score}</p>
                  <button 
                    onClick={resetGame}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all transform hover:scale-105"
                  >
                    REBOOT SYSTEM
                  </button>
                </>
              ) : status === GameStatus.IDLE ? (
                <>
                  <div className="mb-6 text-center">
                    <h1 className="text-5xl font-black italic tracking-tighter text-white bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">NEON</h1>
                    <h1 className="text-6xl font-black italic tracking-tighter text-indigo-500 neon-pulse">TETRIS</h1>
                  </div>
                  <button 
                    onClick={resetGame}
                    className="px-12 py-4 bg-white text-slate-950 font-black rounded-full shadow-2xl hover:bg-indigo-400 hover:text-white transition-all transform hover:scale-110 active:scale-95"
                  >
                    INITIALIZE
                  </button>
                  <div className="mt-8 text-slate-500 text-xs flex gap-4 uppercase tracking-widest font-semibold">
                    <span>ARROWS: MOVE</span>
                    <span>SPACE: DROP</span>
                  </div>
                </>
              ) : status === GameStatus.PAUSED ? (
                <>
                  <h2 className="text-4xl font-black text-white mb-8 uppercase tracking-tighter">PAUSED</h2>
                  <button 
                    onClick={togglePause}
                    className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-full shadow-[0_0_20px_rgba(8,145,178,0.5)] transition-all transform hover:scale-105"
                  >
                    RESUME
                  </button>
                </>
              ) : null}
            </div>
          )}
        </div>

        <div className="flex-1 w-full order-3 max-w-sm lg:max-w-xs space-y-4">
           <div className="bg-slate-900/60 border border-slate-700 p-6 rounded-2xl shadow-xl">
             <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <i className="fa-solid fa-forward-step text-indigo-400"></i> Up Next
             </h3>
             <div className="flex items-center justify-center p-4 bg-slate-950/50 rounded-xl border border-slate-800">
                <div 
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(4, 24px)`,
                    gridTemplateRows: `repeat(4, 24px)`
                  }}
                >
                  {nextPiece.shape.map((row, y) => 
                    row.map((cell, x) => (
                      <Cell key={`next-${x}-${y}`} type={cell as BoardCell} />
                    ))
                  )}
                  {Array.from({length: Math.max(0, 4 - nextPiece.shape.length)}).map((_, ry) => 
                    Array.from({length: 4}).map((_, rx) => (
                      <Cell key={`empty-${ry}-${rx}`} type={0} />
                    ))
                  )}
                </div>
             </div>
           </div>

           <div className="bg-slate-900/30 border border-slate-800/50 p-6 rounded-2xl">
             <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Command Deck</h3>
             <ul className="space-y-3 text-sm text-slate-400">
               <li className="flex justify-between items-center"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">← →</span> <span>Move Horizontal</span></li>
               <li className="flex justify-between items-center"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">↑</span> <span>Rotate Clockwise</span></li>
               <li className="flex justify-between items-center"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">↓</span> <span>Soft Drop</span></li>
               <li className="flex justify-between items-center"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">SPACE</span> <span>Hard Drop</span></li>
               <li className="flex justify-between items-center"><span className="bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-slate-300">P</span> <span>Pause Session</span></li>
             </ul>
           </div>

           <div className="bg-indigo-600/10 border border-indigo-500/20 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[10px] text-indigo-400 font-bold uppercase">Lines Cleared</p>
                <p className="text-xl font-mono text-white">{rows}</p>
              </div>
              <i className="fa-solid fa-layer-group text-indigo-500/40 text-2xl"></i>
           </div>
        </div>
      </div>

      <div className="fixed bottom-8 flex gap-4 lg:hidden">
        <button onPointerDown={(e) => { e.preventDefault(); movePlayer(-1); }} className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 text-white"><i className="fa-solid fa-arrow-left"></i></button>
        <div className="flex flex-col gap-4">
          <button onPointerDown={(e) => { e.preventDefault(); playerRotate(stage, 1); }} className="w-14 h-14 bg-indigo-600/80 rounded-full flex items-center justify-center border border-indigo-400 text-white"><i className="fa-solid fa-rotate-right"></i></button>
          <button onPointerDown={(e) => { e.preventDefault(); hardDrop(); }} className="w-14 h-14 bg-cyan-600/80 rounded-full flex items-center justify-center border border-cyan-400 text-white"><i className="fa-solid fa-angles-down"></i></button>
        </div>
        <button onPointerDown={(e) => { e.preventDefault(); movePlayer(1); }} className="w-14 h-14 bg-slate-800/80 rounded-full flex items-center justify-center border border-slate-700 text-white"><i className="fa-solid fa-arrow-right"></i></button>
      </div>

      <footer className="fixed bottom-4 left-0 right-0 text-center opacity-30 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-500">Gemini Integrated Game System • v3.0-FLASH</p>
      </footer>
    </div>
  );
};

export default App;
