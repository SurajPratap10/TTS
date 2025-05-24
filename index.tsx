import { render } from 'preact';
import { useState, useRef, useEffect, useMemo, useCallback } from 'preact/hooks';
import {Lightbulb, X } from 'lucide-react';
import { BUTTON_TEXTS } from '../../components/ButtonTexts';
import LanguageSelector from '../../components/LanguageSelector';
import StyleSelector from '../../components/StyleSelector';
import VoiceCard from '../../components/VoiceCard';
import PlayAudio from '../../components/PlayAudio';
import './index.css';

interface Voice {
  voiceId: string;
  voiceName: string;
  ageGroup?: string;
  avatar: string;
  useCases?: string[];
  voiceStyles: string[];
}

interface Language {
  language: string;
  accent: string;
  flagName: string;
  voices: Voice[];
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

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const maxChars = 500;
  const baseUrl = 'https://murf.ai/Prod';

  const filteredVoices = useMemo(
    () =>
      voiceData
        .find((lang) => `${lang.language}${lang.accent ? ' - ' + lang.accent : ''}` === language)
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
                .find((lang) => `${lang.language}${lang.accent ? ' - ' + lang.accent : ''}` === language)
                ?.voices.flatMap((voice) => voice.voiceStyles) || []
            )
          ).map((s) => ({
            id: s.toLowerCase().replace(/\s/g, ''),
            name: s,
            emoji: VOICE_STYLES[s.toLowerCase().replace(/\s/g, '')]?.emoji || '⭐',
          })),
    [selectedVoice, voiceData, language]
  );

  // Handlers
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
    setActiveButton(null); // Re-enable all buttons
  }, []);

  const handleLightbulb = useCallback(() => {
    setIsLightbulbActive((prev) => {
      const newState = !prev;
      setSelectedButton('lecture');
      setText(BUTTON_TEXTS.lecture[language] || BUTTON_TEXTS.lecture['English - US & Canada']);
      return newState;
    });
  }, [language]);

  const playAudio = useCallback(
    async (audioText: string, voiceId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          text: audioText.trim(),
          voiceId,
          style,
        });
        const url = `${baseUrl}/anonymous-tts/audio?${params.toString()}`;

        stopCurrentAudio();

        const newAudio = new Audio(url);
        audioRef.current = newAudio;
        setCurrentPlayingVoiceId(voiceId);

        newAudio.addEventListener(
          'canplay',
          () => {
            setIsLoading(false);
            setIsPlaying(true);
            newAudio.play().catch((err) => {
              setError('Failed to play audio: ' + err.message);
              setIsLoading(false);
            });
          },
          { once: true }
        );

        newAudio.addEventListener('ended', handleAudioEnd);
        newAudio.addEventListener('error', () => {
          setError('Failed to load audio');
          setIsLoading(false);
          setIsPlaying(false);
          setCurrentPlayingVoiceId(null);
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
        return; // Do nothing if another button's audio is playing
      }
      setSelectedButton(buttonType);
      setText(BUTTON_TEXTS[buttonType][language] || BUTTON_TEXTS[buttonType]['English - US & Canada']);
      if (selectedVoice) {
        setActiveButton(buttonType); // Set the active button
        setTimeout(() => {
          playAudio(BUTTON_TEXTS[buttonType][language] || BUTTON_TEXTS[buttonType]['English - US & Canada'], selectedVoice.voiceId);
        }, 10);
      }
    },
    [selectedVoice, playAudio, activeButton, language]
  );

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  }, []);

  const handleVoiceChange = useCallback(
    (voice: Voice) => {
      stopCurrentAudio();
      setSelectedVoice(voice);
      if (!voice.voiceStyles.includes(style)) {
        setStyle(voice.voiceStyles[0] || 'Conversational');
      }
    },
    [style, stopCurrentAudio]
  );

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      setLanguage(newLanguage);
      const selectedLang = voiceData.find(
        (lang) => `${lang.language}${lang.accent ? ' - ' + lang.accent : ''}` === newLanguage
      );
      if (selectedLang) {
        const defaultVoice = selectedLang.voices.find((voice) => voice.voiceStyles.includes(style)) || selectedLang.voices[0];
        setSelectedVoice(defaultVoice);
        setStyle(defaultVoice?.voiceStyles.includes(style) ? style : defaultVoice?.voiceStyles[0] || 'Conversational');
        // Update text based on lightbulb state
        if (isLightbulbActive && ['lecture', 'story', 'advertisement', 'podcast'].includes(selectedButton)) {
          setText(BUTTON_TEXTS[selectedButton][newLanguage] || BUTTON_TEXTS[selectedButton]['English - US & Canada']);
        } else {
          setText(BUTTON_TEXTS.lecture[newLanguage] || BUTTON_TEXTS.lecture['English - US & Canada']);
        }
      }
    },
    [voiceData, style, isLightbulbActive, selectedButton]
  );

  const handlePlay = useCallback(async () => {
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
  }, [selectedVoice, text, style, isPlaying, currentPlayingVoiceId, stopCurrentAudio, playAudio]);

  useEffect(() => {
    if (isLightbulbActive && ['lecture', 'story', 'advertisement', 'podcast'].includes(selectedButton)) {
      setText(BUTTON_TEXTS[selectedButton][language] || BUTTON_TEXTS[selectedButton]['English - US & Canada']);
    }
  }, [language, isLightbulbActive, selectedButton]);

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
            filteredVoiceGroups.find((lang: Language) => lang.language === 'English' && lang.accent === 'US & Canada') ||
            filteredVoiceGroups[0];
          setLanguage(`${defaultLanguage.language}${defaultLanguage.accent ? ' - ' + defaultLanguage.accent : ''}`);
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

  return (
    <div
      className="flex justify-center items-center w-full min-h-screen bg-transparent p-4"
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
      <div className="hidden lg:block relative rounded-3xl gradient-border-tx p-0.5 max-w-6xl w-full">
        <div className="bg-white p-8 rounded-3xl shadow-lg">
          <div className="relative flex flex-row gap-6">
            <div className="w-1/2 pr-6">
              <div className="flex items-center gap-4 mb-6">
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
              {error && <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}
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
                    <div className="absolute bottom-0 left-0 p-2 bg-gray-100 bg-opacity-90 rounded-xl">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                            selectedButton === 'lecture' && activeButton === 'lecture'
                              ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                              : selectedButton === 'lecture'
                              ? 'bg-gray-200 text-primary hover:bg-gray-300'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          onClick={() => handleButtonClick('lecture')}
                          disabled={activeButton !== null && activeButton !== 'lecture'}
                        >
                          <span className="text-lg">🎓</span>Training Module
                        </button>
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                            selectedButton === 'story' && activeButton === 'story'
                              ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                              : selectedButton === 'story'
                              ? 'bg-gray-200 text-primary'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          onClick={() => handleButtonClick('story')}
                          disabled={activeButton !== null && activeButton !== 'story'}
                        >
                          <span className="text-lg">🎥</span>Narrate a Story
                        </button>
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                            selectedButton === 'advertisement' && activeButton === 'advertisement'
                              ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                              : selectedButton === 'advertisement'
                              ? 'bg-gray-200 text-primary'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          onClick={() => handleButtonClick('advertisement')}
                          disabled={activeButton !== null && activeButton !== 'advertisement'}
                        >
                          <span className="text-lg">👀</span>Advertisement
                        </button>
                        <button
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                            selectedButton === 'podcast' && activeButton === 'podcast'
                              ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                              : selectedButton === 'podcast'
                              ? 'bg-gray-200 text-primary'
                              : 'bg-gray-200 hover:bg-gray-300'
                          }`}
                          onClick={() => handleButtonClick('podcast')}
                          disabled={activeButton !== null && activeButton !== 'podcast'}
                        >
                          <span className="text-lg">🎙️</span>Intro to a Podcast
                        </button>
                      </div>
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
              <div className="flex justify-between items-center mt-4">
                <div className="flex gap-2 items-center">
                  <button
                    onClick={handleLightbulb}
                    className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
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
              <div className="max-h-[560px] overflow-y-auto py-4" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}>
                <div className="grid grid-cols-4 gap-4">
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
                <div className="mt-4 flex justify-center">
                  <a
                    href="https://murf.ai/studio"
                    className="flex items-center px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-pink-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    Open Murf Studio
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:block lg:hidden relative rounded-3xl gradient-border-tx p-0.5 max-w-3xl w-full">
        <div className="bg-white p-4 rounded-3xl shadow-lg">
          <div className="relative space-y-2">
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
            {error && <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}
            {isLightbulbActive ? (
              <div className="relative overflow-hidden rounded-xl">
                <div className="relative">
                  <div className="p-4">
                    <p className="text-lg text-gray-800 leading-relaxed">{text}</p>
                  </div>
                  <div className="absolute bottom-1 left-0 p-2 bg-gray-100 rounded-xl">
                    <div className="grid grid-cols-3 gap-2 mb-2">
                      <button
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'lecture' && activeButton === 'lecture'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'lecture'
                            ? 'bg-gray-200 text-primary hover:bg-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('lecture')}
                        disabled={activeButton !== null && activeButton !== 'lecture'}
                      >
                        <span className="text-lg">🎓</span>Training Module
                      </button>
                      <button
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'story' && activeButton === 'story'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'story'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('story')}
                        disabled={activeButton !== null && activeButton !== 'story'}
                      >
                        <span className="text-lg">🎥</span>Narrate a Story
                      </button>
                      <button
                        className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'advertisement' && activeButton === 'advertisement'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'advertisement'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('advertisement')}
                        disabled={activeButton !== null && activeButton !== 'advertisement'}
                      >
                        <span className="text-lg">👀</span>Advertisement
                      </button>
                    </div>
                    <div className="w-full">
                      <button
                        className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'podcast' && activeButton === 'podcast'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'podcast'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('podcast')}
                        disabled={activeButton !== null && activeButton !== 'podcast'}
                      >
                        <span className="text-lg">🎙️</span>Intro to a Podcast
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-right text-gray-500 mt-26 mr-2">{charCount}/{maxChars}</div>
                </div>
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-xl">
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onFocus={() => setOpenDropdown(null)}
                    maxLength={maxChars}
                    className="w-full h-32 p-4 border-none focus:ring-0 outline-none resize-none text-lg text-gray-800 leading-relaxed"
                    placeholder="Type or paste your text here..."
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1 bouwen' }}
                  />
                  <div className="text-xs text-right text-gray-500 mr-2">{charCount}/{maxChars}</div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleLightbulb}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
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
      <div className="md:hidden relative rounded-3xl gradient-border-tx p-0.5 max-w-sm w-full">
        <div className="bg-white p-4 rounded-3xl shadow-lg">
          <div className="relative space-y-4">
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
            <p className="text-sm text-center text-gray-500">
              Explore 120+ voices & advanced Controls in{' '}
              <a href="https://murf.ai/studio" className="text-gray-500 underline">
                Murf Studio
              </a>
            </p>
            {error && <div className="mb-4 p-4 bg-red-100 text-red-800 rounded-xl text-sm">{error}</div>}
            {isLightbulbActive ? (
              <div className="relative mb-6 overflow-hidden rounded-xl">
                <div className="relative">
                  <div className="p-4">
                    <p className="text-lg text-gray-800 leading-relaxed">{text}</p>
                  </div>
                  <div className="absolute bottom-0 left-0 p-2 bg-gray-100 rounded-xl gap-2">
                    <div className="flex flex-col gap-2">
                      <button
                        className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'lecture' && activeButton === 'lecture'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'lecture'
                            ? 'bg-gray-200 text-primary hover:bg-gray-300'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('lecture')}
                        disabled={activeButton !== null && activeButton !== 'lecture'}
                      >
                        <span className="text-lg">🎓</span>Training Module
                      </button>
                      <button
                        className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'story' && activeButton === 'story'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'story'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('story')}
                        disabled={activeButton !== null && activeButton !== 'story'}
                      >
                        <span className="text-lg">🎥</span>Narrate a Story
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        className={`flex items-center gap-2 w-full px-4 py-3 mt-2 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'advertisement' && activeButton === 'advertisement'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'advertisement'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('advertisement')}
                        disabled={activeButton !== null && activeButton !== 'advertisement'}
                      >
                        <span className="text-lg">👀</span>Advertisement
                      </button>
                      <button
                        className={`flex items-center gap-2 w-full px-4 py-3 rounded-xl text-sm text-gray-800 font-medium transition-all duration-300 ${
                          selectedButton === 'podcast' && activeButton === 'podcast'
                            ? 'bg-gradient-to-r from-purple-600 to-violet-300 text-white'
                            : selectedButton === 'podcast'
                            ? 'bg-gray-200 text-primary'
                            : 'bg-gray-200 hover:bg-gray-300'
                        }`}
                        onClick={() => handleButtonClick('podcast')}
                        disabled={activeButton !== null && activeButton !== 'podcast'}
                      >
                        <span className="text-lg">🎙️</span>Intro to a Podcast
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-right text-gray-500 mt-6 mr-2">{charCount}/{maxChars}</div>
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
                    className="w-full h-48 p-4 border-none focus:ring-0 outline-none resize-none text-lg text-gray-800 leading-relaxed"
                    placeholder="Type or paste your text here..."
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db #f1f1f1' }}
                  />
                  <div className="text-xs text-right text-gray-500 mt-2 mr-2">{charCount}/{maxChars}</div>
                </div>
              </div>
            )}
            <div className="flex justify-between items-center">
              <div className="flex gap-2 items-center">
                <button
                  onClick={handleLightbulb}
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 hover:bg-gray-200 border border-gray-200 shadow-sm"
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
  );
};

const TextToSpeechIsland = (el: HTMLElement, props: TextToSpeechIslandProps) => {
  render(<TextToSpeechComponent {...props} />, el);
};

export { TextToSpeechComponent };
export default TextToSpeechIsland;
