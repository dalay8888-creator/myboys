import React, { useState, useEffect } from 'react';
import GameSVG from './components/GameSVG';
import Blackboard from './components/Blackboard';
import { WordData } from './types';
import { DEFAULT_WORDS, COLORS } from './constants';

const App: React.FC = () => {
  const [words, setWords] = useState<WordData[]>(DEFAULT_WORDS);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isBlackboardOpen, setIsBlackboardOpen] = useState(false);
  const [triggerNext, setTriggerNext] = useState(false);

  // Load words from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem('spelling_game_words');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWords(parsed);
        }
      } catch (e) {
        console.error("Failed to load custom words", e);
      }
    }
  }, []);

  const handleNextLevel = () => {
    setCurrentWordIndex((prev) => (prev + 1) % words.length);
    setTriggerNext(t => !t);
  };

  const handleSaveCustomWords = (newWords: WordData[]) => {
    setWords(newWords);
    localStorage.setItem('spelling_game_words', JSON.stringify(newWords));
    setIsBlackboardOpen(false);
    setCurrentWordIndex(0);
    setTriggerNext(t => !t);
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-300">
      
      {/* --- Creative Background Elements --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Big Blobs */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-purple-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating Stars/Planets */}
        <div className="absolute top-20 left-[15%] text-4xl animate-float opacity-80">🪐</div>
        <div className="absolute top-40 right-[10%] text-3xl animate-float-reverse opacity-60">🚀</div>
        <div className="absolute bottom-20 left-[5%] text-5xl animate-float opacity-50">☁️</div>
        <div className="absolute bottom-40 right-[15%] text-5xl animate-float-reverse opacity-50">☁️</div>
        
        {/* Tiny Sparkles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-pulse-glow"></div>
        <div className="absolute top-1/3 right-1/3 w-3 h-3 bg-white rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* --- Header / Logo Area --- */}
      <div className="relative z-10 w-full flex flex-col items-center pt-4 sm:pt-8 pb-2">
        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-wider transform -rotate-2 drop-shadow-[0_5px_5px_rgba(0,0,0,0.3)] stroke-black" style={{ textShadow: '3px 3px 0px #7C3AED, 6px 6px 0px rgba(0,0,0,0.2)' }}>
          <span className="inline-block animate-[bounce_2s_infinite]">✨</span>
          <span className="mx-2">闪星单词</span>
          <span className="inline-block animate-[bounce_2s_infinite]" style={{ animationDelay: '0.1s' }}>✨</span>
        </h1>
        <p className="text-white/90 font-bold mt-2 text-sm sm:text-base bg-white/20 px-4 py-1 rounded-full backdrop-blur-sm border border-white/30">
          Twinkle Star Words
        </p>
      </div>

      {/* --- Main Game Area --- */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-2 sm:px-4">
        
        {/* Editor Button (Floating Top Right) */}
        <button 
          onClick={() => setIsBlackboardOpen(true)}
          className="absolute top-0 right-2 sm:right-8 bg-white border-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:scale-110 hover:rotate-3 transition-all duration-300 rounded-2xl p-3 shadow-xl group z-50"
          title="打开单词编辑器"
        >
          <div className="flex flex-col items-center leading-none">
            <span className="text-2xl group-hover:animate-wiggle">✏️</span>
            <span className="text-[10px] font-black mt-1 uppercase">DIY</span>
          </div>
        </button>

        {/* The Game SVG Container */}
        <div className="mt-4 w-full max-w-5xl animate-float">
          <GameSVG 
            currentWordData={words[currentWordIndex]} 
            onWordComplete={handleNextLevel}
            triggerNextWord={triggerNext}
          />
        </div>

        {/* Creative Progress Bar */}
        <div className="mt-6 bg-white/20 backdrop-blur-md rounded-full p-2 border border-white/30 flex gap-3 shadow-lg">
           {words.map((_, i) => (
              <div 
                  key={i}
                  className={`transition-all duration-500 flex items-center justify-center rounded-full
                      ${i === currentWordIndex 
                          ? 'w-10 h-10 bg-yellow-400 scale-110 shadow-[0_0_15px_rgba(250,204,21,0.6)] rotate-12' 
                          : i < currentWordIndex 
                             ? 'w-6 h-6 bg-green-400 opacity-80' 
                             : 'w-6 h-6 bg-white/40'
                      }`}
              >
                  {i === currentWordIndex ? '⭐' : i < currentWordIndex ? '✓' : ''}
              </div>
           ))}
        </div>
      </div>

      <Blackboard 
        isOpen={isBlackboardOpen} 
        onClose={() => setIsBlackboardOpen(false)}
        onSave={handleSaveCustomWords}
      />
    </div>
  );
};

export default App;