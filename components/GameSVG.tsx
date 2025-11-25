import React, { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { WordData, Letter, Slot } from '../types';
import { GAME_CONFIG, COLORS } from '../constants';
import { generateLetters, getColorForLetter, playSound } from '../utils';

interface GameSVGProps {
  currentWordData: WordData;
  onWordComplete: () => void;
  triggerNextWord: boolean;
}

const GameSVG: React.FC<GameSVGProps> = ({ currentWordData, onWordComplete, triggerNextWord }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  // Game State
  const [letters, setLetters] = useState<Letter[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [feedbackState, setFeedbackState] = useState<'neutral' | 'success' | 'error'>('neutral');

  // Initialize Game Logic for a new word
  const initLevel = useCallback(() => {
    const word = currentWordData.word.toUpperCase();
    
    // 1. Generate Slots
    const totalSlotWidth = word.length * (GAME_CONFIG.slotSize + 10);
    const startSlotX = (GAME_CONFIG.canvasWidth - totalSlotWidth) / 2;
    
    const newSlots: Slot[] = word.split('').map((_, i) => ({
      index: i,
      x: startSlotX + i * (GAME_CONFIG.slotSize + 10),
      y: 240, // Vertical position of slots
      width: GAME_CONFIG.slotSize,
      height: GAME_CONFIG.slotSize,
      filledLetterId: null,
    }));
    setSlots(newSlots);

    // 2. Generate Letters
    const newLetters = generateLetters(word, GAME_CONFIG);
    setLetters(newLetters);

    // 3. Reset State
    setFeedbackState('neutral');
    
    // Animate Entry
    gsap.fromTo('.letter-block', 
      { scale: 0, opacity: 0, y: "+=100" }, 
      { scale: 1, opacity: 1, y: "-=100", duration: 0.6, stagger: 0.05, ease: 'back.out(1.5)' }
    );

    // Speak the word
    setTimeout(() => playSound(word), 600);

  }, [currentWordData]);

  // Handle initialization/reset
  useEffect(() => {
    initLevel();
  }, [initLevel, triggerNextWord]);

  // --- Interaction Logic ---

  // Helper: Find first empty slot
  const getNextEmptySlot = () => slots.find(s => s.filledLetterId === null);

  const handleLetterClick = (letter: Letter) => {
    if (letter.status !== 'idle' || feedbackState === 'success') return;

    const targetSlot = getNextEmptySlot();

    if (!targetSlot) {
      // Shake animation if full
      gsap.to(`#letter-${letter.id}`, { x: "+=5", yoyo: true, repeat: 5, duration: 0.05, clearProps: "x" });
      return;
    }

    // --- The Animation Sequence ---
    setLetters(prev => prev.map(l => l.id === letter.id ? { ...l, status: 'flying' } : l));

    const element = document.getElementById(`letter-${letter.id}`);
    if (!element) return;

    playSound(letter.char);

    // Create a slight arc path? For now straight line is snappy enough for kids, but let's add rotation
    gsap.to(element, {
      x: targetSlot.x,
      y: targetSlot.y,
      width: targetSlot.width,
      height: targetSlot.height,
      rotation: 360, // Spin while flying
      duration: 0.6,
      ease: 'back.out(0.8)',
      onComplete: () => {
        gsap.set(element, { clearProps: "all" });
        // Logic after animation lands
        setLetters(prev => prev.map(l => 
          l.id === letter.id ? { ...l, status: 'placed', targetSlotIndex: targetSlot.index } : l
        ));
        setSlots(prev => prev.map(s => 
          s.index === targetSlot.index ? { ...s, filledLetterId: letter.id } : s
        ));
      }
    });
  };

  const handleSlotClick = (slot: Slot) => {
    if (!slot.filledLetterId || feedbackState === 'success') return;

    const letterId = slot.filledLetterId;
    const letter = letters.find(l => l.id === letterId);
    if (!letter) return;

    const element = document.getElementById(`letter-${letterId}`);
    if (!element) return;

    // Animate back to original position
    gsap.to(element, {
      x: letter.x,
      y: letter.y,
      width: letter.width,
      height: letter.height,
      rotation: -360,
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete: () => {
        gsap.set(element, { clearProps: "all" });
        setLetters(prev => prev.map(l => 
          l.id === letterId ? { ...l, status: 'idle', targetSlotIndex: undefined } : l
        ));
        setSlots(prev => prev.map(s => 
          s.index === slot.index ? { ...s, filledLetterId: null } : s
        ));
      }
    });
  };

  // Check Win Condition
  useEffect(() => {
    const isFull = slots.length > 0 && slots.every(s => s.filledLetterId !== null);
    if (isFull && feedbackState === 'neutral') {
      checkSpelling();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots, feedbackState]);

  const checkSpelling = () => {
    const currentSpelling = slots.map(s => {
      const l = letters.find(letter => letter.id === s.filledLetterId);
      return l ? l.char : '';
    }).join('');

    if (currentSpelling === currentWordData.word.toUpperCase()) {
      handleSuccess();
    } else {
      handleError();
    }
  };

  const handleSuccess = () => {
    setFeedbackState('success');
    playSound("Awesome! " + currentWordData.word);
    
    // Star Burst Animation
    const center = { x: GAME_CONFIG.canvasWidth / 2, y: GAME_CONFIG.canvasHeight / 2 };
    const stars = document.querySelectorAll('.success-star');
    
    gsap.fromTo(stars, 
      { x: center.x, y: center.y, scale: 0, opacity: 1 },
      { 
        x: (i) => center.x + (Math.cos(i * 0.5) * 500), 
        y: (i) => center.y + (Math.sin(i * 0.5) * 500), 
        rotation: 720,
        scale: (i) => i % 2 === 0 ? 4 : 2, 
        opacity: 0, 
        duration: 2.5, 
        ease: 'power4.out',
        stagger: 0.01
      }
    );

    // Letter Dance
    const placedLetters = letters.filter(l => l.status === 'placed');
    placedLetters.forEach((l, i) => {
        gsap.to(`#letter-${l.id}`, {
            y: "-=50",
            scale: 1.3,
            rotation: i % 2 === 0 ? 15 : -15,
            duration: 0.4,
            yoyo: true,
            repeat: 3,
            delay: i * 0.1,
            ease: "circ.out"
        });
    });

    setTimeout(onWordComplete, 3000);
  };

  const handleError = () => {
    setFeedbackState('error');
    playSound("Try again");

    // Shake all placed letters
    const placedIds = slots.filter(s => s.filledLetterId).map(s => s.filledLetterId);
    
    placedIds.forEach(id => {
        gsap.to(`#letter-${id}`, {
            x: "+=10",
            duration: 0.08,
            repeat: 5,
            yoyo: true,
            onComplete: () => setFeedbackState('neutral') 
        });
    });
    
    // Flash background red slightly
    gsap.fromTo("#game-board-bg", { fill: "#FEE2E2" }, { fill: "#FFFFFF", duration: 0.5 });
  };

  return (
    <svg 
      ref={svgRef}
      viewBox={`0 0 ${GAME_CONFIG.canvasWidth} ${GAME_CONFIG.canvasHeight}`} 
      className="w-full h-auto max-h-[75vh] drop-shadow-2xl select-none"
      style={{ touchAction: 'none' }}
    >
      <defs>
        <pattern id="dotPattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="2" fill="#E0E7FF" />
        </pattern>
        {/* Cute shiny plastic filter */}
        <filter id="plasticGlow" x="-20%" y="-20%" width="140%" height="140%">
           <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur"/>
           <feOffset in="blur" dx="4" dy="6" result="offsetBlur"/>
           <feSpecularLighting in="blur" surfaceScale="5" specularConstant="1" specularExponent="20" lightingColor="#white" result="specOut">
             <fePointLight x="-5000" y="-10000" z="20000"/>
           </feSpecularLighting>
           <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut"/>
           <feComposite in="SourceGraphic" in2="specOut" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="litPaint"/>
           <feMerge>
             <feMergeNode in="offsetBlur"/>
             <feMergeNode in="litPaint"/>
           </feMerge>
        </filter>
        <filter id="insetShadow">
            <feOffset dx="0" dy="4"/>
            <feGaussianBlur stdDeviation="4" result="offset-blur"/>
            <feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse"/>
            <feFlood floodColor="black" floodOpacity="0.2" result="color"/>
            <feComposite operator="in" in="color" in2="inverse" result="shadow"/>
            <feComposite operator="over" in="shadow" in2="SourceGraphic"/> 
        </filter>
      </defs>

      {/* --- BOARD CONTAINER (Game Boy / Tablet Style) --- */}
      <rect 
        id="game-board-bg"
        x="10" y="10" 
        width={GAME_CONFIG.canvasWidth - 20} 
        height={GAME_CONFIG.canvasHeight - 20} 
        rx="40" 
        fill="#FFFFFF" 
        stroke="#8B5CF6" 
        strokeWidth="12"
      />
      {/* Decorative inner line */}
      <rect 
        x="25" y="25" 
        width={GAME_CONFIG.canvasWidth - 50} 
        height={GAME_CONFIG.canvasHeight - 50} 
        rx="30" 
        fill="url(#dotPattern)" 
        opacity="0.5"
      />

      {/* --- HEADER DISPLAY --- */}
      <g id="header-area">
        {/* Bubble Background for Word */}
        <path 
            d="M 200 40 Q 500 10 800 40 L 800 160 Q 500 190 200 160 Z" 
            fill="#F3E8FF" 
            stroke="#C4B5FD" 
            strokeWidth="3"
        />
        
        {/* Emoji - Bouncing slightly */}
        <g transform="translate(500, 100)">
            <circle r="60" fill="white" filter="url(#plasticGlow)" opacity="0.8"/>
            <text 
                y="25" 
                fontSize="80" 
                textAnchor="middle" 
                style={{ filter: 'drop-shadow(0px 5px 0px rgba(0,0,0,0.1))' }}
                className="animate-[pulse_3s_infinite]"
            >
                {currentWordData.emoji || '✨'}
            </text>
        </g>
        
        {/* Hint Text */}
        <text 
            x="500" y="195" 
            fontSize="32" 
            fill="#6D28D9" 
            fontWeight="900" 
            textAnchor="middle" 
            fontFamily="Nunito"
            style={{ textShadow: '1px 1px 0px white' }}
        >
          {currentWordData.hint}
        </text>
        
        {/* Speaker Button - 3D Circle */}
        <g 
            className="cursor-pointer hover:scale-110 transition-transform" 
            onClick={() => playSound(currentWordData.word)}
            transform="translate(880, 70)"
        >
            <circle r="30" fill="#F472B6" stroke="white" strokeWidth="4" filter="url(#plasticGlow)" />
            <path d="M -6 -8 L -6 8 L 2 8 L 10 14 L 10 -14 L 2 -8 Z" fill="white" />
            <path d="M 14 -6 Q 18 0 14 6" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      </g>

      {/* --- SLOTS AREA --- */}
      <g id="slots-area">
        {slots.map((slot) => (
          <g 
            key={`slot-${slot.index}`} 
            onClick={() => handleSlotClick(slot)}
            className="cursor-pointer"
          >
            {/* Slot Recess (Hole in the board) */}
            <rect
              x={slot.x}
              y={slot.y}
              width={slot.width}
              height={slot.height}
              rx="16"
              fill="#E5E7EB"
              stroke={feedbackState === 'error' && slot.filledLetterId && letters.find(l=>l.id===slot.filledLetterId)?.char !== currentWordData.word[slot.index] ? '#EF4444' : '#D1D5DB'}
              strokeWidth={4}
              filter="url(#insetShadow)"
            />
            {/* Guide Text inside empty slot */}
            {!slot.filledLetterId && (
                 <text 
                    x={slot.x + slot.width/2} 
                    y={slot.y + slot.height/2 + 10} 
                    textAnchor="middle" 
                    fill="#9CA3AF" 
                    fontSize="40" 
                    opacity="0.3"
                    fontFamily="Nunito"
                    fontWeight="bold"
                 >
                    {currentWordData.word[slot.index]}
                 </text>
            )}
          </g>
        ))}
      </g>

      {/* --- SOURCE AREA (Bottom Shelf) --- */}
      <path 
        d={`M 50 400 Q ${GAME_CONFIG.canvasWidth/2} 380 ${GAME_CONFIG.canvasWidth - 50} 400 L ${GAME_CONFIG.canvasWidth - 30} 580 Q ${GAME_CONFIG.canvasWidth/2} 595 30 580 Z`}
        fill="#DDD6FE"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeDasharray="10, 10"
        opacity="0.5"
      />

      <g id="source-area">
         {letters.map((letter, i) => (
           <g
             id={`letter-${letter.id}`}
             key={letter.id}
             onClick={() => handleLetterClick(letter)}
             className={`letter-block`}
             style={{ 
                 cursor: letter.status === 'idle' ? 'pointer' : 'default',
             }}
             transform={`translate(${letter.x}, ${letter.y})`} 
           >
             {/* 3D Block Look */}
             <rect
                y="4"
                width={letter.width}
                height={letter.height}
                rx="16"
                fill="rgba(0,0,0,0.2)" /* Shadow */
             />
             <rect
                width={letter.width}
                height={letter.height}
                rx="16"
                fill={getColorForLetter(i)}
                stroke="white"
                strokeWidth="4"
                filter="url(#plasticGlow)" // Shiny plastic look
             />
             
             <text
                x={letter.width / 2}
                y={letter.height / 2 + 14} 
                fontSize="42"
                fontWeight="900"
                fill="white"
                textAnchor="middle"
                pointerEvents="none" 
                style={{ 
                    textShadow: '2px 2px 0px rgba(0,0,0,0.2)',
                    fontFamily: 'Nunito'
                }}
             >
                {letter.char}
             </text>
           </g>
         ))}
      </g>

      {/* --- FX LAYER --- */}
      <g pointerEvents="none">
          {[...Array(40)].map((_, i) => (
              <path
                key={i}
                className="success-star"
                d="M10 0 L13 7 L20 7 L15 12 L17 19 L10 15 L3 19 L5 12 L0 7 L7 7 Z"
                fill={['#FDE047', '#F472B6', '#60A5FA', '#A78BFA'][i % 4]}
                opacity="0"
              />
          ))}
      </g>

    </svg>
  );
};

export default GameSVG;