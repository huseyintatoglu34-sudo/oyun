import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Crown, RotateCcw, Swords, ShieldAlert, Sparkles, Play } from 'lucide-react';

interface TowerRoyaleGameProps {
  onScoreUpdate: (points: number) => void;
  onTowersDestroyed: (count: number) => void;
}

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: 'troop' | 'swarm' | 'tank' | 'spell' | 'flying';
  icon: string;
  hp: number;
  damage: number;
  range: number; // in pixels
  speed: number;
  count: number;
  color: string;
}

interface Unit {
  id: string;
  cardId: string;
  team: 'player' | 'enemy';
  name: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  damage: number;
  range: number;
  speed: number;
  color: string;
  targetsOnlyBuildings: boolean;
  isFlying: boolean;
  lastAttackTime: number;
}

interface Tower {
  id: string;
  type: 'king' | 'princess_left' | 'princess_right';
  team: 'player' | 'enemy';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  range: number;
  isActive: boolean;
  lastShotTime: number;
}

interface Projectile {
  id: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
  color: string;
}

const CARDS_DECK: Card[] = [
  { id: 'knight', name: 'Şövalye', cost: 3, type: 'troop', icon: '⚔️', hp: 800, damage: 110, range: 25, speed: 1.1, count: 1, color: '#3B82F6' },
  { id: 'archers', name: 'Okçular', cost: 3, type: 'troop', icon: '🏹', hp: 320, damage: 65, range: 110, speed: 1.2, count: 2, color: '#EC4899' },
  { id: 'giant', name: 'Dev', cost: 5, type: 'tank', icon: '🗿', hp: 1900, damage: 160, range: 30, speed: 0.7, count: 1, color: '#F59E0B' },
  { id: 'skeletons', name: 'İskeletler', cost: 3, type: 'swarm', icon: '💀', hp: 120, damage: 45, range: 20, speed: 1.5, count: 6, color: '#E2E8F0' },
  { id: 'baby_dragon', name: 'Yavru Ejder', cost: 4, type: 'flying', icon: '🐲', hp: 750, damage: 95, range: 90, speed: 1.1, count: 1, color: '#10B981' },
  { id: 'fireball', name: 'Ateş Topu', cost: 4, type: 'spell', icon: '🔥', hp: 0, damage: 420, range: 70, speed: 0, count: 1, color: '#EF4444' },
];

const ARENA_WIDTH = 580;
const ARENA_HEIGHT = 580;

