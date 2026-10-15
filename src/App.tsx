import { useState, useEffect } from 'react';
import { GameId, PlayerStats, DailyQuest } from './types/game';
import { Header } from './components/Header';
import { MenuBar } from './components/MenuBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { Footer } from './components/Footer';
import { HelpModal } from './components/HelpModal';
import { GeometryDashGame } from './games/GeometryDash/GeometryDashGame';
import { FifaSoccerGame } from './games/FifaSoccer/FifaSoccerGame';
import { TowerRoyaleGame } from './games/TowerRoyale/TowerRoyaleGame';
import { soundEngine } from './utils/soundEngine';

export default function App() {
  const [activeGame, setActiveGame] = useState<GameId>('geometry-dash');
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundEngine.getMuted());
  const [volume, setVolume] = useState<number>(() => soundEngine.getVolume());

  // Player Global Stats
  const [stats, setStats] = useState<PlayerStats>(() => {
    const saved = localStorage.getItem('arcade_player_stats');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return {
      geometryDash: {
        bestPercentage: Number(localStorage.getItem('gd_best_pct') || 0),
        totalAttempts: Number(localStorage.getItem('gd_attempts') || 0),
        jumps: 0,
        completed: false,
      },
      fifa: {
        cupsWon: 0,
        goalsScored: 0,
        matchesPlayed: 0,
        penaltiesSaved: 0,
      },
      towerRoyale: {
        trophies: 100,
        battlesWon: 0,
        crownsWon: 0,
        towersDestroyed: 0,
      },
      totalPoints: 1200,
      level: 1,
      levelXp: 120,
    };
  });

  // Daily Quests
  const [quests, setQuests] = useState<DailyQuest[]>([
    {
      id: 'q1',
      gameId: 'geometry-dash',
      title: 'Neon Dash: %40 İlerleme Kaydet',
      rewardPoints: 300,
      current: 0,
      target: 40,
      completed: false,
      claimed: false,
    },
    {
      id: 'q2',
      gameId: 'fifa-soccer',
      title: 'FIFA: 2 Gol At',
      rewardPoints: 400,
      current: 0,
      target: 2,
      completed: false,
      claimed: false,
    },
    {
      id: 'q3',
      gameId: 'tower-royale',
      title: 'Tower Royale: 1 Kule Yık',
      rewardPoints: 500,
      current: 0,
      target: 1,
      completed: false,
      claimed: false,
    },
  ]);

  // Persist stats
  useEffect(() => {
    localStorage.setItem('arcade_player_stats', JSON.stringify(stats));
  }, [stats]);

  // Score Awarding & Leveling
  const addPoints = (pts: number) => {
    setStats((prev) => {
      const newTotal = prev.totalPoints + pts;
      const newXp = prev.levelXp + pts;
      const newLevel = 1 + Math.floor(newXp / 1000);
      return {
        ...prev,
        totalPoints: newTotal,
        level: newLevel,
        levelXp: newXp,
      };
    });
  };

  // Event Handlers for Games
  const handleGdScore = (points: number, percentage: number) => {
    addPoints(points);
    setStats((prev) => ({
      ...prev,
      geometryDash: {
        ...prev.geometryDash,
        bestPercentage: Math.max(prev.geometryDash.bestPercentage, percentage),
      },
    }));

    // Update GD quest
    setQuests((prev) =>
      prev.map((q) =>
        q.id === 'q1' && percentage >= q.target ? { ...q, current: percentage, completed: true } : q
      )
    );
  };

  const handleGdAttempt = () => {
    setStats((prev) => ({
      ...prev,
      geometryDash: {
        ...prev.geometryDash,
        totalAttempts: prev.geometryDash.totalAttempts + 1,
      },
    }));
  };

  const handleFifaGoal = () => {
    setStats((prev) => ({
      ...prev,
      fifa: {
        ...prev.fifa,
        goalsScored: prev.fifa.goalsScored + 1,
      },
    }));

    // Update FIFA quest
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'q2') {
          const updated = q.current + 1;
          return {
            ...q,
            current: updated,
            completed: updated >= q.target,
          };
        }
        return q;
      })
    );
  };

  const handleTowersDestroyed = (count: number) => {
    setStats((prev) => ({
      ...prev,
      towerRoyale: {
        ...prev.towerRoyale,
        towersDestroyed: prev.towerRoyale.towersDestroyed + count,
      },
    }));

    // Update Royale quest
    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === 'q3') {
          const updated = q.current + count;
          return {
            ...q,
            current: updated,
            completed: updated >= q.target,
          };
        }
        return q;
      })
    );
  };

  const handleClaimQuest = (questId: string) => {
    const q = quests.find((item) => item.id === questId);
    if (!q || !q.completed || q.claimed) return;

    soundEngine.playFanfare();
    addPoints(q.rewardPoints);
    setQuests((prev) =>
      prev.map((item) => (item.id === questId ? { ...item, claimed: true } : item))
    );
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-amber-50/50 text-slate-800">
      {/* 1. HEADER (BAŞLIK) Alanı -Üst bilgi bölümü- */}
      <Header
        totalPoints={stats.totalPoints}
        level={stats.level}
        onOpenHelp={() => setIsHelpOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* 2. Menü Alanı */}
      <MenuBar activeGame={activeGame} onSelectGame={setActiveGame} />

      {/* 3. Main Tri-Column Portal Arena */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Left: SIDEBAR */}
          <LeftSidebar
            activeGame={activeGame}
            stats={stats}
            volume={volume}
            onVolumeChange={setVolume}
          />

          {/* Center: CONTENT (Sayfa içeriğinin yer aldığı alan) */}
          <section className="flex-1 w-full flex flex-col items-center">
            {/* Content Header Banner matching diagram */}
            <div className="w-full bg-amber-400 border-2 border-amber-500 rounded-xl px-4 py-2.5 mb-4 text-center shadow-xs">
              <span className="font-extrabold text-xs text-amber-950 uppercase tracking-widest font-['Outfit',sans-serif]">
                CONTENT (Sayfa içeriğinin yer aldığı alan)
              </span>
              <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase font-['Outfit',sans-serif]">
                {activeGame === 'geometry-dash' && '1. NEON DASH: GEOMETRİ DASH OYUN ARENASI'}
                {activeGame === 'fifa-soccer' && '2. MINİ FIFA: ŞAMPİYONLAR KUPASI SERBEST VURUŞ & PENALTI'}
                {activeGame === 'tower-royale' && '3. TOWER ROYALE: CLASH ROYALE KULE SAVAŞI'}
              </h2>
            </div>

            {/* Active Game Stage Viewport */}
            <div className="w-full flex justify-center">
              {activeGame === 'geometry-dash' && (
                <GeometryDashGame
                  onScoreUpdate={handleGdScore}
                  onAttempt={handleGdAttempt}
                />
              )}

              {activeGame === 'fifa-soccer' && (
                <FifaSoccerGame
                  onScoreUpdate={addPoints}
                  onGoalScored={handleFifaGoal}
                />
              )}

              {activeGame === 'tower-royale' && (
                <TowerRoyaleGame
                  onScoreUpdate={addPoints}
                  onTowersDestroyed={handleTowersDestroyed}
                />
              )}
            </div>
          </section>

          {/* Right: SİDEBAR (Reklam) */}
          <RightSidebar
            quests={quests}
            onClaimQuest={handleClaimQuest}
            onSpinReward={addPoints}
          />
        </div>
      </main>

      {/* 4. FOOTER (Alt bilgi bölümü) */}
      <Footer />

      {/* Help & Rules Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
