import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Target, Shield, Flame, Activity } from 'lucide-react';

interface FifaSoccerGameProps {
  onScoreUpdate: (points: number) => void;
  onGoalScored: () => void;
}

interface Team {
  id: string;
  name: string;
  flag: string;
  color: string;
  kitColor: string;
}

const TEAMS: Team[] = [
  { id: 'turkey', name: 'Türkiye', flag: '🇹🇷', color: '#E11D48', kitColor: '#E11D48' },
  { id: 'real', name: 'Real Madrid', flag: '👑', color: '#64748B', kitColor: '#F8FAFC' },
  { id: 'city', name: 'Man. City', flag: '🔵', color: '#0EA5E9', kitColor: '#38BDF8' },
  { id: 'barca', name: 'Barcelona', flag: '🔴🔵', color: '#1E3A8A', kitColor: '#DC2626' },
  { id: 'bayern', name: 'Bayern Münih', flag: '🔴', color: '#DC2626', kitColor: '#B91C1C' },
];

export const FifaSoccerGame: React.FC<FifaSoccerGameProps> = ({ onScoreUpdate, onGoalScored }) => {
  const [selectedTeam, setSelectedTeam] = useState<Team>(TEAMS[0]);
  const [opponentTeam, setOpponentTeam] = useState<Team>(TEAMS[1]);
  const [gameStage, setGameStage] = useState<'AIMING' | 'POWER_LOCK' | 'IN_FLIGHT' | 'RESULT' | 'MATCH_OVER'>('AIMING');

  // Shot parameters
  const [targetPos, setTargetPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 }); // percentage of goal (0-100)
  const [power, setPower] = useState<number>(50);
  const [isPowerRising, setIsPowerRising] = useState<boolean>(true);
  const [curve, setCurve] = useState<'straight' | 'left' | 'right'>('straight');

  // Match State
  const [currentRound, setCurrentRound] = useState<number>(1);
  const maxRounds = 5;
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [opponentScore, setOpponentScore] = useState<number>(0);
  const [roundHistory, setRoundHistory] = useState<('GOAL' | 'MISS' | 'SAVE')[]>([]);
  const [commentary, setCommentary] = useState<string>('Vuruş açını seç, gücünü ayarla ve şutunu çek!');

  // Animation values
  const [ballPos, setBallPos] = useState<{ x: number; y: number; scale: number }>({ x: 50, y: 88, scale: 1 });
  const [keeperPos, setKeeperPos] = useState<{ x: number; y: number; diveAngle: number }>({ x: 50, y: 48, diveAngle: 0 });
  const [netRipple, setNetRipple] = useState<boolean>(false);

  const powerIntervalRef = useRef<number | null>(null);

  // Power meter oscillation loop
  useEffect(() => {
    if (gameStage === 'POWER_LOCK') {
      powerIntervalRef.current = window.setInterval(() => {
        setPower((prev) => {
          if (prev >= 98) {
            setIsPowerRising(false);
            return 97;
          }
          if (prev <= 15) {
            setIsPowerRising(true);
            return 16;
          }
          return isPowerRising ? prev + 3.5 : prev - 3.5;
        });
      }, 30);
    } else {
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current);
        powerIntervalRef.current = null;
      }
    }

    return () => {
      if (powerIntervalRef.current) {
        clearInterval(powerIntervalRef.current);
      }
    };
  }, [gameStage, isPowerRising]);

  // Goalkeeper dive logic & ball flight simulation
  const executeShot = useCallback((lockedPower: number) => {
    setGameStage('IN_FLIGHT');
    soundEngine.playKick();

    // AI Goalkeeper dive decision
    // AI has 45% chance to guess correct side (left, center, right)
    const sides = ['left', 'center', 'right'];
    const aiChoice = sides[Math.floor(Math.random() * sides.length)];

    let keeperTargetX = 50;
    let keeperTargetY = 48;
    let diveAngle = 0;

    if (aiChoice === 'left') {
      keeperTargetX = 28;
      keeperTargetY = 44;
      diveAngle = -35;
    } else if (aiChoice === 'right') {
      keeperTargetX = 72;
      keeperTargetY = 44;
      diveAngle = 35;
    }

    setKeeperPos({ x: keeperTargetX, y: keeperTargetY, diveAngle });

    // Calculate ball end position based on target and power
    let finalBallX = targetPos.x;
    let finalBallY = targetPos.y;

    // Curve effect
    if (curve === 'left') finalBallX -= 8;
    if (curve === 'right') finalBallX += 8;

    // Power variance (if overpower > 88, ball flies over bar!)
    const isOverpower = lockedPower > 88;
    if (isOverpower) {
      finalBallY = Math.max(5, finalBallY - 22);
    }

    // Animate ball movement
    const startTime = performance.now();
    const flightDuration = 700; // ms

    const animateFlight = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / flightDuration);

      // Parabolic flight
      const currentX = 50 + (finalBallX - 50) * progress;
      const currentY = 88 + (finalBallY - 88) * progress;
      const scale = 1 - 0.55 * progress;

      setBallPos({ x: currentX, y: currentY, scale });

      if (progress < 1) {
        requestAnimationFrame(animateFlight);
      } else {
        // Result calculation
        determineShotOutcome(finalBallX, finalBallY, isOverpower, keeperTargetX, keeperTargetY);
      }
    };

    requestAnimationFrame(animateFlight);
  }, [targetPos, curve]);

  const determineShotOutcome = (
    ballX: number,
    ballY: number,
    isOverpower: boolean,
    keeperX: number,
    keeperY: number
  ) => {
    // Goal bounds on screen: X between 18% and 82%, Y between 18% and 62%
    const isInsideGoal = ballX >= 20 && ballX <= 80 && ballY >= 20 && ballY <= 60;
    const isPostHit =
      (Math.abs(ballX - 20) < 3.5 || Math.abs(ballX - 80) < 3.5) && ballY >= 18 && ballY <= 62;
    const isCrossbar = Math.abs(ballY - 20) < 4 && ballX >= 20 && ballX <= 80;

    // Keeper distance check
    const distToKeeper = Math.hypot(ballX - keeperX, ballY - keeperY);
    const isSaved = isInsideGoal && distToKeeper < 15;

    let result: 'GOAL' | 'MISS' | 'SAVE' = 'MISS';
    let commentaryMsg = '';

    if (isSaved) {
      result = 'SAVE';
      soundEngine.playSave();
      commentaryMsg = '🧤 MÜTHİŞ BİR REFLEKS! Kaleci topu kornere çeliyor!';
    } else if (isPostHit || isCrossbar) {
      result = 'MISS';
      soundEngine.playPostHit();
      commentaryMsg = '💥 DİREKTEN DÖNDÜ! İnanılmaz bir şut ama direkte patladı!';
    } else if (isInsideGoal && !isOverpower) {
      result = 'GOAL';
      soundEngine.playGoal();
      soundEngine.playWhistle();
      setNetRipple(true);
      setTimeout(() => setNetRipple(false), 900);
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
      onGoalScored();
      onScoreUpdate(150);
      setPlayerScore((prev) => prev + 1);

      if (ballX < 30 && ballY < 30) {
        commentaryMsg = '⚽ 90 DİYE BUNA DERLER! Sol örümcek ağları temizlendi!';
      } else if (ballX > 70 && ballY < 30) {
        commentaryMsg = '⚽ BİNGO! Sağ üst 90\'a füze gibi gitti!';
      } else {
        commentaryMsg = '⚽ GOOOOL! Harika bir vuruş ve top ağlarla buluşuyor!';
      }
    } else {
      result = 'MISS';
      soundEngine.playWhistle();
      commentaryMsg = isOverpower
        ? '🚀 ÇOK HIZLI! Top tribünlere gitti!'
        : '❌ AUT! Top kale direğinin yanından dışarı çıktı.';
    }

    setRoundHistory((prev) => [...prev, result]);
    setCommentary(commentaryMsg);

    // Opponent takes simulated turn
    const opponentScored = Math.random() > 0.45;
    if (opponentScored) {
      setOpponentScore((prev) => prev + 1);
    }

    setGameStage('RESULT');
  };

  const nextRound = () => {
    if (currentRound >= maxRounds) {
      setGameStage('MATCH_OVER');
      if (playerScore >= opponentScore) {
        soundEngine.playFanfare();
        confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });
        onScoreUpdate(500);
      }
    } else {
      setCurrentRound((prev) => prev + 1);
      resetTurn();
    }
  };

  const resetTurn = () => {
    setBallPos({ x: 50, y: 88, scale: 1 });
    setKeeperPos({ x: 50, y: 48, diveAngle: 0 });
    setGameStage('AIMING');
    setCommentary('Sıradaki penaltı için hedefi seç ve tıkla!');
  };

  const restartMatch = () => {
    setCurrentRound(1);
    setPlayerScore(0);
    setOpponentScore(0);
    setRoundHistory([]);
    resetTurn();
  };

  const handlePitchClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameStage === 'AIMING') {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 100;
      const clickY = ((e.clientY - rect.top) / rect.height) * 100;

      // Keep aim within or near the goal area (goal is around 20-80% X, 20-60% Y)
      const clampedX = Math.max(15, Math.min(85, clickX));
      const clampedY = Math.max(15, Math.min(65, clickY));

      setTargetPos({ x: clampedX, y: clampedY });
      setGameStage('POWER_LOCK');
      setCommentary('Güç çubuğunu yeşil bölgede durdurmak için tıkla!');
    } else if (gameStage === 'POWER_LOCK') {
      executeShot(power);
    }
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Top Match Bar */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-white rounded-t-xl text-xs font-mono">
        {/* Teams and Scoreboard */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span>{selectedTeam.flag}</span>
            <span className="text-amber-400">{selectedTeam.name}</span>
          </div>
          <div className="px-2.5 py-0.5 bg-slate-800 rounded font-bold text-sm tracking-widest text-white">
            {playerScore} - {opponentScore}
          </div>
          <div className="flex items-center gap-1.5 font-bold text-slate-400">
            <span>{opponentTeam.name}</span>
            <span>{opponentTeam.flag}</span>
          </div>
        </div>

        {/* Round Ticker */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Tur: {currentRound}/{maxRounds}</span>
          <div className="flex gap-1 ml-2">
            {[...Array(maxRounds)].map((_, i) => {
              const res = roundHistory[i];
              return (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border border-slate-700 flex items-center justify-center text-[8px] font-bold ${
                    res === 'GOAL'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : res === 'SAVE' || res === 'MISS'
                      ? 'bg-rose-500 text-white border-rose-400'
                      : i === currentRound - 1
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-slate-800'
                  }`}
                >
                  {res === 'GOAL' ? '✓' : res ? '✕' : ''}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Selection Ribbon */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-1.5 bg-slate-800/90 text-xs border-b border-slate-700">
        <span className="text-slate-300 font-medium">Takımını Seç:</span>
        <div className="flex gap-2">
          {TEAMS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setSelectedTeam(t);
                const otherTeams = TEAMS.filter((x) => x.id !== t.id);
                setOpponentTeam(otherTeams[Math.floor(Math.random() * otherTeams.length)]);
              }}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all flex items-center gap-1 ${
                selectedTeam.id === t.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                  : 'bg-slate-700/60 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span>{t.flag}</span>
              <span>{t.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stadium Pitch Canvas / Arena */}
      <div
        onClick={handlePitchClick}
        className="relative w-full max-w-[800px] aspect-[800/440] bg-gradient-to-b from-sky-900 via-emerald-800 to-emerald-950 overflow-hidden cursor-crosshair shadow-2xl"
      >
        {/* Stadium Stands & Floodlights */}
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-slate-950 via-slate-900 to-emerald-900/60 flex items-center justify-between px-6 opacity-90">
          {/* Floodlights left */}
          <div className="flex gap-1.5 opacity-70">
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
          </div>
          {/* Stadium Crowd Texture */}
          <div className="text-[11px] text-slate-400/80 font-mono tracking-widest uppercase">
            🏆 UEFA ARCADE ŞAMPİYONLAR KUPASI
          </div>
          {/* Floodlights right */}
          <div className="flex gap-1.5 opacity-70">
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
            <div className="w-3 h-8 bg-amber-100 rounded-sm shadow-[0_0_12px_#FEF08A]" />
          </div>
        </div>

        {/* Pitch Turf & Field Lines */}
        <div className="absolute inset-0 top-24 bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-900">
          {/* Grass stripes */}
          <div className="w-full h-full opacity-15 bg-[repeating-linear-gradient(0deg,#000_0px,#000_20px,transparent_20px,transparent_40px)]" />
          {/* Penalty box lines */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[72%] h-64 border-2 border-white/50" />
          {/* 6-yard box */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[44%] h-24 border-2 border-white/60" />
          {/* Penalty Spot */}
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-md" />
        </div>

        {/* 3D Soccer Goal Post */}
        <div
          className={`absolute top-10 left-1/2 -translate-x-1/2 w-[60%] h-44 border-t-8 border-x-8 border-white shadow-2xl transition-transform ${
            netRipple ? 'scale-[1.01]' : ''
          }`}
        >
          {/* Goal Net Mesh Grid */}
          <div
            className={`w-full h-full bg-[linear-gradient(to_right,rgba(255,255,255,0.25)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.25)_1px,transparent_1px)] bg-[size:16px_16px] transition-all duration-300 ${
              netRipple ? 'brightness-150 animate-pulse' : ''
            }`}
          />
        </div>

        {/* Goalkeeper */}
        <div
          className="absolute z-10 transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${keeperPos.x}%`,
            top: `${keeperPos.y}%`,
            transform: `translate(-50%, -50%) rotate(${keeperPos.diveAngle}deg)`,
          }}
        >
          {/* Goalkeeper Body */}
          <div className="flex flex-col items-center">
            {/* GK Head & Gloves */}
            <div className="w-6 h-6 rounded-full bg-amber-200 border-2 border-slate-900 shadow-sm relative">
              {/* Cap */}
              <div className="absolute -top-1 inset-x-0 h-2 bg-yellow-400 rounded-t" />
            </div>
            {/* Jersey */}
            <div className="w-10 h-12 bg-yellow-400 border border-slate-900 rounded-t-lg flex items-center justify-center font-bold text-[10px] text-slate-900 shadow">
              1
            </div>
            {/* Shorts */}
            <div className="w-8 h-6 bg-slate-900 rounded-b" />
            {/* Gloves */}
            <div className="absolute -left-3 top-7 w-4 h-4 bg-orange-500 rounded-full border border-slate-900" />
            <div className="absolute -right-3 top-7 w-4 h-4 bg-orange-500 rounded-full border border-slate-900" />
          </div>
        </div>

        {/* Aim Reticle */}
        {gameStage === 'AIMING' && (
          <div
            className="absolute z-20 pointer-events-none transition-all duration-75 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${targetPos.x}%`, top: `${targetPos.y}%` }}
          >
            <div className="w-10 h-10 border-2 border-dashed border-amber-400 rounded-full animate-spin flex items-center justify-center shadow-[0_0_15px_#FBBF24]">
              <Target className="w-4 h-4 text-amber-400" />
            </div>
          </div>
        )}

        {/* Ball Shadow & Soccer Ball */}
        <div
          className="absolute z-20 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all"
          style={{
            left: `${ballPos.x}%`,
            top: `${ballPos.y}%`,
            transform: `translate(-50%, -50%) scale(${ballPos.scale})`,
          }}
        >
          {/* Soccer Ball with classic hexagonal markings */}
          <div className="relative w-12 h-12 bg-white rounded-full shadow-2xl border-2 border-slate-800 flex items-center justify-center">
            {/* Center Pentagon */}
            <div className="w-4 h-4 bg-slate-900 rotate-45 rounded-xs" />
            <div className="absolute top-1 left-2 w-2 h-2 bg-slate-900 rounded-full" />
            <div className="absolute bottom-1 right-2 w-2 h-2 bg-slate-900 rounded-full" />
            <div className="absolute top-2 right-1.5 w-2 h-2 bg-slate-900 rounded-full" />
          </div>
        </div>

        {/* In-Game Power Meter Overlay */}
        {gameStage === 'POWER_LOCK' && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center bg-slate-950/85 backdrop-blur-xs px-5 py-3 rounded-xl border border-slate-700 shadow-2xl">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" /> Şut Gücü (Durdurmak için Tıkla)
            </span>
            <div className="w-64 h-5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-600 relative">
              {/* Sweet spot indicator (65-80%) */}
              <div className="absolute left-[65%] w-[18%] top-0 bottom-0 bg-emerald-500/40 border-x border-emerald-400 z-10" />
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 via-amber-400 to-rose-500 transition-all duration-30"
                style={{ width: `${power}%` }}
              />
            </div>
            <div className="flex justify-between w-64 text-[10px] text-slate-400 mt-1">
              <span>Zayıf</span>
              <span className="text-emerald-400 font-bold">Mükemmel Alan</span>
              <span className="text-rose-400">Direk Üstü</span>
            </div>
          </div>
        )}

        {/* Commentary & Next Button Strip */}
        <div className="absolute bottom-2 inset-x-4 flex items-center justify-between pointer-events-none z-20">
          <div className="bg-slate-950/90 backdrop-blur-xs px-4 py-2 rounded-lg border border-slate-800 text-xs text-white font-medium shadow-lg max-w-[70%]">
            {commentary}
          </div>

          {gameStage === 'RESULT' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextRound();
              }}
              className="pointer-events-auto px-5 py-2.5 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-xl uppercase tracking-wider transition-all hover:scale-105"
            >
              {currentRound >= maxRounds ? 'Maç Sonucu' : 'Sonraki Vuruş →'}
            </button>
          )}
        </div>

        {/* Match Over Modal */}
        {gameStage === 'MATCH_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-white p-6 animate-fade-in">
            {playerScore > opponentScore ? (
              <>
                <Trophy className="w-16 h-16 text-amber-400 mb-2 animate-bounce" />
                <h3 className="text-3xl font-extrabold text-amber-300 mb-1">ŞAMPİYON SUNUZ!</h3>
                <p className="text-emerald-400 text-sm font-semibold mb-2">
                  {selectedTeam.name} Kupayı Kaldırdı! ({playerScore} - {opponentScore})
                </p>
                <p className="text-slate-400 text-xs mb-6">+500 Kupa Puanı Kazandın!</p>
              </>
            ) : playerScore === opponentScore ? (
              <>
                <Activity className="w-14 h-14 text-cyan-400 mb-2" />
                <h3 className="text-3xl font-extrabold text-white mb-1">BERABERLİK!</h3>
                <p className="text-slate-300 text-sm mb-6">Müthiş çekişmeli bir seri penaltı maçı oldu!</p>
              </>
            ) : (
              <>
                <Shield className="w-14 h-14 text-rose-500 mb-2" />
                <h3 className="text-3xl font-extrabold text-rose-400 mb-1">MAĞLUBİYET</h3>
                <p className="text-slate-300 text-sm mb-6">
                  {opponentTeam.name} seriyi kazandı ({opponentScore} - {playerScore}). Tekrar dene!
                </p>
              </>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                restartMatch();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-lg shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              Yeni Maç Başlat
            </button>
          </div>
        )}
      </div>

      {/* Curve and Tactics Controls Bottom Strip */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2 bg-slate-900 border-t border-slate-800 text-xs text-white rounded-b-xl">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Falso & Vuruş Tekniği:</span>
          {(['straight', 'left', 'right'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setCurve(mode)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                curve === mode ? 'bg-cyan-600 text-white font-bold' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mode === 'straight' ? 'Düz Füze' : mode === 'left' ? 'Sol Falso ↪' : 'Sağ Falso ↩'}
            </button>
          ))}
        </div>

        <button
          onClick={restartMatch}
          className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Maçı Sıfırla
        </button>
      </div>
    </div>
  );
};
