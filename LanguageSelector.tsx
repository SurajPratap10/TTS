import { ChevronDown } from 'lucide-react';

interface Language {
  language: string;
  accent: string;
  flagName: string;
  voices: Voice[];
}

interface Voice {
  voiceId: string;
  voiceName: string;
  ageGroup?: string;
  avatar: string;
  useCases?: string[];
  voiceStyles: string[];
}

interface LanguageSelectorProps {
  voiceData: Language[];
  language: string;
  setLanguage: (language: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ voiceData, language, setLanguage, isOpen, onToggle }) => {
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    onToggle(); // Close dropdown after selection
  };

  return (
    <div className="relative flex-1">
      <div
        className="bg-gray-100 rounded-xl flex items-center px-4 py-2 cursor-pointer border border-gray-200 shadow-sm"
        onClick={onToggle}
      >
        <span className="mr-2 text-lg">
          {voiceData.find((lang) => `${lang.language}${lang.accent ? ' - ' + lang.accent : ''}` === language)?.flagName ? (
            <img
              src={`https://murf.ai/public-assets/countries/${
                voiceData.find((lang) => `${lang.language}${lang.accent ? ' - ' + lang.accent : ''}` === language)?.flagName
              }.svg`}
              alt={language}
              className="w-7 h-7"
            />
          ) : (
            '🌐'
          )}
        </span>
        <span className="text-sm font-medium text-gray-800 flex-1">{language}</span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      {isOpen && (
        <div className="absolute mt-2 w-full bg-white rounded-xl shadow-lg z-10 py-1 max-h-60 overflow-auto">
          {voiceData.map((lang) => (
            <div
              key={`${lang.language}-${lang.accent}`}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center"
              onClick={() => handleLanguageChange(`${lang.language}${lang.accent ? ' - ' + lang.accent : ''}`)}
            >
              <span className="mr-2 text-lg">
                {lang.flagName ? (
                  <img src={`https://murf.ai/public-assets/countries/${lang.flagName}.svg`} alt={lang.language} className="w-7 h-7" />
                ) : (
                  '🌐'
                )}
              </span>
              <span className="text-sm text-gray-800">{`${lang.language}${lang.accent ? ' - ' + lang.accent : ''}`}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
