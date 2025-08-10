import React, { useRef, useEffect, useState } from "react";

export default function FlappyBird() {
  const canvasRef = useRef(null);
  const sizeRef = useRef({ width: window.innerWidth, height: window.innerHeight });
  const state = useRef({
    x: 150,
    y: 200,
    vy: 0,
    pipes: [],
    score: 0,
    isDead: false,
    lastPipe: 0,
  }).current;

  const [isGameOver, setIsGameOver] = useState(false);
  const [best, setBest] = useState(Number(localStorage?.getItem("flappy_best") || 0));
  const characterImage = useRef(null);
  const grassImage = useRef(null);
  const barnImage = useRef(null);
  const bgMusic = useRef(null);

  // constants - Speed diperbaiki
  const GRAVITY = 0.22;        // Lebih ringan
  const FLAP_POWER = -7.5;     // Lebih halus
  const PIPE_SPEED = 2.2;      // Lebih lambat
  const PIPE_GAP = 350;        // Gap lebih lebar
  const PIPE_INTERVAL = 2000;  // Interval lebih lama

  function spawnPipe(now) {
    const h = sizeRef.current.height;
    const top = 80 + Math.random() * (h - PIPE_GAP - 200);
    state.pipes.push({ x: sizeRef.current.width + 80, top, scored: false });
    state.lastPipe = now;
  }

  function update(dt, now) {
    if (state.isDead) return;

    state.vy += GRAVITY * dt;
    state.y += state.vy * dt;

    if (now - state.lastPipe > PIPE_INTERVAL) spawnPipe(now);

    for (let p of state.pipes) p.x -= PIPE_SPEED * dt;

    while (state.pipes.length && state.pipes[0].x < -120) {
      state.pipes.shift();
    }

    for (let p of state.pipes) {
      if (!p.scored && p.x + 40 < state.x) {
        p.scored = true;
        state.score += 1;
        if (state.score > best) {
          setBest(state.score);
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem("flappy_best", String(state.score));
          }
        }
      }
    }

    const groundY = sizeRef.current.height - (grassImage.current?.height || 60);
    if (state.y >= groundY || state.y <= 0) {
      gameOver();
    }

    for (let p of state.pipes) {
      const pipeW = 100;
      if (state.x + 22 > p.x && state.x - 22 < p.x + pipeW) {
        if (state.y - 22 < p.top || state.y + 22 > p.top + PIPE_GAP) {
          gameOver();
        }
      }
    }
  }

  function gameOver() {
    state.isDead = true;
    setIsGameOver(true);
    if (bgMusic.current) {
      bgMusic.current.pause();
    }
  }

  function draw(ctx) {
    const { width, height } = sizeRef.current;

    // Background gradient yang indah
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#87CEEB");    // Sky blue
    gradient.addColorStop(0.3, "#98FB98");  // Pale green
    gradient.addColorStop(0.7, "#90EE90");  // Light green
    gradient.addColorStop(1, "#32CD32");    // Lime green
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Clouds background
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    for (let i = 0; i < 5; i++) {
      const x = (i * 200 + performance.now() * 0.01) % (width + 100);
      const y = 50 + i * 30;
      ctx.beginPath();
      ctx.arc(x, y, 25, 0, Math.PI * 2);
      ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
      ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
      ctx.fill();
    }

    // pipes dengan shadow dan gradient
    for (let p of state.pipes) {
      if (barnImage.current) {
        ctx.drawImage(barnImage.current, p.x, 0, 100, p.top);
        ctx.drawImage(
          barnImage.current,
          p.x,
          p.top + PIPE_GAP,
          100,
          height - p.top - PIPE_GAP 
        );
      } else {
        // Pipe gradient
        const pipeGradient = ctx.createLinearGradient(p.x, 0, p.x + 100, 0);
        pipeGradient.addColorStop(0, "#228B22");
        pipeGradient.addColorStop(0.3, "#32CD32");
        pipeGradient.addColorStop(0.7, "#228B22");
        pipeGradient.addColorStop(1, "#006400");
        
        // Shadow
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.fillRect(p.x + 3, 3, 100, p.top);
        ctx.fillRect(p.x + 3, p.top + PIPE_GAP + 3, 100, height - p.top - PIPE_GAP);
        
        // Main pipe
        ctx.fillStyle = pipeGradient;
        ctx.fillRect(p.x, 0, 100, p.top);
        ctx.fillRect(p.x, p.top + PIPE_GAP, 100, height - p.top - PIPE_GAP);
        
        // Pipe caps
        ctx.fillStyle = "#006400";
        ctx.fillRect(p.x - 5, p.top - 20, 110, 20);
        ctx.fillRect(p.x - 5, p.top + PIPE_GAP, 110, 20);
      }
    }

    // bird (tetap sama, tidak diubah)
    if (characterImage.current) {
      ctx.drawImage(characterImage.current, state.x - 22, state.y - 22, 44, 44);
    } else {
      ctx.fillStyle = "yellow";
      ctx.beginPath();
      ctx.arc(state.x, state.y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // ground tiles dengan pattern
    if (grassImage.current) {
      const tileWidth = grassImage.current.width;
      const tileHeight = grassImage.current.height;
      const groundY = height - tileHeight;
      for (let x = 0; x < width; x += tileWidth) {
        ctx.drawImage(grassImage.current, x, groundY, tileWidth, tileHeight);
      }
    } else {
      // Default ground dengan gradient
      const groundHeight = 80;
      const groundY = height - groundHeight;
      
      const groundGradient = ctx.createLinearGradient(0, groundY, 0, height);
      groundGradient.addColorStop(0, "#8B4513");
      groundGradient.addColorStop(0.3, "#A0522D");
      groundGradient.addColorStop(1, "#654321");
      
      ctx.fillStyle = groundGradient;
      ctx.fillRect(0, groundY, width, groundHeight);
      
      // Ground pattern
      ctx.fillStyle = "#654321";
      for (let x = 0; x < width; x += 40) {
        for (let y = groundY + 20; y < height; y += 20) {
          ctx.fillRect(x, y, 20, 10);
        }
      }
    }

    // Enhanced score display (hanya current score)
    ctx.save();
    
    // Score background
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.roundRect = ctx.roundRect || function(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
      ctx.fill();
    };
    ctx.roundRect(10, 10, 180, 50, 10);
    
    // Score text with outline
    ctx.strokeStyle = "#000";
    ctx.fillStyle = "#FFF";
    ctx.lineWidth = 3;
    ctx.font = "bold 28px Arial";
    ctx.strokeText(`Score: ${state.score}`, 20, 45);
    ctx.fillText(`Score: ${state.score}`, 20, 45);
    
    ctx.restore();
  }

  function flap() {
    if (!state.isDead) {
      state.vy = FLAP_POWER;
    } else {
      restart();
    }
  }

  function restart() {
    state.x = 150;
    state.y = 200;
    state.vy = 0;
    state.pipes = [];
    state.score = 0;
    state.isDead = false;
    state.lastPipe = 0;
    setIsGameOver(false);
    if (bgMusic.current) {
      bgMusic.current.currentTime = 0;
      bgMusic.current.play();
    }
  }

  useEffect(() => {
    // hilangkan scroll bar
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    // load images (tetap sama)
    const img = new Image();
    img.src = "/character.png";
    img.onload = () => {
      characterImage.current = img;
    };

    const grass = new Image();
    grass.src = "";
    grass.onload = () => {
      grassImage.current = grass;
    };

    const barn = new Image();
    barn.src = "/barn.png";
    barn.onload = () => {
      barnImage.current = barn;
    };

    // music
    if (typeof Audio !== 'undefined') {
      bgMusic.current = new Audio("/bg-music.mp3");
      bgMusic.current.loop = true;
      bgMusic.current.volume = 0.3; // Volume lebih kecil
      bgMusic.current.play().catch(() => {
        // Handle autoplay restriction
      });
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let lastTime = performance.now();
    function loop(now) {
      const dt = (now - lastTime) / 16.67;
      update(dt, now);
      draw(ctx);
      lastTime = now;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    function handleResize() {
      sizeRef.current.width = window.innerWidth;
      sizeRef.current.height = window.innerHeight;
      canvas.width = sizeRef.current.width;
      canvas.height = sizeRef.current.height;
    }
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e) => {
      if (e.code === "Space") {
        e.preventDefault();
        flap();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", flap);
    window.addEventListener("touchstart", flap);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", flap);
      window.removeEventListener("touchstart", flap);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} />
      {isGameOver && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            color: "white",
            fontSize: "24px",
            zIndex: 10,
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "40px 50px",
              borderRadius: "20px",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "2px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(10px)",
            }}
          >
            <h1 style={{
              fontSize: "3em",
              margin: "0 0 20px 0",
              background: "linear-gradient(45deg, #FFD700, #FFA500)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              textShadow: "2px 2px 4px rgba(0,0,0,0.5)"
            }}>
              MOOOO OVERRR
            </h1>
            <div style={{
              fontSize: "1.4em",
              margin: "15px 0",
              color: "#E8E8E8"
            }}>
              Score: <span style={{color: "#FFD700", fontWeight: "bold"}}>{state.score}</span>
            </div>
            <div style={{
              fontSize: "1.4em",
              margin: "15px 0",
              color: "#E8E8E8"
            }}>
              Best: <span style={{color: "#FFD700", fontWeight: "bold"}}>{best}</span>
            </div>
            <div style={{
              fontSize: "1.1em",
              margin: "25px 0",
              color: "#B8B8B8",
              fontStyle: "italic"
            }}>
              @lamumudotxyz
              @avarithhgrind
            </div>
            <button
              style={{
                padding: "15px 30px",
                fontSize: "1.2em",
                background: "linear-gradient(45deg, #4CAF50, #45a049)",
                color: "white",
                border: "none",
                borderRadius: "25px",
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(76, 175, 80, 0.3)",
                transition: "all 0.3s ease",
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "1px"
              }}
              onClick={restart}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 15px rgba(76, 175, 80, 0.3)";
              }}
            >
              🔄 Restart
            </button>
          </div>
        </div>
      )}
    </>
  );
}