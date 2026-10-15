import React from 'react';
import { Gamepad2, Volume2, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-amber-400 border-t-4 border-amber-500 text-amber-950 py-4 px-4 mt-8 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-semibold">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <div>
            <div className="font-extrabold uppercase font-['Outfit',sans-serif] text-slate-950">
              FOOTER (Alt Bilgi Bölümü) · 3'lü Oyun Portalı
            </div>
            <p className="text-[11px] text-amber-950/80">
              Geometri Dash (Neon Dash) · FIFA Soccer · Clash Royale (Tower Royale)
            </p>
          </div>
        </div>

        {/* Center Keyboard Shortcuts Guide */}
        <div className="flex items-center flex-wrap justify-center gap-3 text-[11px] bg-amber-500/50 px-3 py-1.5 rounded-lg border border-amber-600/30">
          <span>Kısayollar:</span>
          <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">Boşluk / Sol Tık: Zıpla / Şut</span>
          <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">R: Yeniden Başlat</span>
          <span className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">Z/X: Pratik Kontrolü</span>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4 text-[11px] text-amber-950">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-800" />
            <span>60 FPS Canvas</span>
          </div>
          <div className="flex items-center gap-1">
            <Volume2 className="w-3.5 h-3.5 text-amber-900" />
            <span>Web Audio Synth</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-700 fill-rose-700" />
            <span>2026 Arcade</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
