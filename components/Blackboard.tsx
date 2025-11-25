import React, { useState, useEffect } from 'react';
import { WordData } from '../types';
import { DEFAULT_WORDS } from '../constants';
// Added: Import GoogleGenAI SDK
import { GoogleGenAI, Type } from "@google/genai";

interface BlackboardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newWords: WordData[]) => void;
}

// Updated Presets with Chinese hints and the new format
const PRESETS = [
  { 
    name: '🐶 动物 (Animals)', 
    data: [
      "DOG：小狗 🐶",
      "CAT：小猫 🐱",
      "LION：狮子 🦁",
      "FISH：小鱼 🐟",
      "BIRD：小鸟 🐦",
      "PANDA：熊猫 🐼",
      "RABBIT：兔子 🐰"
    ]
  },
  { 
    name: '🎨 颜色 (Colors)', 
    data: [
      "RED：红色 🔴",
      "BLUE：蓝色 🔵",
      "GREEN：绿色 🟢",
      "YELLOW：黄色 🟡",
      "PURPLE：紫色 🟣",
      "ORANGE：橙色 🟠",
      "PINK：粉色 🌸"
    ]
  },
  { 
    name: '🍎 水果 (Fruits)', 
    data: [
      "APPLE：苹果 🍎",
      "BANANA：香蕉 🍌",
      "GRAPE：葡萄 🍇",
      "PEACH：桃子 🍑",
      "LEMON：柠檬 🍋",
      "MELON：哈密瓜 🍈"
    ]
  },
  { 
    name: '🔢 数字 (Numbers)', 
    data: [
      "ONE：数字一 1️⃣",
      "TWO：数字二 2️⃣",
      "THREE：数字三 3️⃣",
      "FOUR：数字四 4️⃣",
      "FIVE：数字五 5️⃣"
    ]
  },
  {
    name: '🏠 家庭 (Family)',
    data: [
      "MOM：妈妈 👩",
      "DAD：爸爸 👨",
      "BABY：宝宝 👶",
      "HOME：家 🏠",
      "LOVE：爱 ❤️"
    ]
  }
];

