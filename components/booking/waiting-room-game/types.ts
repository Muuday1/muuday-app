export type ObstacleType = 'plane' | 'house' | 'suitcase' | 'building'

export interface Obstacle {
  x: number
  type: ObstacleType
  width: number
  height: number
  yOffset: number
  passed: boolean
}

export interface Coin {
  x: number
  y: number
  collected: boolean
  floatOffset: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
}

export interface Cloud {
  x: number
  y: number
  w: number
  speed: number
}

export interface GamePlayer {
  x: number
  y: number
  vy: number
  onGround: boolean
  legFrame: number
}

export interface GameState {
  running: boolean
  started: boolean
  over: boolean
  score: number
  speed: number
  groundY: number
  frame: number
  lastObstacleX: number
  player: GamePlayer
  obstacles: Obstacle[]
  coins: Coin[]
  particles: Particle[]
  bgOffset: number
  clouds: Cloud[]
}

export const GROUND_Y_RATIO = 0.82
export const PLAYER_SIZE = 32
export const GRAVITY = 0.55
export const JUMP_STRENGTH = -9.8
export const BASE_SPEED = 4.2
export const MAX_SPEED = 11
export const SPEED_INCREMENT = 0.001
export const COIN_SPAWN_CHANCE = 0.72
