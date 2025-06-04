TTS WEBFLOW CODE:

<script>
(function ({
  languageTarget,
  voiceTarget,
  voiceStyleTarget,
  baseUrl,
  limit,
  editor,
  defaultVoiceId,
  defaultLanguage,
  defaultVoiceStyle,
  playerTarget,
  useCaseTarget,
  useCaseRenderTarget,
  useCaseDataTarget,
  maxCharacters = 500,
  languageSortOrder,
  voiceSortOrder,
  voiceStyleSortOrder,
  trialTarget,
  defaultUseCase,
  defaultUseCaseIndex = 0,
}) {
  const apiBaseUrl = baseUrl ?? "https://murf.ai/Prod";
  // Define local variables
  let voiceData = null;
  let apiDataLoaded = false;
  let selectedLanguage = null;
  let selectedVoice = {
    voiceId: defaultVoiceId,
  };
  let selectedVoiceStyle = defaultVoiceStyle;
  let player = new Audio();
  if (window.playerManager) {
    window.playerManager.registerPlayer(player);
  }
  let playerState = "idle"; // idle, playing, paused, loading,error,exhausted
  let playCount = 0;
  let selectedUseCase = defaultUseCase?.map((e) => e.toLowerCase());
  let selectedUseCaseIndex = defaultUseCaseIndex;
  let editorUpdateRequired = true;
  const playIcon = document.querySelector("#tts-play-icon");
  const pauseIcon = document.querySelector("#tts-pause-icon");
  const loaderIcon = document.querySelector("#tts-loader-icon");

  const VOICE_STYLES = {
    promo: { emoji: "📢" },
    conversational: { emoji: "😃" },
    calm: { emoji: "😌" },
    narration: { emoji: "📜" },
    storytelling: { emoji: "🎬" },
    sad: { emoji: "😔" },
    angry: { emoji: "😠" },
    newscast: { emoji: "📺" },
    documentary: { emoji: "📽️" },
    inspirational: { emoji: "💪" },
    luxury: { emoji: "👑" },
    terrified: { emoji: "😨" },
    furious: { emoji: "😤" },
    general: { emoji: "🙂" },
    casual: { emoji: "✌" },
    cheerful: { emoji: "😊" },
    friendly: { emoji: "🤗" },
    excited: { emoji: "🤩" },
    affectionate: { emoji: "🫶🏻" },
    assistant: { emoji: "👨‍💼" },
    chat: { emoji: "💬" },
    customerservice: { emoji: "📞" },
    disgruntled: { emoji: "😒" },
    embarrassed: { emoji: "😅" },
    empathetic: { emoji: "🤝" },
    fearful: { emoji: "😨" },
    gentle: { emoji: "☀️" },
    hopeful: { emoji: "🤞" },
    lyrical: { emoji: "🎤" },
    "narration-professional": { emoji: "📜" },
    "newscast-casual": { emoji: "📺" },
    "newscast-formal": { emoji: "📺" },
    "poetry-reading": { emoji: "✍️" },
    serious: { emoji: "😐" },
    shouting: { emoji: "🗣️" },
    unfriendly: { emoji: "😏" },
    whispering: { emoji: "🤫" },
    generic: { emoji: "⭐" },
    default: { emoji: "⭐" },
  };

  function setPlayIconVisibility(val) {
    if (val) {
      playIcon.style.display = "flex";
      //   $("#tts-play-icon").show();
    } else {
      playIcon.style.display = "none";
      //   $("#tts-play-icon").hide();
    }
  }

  function setPauseIconVisibility(val) {
    if (val) {
      //   $("#tts-pause-icon").show();
      pauseIcon.style.display = "flex";
    } else {
      //   $("#tts-pause-icon").hide();
      pauseIcon.style.display = "none";
    }
  }

  function setLoaderIconVisibility(val) {
    if (val) {
      //   $("#tts-loader-icon").show();
      loaderIcon.style.display = "flex";
    } else {
      //   $("#tts-loader-icon").hide();
      loaderIcon.style.display = "none";
    }
  }

  function resetPlayState() {
    if (playerState !== "exhausted" || playerState !== "error") {
      setPlayIconVisibility(true);
      setPauseIconVisibility(false);
      setLoaderIconVisibility(false);
      playerState = "idle";
      player.pause();
    }
  }

  function getSortedVoices() {
    const sorted = [
      ...selectedLanguage?.voices?.filter((voice) =>
        voiceSortOrder?.includes(voice.voiceId)
      ),
      ...selectedLanguage?.voices?.filter(
        (voice) => !voiceSortOrder?.includes(voice.voiceId)
      ),
    ].filter((voice) => voice.newEmphasisEnabled);

    const filtered = sorted.filter((voice) => {
      if (!selectedUseCase?.length) {
        return true;
      }
      return voice.useCases
        ?.map((e) => e?.toLowerCase())
        ?.some((e) => selectedUseCase?.includes(e));
    });
    if (filtered.length === 0) {
      return sorted;
    }
    return filtered;
  }

  function getSortedVoiceStyles() {
    return [
      ...selectedVoice?.voiceStyles?.filter((style) =>
        voiceStyleSortOrder
          .map((e) => e?.toLowerCase())
          ?.includes(style?.toLowerCase())
      ),
      ...selectedVoice?.voiceStyles?.filter(
        (style) =>
          !voiceStyleSortOrder
            .map((e) => e?.toLowerCase())
            ?.includes(style?.toLowerCase())
      ),
    ];
  }

  function fetchVoiceData() {
    fetch(`${apiBaseUrl}/ping/common-voices`)
      .then((response) => response.json())
      .then((data) => {
        if (data?.responseCode === "SUCCESS") {
          apiDataLoaded = true;
          voiceData = data.voiceGroups;
          if (languageSortOrder) {
            voiceData = [
              ...voiceData.filter((lang) =>
                languageSortOrder?.find(
                  (l) =>
                    l.language === lang.language && l.accent === lang.accent
                )
              ),
              ...voiceData.filter(
                (lang) =>
                  !languageSortOrder?.find(
                    (l) =>
                      l.language === lang.language && l.accent === lang.accent
                  )
              ),
            ];
          }
          selectedLanguage = voiceData?.[0];
          selectedVoice = getSortedVoices()?.[0];
          selectedVoiceStyle = getSortedVoiceStyles()?.[0];
          if (
            defaultLanguage &&
            voiceData?.findIndex(
              (language) =>
                language.language === defaultLanguage.language &&
                language.accent === defaultLanguage.accent
            ) !== -1
          ) {
            selectedLanguage = voiceData?.find(
              (language) =>
                language.language === defaultLanguage.language &&
                language.accent === defaultLanguage.accent
            );
          }
          if (
            defaultVoiceId &&
            selectedLanguage?.voices?.findIndex(
              (voice) => voice.voiceId === defaultVoiceId
            ) !== -1
          ) {
            selectedVoice = selectedLanguage?.voices?.find(
              (voice) => voice.voiceId === defaultVoiceId
            );
          }
          if (
            defaultVoiceStyle &&
            selectedVoice?.voiceStyles?.findIndex(
              (voiceStyle) => voiceStyle === defaultVoiceStyle
            ) !== -1
          ) {
            selectedVoiceStyle = defaultVoiceStyle;
          }
          renderUseCases();
          renderLanguages();
          renderVoices();
          renderVoiceStyles();
        }
      })
      .catch((error) => {
        console.error("Error loading voice data:", error);
      });
  }

  function handleLanguageSelection(language) {
    murflib.ReactGA.eventGA4("TTS Try Language Select", {
      "Page url": window.location.pathname,
      language: language.language,
      accent: language.accent,
    });
    selectedLanguage = language;
    selectedVoice = getSortedVoices()?.[0];
    selectedVoiceStyle = getSortedVoiceStyles()?.[0];
    renderLanguages();
    renderVoices();
    renderVoiceStyles();
    resetPlayState();
    renderUseCases();
    const languageTargetElement = document.querySelector(languageTarget);

    languageTargetElement
      .querySelector(".mf-dropdown-list")
      .classList.remove("w--open");
    languageTargetElement
      .querySelector(".mf-dropdown-btn")
      .classList.remove("w--open");
  }

  function handleVoiceSelection(voice) {
    murflib.ReactGA.eventGA4("TTS Try Voice Select", {
      "Page url": window.location.pathname,
      voiceId: voice.voiceId,
      voiceName: voice.voiceName,
    });
    selectedVoice = voice;
    selectedVoiceStyle = getSortedVoiceStyles()?.[0];
    resetPlayState();
    renderVoices();
    renderVoiceStyles();
    const voiceTargetElement = document.querySelector(voiceTarget);
    voiceTargetElement
      .querySelector(".mf-dropdown-list")
      .classList.remove("w--open");
    voiceTargetElement
      .querySelector(".mf-dropdown-btn")
      .classList.remove("w--open");
  }

  function handleVoiceStyleSelection(voiceStyle) {
    murflib.ReactGA.eventGA4("TTS Try Style Select", {
      "Page url": window.location.pathname,
      style: voiceStyle,
    });
    selectedVoiceStyle = voiceStyle;
    resetPlayState();
    renderVoiceStyles();
    const voiceStyleTargetElement = document.querySelector(voiceStyleTarget);
    voiceStyleTargetElement
      .querySelector(".mf-dropdown-list")
      .classList.remove("w--open");
    voiceStyleTargetElement
      .querySelector(".mf-dropdown-btn")
      .classList.remove("w--open");
  }

  function renderLanguages() {
    if (!apiDataLoaded) {
      return;
    }
    const languageTargetElement = document.querySelector(languageTarget);
    if (!languageTargetElement) {
      console.error("Language target not found");
      return;
    }

    const languageListElement =
      languageTargetElement.querySelector(".mf-dropdown-list");
    const selectTextElement = languageTargetElement.querySelector(
      ".mf-dropdown-btn-text"
    );
    const selectImageElement = languageTargetElement.querySelector(
      ".mf-dropdown-avatar img"
    );

    selectTextElement.textContent = `${selectedLanguage.language} ${
      selectedLanguage?.accent ? "- " + selectedLanguage?.accent : ""
    }`;
    if (selectImageElement) {
      selectImageElement.src = `https://murf.ai/public-assets/countries/${selectedLanguage.flagName}.svg`;
      selectImageElement.alt = selectedLanguage.language;
    }
    if (languageListElement) {
      const lastNodes = [];
      Array.from(languageListElement.childNodes).forEach((node) => {
        if (!node.classList.contains("mf-dropdown-list-item")) {
          lastNodes.push(node);
        }
      });
      languageListElement.innerHTML = "";

      voiceData.forEach((language, index) => {
        const isSelected =
          language.language === selectedLanguage.language &&
          language.accent === selectedLanguage.accent;
        if (!isSelected && limit && index >= limit) return;
        const languageElement = document.createElement("div");
        languageElement.classList.add("mf-dropdown-list-item");
        if (isSelected) {
          languageElement.classList.add("mf-selected");
        }
        languageElement.innerHTML = `
          <div class="mf-dropdown-avatar">
            <img width="32" height="32" src="https://murf.ai/public-assets/countries/${
              language.flagName
            }.svg" alt="${language.language}" loading="lazy">
          </div>
          <div class="mf-list-item-title">
            <div class="mf-primary-text">${language.language} ${
          language.accent ? "- " + language.accent : ""
        }</div>
            <div class="mf-secondary-text">${language.language} ${
          language.accent ? "- " + language.accent : ""
        }</div>
          </div>
        `;
        languageElement.onclick = () => handleLanguageSelection(language);
        languageListElement.appendChild(languageElement);
      });
      languageListElement.append(...lastNodes);
    }
  }

  function renderVoices() {
    if (!apiDataLoaded) {
      return;
    }
    const voiceTargetElement = document.querySelector(voiceTarget);
    if (!voiceTargetElement) {
      console.error("Voice target not found");
      return;
    }
    const voiceListElement =
      voiceTargetElement.querySelector(".mf-dropdown-list");
    const selectTextElement = voiceTargetElement.querySelector(
      ".mf-dropdown-btn-text"
    );
    const selectImageElement = voiceTargetElement.querySelector(
      ".mf-dropdown-avatar img"
    );
    selectTextElement.textContent = selectedVoice.voiceName;
    if (selectImageElement) {
      selectImageElement.src = `https://murf.ai/public-assets/home/avatars/${selectedVoice.avatar}.jpg`;
      selectImageElement.alt = selectedVoice.avatar;
    }
    if (voiceListElement) {
      const lastNodes = [];
      Array.from(voiceListElement.childNodes).forEach((node) => {
        if (!node.classList.contains("mf-dropdown-list-item")) {
          lastNodes.push(node);
        }
      });
      voiceListElement.innerHTML = "";

      const sortedVoices = getSortedVoices();

      sortedVoices?.forEach((voice, index) => {
        const isSelected = voice.voiceId === selectedVoice.voiceId;
        if (!isSelected && limit && index >= limit) return;
        const voiceElement = document.createElement("div");
        voiceElement.classList.add("mf-dropdown-list-item");
        if (isSelected) {
          voiceElement.classList.add("mf-selected");
        }
        voiceElement.innerHTML = `
          <div class="mf-dropdown-avatar">
            <img width="32" height="32" src="https://murf.ai/public-assets/home/avatars/${voice.avatar}.jpg" alt="${voice.avatar}" loading="lazy">
          </div>
          <div class="mf-list-item-title">
            <div class="mf-primary-text">${voice.voiceName}</div>
          </div>
        `;
        voiceElement.onclick = () => handleVoiceSelection(voice);
        voiceListElement.appendChild(voiceElement);
      });
      voiceListElement.append(...lastNodes);
    }
  }

  function renderVoiceStyles() {
    if (!apiDataLoaded) {
      return;
    }
    const voiceStyleTargetElement = document.querySelector(voiceStyleTarget);
    if (!voiceStyleTargetElement) {
      console.error("Voice style target not found");
      return;
    }
    if (selectedVoice?.voiceStyles?.length === 0) {
      $(voiceStyleTargetElement).hide();
      return;
    } else {
      $(voiceStyleTargetElement).show();
    }
    const voiceStyleListElement =
      voiceStyleTargetElement.querySelector(".mf-dropdown-list");
    const selectTextElement = voiceStyleTargetElement.querySelector(
      ".mf-dropdown-btn-text"
    );
    selectTextElement.textContent = selectedVoiceStyle;
    const selectImageAvatar = voiceStyleTargetElement.querySelector(
      ".mf-dropdown-avatar"
    );
    if (selectImageAvatar) {
      selectImageAvatar.innerHTML = `<div>${
        VOICE_STYLES[selectedVoiceStyle?.toLowerCase()?.replaceAll(" ", "")]
          ?.emoji ?? "😊"
      }</div>`;
    }

    if (voiceStyleListElement) {
      const lastNodes = [];
      Array.from(voiceStyleListElement.childNodes).forEach((node) => {
        if (!node.classList.contains("mf-dropdown-list-item")) {
          lastNodes.push(node);
        }
      });
      voiceStyleListElement.innerHTML = "";
      const sortedVoiceStyles = getSortedVoiceStyles();
      sortedVoiceStyles?.forEach((voiceStyle, index) => {
        const isSelected = voiceStyle === selectedVoiceStyle;
        if (!isSelected && limit && index >= limit) return;
        const voiceStyleElement = document.createElement("div");
        voiceStyleElement.classList.add("mf-dropdown-list-item");
        if (isSelected) {
          voiceStyleElement.classList.add("mf-selected");
        }
        voiceStyleElement.innerHTML = `
          <div class="mf-dropdown-avatar">
            <div>${
              VOICE_STYLES[voiceStyle?.toLowerCase()?.replaceAll(" ", "")]
                ?.emoji ?? "😊"
            }</div>
          </div>
          <div class="mf-list-item-title">
            <div class="mf-primary-text">${voiceStyle}</div>
          </div>
        `;
        voiceStyleElement.onclick = () => handleVoiceStyleSelection(voiceStyle);
        voiceStyleListElement.appendChild(voiceStyleElement);
      });
      voiceStyleListElement.append(...lastNodes);
    }
  }

  function showError(loadingError) {
    $(trialTarget).css("display", "flex");
    if (loadingError) {
      $(trialTarget + " #tts-try-error").css("display", "block");
    }
  }

  player.addEventListener("loadstart", () => {
    murflib.ReactGA.eventGA4("TTS Try Play Pause", {
      "Page url": window.location.pathname,
    });
    playerState = "loading";
    setPauseIconVisibility(false);
    setLoaderIconVisibility(true);
    setPlayIconVisibility(false);
  });

  player.addEventListener("error", (e) => {
    resetPlayState();
    playerState = "error";
    showError(true);
  });
  player.addEventListener("canplay", () => {
    playerState = "playing";
    player.play();
    setPauseIconVisibility(true);
    setLoaderIconVisibility(false);
    setPlayIconVisibility(false);
  });

  player.addEventListener("ended", () => {
    playerState = "paused";
    setPauseIconVisibility(false);
    setLoaderIconVisibility(false);
    setPlayIconVisibility(true);
  });

  player.addEventListener("pause", () => {
    setPauseIconVisibility(false);
    setLoaderIconVisibility(false);
    setPlayIconVisibility(true);
  });

  player.addEventListener("play", () => {
    setPauseIconVisibility(true);
    setLoaderIconVisibility(false);
    setPlayIconVisibility(false);
  });

  fetchVoiceData();

  $(playerTarget).click(() => {
    if (playerState === "idle") {
      if (playCount > 5) {
        showError();
        return;
      }
      const text = $.trim($(editor).text());
      if (!text) {
        return;
      }
      const params = new URLSearchParams({
        text,
        voiceId: selectedVoice.voiceId,
        style: selectedVoiceStyle,
      });
      const url = `${apiBaseUrl}/anonymous-tts/audio?` + params.toString();
      player.src = url;
      player.load();
      playCount += 1;
    } else if (playerState === "playing") {
      murflib.ReactGA.eventGA4("TTS Try Play Pause", {
        "Page url": window.location.pathname,
      });
      player.pause();
      setPauseIconVisibility(true);
      setLoaderIconVisibility(false);
      setPlayIconVisibility(false);
      playerState = "paused";
    } else if (playerState === "paused") {
      murflib.ReactGA.eventGA4("TTS Try Play Pause", {
        "Page url": window.location.pathname,
      });
      player.play();
      setPauseIconVisibility(false);
      setLoaderIconVisibility(false);
      setPlayIconVisibility(true);
      playerState = "playing";
    }
  });

  function useCaseTargetClick() {
    const useCase = $(this).data("content");
    const voiceId = $(this).data("voice");
    const voiceStyle = $(this).data("voice-style");
    selectedUseCaseIndex = $(this).index();
    murflib.ReactGA.eventGA4("TTS Try Usecase Select", {
      "Page url": window.location.pathname,
      useCase: $(this).html(),
    });
    resetPlayState();
    editorUpdateRequired = true;
    $(editor).html(useCase);
    $(this).addClass("select");
    $(useCaseTarget).not(this).removeClass("select");
    $("#character-counter").text(
      $(editor).text().length + " / " + maxCharacters
    );
    selectedUseCase = $(this)
      .data("value")
      ?.split(",")
      ?.map((e) => e?.toLowerCase()?.trim());

    if (voiceId) {
      let newLang = voiceData?.find((language) =>
        language.voices?.find((voice) => voice.voiceId === voiceId)
      );
      let newVoice = newLang?.voices?.find(
        (voice) => voice.voiceId === voiceId
      );
      let newVoiceStyle = newVoice?.voiceStyles?.find(
        (style) => style === voiceStyle
      );

      if (newVoice) {
        selectedLanguage = newLang;
        selectedVoice = newVoice;
        selectedVoiceStyle = newVoiceStyle ?? newVoice?.voiceStyles?.[0];
        renderLanguages(true);
      }
    } else {
      selectedVoice = getSortedVoices()?.[0];

      let newVoiceStyle = selectedVoice?.voiceStyles?.find(
        (style) => style === voiceStyle
      );
      selectedVoiceStyle = newVoiceStyle ?? getSortedVoiceStyles()?.[0];
    }
    renderVoices();
    renderVoiceStyles();
  }

  function addUseCaseEventListeners() {
    $(useCaseTarget).off("click", useCaseTargetClick);
    $(useCaseTarget).click(useCaseTargetClick);
  }

  $(editor).bind("input", function (event) {
    editorUpdateRequired = false;
    let t = $(this).text(),
      e = t.length;
    resetPlayState();
    if (e > maxCharacters) {
      $("#character-counter").addClass("over");
      t = t.substring(0, maxCharacters);
      e = t.length;
      $(this).text(t);
      $(this).blur();
    } else {
      $("#character-counter").removeClass("over");
    }
    char = e + " / " + maxCharacters;
    $("#character-counter").text(char);
  });

  $(editor).blur(() => {
    murflib.ReactGA.eventGA4("TTS Try Enter Text", {
      "Page url": window.location.pathname,
    });
  });

  $("#character-counter").text($(editor).text().length + " / " + maxCharacters);

  function renderUseCases() {
    if (!apiDataLoaded) {
      return;
    }
    const useCaseDataElement = document.querySelector(useCaseDataTarget);
    const useCaseRenderElement = document.querySelector(useCaseRenderTarget);
    if (!useCaseDataElement || !useCaseRenderElement) {
      return;
    }
    let useCases = useCaseDataElement.querySelector(
      `#${selectedLanguage?.language ?? "default"}`
    );
    if (!useCases) {
      useCases = useCaseDataElement.querySelector("#default");
    }
    if (useCases) {
      useCaseRenderElement.innerHTML = useCases.innerHTML;
      let currentText = useCaseRenderElement.querySelector(
        ".tts-tab-name:nth-child(" + (selectedUseCaseIndex + 1) + ")"
      );
      if (!currentText) {
        currentText = useCaseRenderElement.querySelector(
          ".tts-tab-name:nth-child(1)"
        );
      }
      currentText.classList.add("select");
      if (editorUpdateRequired) {
        $(editor).html(currentText.getAttribute("data-content"));
        $("#character-counter").text(
          $(editor).text().length + " / " + maxCharacters
        );
      }
      selectedUseCase = currentText
        .getAttribute("data-value")
        ?.split(",")
        ?.map((e) => e?.toLowerCase()?.trim());

      addUseCaseEventListeners();
    }
  }

  addUseCaseEventListeners();
})({
  languageTarget: "#language-dropdown",
  voiceTarget: "#voice-dropdown",
  useCaseRenderTarget: "#tts-tool-tab",
  useCaseTarget: "#tts-tool-tab .tts-tab-name",
  useCaseDataTarget: "#use-cases-data",
  voiceStyleTarget: "#voice-style-dropdown",
  baseUrl: "https://murf.ai/Prod",
  editor: "#tts-editor",
  limit: 5,
  playerTarget: "#play-tts-preview",
  defaultLanguage: {
    accent: "US & Canada",
    language: "English",
  },
  defaultVoiceId: "VM016372341539042UZ",
  defaultVoiceStyle: "Conversational",
  defaultUseCase: ["E-Learning & Presentations", "Documentary"],
  voiceSortOrder: [
    "VM016372341539042UZ",
    "VM0164121392130292Q",
    "VM016922560137864CI",
    "VM016683248292834O9",
    "VM016665209547179OF",
    "VM016665209547153OB",
    "VM0170140941037743D",
    "VM016989906305189FR",
    "VM01698990630618719",
    "VM016989906306046TP",
  ],
  voiceStyleSortOrder: [
    "Inspirational",
    "Conversational",
    "Narration",
    "Promo",
    "Luxury",
  ],
  languageSortOrder: [
    {
      accent: "US & Canada",
      language: "English",
    },
    {
      accent: "UK",
      language: "English",
    },
    {
      accent: "",
      language: "German",
    },
    {
      accent: "Australia",
      language: "English",
    },
    {
      accent: "Spain",
      language: "Spanish",
    },
  ],
  trialTarget: "#tts-try-message",
  defaultUseCaseIndex: 0,
});
</script>
