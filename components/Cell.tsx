
import React from 'react';
import { BoardCell, TETROMINOS } from '../types';

interface CellProps {
  type: BoardCell;
  isGhost?: boolean;
}

const COLORS: Record<string, string> = {
  I: 'bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.8)] border-cyan-400',
  J: 'bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.8)] border-blue-400',
  L: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] border-orange-400',
  O: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] border-yellow-300',
  S: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)] border-green-400',
  T: 'bg-purple-600 shadow-[0_0_10px_rgba(147,51,234,0.8)] border-purple-400',
  Z: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] border-red-400',
};

const GHOST_COLORS: Record<string, string> = {
  I: 'border-cyan-500/50 bg-cyan-500/10',
  J: 'border-blue-500/50 bg-blue-500/10',
  L: 'border-orange-500/50 bg-orange-500/10',
  O: 'border-yellow-500/50 bg-yellow-500/10',
  S: 'border-green-500/50 bg-green-500/10',
  T: 'border-purple-500/50 bg-purple-500/10',
  Z: 'border-red-500/50 bg-red-500/10',
};

const Cell: React.FC<CellProps> = ({ type, isGhost }) => {
  const colorClass = type !== 0 ? (isGhost ? GHOST_COLORS[type] : COLORS[type]) : 'bg-slate-900/40 border-slate-800/20';

  return (
    <div className={`w-full h-full border ${colorClass} transition-all duration-100`}>
      {type !== 0 && !isGhost && (
        <div className="w-full h-full bg-white/10" />
      )}
    </div>
  );
};

export default React.memo(Cell);
