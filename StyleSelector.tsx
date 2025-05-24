import { ChevronDown } from 'lucide-react';

interface Style {
  id: string;
  name: string;
  emoji: string;
}

interface StyleSelectorProps {
  availableStyles: Style[];
  style: string;
  setStyle: (style: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const VOICE_STYLES: { [key: string]: { emoji: string } } = {
  conversational: { emoji: '😃' },
  professional: { emoji: '👔' },
  cheerful: { emoji: '🎉' },
  serious: { emoji: '🧐' },
  promo: { emoji: '📢' },
  calm: { emoji: '😌' },
  narration: { emoji: '📜' },
  storytelling: { emoji: '🎬' },
  sad: { emoji: '😔' },
  angry: { emoji: '😠' },
  newscast: { emoji: '📺' },
  documentary: { emoji: '📽️' },
  inspirational: { emoji: '💪' },
  luxury: { emoji: '👑' },
  terrified: { emoji: '😨' },
  furious: { emoji: '😤' },
  general: { emoji: '🙂' },
  casual: { emoji: '✌' },
  friendly: { emoji: '🤗' },
  excited: { emoji: '🤩' },
  affectionate: { emoji: '🫶🏻' },
  assistant: { emoji: '👨‍💼' },
  chat: { emoji: '💬' },
  customerservice: { emoji: '📞' },
  disgruntled: { emoji: '😒' },
  embarrassed: { emoji: '😅' },
  empathetic: { emoji: '🤝' },
  fearful: { emoji: '😨' },
  gentle: { emoji: '☀️' },
  hopeful: { emoji: '🤞' },
  lyrical: { emoji: '🎤' },
  'narration-professional': { emoji: '📜' },
  'newscast-casual': { emoji: '📺' },
  'newscast-formal': { emoji: '📺' },
  'poetry-reading': { emoji: '✍️' },
  shouting: { emoji: '🗣️' },
  unfriendly: { emoji: '😏' },
  whispering: { emoji: '🤫' },
  generic: { emoji: '⭐' },
  default: { emoji: '⭐' },
};

const StyleSelector: React.FC<StyleSelectorProps> = ({ availableStyles, style, setStyle, isOpen, onToggle }) => {
  const handleStyleChange = (newStyle: string) => {
    setStyle(newStyle);
    onToggle(); // Close dropdown after selection
  };

  return (
    <div className="relative flex-1">
      <div
        className="bg-gray-100 rounded-xl flex items-center px-4 py-2 cursor-pointer border border-gray-200 shadow-sm"
        onClick={onToggle}
      >
        <span className="mr-2 text-lg">{VOICE_STYLES[style.toLowerCase().replace(/\s/g, '')]?.emoji || '😃'}</span>
        <span className="text-sm font-medium text-gray-800 flex-1">{style}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-auto">
          {availableStyles.map((s) => (
            <div
              key={s.id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => handleStyleChange(s.name)}
            >
              <span className="mr-2 text-lg">{s.emoji}</span>
              <span className="text-sm text-gray-800">{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
