import React from 'react';
import { GameId } from '../types/game';
import { Sparkles, Trophy, Crown, Flame } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface MenuBarProps {
  activeGame: GameId;
  onSelectGame: (gameId: GameId) => void;
}

export const MenuBar: React.FC<MenuBarProps> = ({ activeGame, onSelectGame }) => {
  const games: { id: GameId; label: string; icon: React.ReactNode; genre: string }[] = [
    {
      id: 'geometry-dash',
      label: '1. GEOMETRİ DASH (Neon Dash)',
      icon: <Sparkles className="w-4 h-4 text-cyan-500" />,
      genre: 'Ritim & Platform',
    },
    {
      id: 'fifa-soccer',
      label: '2. FIFA SOCCER (Penaltı & Frikik)',
      icon: <Trophy className="w-4 h-4 text-emerald-500" />,
      genre: 'Futbol Şampiyonası',
    },
    {
      id: 'tower-royale',
      label: '3. CLASH ROYALE (Tower Royale)',
      icon: <Crown className="w-4 h-4 text-amber-500" />,
      genre: 'Gerçek Zamanlı Strateji',
    },
  ];

  return (
    <nav className="w-full bg-slate-200 border-b border-slate-300 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between overflow-x-auto py-2">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-2 hidden md:inline">
            Menü Alanı:
          </span>
          {games.map((g) => {
            const isActive = activeGame === g.id;
            return (
              <button
                key={g.id}
                onClick={() => {
                  soundEngine.playJump();
                  onSelectGame(g.id);
                }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-slate-900 text-amber-300 shadow-md transform -translate-y-0.5'
                    : 'bg-white/80 hover:bg-white text-slate-700 hover:text-slate-950 border border-slate-300'
                }`}
              >
                {g.icon}
                <span>{g.label}</span>
                <span className={`text-[10px] font-normal ${isActive ? 'text-amber-200/80' : 'text-slate-400'}`}>
                  ({g.genre})
                </span>
              </button>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
          <Flame className="w-4 h-4 text-rose-500" />
          <span>3 Efsane Mod Aktif</span>
        </div>
      </div>
    </nav>
  );
};
