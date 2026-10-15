import React from 'react';
import { X, Sparkles, Trophy, Crown, Check } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-amber-300 shadow-2xl overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-amber-400 px-6 py-4 flex items-center justify-between border-b-2 border-amber-500">
          <h2 className="text-lg font-black text-slate-950 font-['Outfit',sans-serif] uppercase">
            3 Oyun Rehberi & Nasıl Oynanır?
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-slate-700">
          {/* Game 1: Geometry Dash */}
          <div className="p-3.5 bg-cyan-50 rounded-xl border border-cyan-200">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-cyan-950">
              <Sparkles className="w-4 h-4 text-cyan-600" />
              <span>1. Neon Dash (Geometri Dash Tarzı)</span>
            </div>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Zıplamak için <strong>Boşluk</strong> veya fareye tıkla. Sarı orbların yanından geçerken tıklayarak havada çift zıplayabilirsin. Pembe/Mavi yerçekimi portallarından geçerek tavana tırman!
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li><strong>Pratik Modu (Z/X):</strong> Z ile kontrol noktası bırak, X ile sil.</li>
              <li><strong>R Tuşu:</strong> Kazadan sonra hemen tekrar dene.</li>
            </ul>
          </div>

          {/* Game 2: FIFA */}
          <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-emerald-950">
              <Trophy className="w-4 h-4 text-emerald-600" />
              <span>2. Mini FIFA Cup (Penaltı & Frikik)</span>
            </div>
            <p className="text-slate-600 mb-2 leading-relaxed">
              Kaleye tıklayarak şutun gideceği noktayı seç. Ardından güç göstergesi açıldığında yeşil alanda tıklayarak roketi ateşle! Falso tercihi ile kalecileri ters köşeye yatır.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li>5 penaltı turunda rakip takımı mağlup ederek kupayı kaldır!</li>
              <li>Direk vuruşları ve 90 köşelere özel spiker tepkileri mevcuttur.</li>
            </ul>
          </div>

          {/* Game 3: Clash Royale */}
          <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-sm text-amber-950">
              <Crown className="w-4 h-4 text-amber-600" />
              <span>3. Tower Royale (Clash Royale Tarzı)</span>
            </div>
            <p className="text-slate-600 mb-2 leading-relaxed">
              İksirin 10'a kadar dolar. Alt kısımdaki desteden Şövalye, Okçular, Dev, İskeletler veya Yavru Ejderha kartını seç ve kendi alanına bırak.
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-700">
              <li><strong>Ateş Topu:</strong> Sahada düşman kuleleri ve birliklerin üzerine doğrudan fırlatılabilir.</li>
              <li><strong>Son 60 Saniye:</strong> İksir dolumu 2 katına çıkar!</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-xs"
          >
            <Check className="w-4 h-4 text-amber-400" />
            Anladım, Oyuna Dön
          </button>
        </div>
      </div>
    </div>
  );
};
