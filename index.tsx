import { render } from 'preact';
import { useState, useRef, useEffect, useMemo, useCallback } from 'preact/hooks';
import { Lightbulb, X } from 'lucide-react';
import { BUTTON_TEXTS } from '../../components/ScriptTypes';
import ScriptTypeSelector from '../../components/ScriptTypeSelector';
import LanguageSelector from '../../components/LanguageSelector';
import StyleSelector, { VOICE_STYLES } from '../../components/StyleSelector';
import VoiceCard from '../../components/VoiceCard';
import PlayAudio from '../../components/PlayAudio';
import { Notification } from '../../components/Notification';
import './index.css';
import { formatLanguageAccent, Language, Voice } from '../../utils/misc';

type TextToSpeechIslandProps = {};

const TextToSpeechComponent = () => {
  const [selectedVoice, setSelectedVoice] = useState<Voice | null>(null);
  const [text, setText] = useState<string>(BUTTON_TEXTS.lecture['English - US & Canada']);
  const [language, setLanguage] = useState<string>('English - US & Canada');
  const [style, setStyle] = useState<string>('Conversational');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLightbulbActive, setIsLightbulbActive] = useState<boolean>(false);
  const [voiceData, setVoiceData] = useState<Language[]>([]);
  const [apiDataLoaded, setApiDataLoaded] = useState<boolean>(false);
  const [selectedButton, setSelectedButton] = useState<string>('lecture');
  const [currentPlayingVoiceId, setCurrentPlayingVoiceId] = useState<string | null>(null);
  const [activeButton, setActiveButton] = useState<string | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isTextManuallyEntered, setIsTextManuallyEntered] = useState<boolean>(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxChars = 500;
  const baseUrl = 'https://murf.ai/Prod';

  const filteredVoices = useMemo(
    () =>
      voiceData
        .find((lang) => formatLanguageAccent(lang) === language)
        ?.voices.filter((voice) => voice.voiceStyles.includes(style)) || [],
    [voiceData, language, style]
  );

  const availableStyles = useMemo(
    () =>
      selectedVoice
        ? selectedVoice.voiceStyles.map((s) => ({
            id: s.toLowerCase().replace(/\s/g, ''),
            name: s,
            emoji: VOICE_STYLES[s.toLowerCase().replace(/\s/g, '')]?.emoji || '⭐',
          }))
        : Array.from(
            new Set(
              voiceData
                .find((lang) => formatLanguageAccent(lang) === language)
                ?.voices.flatMap((voice) => voice.voiceStyles) || []
            )
          ).map((s) => ({
            id: s.toLowerCase().replace(/\s/g, ''),
            name: s,
            emoji: VOICE_STYLES[s.toLowerCase().replace(/\s/g, '')]?.emoji || '⭐',
          })),
    [selectedVoice, voiceData, language]
  );

  const stopCurrentAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.removeEventListener('ended', handleAudioEnd);
      audioRef.current = null;
    }
    setIsPlaying(false);
    setCurrentPlayingVoiceId(null);
  }, []);

  const handleAudioEnd = useCallback(() => {
    setIsPlaying(false);
    setIsLoading(false);
    setCurrentPlayingVoiceId(null);
    setActiveButton(null);
  }, []);

  const handleLightbulb = useCallback(() => {
    setIsLightbulbActive((prev) => {
      if (!prev) {
        setIsTextManuallyEntered(false);
      }
      return !prev;
    });
  }, []);

  const handleVoiceChange = useCallback(
    (voice: Voice) => {
      stopCurrentAudio();
      setIsLoading(false);
      setSelectedVoice(voice);
      setActiveButton(null);
      if (!voice.voiceStyles.includes(style)) {
        setStyle(voice.voiceStyles[0] || 'Conversational');
      }
    },
    [style, stopCurrentAudio]
  );

  const playAudio = useCallback(
    async (audioText: string, voiceId: string) => {
      try {
        stopCurrentAudio();
        setIsLoading(false);
        
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          text: audioText.trim(),
          voiceId,
          style,
        });
        const url = `${baseUrl}/anonymous-tts/audio?${params.toString()}`;

        const newAudio = new Audio(url);
        audioRef.current = newAudio;
        setCurrentPlayingVoiceId(voiceId);

        newAudio.addEventListener(
          'canplay',
          () => {
            if (audioRef.current === newAudio) {
              setIsLoading(false);
              setIsPlaying(true);
              newAudio.play().catch((err) => {
                setError('Failed to play audio: ' + err.message);
                setIsLoading(false);
              });
            }
          },
          { once: true }
        );

        newAudio.addEventListener('ended', handleAudioEnd);
        newAudio.addEventListener('error', () => {
          if (audioRef.current === newAudio) {
            setError('Failed to generate audio. Please try again later.');
            setIsLoading(false);
            setIsPlaying(false);
            setCurrentPlayingVoiceId(null);
          }
        });

        newAudio.load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while generating audio');
        setIsLoading(false);
      }
    },
    [style, stopCurrentAudio, handleAudioEnd]
  );

  const handleButtonClick = useCallback(
    (buttonType: string) => {
      if (activeButton && activeButton !== buttonType) {
        return;
      }
      setSelectedButton(buttonType);
      setText(BUTTON_TEXTS[buttonType][language] || BUTTON_TEXTS[buttonType]['English - US & Canada']);
      setIsTextManuallyEntered(false);
      if (selectedVoice) {
        setActiveButton(buttonType);
        setTimeout(() => {
          playAudio(BUTTON_TEXTS[buttonType][language] || BUTTON_TEXTS[buttonType]['English - US & Canada'], selectedVoice.voiceId);
        }, 10);
      }
    },
    [selectedVoice, playAudio, activeButton, language]
  );

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.currentTarget.value);
    setIsTextManuallyEntered(true);
  }, []);

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setLanguage(newLanguage);
      const selectedLang = voiceData.find((lang) => formatLanguageAccent(lang) === newLanguage);
      if (selectedLang) {
        const defaultVoice = selectedLang.voices.find((voice) => voice.voiceStyles.includes(style)) || selectedLang.voices[0];
        setSelectedVoice(defaultVoice);
        setStyle(defaultVoice?.voiceStyles.includes(style) ? style : defaultVoice?.voiceStyles[0] || 'Conversational');
        if (!isTextManuallyEntered && text === (BUTTON_TEXTS[selectedButton][language] || BUTTON_TEXTS[selectedButton]['English - US & Canada'])) {
          const newText = BUTTON_TEXTS[selectedButton][newLanguage] || BUTTON_TEXTS[selectedButton]['English - US & Canada'];
          setText(newText);
        }
        stopCurrentAudio();
        setActiveButton(null);
      }
    },
    [voiceData, style, selectedButton, language, text, stopCurrentAudio, isTextManuallyEntered]
  );

  const handlePlay = useCallback(
    async () => {
      if (!selectedVoice || !text.trim()) {
        setError('Please select a voice and enter text');
        return;
      }
      if (!selectedVoice.voiceStyles.includes(style)) {
        setError('Selected style is not supported by this voice');
        return;
      }
      if (isPlaying && currentPlayingVoiceId === selectedVoice.voiceId) {
        stopCurrentAudio();
        setActiveButton(null);
        return;
      }
      if (audioRef.current && currentPlayingVoiceId !== selectedVoice.voiceId) {
        stopCurrentAudio();
        setActiveButton(null);
      }
      await playAudio(text, selectedVoice.voiceId);
    },
    [selectedVoice, text, style, isPlaying, currentPlayingVoiceId, stopCurrentAudio, playAudio]
  );

  useEffect(() => {
    if (isLightbulbActive && activeButton && ['lecture', 'story', 'advertisement', 'podcast'].includes(activeButton)) {
      setText(BUTTON_TEXTS[activeButton][language] || BUTTON_TEXTS[activeButton]['English - US & Canada']);
      setIsTextManuallyEntered(false);
    }
  }, [language, isLightbulbActive, activeButton]);

  useEffect(() => {
    const fetchVoiceData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`${baseUrl}/ping/common-voices`);
        const data = await response.json();
        if (data?.responseCode === 'SUCCESS') {
          const filteredVoiceGroups = data.voiceGroups
            .map((lang: Language) => ({
              ...lang,
              voices: lang.voices.filter((voice: Voice) => voice.voiceId.startsWith('VM')),
            }))
            .filter((lang: Language) => lang.voices.length > 0);

          setVoiceData(filteredVoiceGroups);
          setApiDataLoaded(true);

          const defaultLanguage =
            filteredVoiceGroups.find((lang: Language) => formatLanguageAccent(lang) === 'English - US & Canada') ||
            filteredVoiceGroups[0];
          setLanguage(formatLanguageAccent(defaultLanguage));
          const defaultVoice =
            defaultLanguage.voices.find((voice: Voice) => voice.voiceId.startsWith('VM')) || defaultLanguage.voices[0];
          setSelectedVoice(defaultVoice);
          setStyle(defaultVoice?.voiceStyles[0] || 'Conversational');
        } else {
          setError('Failed to load voice data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching voice data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoiceData();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const charCount: number = text.length;

  const handleCloseNotification = () => {
    setError(null);
  };

  return (
    <>
      <div
        className="flex justify-center items-center w-full bg-transparent"
        style={{
          fontFamily: "'Inter', sans-serif",
          lineHeight: 1.5,
          fontWeight: 400,
          fontSynthesis: 'none',
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        <div className="hidden lg:block relative rounded-3xl gradient-border-sx p-0.5 max-w-6xl w-full">
          <div className="bg-white pt-6 pl-6 pr-6 rounded-3xl shadow-lg">
            <div className="relative flex flex-row gap-6">
              <div className="w-1/2 pr-6">
                <div className="flex items-center gap-4 mb-4">
                  <LanguageSelector
                    voiceData={voiceData}
                    language={language}
                    setLanguage={handleLanguageChange}
                    isOpen={openDropdown === 'language'}
                    onToggle={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                  />
                  <StyleSelector
                    availableStyles={availableStyles}
                    style={style}
                    setStyle={setStyle}
                    isOpen={openDropdown === 'style'}
                    onToggle={() => setOpenDropdown(openDropdown === 'style' ? null : 'style')}
                  />
                </div>
                {error && <Notification message={error} type="error" onClose={handleCloseNotification} />}
                {isLightbulbActive ? (
                  <div className="relative mb-6 overflow-hidden rounded-xl">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={() => setOpenDropdown(null)}
                        maxLength={maxChars}
                        className="w-full h-96 p-4 border-none focus:ring-0 outline-none resize-none text-lg text-gray-800 leading-relaxed"
                        placeholder="Type or paste your text here..."
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}
                      />
                      <div className="absolute bottom-0 left-0 p-2 w-[420px] bg-gray-100 bg-opacity-90 rounded-xl">
                        <ScriptTypeSelector
                          selectedButton={selectedButton}
                          activeButton={activeButton}
                          handleButtonClick={handleButtonClick}
                          view="pc"
                        />
                      </div>
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 p-2">{charCount}/{maxChars}</div>
                    </div>
                  </div>
                ) : (
                  <div className="relative mb-6 overflow-hidden rounded-xl">
                    <div className="relative">
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={() => setOpenDropdown(null)}
                        maxLength={maxChars}
                        className="w-full h-96 p-4 border-none focus:ring-0 outline-none resize-none text-lg text-gray-800 leading-relaxed"
                        placeholder="Type or paste your text here..."
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}
                      />
                      <div className="absolute bottom-0 right-0 text-xs text-gray-500 p-2">{charCount}/{maxChars}</div>
                    </div>
                  </div>
                )}
                <div className="flex justify-between items-center mb-7">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleLightbulb}
                      className="flex items-center justify-center w-10 h-10 mt-4 rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
                    >
                      {isLightbulbActive ? <X size={18} /> : <Lightbulb size={18} />}
                    </button>
                  </div>
                  <PlayAudio
                    isLoading={isLoading}
                    isPlaying={isPlaying}
                    currentPlayingVoiceId={currentPlayingVoiceId}
                    selectedVoice={selectedVoice}
                    handlePlay={handlePlay}
                    apiDataLoaded={apiDataLoaded}
                  />
                </div>
              </div>
              <div className="w-1/2 pl-6">
                <div className="relative">
                  <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white to-transparent z-10 pointer-events-none"></div>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent z-10 pointer-events-none"></div>
                  <div className="max-h-[560px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}>
                    <div className="grid grid-cols-4 gap-2 pt-2">
                      {filteredVoices.map((voice) => (
                        <VoiceCard key={voice.voiceId} voice={voice} selectedVoice={selectedVoice} handleVoiceChange={handleVoiceChange} />
                      ))}
                    </div>
                    <p className="text-sm text-center text-black-500 mt-16">
                      Explore 120+ voices & advanced Controls in{' '}
                      <a href="https://murf.ai/studio" className="text-black-500">
                        Murf Studio
                      </a>
                    </p>
                    <div className="mt-4 mb-4 flex justify-center">
                      <a
                        href="https://murf.ai/studio"
                        className="flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-[#FC6337] to-[#C516E1] text-white text-sm font-bold shadow-md hover:shadow-lg transition-sensor-all duration-300 z-20"
                      >
                        Open Murf Studio
                        <svg className="ml-2" width="16" height="17" viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path
                            d="M10.7071 3.79289C10.3166 3.40237 9.68342 3.40237 9.29289 3.79289C8.90237 4.18342 8.90237 4.81658 9.29289 5.20711L11.5858 7.50004L2 7.5C1.44772 7.5 1 7.94771 1 8.5C0.999998 9.05228 1.44771 9.5 2 9.5L11.5857 9.50004L9.29289 11.7929C8.90237 12.1834 8.90237 12.8166 9.29289 13.2071C9.68342 13.5976 10.3166 13.5976 10.7071 13.2071L14.7012 9.21297C14.7224 9.19218 14.7426 9.17045 14.7618 9.14787C14.8255 9.07317 14.8764 8.99133 14.9145 8.90521C14.9691 8.78221 14.9996 8.64616 15 8.50303C15 8.50005 15 8.49696 15 8.49388 15 8.49079 14.9988 8.36635 14.975 8.24733 14.9323 8.13769 14.8836 8.01206 14.8085 7.8943 14.7071 7.79289 10.7071 3.79289Z"
                            fill="white"
                          />
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {error && <Notification message={error} type="error" onClose={handleCloseNotification} />}
          </div>
        </div>
        <div className="hidden md:block lg:hidden relative rounded-3xl gradient-border-sx p-0.5 max-w-3xl w-full">
          <div className="bg-white p-4 rounded-3xl shadow-lg">
            <div className="relative">
              {error && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 50 }}>
                  <Notification message={error} type="error" onClose={handleCloseNotification} />
                </div>
              )}
              <div className="space-y-2">
                <div className="flex items-center mb-4 gap-4">
                  <LanguageSelector
                    voiceData={voiceData}
                    language={language}
                    setLanguage={handleLanguageChange}
                    isOpen={openDropdown === 'language'}
                    onToggle={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                  />
                  <StyleSelector
                    availableStyles={availableStyles}
                    style={style}
                    setStyle={setStyle}
                    isOpen={openDropdown === 'style'}
                    onToggle={() => setOpenDropdown(openDropdown === 'style' ? null : 'style')}
                  />
                </div>
                <div className="swipe-container">
                  {filteredVoices.map((voice) => (
                    <VoiceCard key={voice.voiceId} voice={voice} selectedVoice={selectedVoice} handleVoiceChange={handleVoiceChange} />
                  ))}
                </div>
                <p className="text-sm text-center text-gray-500">
                  Explore 120+ voices & advanced Controls in{' '}
                  <a href="https://murf.ai/studio" className="text-gray-500 underline">
                    Murf Studio
                  </a>
                </p>
                <div className="relative overflow-hidden rounded-xl h-[270px]">
                  <div className="relative h-full">
                    {isLightbulbActive ? (
                      <div className="p-4 h-full">
                        <p className="text-lg text-gray-800 leading-relaxed mb-2">{text}</p>
                      </div>
                    ) : (
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={() => setOpenDropdown(null)}
                        maxLength={maxChars}
                        className="w-full h-64 p-4 border-none focus:ring-0 outline-none resize-none text-lg text-gray-800 leading-relaxed"
                        placeholder="Type or paste your text here..."
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}
                      />
                    )}
                    {isLightbulbActive && (
                      <div className="absolute bottom-0 w-[630px] text-lg text-gray-800 leading-relaxed left-0 p-2 bg-gray-100 rounded-xl">
                        <ScriptTypeSelector
                          selectedButton={selectedButton}
                          activeButton={activeButton}
                          handleButtonClick={handleButtonClick}
                          view="tablet"
                        />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10">{charCount}/{maxChars}</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleLightbulb}
                      className="flex items-center justify-center w-10 h-10 mt-4 rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
                    >
                      {isLightbulbActive ? <X size={18} /> : <Lightbulb size={18} />}
                    </button>
                  </div>
                  <PlayAudio
                    isLoading={isLoading}
                    isPlaying={isPlaying}
                    currentPlayingVoiceId={currentPlayingVoiceId}
                    selectedVoice={selectedVoice}
                    handlePlay={handlePlay}
                    apiDataLoaded={apiDataLoaded}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="md:hidden relative rounded-3xl gradient-border-sx p-0.5 max-w-sm w-full">
          <div className="bg-white p-2 rounded-3xl shadow-lg">
            <div className="relative">
              {error && (
                <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', zIndex: 50 }}>
                  <Notification message={error} type="error" onClose={handleCloseNotification} />
                </div>
              )}
              <div className="space-y-2">
                <LanguageSelector
                  voiceData={voiceData}
                  language={language}
                  setLanguage={handleLanguageChange}
                  isOpen={openDropdown === 'language'}
                  onToggle={() => setOpenDropdown(openDropdown === 'language' ? null : 'language')}
                />
                <StyleSelector
                  availableStyles={availableStyles}
                  style={style}
                  setStyle={setStyle}
                  isOpen={openDropdown === 'style'}
                  onToggle={() => setOpenDropdown(openDropdown === 'style' ? null : 'style')}
                />
                <div className="swipe-container">
                  {filteredVoices.map((voice) => (
                    <VoiceCard key={voice.voiceId} voice={voice} selectedVoice={selectedVoice} handleVoiceChange={handleVoiceChange} />
                  ))}
                </div>
                <p className="text-xs text-center text-gray-500">
                  Explore 120+ voices & advanced Controls in{' '}
                  <a href="https://murf.ai/studio" className="text-gray-500 underline">
                    Murf Studio
                  </a>
                </p>
                <div className="relative rounded-xl h-[280px] overflow-y-auto">
                  <div className="relative h-full flex flex-col">
                    {isLightbulbActive ? (
                      <div className="p-4 flex-1 overflow-y-auto">
                        <p className="text-lg text-gray-800 leading-relaxed">{text}</p>
                      </div>
                    ) : (
                      <textarea
                        ref={textareaRef}
                        value={text}
                        onChange={handleTextChange}
                        onFocus={() => setOpenDropdown(null)}
                        maxLength={maxChars}
                        className="w-full flex-1 p-4 border-none focus:ring-0 outline-none text-lg text-gray-800 leading-relaxed"
                        placeholder="Type or paste your text here..."
                        style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1', resize: 'none' }}
                      />
                    )}
                    {isLightbulbActive && (
                      <div className="absolute bottom-0 w-[240px] left-0 p-2 bg-gray-100 rounded-xl">
                        <ScriptTypeSelector
                          selectedButton={selectedButton}
                          activeButton={activeButton}
                          handleButtonClick={handleButtonClick}
                          view="mobile"
                        />
                      </div>
                    )}
                    <div className="absolute bottom-2 right-2 text-xs text-gray-500 z-10">{charCount}/{maxChars}</div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={handleLightbulb}
                      className="flex items-center justify-center w-10 h-10 rounded-xl mt-2 bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
                    >
                      {isLightbulbActive ? <X size={18} /> : <Lightbulb size={18} />}
                    </button>
                  </div>
                  <PlayAudio
                    isLoading={isLoading}
                    isPlaying={isPlaying}
                    currentPlayingVoiceId={currentPlayingVoiceId}
                    selectedVoice={selectedVoice}
                    handlePlay={handlePlay}
                    apiDataLoaded={apiDataLoaded}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

const TextToSpeechIsland = (el: HTMLElement, props: TextToSpeechIslandProps) => {
  render(<TextToSpeechComponent {...props} />, el);
};

export default TextToSpeechIsland;
