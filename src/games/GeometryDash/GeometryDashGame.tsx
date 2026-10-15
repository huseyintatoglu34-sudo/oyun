import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundEngine } from '../../utils/soundEngine';
import confetti from 'canvas-confetti';
import { Play, RotateCcw, Volume2, VolumeX, Shield, Flag, Award, Sparkles } from 'lucide-react';

interface GeometryDashGameProps {
  onScoreUpdate: (points: number, percentage: number) => void;
  onAttempt: () => void;
}

interface Obstacle {
  x: number;
  y: number;
  type: 'spike' | 'block' | 'pad' | 'orb' | 'portal_flip' | 'portal_normal';
  width: number;
  height: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
}

const LEVEL_LENGTH = 3600; // Total distance to 100%
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 420;
const FLOOR_Y = 350;
const CEILING_Y = 70;
const GRAVITY = 0.85;
const JUMP_FORCE = -12.5;

export const GeometryDashGame: React.FC<GeometryDashGameProps> = ({ onScoreUpdate, onAttempt }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'CRASHED' | 'VICTORY'>('IDLE');
  const [attempts, setAttempts] = useState<number>(() => {
    return Number(localStorage.getItem('gd_attempts') || 0);
  });
  const [bestProgress, setBestProgress] = useState<number>(() => {
    return Number(localStorage.getItem('gd_best_pct') || 0);
  });
  const [currentProgress, setCurrentProgress] = useState<number>(0);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [cubeColor, setCubeColor] = useState<string>('#06B6D4'); // cyan default
  const [musicMuted, setMusicMuted] = useState<boolean>(soundEngine.getMuted());

  // Game loop refs to maintain smooth 60fps without React re-render lag
  const stateRef = useRef({
    gameState: 'IDLE' as 'IDLE' | 'PLAYING' | 'CRASHED' | 'VICTORY',
    cameraX: 0,
    speed: 6.2,
    cube: {
      x: 120,
      y: FLOOR_Y - 32,
      size: 32,
      vy: 0,
      rotation: 0,
      isGrounded: true,
      gravityInverted: false,
    },
    particles: [] as Particle[],
    checkpoint: null as { cameraX: number; cubeY: number; gravityInverted: boolean } | null,
    obstacles: [] as Obstacle[],
    animationFrameId: 0,
  });

  // Build the obstacle course
  const initLevel = useCallback(() => {
    const obs: Obstacle[] = [
      // Early warm up spikes
      { x: 500, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 800, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 830, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },

      // Platform hop
      { x: 1100, y: FLOOR_Y - 40, type: 'block', width: 80, height: 40 },
      { x: 1240, y: FLOOR_Y - 70, type: 'block', width: 80, height: 70 },
      { x: 1380, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },

      // Jump Pad launch
      { x: 1550, y: FLOOR_Y - 12, type: 'pad', width: 34, height: 12 },
      { x: 1650, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 1680, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 1710, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },

      // Jump Orb in mid-air
      { x: 1900, y: FLOOR_Y - 80, type: 'orb', width: 30, height: 30 },
      { x: 1950, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 1980, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },

      // Gravity Flip Portal! (cyan to roof)
      { x: 2200, y: FLOOR_Y - 160, type: 'portal_flip', width: 24, height: 160 },
      // Spikes on the ceiling!
      { x: 2450, y: CEILING_Y, type: 'spike', width: 26, height: 26 },
      { x: 2650, y: CEILING_Y, type: 'spike', width: 26, height: 26 },
      { x: 2680, y: CEILING_Y, type: 'spike', width: 26, height: 26 },

      // Normal Gravity Portal back to ground
      { x: 2850, y: CEILING_Y, type: 'portal_normal', width: 24, height: 160 },

      // Final rhythmic obstacle gauntlet
      { x: 3050, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 3180, y: FLOOR_Y - 12, type: 'pad', width: 34, height: 12 },
      { x: 3280, y: FLOOR_Y - 50, type: 'block', width: 60, height: 50 },
      { x: 3400, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
      { x: 3430, y: FLOOR_Y - 26, type: 'spike', width: 26, height: 26 },
    ];
    stateRef.current.obstacles = obs;
  }, []);

  const createCrashParticles = (x: number, y: number) => {
    const parts: Particle[] = [];
    const colors = ['#F59E0B', '#EF4444', '#EC4899', '#3B82F6', '#10B981'];
    for (let i = 0; i < 28; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 7 + 2;
      parts.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
      });
    }
    stateRef.current.particles = parts;
  };

  const jump = useCallback(() => {
    const st = stateRef.current;
    if (st.gameState !== 'PLAYING') return;

    const { cube } = st;

    // Check if cube is near an orb to ring-jump in mid-air
    const orb = st.obstacles.find(
      (o) =>
        o.type === 'orb' &&
        Math.hypot(cube.x + st.cameraX - (o.x + o.width / 2), cube.y + cube.size / 2 - (o.y + o.height / 2)) < 55
    );

    if (orb) {
      cube.vy = cube.gravityInverted ? -JUMP_FORCE : JUMP_FORCE;
      cube.isGrounded = false;
      soundEngine.playPadBounce();
      return;
    }

    if (cube.isGrounded) {
      cube.vy = cube.gravityInverted ? -JUMP_FORCE : JUMP_FORCE;
      cube.isGrounded = false;
      soundEngine.playJump();
    }
  }, []);

  const startGame = useCallback(() => {
    initLevel();
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    localStorage.setItem('gd_attempts', String(newAttempts));
    onAttempt();

    const st = stateRef.current;
    st.gameState = 'PLAYING';
    setGameState('PLAYING');
    st.cameraX = 0;
    st.cube = {
      x: 120,
      y: FLOOR_Y - 32,
      size: 32,
      vy: 0,
      rotation: 0,
      isGrounded: true,
      gravityInverted: false,
    };
    st.particles = [];
    setCurrentProgress(0);

    soundEngine.startNeonDashMusic();
  }, [attempts, initLevel, onAttempt]);

  const setCheckpoint = () => {
    if (!isPracticeMode || stateRef.current.gameState !== 'PLAYING') return;
    const st = stateRef.current;
    st.checkpoint = {
      cameraX: st.cameraX,
      cubeY: st.cube.y,
      gravityInverted: st.cube.gravityInverted,
    };
  };

  const removeCheckpoint = () => {
    stateRef.current.checkpoint = null;
  };

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      const st = stateRef.current;
      const { cube } = st;

      // Update game logic if playing
      if (st.gameState === 'PLAYING') {
        st.cameraX += st.speed;

        // Gravity apply
        const grav = cube.gravityInverted ? -GRAVITY : GRAVITY;
        cube.vy += grav;
        cube.y += cube.vy;

        // Ground & Ceiling floor checks
        if (!cube.gravityInverted) {
          if (cube.y >= FLOOR_Y - cube.size) {
            cube.y = FLOOR_Y - cube.size;
            cube.vy = 0;
            cube.isGrounded = true;
            // Snap rotation to nearest 90 deg when landed
            cube.rotation = Math.round(cube.rotation / (Math.PI / 2)) * (Math.PI / 2);
          } else {
            cube.isGrounded = false;
            cube.rotation += 0.14;
          }
        } else {
          // Inverted ceiling mode
          if (cube.y <= CEILING_Y) {
            cube.y = CEILING_Y;
            cube.vy = 0;
            cube.isGrounded = true;
            cube.rotation = Math.round(cube.rotation / (Math.PI / 2)) * (Math.PI / 2);
          } else {
            cube.isGrounded = false;
            cube.rotation += 0.14;
          }
        }

        // Percentage progress calculation
        const pct = Math.min(100, Math.floor((st.cameraX / (LEVEL_LENGTH - 400)) * 100));
        setCurrentProgress(pct);

        if (pct > bestProgress) {
          setBestProgress(pct);
          localStorage.setItem('gd_best_pct', String(pct));
        }

        // Check Victory
        if (pct >= 100) {
          st.gameState = 'VICTORY';
          setGameState('VICTORY');
          soundEngine.stopBgm();
          soundEngine.playFanfare();
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
          onScoreUpdate(1000, 100);
        }

        // Obstacle interactions
        const worldCubeX = cube.x + st.cameraX;
        const cubeBounds = {
          left: worldCubeX,
          right: worldCubeX + cube.size,
          top: cube.y,
          bottom: cube.y + cube.size,
        };

        for (const obs of st.obstacles) {
          // Cull offscreen
          if (obs.x + obs.width < st.cameraX - 100 || obs.x > st.cameraX + CANVAS_WIDTH + 100) {
            continue;
          }

          const obsBounds = {
            left: obs.x,
            right: obs.x + obs.width,
            top: obs.y,
            bottom: obs.y + obs.height,
          };

          const isColliding =
            cubeBounds.right > obsBounds.left + 4 &&
            cubeBounds.left < obsBounds.right - 4 &&
            cubeBounds.bottom > obsBounds.top + 4 &&
            cubeBounds.top < obsBounds.bottom - 4;

          if (isColliding) {
            if (obs.type === 'spike') {
              // Crash!
              handleCrash();
              break;
            } else if (obs.type === 'block') {
              // Check landing on top vs hitting side
              if (!cube.gravityInverted && cube.vy >= 0 && cubeBounds.bottom - obsBounds.top < 15) {
                cube.y = obsBounds.top - cube.size;
                cube.vy = 0;
                cube.isGrounded = true;
                cube.rotation = Math.round(cube.rotation / (Math.PI / 2)) * (Math.PI / 2);
              } else if (cube.gravityInverted && cube.vy <= 0 && obsBounds.bottom - cubeBounds.top < 15) {
                cube.y = obsBounds.bottom;
                cube.vy = 0;
                cube.isGrounded = true;
                cube.rotation = Math.round(cube.rotation / (Math.PI / 2)) * (Math.PI / 2);
              } else {
                handleCrash();
                break;
              }
            } else if (obs.type === 'pad') {
              cube.vy = cube.gravityInverted ? 16 : -16;
              cube.isGrounded = false;
              soundEngine.playPadBounce();
            } else if (obs.type === 'portal_flip' && !cube.gravityInverted) {
              cube.gravityInverted = true;
              soundEngine.playPortal();
            } else if (obs.type === 'portal_normal' && cube.gravityInverted) {
              cube.gravityInverted = false;
              soundEngine.playPortal();
            }
          }
        }
      }

      function handleCrash() {
        soundEngine.playCrash();
        soundEngine.stopBgm();
        createCrashParticles(cube.x, cube.y);

        if (isPracticeMode && st.checkpoint) {
          // Restore from checkpoint
          st.cameraX = st.checkpoint.cameraX;
          cube.y = st.checkpoint.cubeY;
          cube.vy = 0;
          cube.gravityInverted = st.checkpoint.gravityInverted;
          soundEngine.startNeonDashMusic();
        } else {
          st.gameState = 'CRASHED';
          setGameState('CRASHED');
          onScoreUpdate(Math.floor(st.cameraX / 10), Math.min(100, Math.floor((st.cameraX / (LEVEL_LENGTH - 400)) * 100)));
        }
      }

      // Update particles
      for (let i = st.particles.length - 1; i >= 0; i--) {
        const p = st.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= dt * 1.5;
        if (p.alpha <= 0) {
          st.particles.splice(i, 1);
        }
      }

      // --- DRAW CANVAS ---
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cyber Neon Background with scrolling grid lines
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#0F172A');
      bgGrad.addColorStop(0.5, '#1E1B4B');
      bgGrad.addColorStop(1, '#0B0F19');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Animated background grid
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.08)';
      ctx.lineWidth = 1;
      const gridOffset = (st.cameraX * 0.3) % 40;
      for (let x = -gridOffset; x < CANVAS_WIDTH; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Ceiling bar (active during flip portal)
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CEILING_Y);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, CEILING_Y);
      ctx.lineTo(CANVAS_WIDTH, CEILING_Y);
      ctx.stroke();

      // Floor bar
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(0, FLOOR_Y, CANVAS_WIDTH, CANVAS_HEIGHT - FLOOR_Y);
      ctx.strokeStyle = '#F43F5E';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y);
      ctx.lineTo(CANVAS_WIDTH, FLOOR_Y);
      ctx.stroke();

      // Floor neon pattern
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
      const floorTile = (st.cameraX) % 30;
      for (let fx = -floorTile; fx < CANVAS_WIDTH; fx += 30) {
        ctx.beginPath();
        ctx.moveTo(fx, FLOOR_Y);
        ctx.lineTo(fx + 15, CANVAS_HEIGHT);
        ctx.stroke();
      }

      // Draw Obstacles
      for (const obs of st.obstacles) {
        const screenX = obs.x - st.cameraX;
        if (screenX + obs.width < -50 || screenX > CANVAS_WIDTH + 50) continue;

        if (obs.type === 'spike') {
          // Sharp triangular spike
          ctx.save();
          ctx.fillStyle = '#EF4444';
          ctx.strokeStyle = '#FCA5A5';
          ctx.lineWidth = 2;
          ctx.beginPath();
          if (obs.y <= CEILING_Y) {
            // Ceiling spike pointing down
            ctx.moveTo(screenX, obs.y);
            ctx.lineTo(screenX + obs.width, obs.y);
            ctx.lineTo(screenX + obs.width / 2, obs.y + obs.height);
          } else {
            // Ground spike pointing up
            ctx.moveTo(screenX, obs.y + obs.height);
            ctx.lineTo(screenX + obs.width, obs.y + obs.height);
            ctx.lineTo(screenX + obs.width / 2, obs.y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else if (obs.type === 'block') {
          // Neon square block
          ctx.save();
          ctx.fillStyle = '#334155';
          ctx.fillRect(screenX, obs.y, obs.width, obs.height);
          ctx.strokeStyle = '#38BDF8';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, obs.y, obs.width, obs.height);
          // Inner icon
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
          ctx.strokeRect(screenX + 6, obs.y + 6, obs.width - 12, obs.height - 12);
          ctx.restore();
        } else if (obs.type === 'pad') {
          // Yellow bounce pad
          ctx.save();
          ctx.fillStyle = '#F59E0B';
          ctx.beginPath();
          ctx.roundRect(screenX, obs.y, obs.width, obs.height, 4);
          ctx.fill();
          ctx.shadowColor = '#F59E0B';
          ctx.shadowBlur = 10;
          ctx.strokeStyle = '#FEF08A';
          ctx.stroke();
          ctx.restore();
        } else if (obs.type === 'orb') {
          // Glowing jump ring
          ctx.save();
          ctx.fillStyle = 'rgba(234, 179, 8, 0.3)';
          ctx.strokeStyle = '#FACC15';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(screenX + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else if (obs.type === 'portal_flip' || obs.type === 'portal_normal') {
          // Gravity portal
          const isFlip = obs.type === 'portal_flip';
          ctx.save();
          const portalGrad = ctx.createLinearGradient(screenX, obs.y, screenX + obs.width, obs.y);
          portalGrad.addColorStop(0, isFlip ? '#06B6D4' : '#EC4899');
          portalGrad.addColorStop(1, '#FFFFFF');
          ctx.fillStyle = portalGrad;
          ctx.fillRect(screenX, obs.y, obs.width, obs.height);
          ctx.shadowColor = isFlip ? '#06B6D4' : '#EC4899';
          ctx.shadowBlur = 15;
          ctx.strokeStyle = '#FFFFFF';
          ctx.strokeRect(screenX, obs.y, obs.width, obs.height);
          ctx.restore();
        }
      }

      // Draw Checkpoint in Practice Mode
      if (isPracticeMode && st.checkpoint) {
        const cpScreenX = st.checkpoint.cameraX - st.cameraX + cube.x;
        ctx.fillStyle = '#10B981';
        ctx.beginPath();
        ctx.arc(cpScreenX, st.checkpoint.cubeY + 16, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Cube Player
      if (st.gameState === 'PLAYING' || st.gameState === 'IDLE' || st.gameState === 'VICTORY') {
        ctx.save();
        ctx.translate(cube.x + cube.size / 2, cube.y + cube.size / 2);
        ctx.rotate(cube.rotation);

        // Cube Body
        ctx.fillStyle = cubeColor;
        ctx.fillRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);

        // Neon Border
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-cube.size / 2, -cube.size / 2, cube.size, cube.size);

        // Eyes & Mouth (Classic Geometry Dash Face)
        ctx.fillStyle = '#0F172A';
        // Left Eye
        ctx.fillRect(-9, -8, 6, 6);
        // Right Eye
        ctx.fillRect(3, -8, 6, 6);
        // Mouth
        ctx.fillRect(-8, 3, 16, 4);

        ctx.restore();
      }

      // Draw Particles
      for (const p of st.particles) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size, p.size);
        ctx.restore();
      }

      st.animationFrameId = requestAnimationFrame(loop);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(stateRef.current.animationFrameId);
      soundEngine.stopBgm();
    };
  }, [bestProgress, cubeColor, isPracticeMode, onScoreUpdate]);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (stateRef.current.gameState === 'IDLE' || stateRef.current.gameState === 'CRASHED') {
          startGame();
        } else if (stateRef.current.gameState === 'PLAYING') {
          jump();
        }
      } else if (e.code === 'KeyZ') {
        // Place checkpoint in practice mode
        setCheckpoint();
      } else if (e.code === 'KeyX') {
        // Remove checkpoint
        removeCheckpoint();
      } else if (e.code === 'KeyR') {
        startGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [jump, startGame, isPracticeMode]);

  const toggleSound = () => {
    const currentMute = soundEngine.getMuted();
    soundEngine.setMuted(!currentMute);
    setMusicMuted(!currentMute);
  };

  return (
    <div className="relative w-full flex flex-col items-center select-none">
      {/* Top HUD inside game */}
      <div className="w-full max-w-[800px] flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-white rounded-t-xl text-xs font-mono">
        <div className="flex items-center gap-4">
          <span className="text-amber-400 font-bold tracking-wider">NEON DASH</span>
          <span className="text-slate-400">Deneme: #{attempts}</span>
          <span className="text-emerald-400">En İyi: %{bestProgress}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPracticeMode(!isPracticeMode)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
              isPracticeMode ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Pratik Modu (Z ile nokta koy, X ile sil)"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Pratik {isPracticeMode ? 'Açık' : 'Kapalı'}</span>
          </button>
          <button
            onClick={toggleSound}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Ses Aç/Kapat"
          >
            {musicMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-[800px] h-2 bg-slate-800 relative overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 via-amber-400 to-rose-500 transition-all duration-75"
          style={{ width: `${currentProgress}%` }}
        />
        <div className="absolute right-2 top-0 text-[10px] text-white/70 font-mono leading-none">
          %{currentProgress}
        </div>
      </div>

      {/* Game Canvas Container */}
      <div
        className="relative w-full max-w-[800px] aspect-[800/420] cursor-pointer bg-slate-950 overflow-hidden shadow-2xl"
        onClick={() => {
          if (stateRef.current.gameState === 'PLAYING') {
            jump();
          } else {
            startGame();
          }
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block"
        />

        {/* Start / Intro Overlay */}
        {gameState === 'IDLE' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6">
            <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-pink-500 tracking-wider mb-2">
              NEON DASH: RETRO RİTİM
            </h2>
            <p className="text-slate-300 text-sm max-w-md text-center mb-6">
              Geometri Dash ritmiyle engellerden zıpla, yerçekimi kapılarından geç ve %100 bitiş çizgisine ulaş!
            </p>
            <div className="flex gap-4 mb-6">
              {['#06B6D4', '#EAB308', '#EC4899', '#10B981'].map((c) => (
                <button
                  key={c}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCubeColor(c);
                  }}
                  className={`w-8 h-8 rounded-md transition-transform ${cubeColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                  style={{ backgroundColor: c }}
                  title="Küp Rengini Seç"
                />
              ))}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold rounded-lg shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <Play className="w-5 h-5 fill-slate-950" />
              Oyunu Başlat (Boşluk Tuşu)
            </button>
            <div className="mt-4 text-xs text-slate-400">
              İpucu: Zıplamak için Boşluk veya Ekrana Tıkla · R ile yeniden başla
            </div>
          </div>
        )}

        {/* Crashed Overlay */}
        {gameState === 'CRASHED' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white p-6 animate-fade-in">
            <span className="text-rose-500 font-mono text-xs uppercase tracking-widest mb-1">Kaza Yapıldı!</span>
            <h3 className="text-4xl font-extrabold text-white mb-2">%{currentProgress} Tamamlandı</h3>
            <p className="text-slate-400 text-xs mb-6">
              En İyi İlerleme: %{bestProgress} · Toplam Deneme: {attempts}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              Tekrar Dene (R Tuşu)
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center text-white p-6 animate-fade-in">
            <Sparkles className="w-12 h-12 text-amber-400 mb-2 animate-bounce" />
            <h3 className="text-3xl font-extrabold text-amber-300 mb-1">TEBRİKLER! %100 BİTTİ!</h3>
            <p className="text-emerald-400 text-sm font-semibold mb-6 flex items-center gap-1">
              <Award className="w-4 h-4" /> Neon Şampiyonu Rozetini Kazandın! (+1000 Puan)
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-emerald-400 text-slate-950 font-bold rounded-lg shadow-lg hover:scale-105 transition-all text-sm uppercase tracking-wider"
            >
              <RotateCcw className="w-4 h-4" />
              Yeniden Oyna
            </button>
          </div>
        )}
      </div>

      {/* Practice mode helpers bottom strip */}
      {isPracticeMode && (
        <div className="w-full max-w-[800px] flex items-center justify-between px-3 py-1.5 bg-slate-900/90 border-t border-slate-800 text-[11px] text-slate-400 rounded-b-xl">
          <div className="flex items-center gap-2">
            <Flag className="w-3.5 h-3.5 text-emerald-400" />
            <span>Pratik Modu: [Z] Checkpoint Ekle · [X] Checkpoint Kaldır</span>
          </div>
          <button
            onClick={setCheckpoint}
            className="px-2 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[10px]"
          >
            Nokta Koy (Z)
          </button>
        </div>
      )}
    </div>
  );
};
