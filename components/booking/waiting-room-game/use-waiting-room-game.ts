'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ObstacleType, GameState } from './types'
import {
  GROUND_Y_RATIO,
  PLAYER_SIZE,
  GRAVITY,
  JUMP_STRENGTH,
  BASE_SPEED,
  MAX_SPEED,
  SPEED_INCREMENT,
  COIN_SPAWN_CHANCE,
} from './types'
import { getHighScore, setHighScore, randomBetween } from './helpers'
import {
  drawPixelText,
  drawCloud,
  drawGround,
  drawPlayer,
  drawObstacle,
  drawCoin,
  drawParticles,
  drawTitleScreen,
  drawGameOver,
} from './draw'

export function useWaitingRoomGame(isPaused: boolean) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [highScore, setHighScoreState] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [currentScore, setCurrentScore] = useState(0)

  const stateRef = useRef<GameState>({
    running: false,
    started: false,
    over: false,
    score: 0,
    speed: BASE_SPEED,
    groundY: 0,
    frame: 0,
    lastObstacleX: 0,
    player: {
      x: 60,
      y: 0,
      vy: 0,
      onGround: true,
      legFrame: 0,
    },
    obstacles: [],
    coins: [],
    particles: [],
    bgOffset: 0,
    clouds: [],
  })

  // Init high score
  useEffect(() => {
    setHighScoreState(getHighScore())
  }, [])

  // Expose score to React state periodically
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current
      if (s.started && !s.over) {
        setCurrentScore(Math.floor(s.score))
      }
    }, 250)
    return () => clearInterval(id)
  }, [])

  const startGame = useCallback(() => {
    const s = stateRef.current
    s.started = true
    s.running = true
    s.over = false
    s.score = 0
    s.speed = BASE_SPEED
    s.obstacles = []
    s.coins = []
    s.particles = []
    s.lastObstacleX = 0
    s.player.vy = 0
    s.player.onGround = true
    s.player.legFrame = 0
    setGameStarted(true)
    setGameOver(false)
    setCurrentScore(0)
  }, [])

  const resetGame = useCallback(() => {
    const s = stateRef.current
    const canvas = canvasRef.current
    if (!canvas) return
    s.groundY = canvas.height * GROUND_Y_RATIO
    s.player.y = s.groundY - PLAYER_SIZE
    startGame()
  }, [startGame])

  // Main game loop
  useEffect(() => {
    if (!canvasRef.current) return
    const cvs = canvasRef.current
    const rawCtx = cvs.getContext('2d')
    if (!rawCtx) return
    const ctx = rawCtx

    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1

    function resize() {
      const container = containerRef.current
      if (!container) return
      const rect = container.getBoundingClientRect()
      const w = Math.max(rect.width, 280)
      const h = Math.max(rect.height, 220)
      cvs.width = w * dpr
      cvs.height = h * dpr
      cvs.style.width = `${w}px`
      cvs.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      stateRef.current.groundY = h * GROUND_Y_RATIO
      if (!stateRef.current.started) {
        stateRef.current.player.y = stateRef.current.groundY - PLAYER_SIZE
      }
      // init clouds once
      if (stateRef.current.clouds.length === 0) {
        for (let i = 0; i < 4; i++) {
          stateRef.current.clouds.push({
            x: Math.random() * w,
            y: 20 + Math.random() * (h * 0.25),
            w: 40 + Math.random() * 60,
            speed: 0.15 + Math.random() * 0.25,
          })
        }
      }
    }

    resize()
    window.addEventListener('resize', resize)

    const s = stateRef.current
    s.groundY = (cvs.height / dpr) * GROUND_Y_RATIO
    s.player.y = s.groundY - PLAYER_SIZE

    function spawnObstacle(w: number) {
      const score = s.score
      let type: ObstacleType = 'plane'
      if (score > 1500) type = 'building'
      else if (score > 800) type = 'suitcase'
      else if (score > 300) type = 'house'

      const configs: Record<ObstacleType, { w: number; h: number; yOff: number }> = {
        plane: { w: 44, h: 22, yOff: randomBetween(18, 48) },
        house: { w: 34, h: 40, yOff: 0 },
        suitcase: { w: 26, h: 22, yOff: 0 },
        building: { w: 32, h: 56, yOff: 0 },
      }

      const cfg = configs[type]
      s.obstacles.push({
        x: w + 10,
        type,
        width: cfg.w,
        height: cfg.h,
        yOffset: cfg.yOff,
        passed: false,
      })

      s.lastObstacleX = w + 10

      // Chance to spawn coins above/next to obstacle
      if (Math.random() < COIN_SPAWN_CHANCE) {
        const coinY =
          type === 'plane'
            ? s.groundY - cfg.yOff - cfg.h / 2 - 10 - Math.random() * 25
            : s.groundY - cfg.h - 16 - Math.random() * 35
        s.coins.push({
          x: w + 10 + cfg.w / 2 + randomBetween(-10, 30),
          y: coinY,
          collected: false,
          floatOffset: Math.random() * Math.PI * 2,
        })
      }
    }

    function addParticles(x: number, y: number, count: number) {
      for (let i = 0; i < count; i++) {
        s.particles.push({
          x,
          y,
          vx: randomBetween(-2.5, 2.5),
          vy: randomBetween(-3, -0.5),
          life: 1,
          maxLife: randomBetween(20, 40),
        })
      }
    }

    function rectIntersect(
      ax: number,
      ay: number,
      aw: number,
      ah: number,
      bx: number,
      by: number,
      bw: number,
      bh: number
    ) {
      return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
    }

    let animId = 0

    function loop() {
      const w = cvs.width / dpr
      const h = cvs.height / dpr
      ctx.clearRect(0, 0, w, h)

      // Background
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(0, 0, w, h)

      // Clouds
      for (const cloud of s.clouds) {
        drawCloud(ctx, cloud.x, cloud.y, cloud.w)
        if (s.running && !s.over) {
          cloud.x -= cloud.speed
          if (cloud.x + cloud.w < -20) {
            cloud.x = w + 20 + Math.random() * 80
            cloud.y = 20 + Math.random() * (h * 0.25)
          }
        }
      }

      drawGround(ctx, w, s.groundY, s.bgOffset)

      if (!s.started) {
        drawTitleScreen(ctx, w, h)
        drawPlayer(ctx, s.player.x, s.player.y, s.player.legFrame, s.player.onGround)
        animId = requestAnimationFrame(loop)
        return
      }

      if (s.running && !s.over && !isPaused) {
        s.frame++
        s.score += s.speed * 0.015
        s.speed = Math.min(MAX_SPEED, BASE_SPEED + s.score * SPEED_INCREMENT)
        s.bgOffset += s.speed
        s.player.legFrame += 0.25

        // Gravity
        s.player.vy += GRAVITY
        s.player.y += s.player.vy

        if (s.player.y >= s.groundY - PLAYER_SIZE) {
          s.player.y = s.groundY - PLAYER_SIZE
          s.player.vy = 0
          s.player.onGround = true
        } else {
          s.player.onGround = false
        }

        // Spawn obstacles proportional to canvas width
        const distSinceLast = w - (s.lastObstacleX < 0 ? w : s.lastObstacleX)
        const spawnDistMin = w * 1.2
        const spawnDistMax = w * 2.2
        const spawnDist = randomBetween(spawnDistMin, spawnDistMax) * (BASE_SPEED / s.speed)
        if (s.lastObstacleX === 0 || distSinceLast >= spawnDist) {
          spawnObstacle(w)
        }

        // Move obstacles
        for (const o of s.obstacles) {
          o.x -= s.speed
        }
        for (const c of s.coins) {
          c.x -= s.speed
        }

        // Cleanup off-screen
        s.obstacles = s.obstacles.filter(o => o.x + o.width > -40)
        s.coins = s.coins.filter(c => c.x > -30)

        // Collision: obstacles
        const px = s.player.x + 4
        const py = s.player.y + 2
        const pw = PLAYER_SIZE - 8
        const ph = PLAYER_SIZE - 4

        for (const o of s.obstacles) {
          const ox = o.x + 2
          const oy = s.groundY - o.height - o.yOffset + 2
          const ow = o.width - 4
          const oh = o.height - 4
          if (rectIntersect(px, py, pw, ph, ox, oy, ow, oh)) {
            s.over = true
            s.running = false
            addParticles(s.player.x + PLAYER_SIZE / 2, s.player.y + PLAYER_SIZE / 2, 18)
            const finalScore = Math.floor(s.score)
            setGameOver(true)
            setCurrentScore(finalScore)
            const hs = getHighScore()
            if (finalScore > hs) {
              setHighScore(finalScore)
              setHighScoreState(finalScore)
            }
          }
        }

        // Collision: coins
        for (const c of s.coins) {
          if (c.collected) continue
          const floatY = Math.sin(s.frame * 0.08 + c.floatOffset) * 4
          const cx = c.x
          const cy = c.y + floatY
          if (rectIntersect(px, py, pw, ph, cx - 6, cy - 6, 12, 12)) {
            c.collected = true
            s.score += 15
            addParticles(cx, cy, 8)
          }
        }
      }

      // Draw coins
      for (const c of s.coins) {
        drawCoin(ctx, c, s.frame)
      }

      // Draw obstacles
      for (const o of s.obstacles) {
        drawObstacle(ctx, o, s.groundY)
      }

      // Draw player
      drawPlayer(ctx, s.player.x, s.player.y, s.player.legFrame, s.player.onGround)

      // Particles
      for (const p of s.particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.15
        p.life -= 1
      }
      s.particles = s.particles.filter(p => p.life > 0)
      drawParticles(ctx, s.particles)

      // HUD
      drawPixelText(ctx, `PTS ${Math.floor(s.score)}`, 12, 12, 13)
      if (highScore > 0) {
        drawPixelText(ctx, `REC ${highScore}`, 12, 30, 11)
      }

      // Game Over overlay
      if (s.over) {
        drawGameOver(ctx, w, h, s.score, highScore)
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [highScore, isPaused])

  // Input handling
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault()
        const s = stateRef.current
        if (!s.started || s.over) {
          if (s.over) {
            resetGame()
          } else {
            startGame()
          }
          return
        }
        if (s.player.onGround) {
          s.player.vy = JUMP_STRENGTH
          s.player.onGround = false
          // Dust particles on jump
          for (let i = 0; i < 6; i++) {
            s.particles.push({
              x: s.player.x + PLAYER_SIZE / 2 + randomBetween(-8, 8),
              y: s.groundY,
              vx: randomBetween(-1.5, 1.5),
              vy: randomBetween(-1, -0.3),
              life: 1,
              maxLife: randomBetween(10, 20),
            })
          }
        }
      }
    }

    function onTouchStart(e: TouchEvent) {
      // Allow tap on canvas only
      const target = e.target as HTMLElement
      if (!canvasRef.current || !canvasRef.current.contains(target)) return
      e.preventDefault()
      const s = stateRef.current
      if (!s.started || s.over) {
        if (s.over) {
          resetGame()
        } else {
          startGame()
        }
        return
      }
      if (s.player.onGround) {
        s.player.vy = JUMP_STRENGTH
        s.player.onGround = false
        // Dust particles on jump
        for (let i = 0; i < 6; i++) {
          s.particles.push({
            x: s.player.x + PLAYER_SIZE / 2 + randomBetween(-8, 8),
            y: s.groundY,
            vx: randomBetween(-1.5, 1.5),
            vy: randomBetween(-1, -0.3),
            life: 1,
            maxLife: randomBetween(10, 20),
          })
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('touchstart', onTouchStart, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('touchstart', onTouchStart)
    }
  }, [startGame, resetGame])

  return {
    canvasRef,
    containerRef,
    highScore,
    gameStarted,
    gameOver,
    currentScore,
  }
}
