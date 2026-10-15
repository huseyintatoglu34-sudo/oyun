import React from 'react';
import { GameId, PlayerStats } from '../types/game';
import { Gamepad2, Volume2, Award, Zap, Sliders, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/soundEngine';

interface LeftSidebarProps {
  activeGame: GameId;
  stats: PlayerStats;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  activeGame,
  stats,
  volume,
  onVolumeChange,
}) => {
  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
      {/* Sidebar Label matching the diagram */}
      <div className="bg-amber-400 border-2 border-amber-500 rounded-xl px-4 py-2 text-center shadow-xs">
        <span className="font-extrabold text-xs text-amber-950 uppercase tracking-widest font-['Outfit',sans-serif]">
          SIDEBAR (Sol Bilgi & Kontrol)
        </span>
      </div>

      {/* Game Specific Controls Card */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Gamepad2 className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Oyun Kontrolleri</h3>
        </div>

        {activeGame === 'geometry-dash' && (
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Zıplama:</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-[11px] text-slate-800">
                Boşluk / Tıkla
              </kbd>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Yeniden Başlat:</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-[11px] text-slate-800">
                R Tuşu
              </kbd>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Pratik Noktası:</span>
              <kbd className="px-2 py-1 bg-white border border-slate-300 rounded shadow-xs font-mono font-bold text-[11px] text-slate-800">
                Z (Koy) / X (Sil)
              </kbd>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * Sarı zıplama orblarına havada yaklaşırken tıklayarak çift zıpla!
            </p>
          </div>
        )}

        {activeGame === 'fifa-soccer' && (
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">1. Hedef Belirle:</span>
              <span className="font-bold text-slate-800 text-[11px]">Kaleye Tıkla</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">2. Gücü Durdur:</span>
              <span className="font-bold text-slate-800 text-[11px]">Yeşil Alanda Tıkla</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">3. Falso Tekniği:</span>
              <span className="font-bold text-slate-800 text-[11px]">Alt Menüden Seç</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * 90 köşelere atılan falsolu sert şutları kaleciler kurtaramaz!
            </p>
          </div>
        )}

        {activeGame === 'tower-royale' && (
          <div className="space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Kart Seç:</span>
              <span className="font-bold text-slate-800 text-[11px]">Desteden Kart Tıkla</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Sahaya Bırak:</span>
              <span className="font-bold text-slate-800 text-[11px]">Kendi Alanına Tıkla</span>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
              <span className="font-medium text-slate-700">Ateş Topu Büyüsü:</span>
              <span className="font-bold text-slate-800 text-[11px]">Her Yere Atılabilir</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              * Son 60 saniyede iksir 2 kat hızlı dolar! Dev birikimi yapın.
            </p>
          </div>
        )}
      </div>

      {/* Live Statistics Card */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Zap className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Oyuncu İstatistikleri</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Neon Dash En İyi:</span>
            <span className="font-bold font-mono text-cyan-600">%{stats.geometryDash.bestPercentage || 0}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Dash Denemeleri:</span>
            <span className="font-bold font-mono text-slate-800">{stats.geometryDash.totalAttempts}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">FIFA Atılan Goller:</span>
            <span className="font-bold font-mono text-emerald-600">{stats.fifa.goalsScored}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">FIFA Kupaları:</span>
            <span className="font-bold font-mono text-amber-600">{stats.fifa.cupsWon}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-50">
            <span className="text-slate-500">Royale Yıkılan Kule:</span>
            <span className="font-bold font-mono text-rose-600">{stats.towerRoyale.towersDestroyed}</span>
          </div>
        </div>
      </div>

      {/* Audio & Settings Card */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Sliders className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Ses & Ayarlar</h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span className="flex items-center gap-1">
                <Volume2 className="w-3.5 h-3.5" /> Ses Düzeyi:
              </span>
              <span className="font-mono font-bold">%{Math.round(volume * 100)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                onVolumeChange(val);
                soundEngine.setVolume(val);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="p-2.5 bg-amber-50/70 rounded-lg border border-amber-200/60 text-[11px] text-amber-900 leading-relaxed">
            🎵 Gerçek zamanlı Web Audio sentez motoru ile gecikmesiz ses efektleri!
          </div>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Award className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Rozet Koleksiyonu</h3>
        </div>

        <div className="space-y-2">
          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${stats.geometryDash.bestPercentage >= 50 ? 'bg-cyan-50 border-cyan-200 text-cyan-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-cyan-500" />
            <div>
              <div className="font-bold">Neon Çırağı</div>
              <div className="text-[10px]">Neon Dash'te %50'ye ulaş</div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${stats.fifa.goalsScored >= 3 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <div>
              <div className="font-bold">Hat-Trick Ustası</div>
              <div className="text-[10px]">FIFA'da 3 gol kaydet</div>
            </div>
          </div>

          <div className={`flex items-center gap-2 p-2 rounded-lg border text-xs ${stats.towerRoyale.towersDestroyed >= 1 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
            <CheckCircle2 className="w-4 h-4 shrink-0 text-amber-500" />
            <div>
              <div className="font-bold">Kule Fatihi</div>
              <div className="text-[10px]">Tower Royale'de 1 kule yık</div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
