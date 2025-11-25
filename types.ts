export interface WordData {
  id: string;
  word: string; // The English word (e.g., "APPLE")
  hint: string; // The display hint (e.g., "苹果 (Píng Guǒ)")
  emoji?: string; // Optional emoji/image
}

export interface Letter {
  id: string; // Unique ID for every letter tile (e.g., "A_1")
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  status: 'idle' | 'flying' | 'placed' | 'hidden';
  targetSlotIndex?: number; // If placed, which slot is it in?
}

export interface Slot {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  filledLetterId?: string | null; // ID of the letter currently in this slot
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
  slotSize: number;
  letterSize: number;
}