const Blackboard: React.FC<BlackboardProps> = ({ isOpen, onClose, onSave }) => {
  const [text, setText] = useState('');
  // Added: State for AI generation
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load current words from local storage or defaults to populate textarea
      const stored = localStorage.getItem('spelling_game_words');
      const wordsToLoad: WordData[] = stored ? JSON.parse(stored) : DEFAULT_WORDS;
      
      // Format: WORD：Hint
      const formatted = wordsToLoad
        .map(w => `${w.word}：${w.hint}`)
        .join('\n');
      setText(formatted);
    }
  }, [isOpen]);

  const handleSave = () => {
    const lines = text.split('\n');
    const newWords: WordData[] = [];
    const emojiRegex = /\p{Extended_Pictographic}/u; // Regex to find emojis
    
    lines.forEach((line, idx) => {
      // Support both Chinese colon '：' and English colon ':'
      const parts = line.split(/[:：]/).map(s => s.trim());
      
      if (parts.length >= 2 && parts[0].length > 0) {
        const word = parts[0].toUpperCase().replace(/[^A-Z]/g, ''); // Keep only letters for the word ID
        const hint = parts.slice(1).join('：'); // Rejoin rest in case hint has colons
        
        // Auto-detect emoji from the hint text for the big icon
        const emojiMatch = hint.match(emojiRegex);
        const emoji = emojiMatch ? emojiMatch[0] : '🌟'; // Default star if no emoji found

        newWords.push({
          id: `custom_${idx}_${Date.now()}`,
          word: word,
          hint: hint,
          emoji: emoji
        });
      }
    });

    if (newWords.length > 0) {
      onSave(newWords);
    } else {
      alert("请输入至少一行有效的单词，格式为：单词：提示 (例如：APPLE：苹果)");
    }
  };

  const handleClear = () => {
    if (window.confirm("确定要清空所有内容吗？")) {
      setText('');
    }
  };

  const appendPreset = (presetData: string[]) => {
    setText(prev => {
      const trimmed = prev.trim();
      return trimmed + (trimmed ? '\n' : '') + presetData.join('\n');
    });
  };

  // Added: Handle AI generation using Google GenAI
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 simple English words related to: "${aiPrompt}". 
        For kids. Return JSON.
        Each item: word (uppercase), hint (English meaning + Chinese translation), emoji.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                hint: { type: Type.STRING },
                emoji: { type: Type.STRING },
              },
              required: ['word', 'hint', 'emoji'],
            },
          },
        },
      });

      const data = JSON.parse(response.text || '[]');
      if (Array.isArray(data)) {
        const formatted = data.map((item: any) => `${item.word}：${item.hint} ${item.emoji}`);
        appendPreset(formatted);
        setAiPrompt('');
      }
    } catch (error) {
      console.error("AI Error:", error);
      alert('Failed to generate words. Check API Key.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Blackboard Container */}
      <div className="relative w-full max-w-3xl bg-[#2D3748] rounded-xl border-8 border-[#5D4037] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-[#4A5568] p-4 flex justify-between items-center border-b border-gray-600 shrink-0">
          <h2 className="text-white font-bold text-xl flex items-center gap-2">
             ✏️ 自定义单词 (Custom Words)
          </h2>
          <button onClick={onClose} className="text-gray-300 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Instructions */}
          <div className="bg-[#1A202C] p-3 rounded-lg border border-gray-600 shrink-0">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
              <div>
                <p className="text-gray-400 text-xs mb-1 font-mono uppercase tracking-wider">格式 Format</p>
                <p className="text-green-400 font-mono text-sm font-bold">单词：提示信息 (Word：Hint)</p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-gray-500 text-xs mt-1">例如 Example:</p>
                <p className="text-gray-400 text-xs font-mono">HAPPY：幸福的 😊</p>
              </div>
            </div>
          </div>

          {/* Added: AI Generation Bar */}
          <div className="flex gap-2 items-center bg-indigo-900/30 p-2 rounded-lg border border-indigo-500/30 shrink-0">
             <span className="text-indigo-300 text-xs font-bold uppercase tracking-wider ml-1 whitespace-nowrap">✨ AI Generate:</span>
             <input 
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerate()}
                placeholder="Enter topic (e.g. Space, Animals)..."
                className="flex-1 bg-indigo-950/60 text-white text-sm px-3 py-1 rounded border border-indigo-500/50 focus:border-indigo-400 focus:outline-none placeholder-indigo-400/50"
             />
             <button
                onClick={handleAiGenerate}
                disabled={isGenerating}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white text-xs font-bold px-4 py-1.5 rounded transition-colors whitespace-nowrap"
             >
                {isGenerating ? 'Thinking...' : 'Go'}
             </button>
          </div>

          {/* Quick Add Buttons */}
          <div className="flex flex-wrap gap-2 shrink-0">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider py-1 flex items-center mr-2">
              ⚡ 快速添加 (Quick Add):
            </span>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => appendPreset(preset.data)}
                className="px-3 py-1 rounded-full bg-indigo-600/80 hover:bg-indigo-500 text-xs text-white border border-indigo-400 transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full flex-1 bg-[#1A202C]/50 text-white font-mono text-lg border-2 border-dashed border-gray-500 rounded-lg p-4 focus:outline-none focus:border-green-400 focus:bg-[#1A202C] resize-none transition-colors leading-relaxed"
            placeholder="在此输入单词...\n格式：\nAPPLE：苹果\nBANANA：香蕉"
            spellCheck={false}
          />

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 mt-2 shrink-0">
             <button 
              onClick={handleClear}
              className="px-6 py-2 rounded-full bg-red-500/20 hover:bg-red-500 hover:text-white text-red-200 border border-red-500/50 font-bold transition-all active:scale-95 flex items-center gap-2"
            >
              🧹 清空 (Clear)
            </button>
            <button 
              onClick={handleSave}
              className="px-8 py-2 rounded-full bg-green-500 hover:bg-green-400 text-white font-bold shadow-[0_4px_14px_0_rgba(72,187,120,0.39)] hover:shadow-[0_6px_20px_rgba(72,187,120,0.23)] transition-all active:scale-95 flex items-center gap-2"
            >
              ✅ 保存并开始 (Save & Play)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Blackboard;