export const TowerRoyaleGame: React.FC<TowerRoyaleGameProps> = ({ onScoreUpdate, onTowersDestroyed }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAME_OVER'>('IDLE');
  const [matchTime, setMatchTime] = useState<number>(180); // 3 minutes
  const [playerElixir, setPlayerElixir] = useState<number>(5);
  const [enemyElixir, setEnemyElixir] = useState<number>(5);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  const [playerCrowns, setPlayerCrowns] = useState<number>(0);
  const [enemyCrowns, setEnemyCrowns] = useState<number>(0);

  // Dynamic game entities
  const [towers, setTowers] = useState<Tower[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);

  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'GAME_OVER',
    units: [] as Unit[],
    towers: [] as Tower[],
    projectiles: [] as Projectile[],
    playerElixir: 5,
    enemyElixir: 5,
    matchTime: 180,
    lastAiSpawn: 0,
  });

  const initTowers = (): Tower[] => [
    // Enemy towers (top)
    { id: 'enemy_king', type: 'king', team: 'enemy', x: 290, y: 70, hp: 2400, maxHp: 2400, range: 130, isActive: false, lastShotTime: 0 },
    { id: 'enemy_left', type: 'princess_left', team: 'enemy', x: 130, y: 140, hp: 1400, maxHp: 1400, range: 120, isActive: true, lastShotTime: 0 },
    { id: 'enemy_right', type: 'princess_right', team: 'enemy', x: 450, y: 140, hp: 1400, maxHp: 1400, range: 120, isActive: true, lastShotTime: 0 },
    // Player towers (bottom)
    { id: 'player_king', type: 'king', team: 'player', x: 290, y: 510, hp: 2400, maxHp: 2400, range: 130, isActive: false, lastShotTime: 0 },
    { id: 'player_left', type: 'princess_left', team: 'player', x: 130, y: 440, hp: 1400, maxHp: 1400, range: 120, isActive: true, lastShotTime: 0 },
    { id: 'player_right', type: 'princess_right', team: 'player', x: 450, y: 440, hp: 1400, maxHp: 1400, range: 120, isActive: true, lastShotTime: 0 },
  ];

  const startBattle = () => {
    const initT = initTowers();
    setTowers(initT);
    setUnits([]);
    setProjectiles([]);
    setPlayerElixir(5);
    setEnemyElixir(5);
    setMatchTime(180);
    setPlayerCrowns(0);
    setEnemyCrowns(0);
    setSelectedCard(null);

    const st = stateRef.current;
    st.gameState = 'PLAYING';
    st.towers = initT;
    st.units = [];
    st.projectiles = [];
    st.playerElixir = 5;
    st.enemyElixir = 5;
    st.matchTime = 180;
    st.lastAiSpawn = Date.now();

    setGameState('PLAYING');
    soundEngine.playCardDeploy();
  };

  // Elixir regeneration & match clock loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = window.setInterval(() => {
      const st = stateRef.current;
      st.matchTime -= 1;
      setMatchTime(st.matchTime);

      const is2xElixir = st.matchTime <= 60;
      const elixirInc = is2xElixir ? 0.6 : 0.35;

      st.playerElixir = Math.min(10, st.playerElixir + elixirInc);
      st.enemyElixir = Math.min(10, st.enemyElixir + elixirInc);
      setPlayerElixir(st.playerElixir);
      setEnemyElixir(st.enemyElixir);

      // Match time over check
      if (st.matchTime <= 0) {
        endBattle();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState]);

  const endBattle = useCallback(() => {
    stateRef.current.gameState = 'GAME_OVER';
    setGameState('GAME_OVER');

    // Count crowns based on destroyed towers
    const pTowers = stateRef.current.towers.filter((t) => t.team === 'player' && t.hp > 0).length;
    const eTowers = stateRef.current.towers.filter((t) => t.team === 'enemy' && t.hp > 0).length;

    const pCrowns = 3 - eTowers;
    const eCrowns = 3 - pTowers;
    setPlayerCrowns(pCrowns);
    setEnemyCrowns(eCrowns);

    if (pCrowns > eCrowns) {
      soundEngine.playFanfare();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      onScoreUpdate(600 + pCrowns * 100);
      onTowersDestroyed(pCrowns);
    }
  }, [onScoreUpdate, onTowersDestroyed]);

  // Main combat engine loop (every 50ms)
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = window.setInterval(() => {
      const st = stateRef.current;
      const now = Date.now();

      // 1. AI troop deployment
      if (now - st.lastAiSpawn > 4200 && st.enemyElixir >= 3) {
        const playableCards = CARDS_DECK.filter((c) => c.cost <= st.enemyElixir && c.id !== 'fireball');
        if (playableCards.length > 0) {
          const card = playableCards[Math.floor(Math.random() * playableCards.length)];
          st.enemyElixir -= card.cost;
          st.lastAiSpawn = now;

          // Choose spawn lane (left 150 or right 430)
          const laneX = Math.random() > 0.5 ? 160 : 420;
          const spawnY = 160;

          spawnUnits(card, 'enemy', laneX, spawnY);
        }
      }

      // 2. Units movement & attack
      for (let i = st.units.length - 1; i >= 0; i--) {
        const unit = st.units[i];
        if (unit.hp <= 0) {
          st.units.splice(i, 1);
          continue;
        }

        const enemyTeam = unit.team === 'player' ? 'enemy' : 'player';

        // Find nearest viable target
        // If targets only buildings, only look at towers
        let target: { x: number; y: number; hp: number; takeDamage: (dmg: number) => void } | null = null;
        let minDist = 99999;

        if (!unit.targetsOnlyBuildings) {
          // Check enemy units first
          for (const enemyUnit of st.units) {
            if (enemyUnit.team === enemyTeam && enemyUnit.hp > 0) {
              const d = Math.hypot(enemyUnit.x - unit.x, enemyUnit.y - unit.y);
              if (d < minDist) {
                minDist = d;
                target = {
                  x: enemyUnit.x,
                  y: enemyUnit.y,
                  hp: enemyUnit.hp,
                  takeDamage: (dmg) => {
                    enemyUnit.hp -= dmg;
                  },
                };
              }
            }
          }
        }

        // If no close unit target, target nearest alive tower
        const aliveTowers = st.towers.filter((t) => t.team === enemyTeam && t.hp > 0);
        for (const tower of aliveTowers) {
          const d = Math.hypot(tower.x - unit.x, tower.y - unit.y);
          if (d < minDist) {
            minDist = d;
            target = {
              x: tower.x,
              y: tower.y,
              hp: tower.hp,
              takeDamage: (dmg) => {
                tower.hp = Math.max(0, tower.hp - dmg);
                tower.isActive = true; // activate King if hit!
                if (tower.hp <= 0) {
                  soundEngine.playTowerDestroy();
                  if (tower.type === 'king') {
                    endBattle();
                  }
                }
              },
            };
          }
        }

        if (target) {
          if (minDist <= unit.range) {
            // In attack range
            if (now - unit.lastAttackTime > 1100) {
              unit.lastAttackTime = now;
              target.takeDamage(unit.damage);
              soundEngine.playSwordAttack();
            }
          } else {
            // Move toward target
            const angle = Math.atan2(target.y - unit.y, target.x - unit.x);
            unit.x += Math.cos(angle) * unit.speed;
            unit.y += Math.sin(angle) * unit.speed;
          }
        }
      }

      // 3. Tower defense shooting
      for (const tower of st.towers) {
        if (tower.hp <= 0 || (!tower.isActive && tower.type === 'king')) continue;

        const enemyTeam = tower.team === 'player' ? 'enemy' : 'player';
        // Find nearest invader
        const inRangeUnits = st.units.filter(
          (u) => u.team === enemyTeam && Math.hypot(u.x - tower.x, u.y - tower.y) <= tower.range
        );

        if (inRangeUnits.length > 0 && now - tower.lastShotTime > 1200) {
          tower.lastShotTime = now;
          const targetUnit = inRangeUnits[0];
          targetUnit.hp -= 90;

          // Spawn visual projectile
          st.projectiles.push({
            id: `proj_${Date.now()}_${Math.random()}`,
            startX: tower.x,
            startY: tower.y,
            targetX: targetUnit.x,
            targetY: targetUnit.y,
            progress: 0,
            color: tower.team === 'player' ? '#60A5FA' : '#F87171',
          });
        }
      }

      // 4. Update projectiles
      for (let i = st.projectiles.length - 1; i >= 0; i--) {
        const p = st.projectiles[i];
        p.progress += 0.25;
        if (p.progress >= 1) {
          st.projectiles.splice(i, 1);
        }
      }

      // Sync state to UI
      setUnits([...st.units]);
      setTowers([...st.towers]);
      setProjectiles([...st.projectiles]);
    }, 50);

    return () => clearInterval(interval);
  }, [endBattle, gameState]);

  const spawnUnits = (card: Card, team: 'player' | 'enemy', spawnX: number, spawnY: number) => {
    const st = stateRef.current;

    for (let c = 0; c < card.count; c++) {
      const offsetX = (c % 3) * 16 - 16;
      const offsetY = Math.floor(c / 3) * 16;

      st.units.push({
        id: `unit_${Date.now()}_${Math.random()}`,
        cardId: card.id,
        team,
        name: card.name,
        x: spawnX + offsetX,
        y: spawnY + offsetY,
        hp: card.hp,
        maxHp: card.hp,
        damage: card.damage,
        range: card.range,
        speed: card.speed,
        color: card.color,
        targetsOnlyBuildings: card.type === 'tank',
        isFlying: card.type === 'flying',
        lastAttackTime: 0,
      });
    }
  };

  const handleArenaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (gameState !== 'PLAYING' || !selectedCard) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * ARENA_WIDTH;
    const clickY = ((e.clientY - rect.top) / rect.height) * ARENA_HEIGHT;

    // Player can deploy anywhere on their half (y > 280), or spells anywhere!
    const isPlayerHalf = clickY >= 270;
    if (!isPlayerHalf && selectedCard.type !== 'spell') {
      return; // Cannot spawn enemy side unless spell
    }

    if (playerElixir < selectedCard.cost) return;

    // Deduct elixir
    const newElixir = playerElixir - selectedCard.cost;
    setPlayerElixir(newElixir);
    stateRef.current.playerElixir = newElixir;

    if (selectedCard.id === 'fireball') {
      soundEngine.playFireball();
      // Deal area damage to enemy units and towers in 80px radius
      const st = stateRef.current;
      for (const u of st.units) {
        if (u.team === 'enemy' && Math.hypot(u.x - clickX, u.y - clickY) <= 80) {
          u.hp -= selectedCard.damage;
        }
      }
      for (const t of st.towers) {
        if (t.team === 'enemy' && Math.hypot(t.x - clickX, t.y - clickY) <= 80) {
          t.hp = Math.max(0, t.hp - Math.floor(selectedCard.damage * 0.65)); // reduced spell damage to towers
          t.isActive = true;
          if (t.hp <= 0) soundEngine.playTowerDestroy();
        }
      }
    } else {
      soundEngine.playCardDeploy();
      spawnUnits(selectedCard, 'player', clickX, clickY);
    }

    setSelectedCard(null);
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Top HUD */}
      <div className="w-full max-w-[580px] flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-white rounded-t-xl text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <Crown className="w-4 h-4 fill-amber-400" />
            <span>ARENA TOWER ROYALE</span>
          </div>
          <span className="text-slate-400">
            Süre: {Math.floor(matchTime / 60)}:{(matchTime % 60).toString().padStart(2, '0')}
          </span>
        </div>

        {/* Crowns Count */}
        <div className="flex items-center gap-3 font-bold text-sm">
          <div className="flex items-center gap-1 text-cyan-400">
            <span>Sen: {playerCrowns}</span>
            <Crown className="w-3.5 h-3.5 fill-cyan-400" />
          </div>
          <span className="text-slate-600">vs</span>
          <div className="flex items-center gap-1 text-rose-400">
            <span>Rakip: {enemyCrowns}</span>
            <Crown className="w-3.5 h-3.5 fill-rose-400" />
          </div>
        </div>
      </div>

      {/* Arena Battlefield */}
      <div
        onClick={handleArenaClick}
        className="relative w-full max-w-[580px] aspect-square bg-[#34495E] overflow-hidden cursor-pointer shadow-2xl border-x-4 border-slate-800"
      >
        {/* River dividing the arena */}
        <div className="absolute top-[47%] inset-x-0 h-10 bg-cyan-700/80 border-y-2 border-cyan-500/50 flex items-center justify-between px-20">
          {/* Left Bridge */}
          <div className="w-20 h-12 -mt-1 bg-amber-800 border-2 border-amber-950 rounded-xs shadow-md" />
          {/* Right Bridge */}
          <div className="w-20 h-12 -mt-1 bg-amber-800 border-2 border-amber-950 rounded-xs shadow-md" />
        </div>

        {/* Grass Terrain details */}
        <div className="absolute inset-0 bg-[radial-gradient(#27ae60_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />

        {/* Render Towers */}
        {towers.map((tower) => {
          const isDead = tower.hp <= 0;
          const isPlayer = tower.team === 'player';
          const hpPct = Math.max(0, (tower.hp / tower.maxHp) * 100);

          return (
            <div
              key={tower.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-100 flex flex-col items-center pointer-events-none"
              style={{ left: `${(tower.x / ARENA_WIDTH) * 100}%`, top: `${(tower.y / ARENA_HEIGHT) * 100}%` }}
            >
              {/* HP Bar */}
              {!isDead && (
                <div className="w-14 h-2 bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-slate-700 mb-1">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isPlayer ? 'bg-cyan-400' : 'bg-rose-500'
                    }`}
                    style={{ width: `${hpPct}%` }}
                  />
                </div>
              )}

              {/* Tower Graphic */}
              <div
                className={`flex items-center justify-center rounded-lg border-2 shadow-xl ${
                  tower.type === 'king' ? 'w-16 h-16 text-2xl' : 'w-12 h-12 text-xl'
                } ${
                  isDead
                    ? 'bg-slate-700 border-slate-600 opacity-40'
                    : isPlayer
                    ? 'bg-blue-600 border-cyan-300 text-white'
                    : 'bg-rose-700 border-amber-300 text-white'
                }`}
              >
                {isDead ? '🏚️' : tower.type === 'king' ? '🏰' : '🗼'}
              </div>
            </div>
          );
        })}

        {/* Render Units */}
        {units.map((unit) => {
          const isPlayer = unit.team === 'player';
          const hpPct = Math.max(0, (unit.hp / unit.maxHp) * 100);
          const icon = CARDS_DECK.find((c) => c.id === unit.cardId)?.icon || '⚔️';

          return (
            <div
              key={unit.id}
              className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none flex flex-col items-center z-20"
              style={{
                left: `${(unit.x / ARENA_WIDTH) * 100}%`,
                top: `${(unit.y / ARENA_HEIGHT) * 100}%`,
              }}
            >
              {/* Mini HP Bar */}
              <div className="w-8 h-1.5 bg-slate-950/80 rounded-full overflow-hidden mb-0.5">
                <div
                  className={`h-full ${isPlayer ? 'bg-cyan-400' : 'bg-rose-500'}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>

              {/* Unit Avatar */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shadow-md border ${
                  isPlayer ? 'bg-blue-600 border-cyan-300' : 'bg-rose-600 border-rose-300'
                }`}
              >
                {icon}
              </div>
            </div>
          );
        })}

        {/* Projectile animations */}
        {projectiles.map((p) => {
          const currentX = p.startX + (p.targetX - p.startX) * p.progress;
          const currentY = p.startY + (p.targetY - p.startY) * p.progress;

          return (
            <div
              key={p.id}
              className="absolute w-2 h-2 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30 shadow-md"
              style={{
                left: `${(currentX / ARENA_WIDTH) * 100}%`,
                top: `${(currentY / ARENA_HEIGHT) * 100}%`,
                backgroundColor: p.color,
              }}
            />
          );
        })}

        {/* Deployment Area Indicator Guide */}
        {selectedCard && selectedCard.type !== 'spell' && (
          <div className="absolute bottom-0 inset-x-0 top-[52%] bg-cyan-500/10 border-t-2 border-dashed border-cyan-400 pointer-events-none flex items-center justify-center text-cyan-200 text-xs font-semibold">
            Birlikleri Bu Alana Bırakabilirsin
          </div>
        )}

        {/* Start / Intro Screen */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 z-40">
            <Swords className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h2 className="text-3xl font-extrabold text-amber-400 mb-2 tracking-wide">
              TOWER ROYALE ARENA
            </h2>
            <p className="text-slate-300 text-sm max-w-sm text-center mb-6">
              İksirini topla, kartlarını sahaya sür, rakip kuleleri yok et ve taçları topla!
            </p>
            <button
              onClick={startBattle}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 text-slate-950 font-bold rounded-lg shadow-xl hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              Savaşa Başla
            </button>
          </div>
        )}

        {/* Game Over Screen */}
        {gameState === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 z-40 animate-fade-in">
            {playerCrowns > enemyCrowns ? (
              <>
                <Sparkles className="w-14 h-14 text-amber-400 mb-2 animate-bounce" />
                <h3 className="text-3xl font-extrabold text-amber-300 mb-1">ARENA ZAFERİ!</h3>
                <p className="text-emerald-400 text-sm font-semibold mb-2">
                  {playerCrowns} Taç Kazanarak Düşmanı Yendin!
                </p>
                <p className="text-slate-400 text-xs mb-6">+600 Kupa ve Şampiyon Puanı!</p>
              </>
            ) : (
              <>
                <ShieldAlert className="w-14 h-14 text-rose-500 mb-2" />
                <h3 className="text-3xl font-extrabold text-rose-400 mb-1">ARENA KAYBEDİLDİ</h3>
                <p className="text-slate-300 text-sm mb-6">
                  Düşman daha fazla kule yıktı ({enemyCrowns} - {playerCrowns}). Stratejini yenile!
                </p>
              </>
            )}

            <button
              onClick={startBattle}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-lg shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              Yeniden Savaş
            </button>
          </div>
        )}
      </div>

      {/* Elixir Bar (1-10) */}
      <div className="w-full max-w-[580px] bg-slate-900 px-4 py-2 border-x-4 border-slate-800 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-fuchsia-400 shrink-0">
          <span>💧 İksir:</span>
          <span className="text-sm font-mono">{Math.floor(playerElixir)}/10</span>
        </div>
        <div className="flex-1 h-3.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-fuchsia-900/50">
          <div
            className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 via-pink-500 to-fuchsia-400 transition-all duration-100"
            style={{ width: `${(playerElixir / 10) * 100}%` }}
          />
        </div>
      </div>

      {/* Battle Cards Deck Hand */}
      <div className="w-full max-w-[580px] bg-slate-950 px-3 py-2.5 rounded-b-xl border-x-4 border-b-4 border-slate-800 grid grid-cols-6 gap-2">
        {CARDS_DECK.map((card) => {
          const canAfford = playerElixir >= card.cost;
          const isSelected = selectedCard?.id === card.id;

          return (
            <button
              key={card.id}
              disabled={gameState !== 'PLAYING'}
              onClick={() => setSelectedCard(isSelected ? null : card)}
              className={`relative flex flex-col items-center p-2 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-amber-400 bg-amber-500/20 -translate-y-1 shadow-lg ring-2 ring-amber-400'
                  : canAfford
                  ? 'border-slate-700 bg-slate-900 hover:border-slate-500'
                  : 'border-slate-800 bg-slate-950/70 opacity-40 cursor-not-allowed'
              }`}
            >
              {/* Elixir Cost Badge */}
              <div className="absolute -top-2 -left-1 w-5 h-5 bg-fuchsia-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center border border-white shadow">
                {card.cost}
              </div>

              {/* Card Icon */}
              <span className="text-xl mb-1">{card.icon}</span>
              {/* Card Name */}
              <span className="text-[10px] font-bold text-slate-200 truncate w-full text-center">
                {card.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
