import React, { useEffect, useRef, useState } from "react";
import srkImgSrc from "../assets/srk.png";
import vimalImgSrc from "../assets/vimal.jpg";
import spitImgSrc from "../assets/spit.png";
import ragniImgSrc from "../assets/ragnigandha.png";
import bgMusicSrc from "../assets/background.mp3";
import spitMusicSrc from "../assets/spitting.mp3";
import kesariMusicSrc from "../assets/kesari.mp3";
import haklamanImgSrc from "../assets/haklaman.jpg";

// Map Layout: 1=Wall, 2=Dot, 3=Power Pellet, 0=Empty, 4=Ghost Door
const MAP = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 2, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 2, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 2, 1, 1, 1, 0, 1, 0, 1, 1, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 4, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 0, 2, 0, 0, 1, 0, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 0, 1, 1, 1, 1, 1, 0, 1, 2, 1, 1, 1, 1],
  [0, 0, 0, 1, 2, 1, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 0, 0, 0],
  [1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1],
  [1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
  [1, 3, 1, 1, 2, 1, 1, 1, 2, 1, 2, 1, 1, 1, 2, 1, 1, 3, 1],
  [1, 2, 2, 1, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 2, 1],
  [1, 1, 2, 1, 2, 1, 2, 1, 1, 1, 1, 1, 2, 1, 2, 1, 2, 1, 1],
  [1, 2, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 1, 2, 2, 2, 2, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const ROWS = MAP.length;
const COLS = MAP[0].length;
const TILE_SIZE = 32;
const WIDTH = COLS * TILE_SIZE;
const HEIGHT = ROWS * TILE_SIZE;

const SPEED = 2; // Must divide TILE_SIZE cleanly

export default function Game() {
  const canvasRef = useRef(null);

  const [gameState, setGameState] = useState('start'); // start, playing, hit
  const [score, setScore] = useState(0);

  // References to keep state mutable inside the requestAnimationFrame loop
  const gameData = useRef({
    state: 'start', // 'start', 'playing', 'hit'
    score: 0,
    dotsLeft: 0,
    powerModeTime: 0,
    map: [],
    particles: [],

    player: {
      x: 9 * TILE_SIZE,
      y: 15 * TILE_SIZE,
      vx: 0,
      vy: 0,
      nextVx: 0,
      nextVy: 0,
      radius: 12
    },

    ghosts: []
  });

  const assets = useRef({
    srk: null,
    vimal: null,
    spitImg: null,
    ragni: null,
    bgMusic: null,
    spitMusic: null,
    kesariMusic: null
  });

  useEffect(() => {
    // Load Assets
    const loadImg = (src) => {
      const img = new Image();
      img.src = src;
      return img;
    };
    assets.current.srk = loadImg(srkImgSrc);
    assets.current.vimal = loadImg(vimalImgSrc);
    assets.current.spitImg = loadImg(spitImgSrc);
    assets.current.ragni = loadImg(ragniImgSrc);

    assets.current.bgMusic = new Audio(bgMusicSrc);
    assets.current.bgMusic.loop = true;
    assets.current.bgMusic.volume = 0.5;

    assets.current.spitMusic = new Audio(spitMusicSrc);
    assets.current.kesariMusic = new Audio(kesariMusicSrc);

    initGame();
  }, []);

  const initGame = () => {
    const data = gameData.current;

    // Copy map
    data.map = MAP.map(row => [...row]);

    // Count dots
    data.dotsLeft = 0;
    data.map.forEach(row => row.forEach(val => {
      if (val === 2 || val === 3) data.dotsLeft++;
    }));

    // Player start
    data.player.x = 9 * TILE_SIZE;
    data.player.y = 15 * TILE_SIZE;
    data.player.vx = -SPEED;
    data.player.vy = 0;
    data.player.nextVx = -SPEED;
    data.player.nextVy = 0;

    // Ghosts
    data.ghosts = [
      { x: 8 * TILE_SIZE, y: 9 * TILE_SIZE, vx: SPEED, vy: 0, scared: false, dead: false },
      { x: 9 * TILE_SIZE, y: 9 * TILE_SIZE, vx: -SPEED, vy: 0, scared: false, dead: false },
      { x: 10 * TILE_SIZE, y: 9 * TILE_SIZE, vx: SPEED, vy: 0, scared: false, dead: false },
      { x: 9 * TILE_SIZE, y: 8 * TILE_SIZE, vx: 0, vy: -SPEED, scared: false, dead: false }
    ];
    data.powerModeTime = 0;
    data.score = 0;
    data.particles = [];
  };

  const handleKeyDown = (e) => {
    const p = gameData.current.player;
    const key = e.key.toLowerCase();
    if (key === "arrowup" || key === "w") { p.nextVx = 0; p.nextVy = -SPEED; }
    if (key === "arrowdown" || key === "s") { p.nextVx = 0; p.nextVy = SPEED; }
    if (key === "arrowleft" || key === "a") { p.nextVx = -SPEED; p.nextVy = 0; }
    if (key === "arrowright" || key === "d") { p.nextVx = SPEED; p.nextVy = 0; }
  };

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hitMonster = () => {
    setGameState('hit');
    gameData.current.state = 'hit';
    assets.current.bgMusic.pause();
    assets.current.spitMusic.currentTime = 0;
    assets.current.spitMusic.play();

    // Recover after 3 seconds
    setTimeout(() => {
      initGame();
      setGameState('playing');
      gameData.current.state = 'playing';
      assets.current.bgMusic.play();
      requestAnimationFrame(gameLoop);
    }, 3000);
  };

  const startGame = () => {
    initGame();
    setScore(0);
    setGameState('playing');
    gameData.current.state = 'playing';
    assets.current.bgMusic.currentTime = 0;
    assets.current.bgMusic.play().catch(console.error); // Catch auto-play issues
    requestAnimationFrame(gameLoop);
  };

  const checkCollision = (x, y) => {
    const inset = 1; // 1 pixel inset so we don't stick to parallel walls

    const top = Math.floor((y + inset) / TILE_SIZE);
    const bottom = Math.floor((y + TILE_SIZE - inset - 1) / TILE_SIZE);
    const left = Math.floor((x + inset) / TILE_SIZE);
    const right = Math.floor((x + TILE_SIZE - inset - 1) / TILE_SIZE);

    if (top < 0 || bottom >= ROWS || left < 0 || right >= COLS) {
      if (top === 7 && bottom === 7) {
        if (left < 0 || right >= COLS) return false; // Tunnel wrap around
      }
      return true;
    }

    if (
      gameData.current.map[top][left] === 1 ||
      gameData.current.map[top][right] === 1 ||
      gameData.current.map[bottom][left] === 1 ||
      gameData.current.map[bottom][right] === 1
    ) {
      return true;
    }
    return false;
  };

  // Game Loop
  const gameLoop = (timestamp) => {
    const d = gameData.current;

    if (d.state !== 'playing') {
      if (d.state === 'hit') return; // Stop drawing
    }

    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');

    // ----- LOGIC UPDATE -----
    if (d.state === 'playing') {
      // 1. Move Player
      if (d.player.x % TILE_SIZE === 0 && d.player.y % TILE_SIZE === 0) {
        // Can we turn?
        if (!checkCollision(d.player.x + d.player.nextVx, d.player.y + d.player.nextVy)) {
          d.player.vx = d.player.nextVx;
          d.player.vy = d.player.nextVy;
        }
      }

      // Proceed moving
      if (!checkCollision(d.player.x + d.player.vx, d.player.y + d.player.vy)) {
        d.player.x += d.player.vx;
        d.player.y += d.player.vy;
      }

      // Map wrap around
      if (d.player.x < -TILE_SIZE) d.player.x = WIDTH;
      if (d.player.x > WIDTH) d.player.x = -TILE_SIZE;

      // 2. Eat Dots
      const pxC = Math.floor((d.player.x + TILE_SIZE / 2) / TILE_SIZE);
      const pyC = Math.floor((d.player.y + TILE_SIZE / 2) / TILE_SIZE);

      if (pyC >= 0 && pyC < ROWS && pxC >= 0 && pxC < COLS) {
        if (d.map[pyC][pxC] === 4 || (pyC === 9 && pxC >= 8 && pxC <= 10)) {
          // Player entered the spawn point limit
          hitMonster();
          return;
        }

        if (d.map[pyC][pxC] === 2) {
          d.map[pyC][pxC] = 0;
          d.score += 10;
          d.dotsLeft--;
        } else if (d.map[pyC][pxC] === 3) {
          d.map[pyC][pxC] = 0;
          d.score += 50;
          d.dotsLeft--;
          d.powerModeTime = 600; // 600 frames = ~10 seconds
        }
      }

      // Check win condition
      if (d.dotsLeft === 0) {
        initGame(); // Level refresh mechanism (or win state)
      }

      if (d.powerModeTime > 0) d.powerModeTime--;

      // 3. Move Ghosts
      d.ghosts.forEach(g => {
        if (g.dead) {
          // Go to center logic (simplified: just snap them back for now)
          g.x = 9 * TILE_SIZE;
          g.y = 9 * TILE_SIZE;
          g.dead = false;
        } else {
          // Ghost intersection logic
          if (g.x % TILE_SIZE === 0 && g.y % TILE_SIZE === 0) {
            const possibleMoves = [
              { vx: 0, vy: -SPEED },
              { vx: 0, vy: SPEED },
              { vx: -SPEED, vy: 0 },
              { vx: SPEED, vy: 0 }
            ].filter(m => {
              // Don't reverse direction simply
              if (m.vx === -g.vx && m.vy === -g.vy && (g.vx !== 0 || g.vy !== 0)) return false;
              return !checkCollision(g.x + m.vx, g.y + m.vy);
            });

            if (possibleMoves.length > 0) {
              // Pick random
              const move = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
              g.vx = move.vx;
              g.vy = move.vy;
            } else {
              // Dead end, just reverse
              g.vx *= -1;
              g.vy *= -1;
            }
          }

          if (!checkCollision(g.x + g.vx, g.y + g.vy)) {
            g.x += g.vx;
            g.y += g.vy;
          }

          // Map wrap for ghosts
          if (g.x < -TILE_SIZE) g.x = WIDTH;
          if (g.x > WIDTH) g.x = -TILE_SIZE;
        }

        // Scared state sync
        g.scared = d.powerModeTime > 0;
      });

      // Generate Particles
      if (Math.random() > 0.4) {
        d.particles.push({
          x: d.player.x + TILE_SIZE / 2,
          y: d.player.y + TILE_SIZE / 2,
          life: 1.0,
          type: 'stardust',
          vx: (Math.random() - 0.5) * 1.5,
          vy: (Math.random() - 0.5) * 1.5
        });
      }
      d.ghosts.forEach(g => {
        if (!g.dead && Math.random() > 0.4) {
          d.particles.push({
            x: g.x + TILE_SIZE / 2,
            y: g.y + TILE_SIZE / 2,
            life: 1.0,
            type: 'red_dust',
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5
          });
        }
      });
      // Update Particles
      for (let i = d.particles.length - 1; i >= 0; i--) {
        let p = d.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) d.particles.splice(i, 1);
      }

      // 4. Collision Player & Ghosts
      const pBnd = {
        left: d.player.x + 4, right: d.player.x + TILE_SIZE - 4,
        top: d.player.y + 4, bottom: d.player.y + TILE_SIZE - 4
      };

      for (let g of d.ghosts) {
        const gBnd = {
          left: g.x + 4, right: g.x + TILE_SIZE - 4,
          top: g.y + 4, bottom: g.y + TILE_SIZE - 4
        };

        if (pBnd.left < gBnd.right && pBnd.right > gBnd.left &&
          pBnd.top < gBnd.bottom && pBnd.bottom > gBnd.top) {

          if (g.scared) {
            g.dead = true;
            d.score += 200;
            if (assets.current.kesariMusic) {
              assets.current.kesariMusic.currentTime = 0;
              assets.current.kesariMusic.play().catch(console.error);
            }
          } else {
            hitMonster();
            return; // Stop processing loop this frame
          }
        }
      }
    }

    setScore(d.score);

    // ----- DRAWING -----
    // Draw blurred background image
    if (assets.current.srk && assets.current.srk.complete) {
      ctx.save();
      ctx.filter = 'blur(8px) brightness(0.3)';
      ctx.drawImage(assets.current.srk, 0, 0, WIDTH, HEIGHT);
      ctx.restore();
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }

    // Draw Map
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        let val = d.map[r][c];
        let px = c * TILE_SIZE;
        let py = r * TILE_SIZE;

        if (val === 1) {
          ctx.fillStyle = "#1e3a8a"; // Blue wall
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "#3b82f6";
          ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);
        } else if (val === 2) {
          ctx.fillStyle = "white";
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (val === 3) {
          ctx.fillStyle = "#fbbf24"; // power pellet amber
          ctx.beginPath();
          ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        } else if (val === 4) {
          ctx.fillStyle = "pink";
          ctx.fillRect(px, py + TILE_SIZE / 2 - 2, TILE_SIZE, 4); // Ghost door
        }
      }
    }

    // Draw Particles
    d.particles.forEach(p => {
      ctx.globalAlpha = p.life;
      if (p.type === 'stardust') {
        ctx.fillStyle = "gold";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2 + p.life * 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.type === 'red_dust') {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 + p.life * 3, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.globalAlpha = 1.0;

    // Draw Player
    if (assets.current.srk && assets.current.srk.complete) {
      ctx.drawImage(assets.current.srk, d.player.x, d.player.y, TILE_SIZE, TILE_SIZE);
    } else {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(d.player.x + TILE_SIZE / 2, d.player.y + TILE_SIZE / 2, d.player.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw Ghosts
    for (let g of d.ghosts) {
      if (g.scared) {
        if (assets.current.ragni && assets.current.ragni.complete) {
          // Flashing logic for scared mode before running out
          if (d.powerModeTime < 180 && Math.floor(d.powerModeTime / 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
            ctx.drawImage(assets.current.ragni, g.x, g.y, TILE_SIZE, TILE_SIZE);
            ctx.globalAlpha = 1.0;
          } else {
            ctx.drawImage(assets.current.ragni, g.x, g.y, TILE_SIZE, TILE_SIZE);
          }
        } else {
          ctx.fillStyle = "blue";
          ctx.beginPath();
          ctx.arc(g.x + TILE_SIZE / 2, g.y + TILE_SIZE / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        if (assets.current.vimal && assets.current.vimal.complete) {
          ctx.drawImage(assets.current.vimal, g.x, g.y, TILE_SIZE, TILE_SIZE);
        } else {
          ctx.fillStyle = "red";
          ctx.beginPath();
          ctx.arc(g.x + TILE_SIZE / 2, g.y + TILE_SIZE / 2, 12, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    if (d.state === 'playing') {
      requestAnimationFrame(gameLoop);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
        fontFamily: "Arial, sans-serif",
        color: "white",
        overflow: "hidden",
        boxSizing: "border-box",
        position: "relative",
        gap: "40px"
      }}
    >
      <div style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "40px"
      }}>
        {/* Left Haklaman Image */}
        <div style={{
          height: HEIGHT + 100,
          width: "250px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "4px solid white",
          boxShadow: "0 0 20px rgba(255,255,255,0.3)"
        }}>
          <img
            src={haklamanImgSrc}
            alt="Haklaman Left"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>

        {/* Center Game Column */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>
          {/* HUD Background Panel */}
          <div style={{
            width: WIDTH,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            padding: "16px 24px",
            borderRadius: "16px",
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
            boxSizing: "border-box"
          }}>
            <h1 style={{ margin: 0, fontSize: "28px", fontWeight: "800" }}>PAC-SRK</h1>
            <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "700", color: "#facc15" }}>HAKLA SCORE: {score}</h2>
          </div>

          {/* Game Canvas container */}
          <div style={{
            position: "relative",
            width: WIDTH,
            height: HEIGHT,
            boxShadow: "0 10px 40px rgba(0,0,0,0.8)",
            borderRadius: "8px",
            overflow: "hidden",
            border: "4px solid #1e3a8a"
          }}>
            <canvas
              ref={canvasRef}
              width={WIDTH}
              height={HEIGHT}
              style={{ display: "block" }}
            />

            {/* Start Overlay */}
            {gameState === 'start' && (
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                display: "flex", flexDirection: "column",
                justifyContent: "center", alignItems: "center",
                overflow: "hidden"
              }}>
                {/* Blurred Background Image */}
                <div style={{
                  position: "absolute",
                  top: "-10%", left: "-10%", width: "120%", height: "120%",
                  backgroundImage: `url(${srkImgSrc})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "blur(12px) brightness(0.4)",
                  zIndex: 0
                }} />

                <h2 style={{ fontSize: "32px", color: "white", marginBottom: "20px", position: "relative", zIndex: 1 }}>Ready to Play?</h2>
                <button
                  onClick={startGame}
                  style={{
                    padding: "12px 32px", fontSize: "20px", fontWeight: "bold",
                    backgroundColor: "#facc15", color: "#000", border: "none",
                    borderRadius: "8px", cursor: "pointer", transition: "transform 0.2s",
                    position: "relative", zIndex: 1
                  }}
                  onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                  onMouseOut={e => e.target.style.transform = 'scale(1)'}
                >
                  Start Game
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Haklaman Image */}
        <div style={{
          height: HEIGHT + 100,
          width: "250px",
          borderRadius: "16px",
          overflow: "hidden",
          border: "4px solid white",
          boxShadow: "0 0 20px rgba(255,255,255,0.3)"
        }}>
          <img
            src={haklamanImgSrc}
            alt="Haklaman Right"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Spit Hit Effect - Overlay over everything */}
      {gameState === 'hit' && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, width: "100vw", height: "100vh",
          background: "rgba(100,0,0,0.3)",
          display: "flex", justifyContent: "center", alignItems: "center",
          zIndex: 9999,
          pointerEvents: "none" // Allow clicks through if needed
        }}>
          <img
            src={spitImgSrc}
            alt="Spit Effect"
            style={{
              width: "60vw",
              maxWidth: "600px",
              animation: "pulse 0.5s infinite"
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.1); }
            100% { transform: scale(1); }
          }
        `}
      </style>
    </div>
  );
}
