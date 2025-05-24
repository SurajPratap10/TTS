interface Voice {
  voiceId: string;
  voiceName: string;
  ageGroup?: string;
  avatar: string;
  useCases?: string[];
  voiceStyles: string[];
}

interface VoiceCardProps {
  voice: Voice;
  selectedVoice: Voice | null;
  handleVoiceChange: (voice: Voice) => void;
}

const VoiceCard: React.FC<VoiceCardProps> = ({ voice, selectedVoice, handleVoiceChange }) => (
  <div className="flex flex-col items-center" onClick={() => handleVoiceChange(voice)}>
    <div
      className={`relative rounded-full bg-gray-100 border-transparent transition-all duration-300 cursor-pointer w-[80px] h-[80px] mb-2 ${
        selectedVoice?.voiceId === voice.voiceId ? 'border-purple-500 ring-4 ring-purple-400 bg-gray-200' : ''
      }`}
    >
      <div className="rounded-full overflow-hidden w-full h-full">
        <img
          src={`https://murf.ai/public-assets/home/avatars/${voice.avatar}.jpg`}
          alt={voice.voiceName}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute top-0 right-0 w-8 h-8 rounded-full border-2 border-white flex items-center justify-center translate-x-2 -translate-y-3">
        <img src="https://murf.ai/public-assets/v2-assets/icons/globe.svg" alt="Globe" className="w-8 h-8" />
      </div>
    </div>
    <h3 className="text-sm font-medium text-gray-800 text-center">{voice.voiceName}</h3>
    <p className="text-sm text-gray-500 text-center">{voice.ageGroup || 'Unknown'}</p>
  </div>
);

export default VoiceCard;
