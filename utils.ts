import { Letter, GameConfig } from './types';
import { COLORS } from './constants';

export const generateLetters = (word: string, config: GameConfig): Letter[] => {
  // Add some distractors (random letters)
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const neededChars = word.toUpperCase().split('');
  
  // Calculate how many distractors to add to fill a grid roughly
  const totalLetters = Math.max(neededChars.length + 3, 10); 
  const pool = [...neededChars];
  
  while (pool.length < totalLetters) {
    pool.push(alphabet[Math.floor(Math.random() * alphabet.length)]);
  }

  // Shuffle
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  // Layout logic (Grid at the bottom)
  const cols = 8;
  const startX = (config.canvasWidth - (cols * (config.letterSize + 20))) / 2;
  const startY = 400; 

  return pool.map((char, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    
    return {
      id: `${char}_${index}_${Date.now()}`,
      char,
      x: startX + col * (config.letterSize + 20),
      y: startY + row * (config.letterSize + 20),
      width: config.letterSize,
      height: config.letterSize,
      status: 'idle',
    };
  });
};

export const getColorForLetter = (index: number) => {
  return COLORS.letter.bg[index % COLORS.letter.bg.length];
};

export const playSound = (text: string) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  }
};