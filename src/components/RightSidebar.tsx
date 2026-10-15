import React, { useState } from 'react';
import { Trophy, Gift, Check, Flame, ExternalLink } from 'lucide-react';
import { DailyQuest } from '../types/game';
import confetti from 'canvas-confetti';
import { soundEngine } from '../utils/soundEngine';

interface RightSidebarProps {
  quests: DailyQuest[];
  onClaimQuest: (questId: string) => void;
  onSpinReward: (points: number) => void;
}

export const RightSidebar: React.FC<RightSidebarProps> = ({
  quests,
  onClaimQuest,
  onSpinReward,
}) => {
  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [hasSpunToday, setHasSpunToday] = useState<boolean>(false);

  const handleSpin = () => {
    if (isSpinning || hasSpunToday) return;

    setIsSpinning(true);
    soundEngine.playPadBounce();

    setTimeout(() => {
      const rewards = [100, 250, 500, 1000];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      setSpinResult(win);
      setIsSpinning(false);
      setHasSpunToday(true);
      soundEngine.playFanfare();
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
      onSpinReward(win);
    }, 1800);
  };

  return (
    <aside className="w-full lg:w-72 shrink-0 flex flex-col gap-4">
      {/* Sidebar Label matching the diagram */}
      <div className="bg-amber-400 border-2 border-amber-500 rounded-xl px-4 py-2 text-center shadow-xs">
        <span className="font-extrabold text-xs text-amber-950 uppercase tracking-widest font-['Outfit',sans-serif]">
          SİDEBAR (Reklam & Turnuva)
        </span>
      </div>

      {/* Lucky Spin / Daily Wheel Box */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5">
            <Gift className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-slate-900">Günlük Şans Çarkı</h3>
          </div>
          <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
            Ücretsiz
          </span>
        </div>

        <div className="text-center py-2">
          <div
            className={`w-20 h-20 mx-auto rounded-full border-4 border-amber-400 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg mb-3 ${
              isSpinning ? 'animate-spin' : ''
            }`}
          >
            {isSpinning ? '🎲' : spinResult ? `+${spinResult}` : '🎁'}
          </div>

          {spinResult ? (
            <p className="text-xs font-bold text-emerald-600 mb-2">
              🎉 Tebrikler! {spinResult} Bonus Puan Kazandın!
            </p>
          ) : (
            <p className="text-xs text-slate-600 mb-3">
              Çarkı çevirerek 1000'e kadar bonus arcade puanı kazan!
            </p>
          )}

          <button
            onClick={handleSpin}
            disabled={isSpinning || hasSpunToday}
            className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
              hasSpunToday
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 hover:scale-[1.02]'
            }`}
          >
            {hasSpunToday ? 'Yarın Tekrar Çevir' : isSpinning ? 'Çevriliyor...' : 'Şansını Dene!'}
          </button>
        </div>
      </div>

      {/* Tournament Leaderboard */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-100">
          <Trophy className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Günün Turnuva Tablosu</h3>
        </div>

        <div className="relative rounded-lg overflow-hidden mb-3 aspect-[4/2] bg-slate-900">
          <img
            src="/src/assets/images/championship_trophy_1792048750750.jpg"
            alt="Şampiyona Kupası"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex items-end p-2.5">
            <span className="text-[11px] font-bold text-amber-300">
              Arcade Haftalık Büyük Kupa
            </span>
          </div>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between p-1.5 rounded bg-amber-50 font-semibold text-amber-950 border border-amber-200/60">
            <div className="flex items-center gap-1.5">
              <span>🥇</span>
              <span>Kadir_Pro99</span>
            </div>
            <span className="font-mono text-amber-700">14,250 P</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>🥈</span>
              <span>ErenGamer</span>
            </div>
            <span className="font-mono text-slate-600">11,800 P</span>
          </div>

          <div className="flex items-center justify-between p-1.5 rounded bg-slate-50 text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>🥉</span>
              <span>Zeynep_Dash</span>
            </div>
            <span className="font-mono text-slate-600">9,420 P</span>
          </div>
        </div>
      </div>

      {/* Daily Quests Box */}
      <div className="bg-white rounded-xl border border-amber-200/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
          <Flame className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-sm text-slate-900">Günlük Görevler</h3>
        </div>

        <div className="space-y-2.5">
          {quests.map((q) => (
            <div key={q.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-slate-800">{q.title}</span>
                <span className="text-amber-600 font-bold font-mono">+{q.rewardPoints}P</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-slate-500">
                  İlerleme: {q.current}/{q.target}
                </span>
                {q.claimed ? (
                  <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                    <Check className="w-3 h-3" /> Alındı
                  </span>
                ) : (
                  <button
                    disabled={!q.completed}
                    onClick={() => onClaimQuest(q.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                      q.completed
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs cursor-pointer'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Ödülü Al
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Styled Retro Game Sponsor / Reklam Card (Matching user diagram) */}
      <div className="bg-gradient-to-b from-indigo-950 to-slate-900 rounded-xl border-2 border-indigo-700/60 p-3 shadow-md text-white text-center">
        <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider mb-1.5 flex items-center justify-center gap-1">
          <ExternalLink className="w-3 h-3" /> Sponsor & Reklam Alanı
        </div>

        <div className="rounded-lg overflow-hidden border border-indigo-500/30 mb-2">
          <img
            src="/src/assets/images/retro_arcade_ad_1792048749772.jpg"
            alt="Retro Arcade Sponsor"
            referrerPolicy="no-referrer"
            className="w-full h-44 object-cover"
          />
        </div>

        <h4 className="font-extrabold text-xs text-amber-300 uppercase tracking-wide">
          ULTRA-GAUNTLET RETRO PRO
        </h4>
        <p className="text-[10px] text-slate-300 mt-1 mb-2">
          16-Bit mekanik arcade joystick & oyun kolu seti!
        </p>

        <button
          onClick={() => {
            soundEngine.playPadBounce();
            confetti({ particleCount: 40, spread: 45 });
          }}
          className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[11px] font-bold uppercase transition-colors"
        >
          İncele & İndirimi Yakala
        </button>
      </div>
    </aside>
  );
};
