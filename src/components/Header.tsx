import React from 'react';
import { Volume2, VolumeX, Maximize2, HelpCircle, Gamepad2, Award } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface HeaderProps {
  totalPoints: number;
  level: number;
  onOpenHelp: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalPoints,
  level,
  onOpenHelp,
  isMuted,
  onToggleMute,
}) => {
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="relative w-full overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 border-b-4 border-amber-600 shadow-md">
      {/* Background illustration with smooth overlay */}
      <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-multiply">
        <img
          src="/src/assets/images/arcade_header_banner_1792048750218.jpg"
          alt="Arcade Zone"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-3 sm:py-4 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border-2 border-amber-200 text-amber-400 flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight uppercase font-['Outfit',sans-serif]">
                ARCADE ARENA
              </h1>
              <span className="bg-slate-900 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                3 Oyun Portalı
              </span>
            </div>
            <p className="text-xs font-semibold text-amber-950/80">
              HEADER (BAŞLIK) Alanı - Geometri Dash · FIFA · Clash Royale
            </p>
          </div>
        </div>

        {/* Player Stats & Controls */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3">
          {/* Level Badge */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 text-white rounded-lg border border-amber-300/40 shadow-sm text-xs font-mono">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 font-bold">LVL {level}</span>
          </div>

          {/* Points Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950/90 text-white rounded-lg border border-amber-300/40 shadow-sm text-xs font-mono">
            <span className="text-slate-400">Puan:</span>
            <span className="text-amber-300 font-bold tabular-nums">
              {totalPoints.toLocaleString()}
            </span>
          </div>

          {/* Audio Mute/Unmute */}
          <button
            onClick={() => {
              soundEngine.playJump();
              onToggleMute();
            }}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg border border-amber-300/30 transition-colors shadow-sm"
            title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullScreen}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-lg border border-amber-300/30 transition-colors shadow-sm hidden sm:block"
            title="Tam Ekran"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Help Modal Trigger */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950 text-amber-200 hover:bg-black font-semibold rounded-lg text-xs transition-colors shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Kılavuz</span>
          </button>
        </div>
      </div>
    </header>
  );
};
