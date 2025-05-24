import { Loader, Play, Pause } from 'lucide-react';

interface PlayAudioProps {
  isLoading: boolean;
  isPlaying: boolean;
  currentPlayingVoiceId: string | null;
  selectedVoice: { voiceId: string } | null;
  handlePlay: () => void;
  apiDataLoaded: boolean;
}

const PlayAudio = ({ isLoading, isPlaying, currentPlayingVoiceId, selectedVoice, handlePlay, apiDataLoaded }: PlayAudioProps) => {
  return (
    <button
      className="flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg hover:shadow-xl transition-all duration-300"
      onClick={handlePlay}
      disabled={isLoading || !apiDataLoaded}
    >
      {isLoading ? (
        <Loader size={24} className="animate-spin" />
      ) : isPlaying && currentPlayingVoiceId === selectedVoice?.voiceId ? (
        <Pause size={24} fill="white" />
      ) : (
        <Play size={24} fill="white" className="ml-1" />
      )}
    </button>
  );
};

export default PlayAudio;
