import { WordData } from './types';

// Macaron Palette
export const COLORS = {
  backgroundGradient: ['#E0C3FC', '#8EC5FC'], // Soft Purple to Blue
  slot: {
    fill: '#F3F4F6',
    stroke: '#A78BFA',
    strokeActive: '#F472B6',
  },
  letter: {
    bg: ['#FCA5A5', '#FDBA74', '#FDE047', '#86EFAC', '#67E8F9', '#C4B5FD'], // Random nice colors
    text: '#ffffff',
    shadow: 'rgba(0,0,0,0.15)',
  },
  ui: {
    buttonPrimary: '#8B5CF6',
    buttonDanger: '#EF4444',
    textMain: '#4C1D95',
  }
};

export const DEFAULT_WORDS: WordData[] = [
  { id: '1', word: 'APPLE', hint: 'A Red Fruit 🍎', emoji: '🍎' },
  { id: '2', word: 'CAT', hint: 'Says Meow 🐱', emoji: '🐱' },
  { id: '3', word: 'STAR', hint: 'In the Sky ⭐', emoji: '⭐' },
  { id: '4', word: 'FISH', hint: 'Swims in Water 🐟', emoji: '🐟' },
  { id: '5', word: 'HAPPY', hint: 'Smile! 😊', emoji: '😊' },
  { id: '6', word: 'DOG', hint: 'Best Friend 🐶', emoji: '🐶' },
  { id: '7', word: 'SUN', hint: 'Hot and Bright ☀️', emoji: '☀️' },
  { id: '8', word: 'MOON', hint: 'Night Light 🌙', emoji: '🌙' },
];

export const GAME_CONFIG = {
  canvasWidth: 1000,
  canvasHeight: 600,
  slotSize: 80,
  letterSize: 70,
};