export const work = () => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const greeting = document.getElementById("greeting");
  if (!greeting) return;
  
  const phrases = [
    { first: "hi,", second: "i'm ben." },
    { first: "안녕,", second: "저는 벤." },
    { first: "bonjour,", second: "je suis ben." },
    { first: "hola,", second: "me llamo ben." },
  ];
  const projectsPhrase = { first: "work", second: "" };
  const moduleWorkJsonUrl = new URL("./work.json", import.meta.url).href;
  const workDataPaths = ["/api/work", moduleWorkJsonUrl, "./lib/work.json", "lib/work.json"];
  const currentWorkYear = String(new Date().getFullYear());
  const partAnimMs = 520;
  const partDelayMs = 300;
  const partOutDelayMs = 300;
  const startDelayMs = 1400;
  const rotationIntervalMs = 3400;
  const introAnimClearMs = 2100;
  const labelSwapMs = 220;
  const mainLinkBaseDelayMs = 580;
  const mainLinkStaggerMs = 180;
  const workLinkTransitionSettleMs = 360;
  const workFilterRevealSettleMs = 360;
  const resumeMinimumScale = 0.001;
  const resumeGrowDurationMs = 920;
  const resumeShrinkDurationMs = 760;
  const resumeHoldDurationMs = 140;
  const resumeFadeLerp = 0.12;
  const resumeOpacitySnapThreshold = 0.02;
  const nameRegex = /\bben\b|벤/gi;
  const waveEmoji = "👋";
  const byNewestYearThenName = (left, right) =>
    right.year - left.year || left.name.localeCompare(right.name);
  const svgNamespace = "http://www.w3.org/2000/svg";
  
  let index = 0;
  let remainingSteps = phrases.length;
  let secondPartInTimer = null;
  let secondPartOutTimer = null;
  let outAnimationTimer = null;
  let cycleTimer = null;
  let cycleDeadlineMs = null;
  let pausedCycleDelayMs = null;
  let labelSwapTimer = null;
  let projectsOpen = false;
  let restoredPhrase = null;
  let workProjects = [];
  let selectedWorkYear = currentWorkYear;
  let workLinksLockedHeightPx = 0;
  let workFilterLabelSwapTimer = null;
  let workFilterLabelShowCleanupTimer = null;
  let workFilterSquiggleTimer = null;
  let workFilterRevealTimer = null;
  let workLinksEnterDelayResetTimer = null;
  let focusedBeforeModal = null;
  let focusedBeforeResume = null;
  let activeProjectImageRequestId = 0;
  let isResumeTransitioning = false;
  let waveRainSpawnTimer = null;
  let waveRainStopTimer = null;
  let waveRainCleanupTimer = null;
  let waveRainGeneration = 0;
  let waveRainActiveParticles = 0;
  let waveRainShouldDeactivate = false;
  let waveRainIsEnding = false;
  const projectScreenshotPreloadCache = new Map();
  const lerp = (startValue, endValue, amount) =>
    startValue + (endValue - startValue) * amount;
  const smootherStep = (value) =>
    value * value * value * (value * (value * 6 - 15) + 10);
  const getFrameLerpAmount = (baseAmount, deltaTimeMs) => {
    const normalizedFrames = Math.max(0.5, deltaTimeMs / (1000 / 60));
    return 1 - Math.pow(1 - baseAmount, normalizedFrames);
  };

  const createNameSquiggle = () => {
    const svg = document.createElementNS(svgNamespace, "svg");
    svg.classList.add("name-squiggle");
    svg.setAttribute("viewBox", "0 0 120 16");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute(
      "d",
      "M1 9 C6 9 6 3 13 3 C20 3 20 9 27 9 C34 9 34 3 41 3 C48 3 48 9 55 9 C62 9 62 3 69 3 C76 3 76 9 83 9 C90 9 90 3 97 3 C104 3 104 9 111 9 C116 9 118 6 119 5"
    );
    svg.appendChild(path);
    return svg;
  };

  const renderSecondPartMarkup = (value) => {
    const fragment = document.createDocumentFragment();
    const sourceText = String(value ?? "");
    let lastIndex = 0;

    for (const match of sourceText.matchAll(nameRegex)) {
      const matchIndex = match.index ?? 0;
      if (matchIndex > lastIndex) {
        fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex, matchIndex)));
      }

      const nameWrapper = document.createElement("span");
      nameWrapper.className = "name-with-squiggle";

      const nameText = document.createElement("span");
      nameText.className = "name-text";
      nameText.textContent = match[0];

      nameWrapper.append(nameText, createNameSquiggle());
      fragment.appendChild(nameWrapper);
      lastIndex = matchIndex + match[0].length;
    }

    if (lastIndex < sourceText.length) {
      fragment.appendChild(document.createTextNode(sourceText.slice(lastIndex)));
    }

    return fragment;
  };

  const buildGreetingParts = () => {
    const first = document.createElement("span");
    first.className = "greeting-part greeting-first";

    const second = document.createElement("span");
    second.className = "greeting-part greeting-second";

    greeting.replaceChildren(first, second);
    return [first, second];
  };

  const [firstPart, secondPart] = buildGreetingParts();
  greeting.tabIndex = 0;
  greeting.setAttribute("role", "button");
  greeting.setAttribute("aria-label", "hello. click to start wave rain");
  const projectsToggle = document.getElementById("projects-toggle");
  const projectsLabel = projectsToggle?.querySelector(".projects-label") ?? null;
  const resumeLink = document.getElementById("resume-link");
  const secondaryLinks = Array.from(document.querySelectorAll("[data-secondary-link]"));
  const workLinksContainer = document.getElementById("work-links");
  const workFilter = document.getElementById("work-filter");
  const workFilterToggle = document.getElementById("work-filter-toggle");
  const workFilterMenu = document.getElementById("work-filter-menu");
  const workFilterYearLabel = document.getElementById("work-filter-current-year");
  const mainContent = document.querySelector("main");
  const themeToggle = document.getElementById("theme-toggle");
  const resumeScreen = document.getElementById("resume-screen");
  const resumePhotoImage = document.querySelector(".resume-photo-image");
  const resumeLocationImage = document.querySelector(".resume-location-image");
  const projectModal = document.getElementById("project-modal");
  const projectModalBackdrop = projectModal?.querySelector(".project-modal-backdrop") ?? null;
  const projectModalClose = document.getElementById("project-modal-close");
  const projectModalTitle = document.getElementById("project-modal-title");
  const projectModalTitleDisplay = document.getElementById("project-modal-title-display");
  const projectModalYearDisplay = document.getElementById("project-modal-year-display");
  const projectModalTitleMarquee = document.getElementById("project-modal-title-marquee");
  const projectModalTitleRunA = document.getElementById("project-modal-title-run-a");
  const projectModalTitleRunB = document.getElementById("project-modal-title-run-b");
  const projectModalMedia = document.getElementById("project-modal-media");
  const projectModalImage = document.getElementById("project-modal-image");
  const projectModalPlaceholder =
    projectModal?.querySelector(".project-modal-placeholder") ?? null;
  const projectModalDescription = document.getElementById("project-modal-description");
  const projectModalButtons = document.getElementById("project-modal-buttons");
  if (!firstPart || !secondPart) return;

  const waveRainLayer = document.createElement("div");
  waveRainLayer.className = "wave-rain";
  waveRainLayer.setAttribute("aria-hidden", "true");
  document.body.appendChild(waveRainLayer);

  if (projectModalImage) {
    projectModalImage.decoding = "async";
    if ("loading" in projectModalImage) {
      projectModalImage.loading = "eager";
    }
    if ("fetchPriority" in projectModalImage) {
      projectModalImage.fetchPriority = "high";
    }
  }

  const disableImageInteractions = (imageElement) => {
    if (!imageElement) return;

    imageElement.draggable = false;
    imageElement.addEventListener("dragstart", (event) => {
      event.preventDefault();
    });
    imageElement.addEventListener("contextmenu", (event) => {
      event.preventDefault();
    });
  };

  disableImageInteractions(projectModalImage);
  disableImageInteractions(resumePhotoImage);
  disableImageInteractions(resumeLocationImage);
  
  const clearTimer = (timerId) => {
    if (timerId) {
      window.clearTimeout(timerId);
    }
    return null;
  };
  
  const clearPartTimers = () => {
    secondPartInTimer = clearTimer(secondPartInTimer);
    secondPartOutTimer = clearTimer(secondPartOutTimer);
  };
  
  const clearWorkFilterAnimationTimers = () => {
    workFilterLabelSwapTimer = clearTimer(workFilterLabelSwapTimer);
    workFilterLabelShowCleanupTimer = clearTimer(workFilterLabelShowCleanupTimer);
    workFilterSquiggleTimer = clearTimer(workFilterSquiggleTimer);
  };
  
  const clearWorkFilterRevealTimer = () => {
    workFilterRevealTimer = clearTimer(workFilterRevealTimer);
  };
  
  const clearWorkLinksEnterDelayResetTimer = () => {
    workLinksEnterDelayResetTimer = clearTimer(workLinksEnterDelayResetTimer);
  };
  
  const clearCycleTimer = () => {
    cycleTimer = clearTimer(cycleTimer);
    cycleDeadlineMs = null;
  };
  
  const scheduleCycle = (delayMs) => {
    if (remainingSteps === 0 || projectsOpen) return;
  
    clearCycleTimer();
    cycleDeadlineMs = window.performance.now() + delayMs;
    cycleTimer = window.setTimeout(() => {
      cycleTimer = null;
      cycleDeadlineMs = null;
      runCycle();
    }, delayMs);
  };
  
  const pauseCycle = () => {
    if (remainingSteps === 0) return;
  
    if (cycleTimer && cycleDeadlineMs !== null) {
      pausedCycleDelayMs = Math.max(
        0,
        Math.round(cycleDeadlineMs - window.performance.now())
      );
    } else if (pausedCycleDelayMs === null) {
      pausedCycleDelayMs = rotationIntervalMs;
    }
  
    clearCycleTimer();
  };
  
  const resumeCycle = () => {
    if (remainingSteps === 0 || projectsOpen) return;
  
    const resumeDelay = pausedCycleDelayMs ?? rotationIntervalMs;
    pausedCycleDelayMs = null;
    scheduleCycle(resumeDelay);
  };
  
  const clearOutAnimationTimer = () => {
    outAnimationTimer = clearTimer(outAnimationTimer);
  };

  const clearWaveRainTimers = () => {
    waveRainSpawnTimer = clearTimer(waveRainSpawnTimer);
    waveRainStopTimer = clearTimer(waveRainStopTimer);
    waveRainCleanupTimer = clearTimer(waveRainCleanupTimer);
  };

  const resetWaveRainLayer = () => {
    waveRainLayer.classList.remove("is-active");
    waveRainLayer.replaceChildren();
    waveRainActiveParticles = 0;
    waveRainShouldDeactivate = false;
    waveRainIsEnding = false;
  };

  const finishWaveRain = (runId) => {
    if (runId !== waveRainGeneration || waveRainIsEnding) return;

    waveRainIsEnding = true;
    clearWaveRainTimers();
    waveRainLayer.classList.remove("is-active");
    waveRainCleanupTimer = window.setTimeout(() => {
      if (runId !== waveRainGeneration) return;
      waveRainLayer.replaceChildren();
      waveRainCleanupTimer = null;
    }, 180);
  };

  const createWaveEmojiParticle = (runId) => {
    const particle = document.createElement("span");
    particle.className = "wave-rain-emoji";
    particle.textContent = waveEmoji;

    const leftPosition = Math.random() * 100;
    const sizeScale = lerp(2.15, 3.7, Math.random());
    const driftX = (Math.random() * 2 - 1) * 120;
    const durationMs = 1800 + Math.random() * 1400;
    const fadeDelayMs = Math.random() * 160;
    const startY = -8 * window.innerHeight / 100;
    const endY = 112 * window.innerHeight / 100;
    const startOpacityWindow = 0.08;
    const endOpacityWindow = 0.08;
    const startTimeMs = window.performance.now() + fadeDelayMs;
    const fallbackTimeoutMs = fadeDelayMs + durationMs + 120;

    particle.style.left = `${leftPosition}vw`;
    particle.style.setProperty("--wave-size", `${sizeScale}rem`);
    particle.style.opacity = "0";
    particle.style.transform = "translate3d(0, -8vh, 0) rotate(0deg)";

    let completed = false;
    let animationFrameId = null;
    let fallbackTimerId = null;

    const completeParticle = () => {
      if (completed) return;

      completed = true;
      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
      fallbackTimerId = clearTimer(fallbackTimerId);
      if (runId !== waveRainGeneration) {
        particle.remove();
        return;
      }

      waveRainActiveParticles = Math.max(0, waveRainActiveParticles - 1);
      particle.remove();

      if (waveRainShouldDeactivate && waveRainActiveParticles === 0) {
        finishWaveRain(runId);
      }
    };

    const animate = (nowMs) => {
      if (runId !== waveRainGeneration || !particle.isConnected) {
        completeParticle();
        return;
      }

      if (nowMs < startTimeMs) {
        animationFrameId = window.requestAnimationFrame(animate);
        return;
      }

      const elapsedMs = nowMs - startTimeMs;
      const progress = Math.min(1, Math.max(0, elapsedMs / durationMs));
      const easedProgress = smootherStep(progress);
      const opacityProgress = progress < startOpacityWindow
        ? progress / startOpacityWindow
        : progress > 1 - endOpacityWindow
          ? (1 - progress) / endOpacityWindow
          : 1;
      const currentX = lerp(0, driftX, easedProgress);
      const currentY = lerp(startY, endY, easedProgress);
      const currentRotation = lerp(0, 240, easedProgress);

      particle.style.opacity = String(Math.max(0, Math.min(1, opacityProgress)));
      particle.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${currentRotation}deg)`;

      if (progress >= 1) {
        completeParticle();
        return;
      }

      animationFrameId = window.requestAnimationFrame(animate);
    };

    fallbackTimerId = window.setTimeout(completeParticle, fallbackTimeoutMs);
    animationFrameId = window.requestAnimationFrame(animate);

    waveRainActiveParticles += 1;
    waveRainLayer.appendChild(particle);
  };

  const startWaveRain = () => {
    if (reduceMotion) return;

    const burstCount = 3;
    const burstIntervalMs = 300;
    const rainDurationMs = 3200;

    const hasLiveWave =
      waveRainSpawnTimer !== null || waveRainActiveParticles > 0 || waveRainIsEnding;

    if (!hasLiveWave) {
      waveRainGeneration += 1;
    }

    const runId = waveRainGeneration;

    waveRainCleanupTimer = clearTimer(waveRainCleanupTimer);
    waveRainLayer.classList.add("is-active");
    waveRainShouldDeactivate = false;
    waveRainIsEnding = false;

    const spawnBurst = () => {
      if (runId !== waveRainGeneration) return;

      for (let index = 0; index < burstCount; index += 1) {
        createWaveEmojiParticle(runId);
      }
    };

    if (waveRainSpawnTimer === null) {
      spawnBurst();
      waveRainSpawnTimer = window.setInterval(spawnBurst, burstIntervalMs);
    } else {
      spawnBurst();
    }

    waveRainStopTimer = clearTimer(waveRainStopTimer);
    waveRainStopTimer = window.setTimeout(() => {
      if (runId !== waveRainGeneration) return;

      waveRainStopTimer = null;
      waveRainShouldDeactivate = true;
      waveRainSpawnTimer = clearTimer(waveRainSpawnTimer);

      if (waveRainActiveParticles === 0) {
        finishWaveRain(runId);
      }
    }, rainDurationMs);
  };

  const clearActiveTextSelection = () => {
    const activeSelection = window.getSelection();
    if (
      !activeSelection ||
      activeSelection.rangeCount === 0 ||
      activeSelection.isCollapsed
    ) {
      return;
    }
    activeSelection.removeAllRanges();
  };
  
  const renderPhraseText = (phrase, animateParts) => {
    if (!phrase) return;

    clearActiveTextSelection();
  
    clearPartTimers();
  
    firstPart.classList.remove("part-show", "part-hide");
    secondPart.classList.remove("part-show", "part-hide");
  
    const hasSecondPart = phrase.second.trim().length > 0;
    secondPart.style.display = hasSecondPart ? "inline-block" : "none";
  
    firstPart.textContent = phrase.first;
    secondPart.replaceChildren(renderSecondPartMarkup(phrase.second));
  
    if (!animateParts || reduceMotion) {
      firstPart.classList.add("part-show");
      if (hasSecondPart) {
        secondPart.classList.add("part-show");
      }
      return;
    }
  
    void firstPart.offsetWidth;
    void secondPart.offsetWidth;
  
    firstPart.classList.add("part-show");
    if (!hasSecondPart) return;
  
    secondPartInTimer = window.setTimeout(() => {
      secondPart.classList.add("part-show");
      secondPartInTimer = null;
    }, partDelayMs);
  };
  
  const renderPhrase = (phraseIndex, animateParts) => {
    const phrase = phrases[phraseIndex];
    if (!phrase) return;
    renderPhraseText(phrase, animateParts);
  };
  
  const swapPhrase = (animateParts) => {
    index = (index + 1) % phrases.length;
    renderPhrase(index, animateParts);
  };
  
  const animateOutParts = (onComplete) => {
    if (reduceMotion) {
      onComplete();
      return;
    }
  
    if (secondPartInTimer) {
      secondPartInTimer = clearTimer(secondPartInTimer);
      secondPart.classList.add("part-show");
    }
    if (secondPartOutTimer) {
      secondPartOutTimer = clearTimer(secondPartOutTimer);
    }
    clearOutAnimationTimer();
  
    firstPart.classList.remove("part-hide");
    secondPart.classList.remove("part-hide");
  
    void firstPart.offsetWidth;
    void secondPart.offsetWidth;
  
    firstPart.classList.add("part-hide");
    const secondPartVisible =
      secondPart.style.display !== "none" && secondPart.textContent.trim().length > 0;
  
    if (secondPartVisible) {
      secondPartOutTimer = window.setTimeout(() => {
        secondPart.classList.add("part-hide");
        secondPartOutTimer = null;
      }, partOutDelayMs);
    }
  
    const totalDelay = partAnimMs + (secondPartVisible ? partOutDelayMs : 0);
    outAnimationTimer = window.setTimeout(() => {
      outAnimationTimer = null;
      onComplete();
    }, totalDelay);
  };
  
  const animateToPhrase = (phrase) => {
    if (reduceMotion) {
      renderPhraseText(phrase, false);
      return;
    }
    animateOutParts(() => {
      renderPhraseText(phrase, true);
    });
  };
  
  const getGreetingSwapDelayMs = () => {
    if (reduceMotion) return 0;
    const secondPartVisible =
      secondPart.style.display !== "none" && secondPart.textContent.trim().length > 0;
    return partAnimMs + (secondPartVisible ? partOutDelayMs : 0);
  };
  
  const revealWorkFilterAfterGreetingSwap = () => {
    clearWorkFilterRevealTimer();
  
    const reveal = () => {
      workFilterRevealTimer = null;
      if (!projectsOpen) return;
      setWorkFilterHidden(false);
      updateWorkFilterLabel(false);
    };
  
    const delayMs = getGreetingSwapDelayMs() + (reduceMotion ? 0 : partDelayMs);
    if (delayMs <= 0) {
      reveal();
      return;
    }
  
    workFilterRevealTimer = window.setTimeout(reveal, delayMs);
  };
  
  const getProjectsEnterBaseDelayMs = () => {
    if (reduceMotion) return 0;
    const workFilterRevealCompleteMs =
      getGreetingSwapDelayMs() + partDelayMs + workFilterRevealSettleMs;
    return Math.max(mainLinkBaseDelayMs, workFilterRevealCompleteMs);
  };
  
  const getWorkLinks = () =>
    workLinksContainer
      ? Array.from(workLinksContainer.querySelectorAll("[data-work-link]"))
      : [];
  
  const applyWorkLinksLockedHeight = () => {
    if (!workLinksContainer) return;
    if (projectsOpen && workLinksLockedHeightPx > 0) {
      workLinksContainer.style.minHeight = `${workLinksLockedHeightPx}px`;
      return;
    }
    workLinksContainer.style.minHeight = "0px";
  };
  
  const recomputeWorkLinksLockedHeight = () => {
    if (!workLinksContainer) return;
  
    const links = getWorkLinks();
    if (workProjects.length === 0 || links.length === 0) {
      workLinksLockedHeightPx = 0;
      applyWorkLinksLockedHeight();
      return;
    }
  
    const sampleLinkHeight = links[0].getBoundingClientRect().height;
    const workLinksStyles = window.getComputedStyle(workLinksContainer);
    const rowGapValue =
      workLinksStyles.rowGap === "normal" ? workLinksStyles.gap : workLinksStyles.rowGap;
    const rowGapPx = Number.parseFloat(rowGapValue) || 0;
    const maxRows = workProjects.length;
    workLinksLockedHeightPx = Math.ceil(
      sampleLinkHeight * maxRows + rowGapPx * Math.max(0, maxRows - 1)
    );
    applyWorkLinksLockedHeight();
  };
  
  const getAvailableWorkYears = () =>
    Array.from(new Set(workProjects.map((project) => String(project.year)))).sort(
      (left, right) => Number(right) - Number(left)
    );
  
  const syncSelectedWorkYear = () => {
    if (selectedWorkYear === "all") return;
    const years = getAvailableWorkYears();
    if (years.length === 0) return;
    if (years.includes(selectedWorkYear)) return;
    selectedWorkYear = years[0] ?? "all";
  };
  
  const closeWorkFilterMenu = () => {
    if (!workFilter) return;
    workFilter.classList.remove("is-open");
    workFilterToggle?.setAttribute("aria-expanded", "false");
  };
  
  const triggerWorkFilterSquiggle = (delayMs = 0) => {
    if (!workFilter || reduceMotion) return;
  
    workFilterSquiggleTimer = clearTimer(workFilterSquiggleTimer);
  
    const runSquiggle = () => {
      workFilter.classList.remove("is-squiggle-anim");
      void workFilter.offsetWidth;
      workFilter.classList.add("is-squiggle-anim");
      workFilterSquiggleTimer = null;
    };
  
    if (delayMs > 0) {
      workFilterSquiggleTimer = window.setTimeout(runSquiggle, delayMs);
      return;
    }
  
    runSquiggle();
  };
  
  const getSelectedWorkLabel = () =>
    selectedWorkYear === "all" ? "over the years" : formatWorkYearLabel(selectedWorkYear);
  
  const formatWorkYearLabel = (yearValue) => {
    const yearText = String(yearValue).trim();
    const twoDigitYear = yearText.slice(-2).padStart(2, "0");
    return `'${twoDigitYear}`;
  };
  
  const setWorkFilterLabelText = (labelText) => {
    if (!workFilterYearLabel) return;
    workFilterYearLabel.textContent = labelText;
  };
  
  const animateWorkFilterLabel = (nextLabel, force = false) => {
    if (!workFilterYearLabel) return;
  
    const labelChanged = workFilterYearLabel.textContent !== nextLabel;
    const shouldAnimate = force || labelChanged;
  
    clearWorkFilterAnimationTimers();
    workFilterYearLabel.classList.remove("is-label-show", "is-label-hide");
  
    if (!shouldAnimate || reduceMotion) {
      setWorkFilterLabelText(nextLabel);
      if (shouldAnimate) {
        triggerWorkFilterSquiggle();
      }
      return;
    }
  
    void workFilterYearLabel.offsetWidth;
    workFilterYearLabel.classList.add("is-label-hide");
    workFilterLabelSwapTimer = window.setTimeout(() => {
      setWorkFilterLabelText(nextLabel);
      workFilterYearLabel.classList.remove("is-label-hide");
      void workFilterYearLabel.offsetWidth;
      workFilterYearLabel.classList.add("is-label-show");
      workFilterLabelShowCleanupTimer = window.setTimeout(() => {
        workFilterYearLabel.classList.remove("is-label-show");
        workFilterLabelShowCleanupTimer = null;
      }, partAnimMs);
      triggerWorkFilterSquiggle(partDelayMs);
      workFilterLabelSwapTimer = null;
    }, partAnimMs + partOutDelayMs);
  };
  
  const setWorkFilterHidden = (hidden) => {
    if (!workFilter) return;
  
    if (hidden && workFilter.contains(document.activeElement)) {
      projectsToggle?.focus();
    }
  
    workFilter.classList.toggle("is-hidden", hidden);
    workFilter.setAttribute("aria-hidden", String(hidden));
    if (hidden) {
      closeWorkFilterMenu();
    }
  };
  
  const updateWorkFilterLabel = (animate = false, force = false) => {
    syncSelectedWorkYear();
    const nextLabel = getSelectedWorkLabel();
    if (animate) {
      animateWorkFilterLabel(nextLabel, force);
      return;
    }
    setWorkFilterLabelText(nextLabel);
  };
  
  const renderWorkFilterMenu = () => {
    if (!workFilterMenu) return;
  
    syncSelectedWorkYear();
    const years = getAvailableWorkYears();
    const options = [
      ...years.map((year) => ({ label: formatWorkYearLabel(year), value: year })),
      { label: "over the years", value: "all" },
    ];
  
    const optionButtons = options.map((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "work-filter-option";
      button.dataset.workYear = option.value;
      button.textContent = option.label;
      button.setAttribute("aria-pressed", String(option.value === selectedWorkYear));
      if (option.value === selectedWorkYear) {
        button.classList.add("is-selected");
      }
      return button;
    });
  
    workFilterMenu.replaceChildren(...optionButtons);
  };

  const isModalOpen = () =>
    !!projectModal && !projectModal.classList.contains("is-hidden");

  const closeProjectModal = () => {
    if (!projectModal || !isModalOpen()) return;

    activeProjectImageRequestId += 1;
    projectModal.classList.add("is-hidden");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-project-modal-open");

    if (focusedBeforeModal && document.contains(focusedBeforeModal)) {
      focusedBeforeModal.focus();
    }
    focusedBeforeModal = null;
  };

  const isResumeOpen = () =>
    !!resumeScreen &&
    !resumeScreen.classList.contains("is-hidden") &&
    resumeScreen.classList.contains("is-open");

  const hideResumeScreenNow = () => {
    if (!resumeScreen) return;
    resumeScreen.classList.add("is-hidden");
    resumeScreen.classList.remove("is-open", "is-closing");
    resumeScreen.style.removeProperty("--resume-clip-radius");
    resumeScreen.setAttribute("aria-hidden", "true");
  };

  const closeResumeScreen = () => {
    if (!resumeScreen || !isResumeOpen() || resumeScreen.classList.contains("is-closing")) return;

    const restoreFocus = () => {
      if (focusedBeforeResume && document.contains(focusedBeforeResume)) {
        focusedBeforeResume.focus();
      }
      focusedBeforeResume = null;
      resumeCycle();
    };

    const finalizeClose = () => {
      hideResumeScreenNow();
      mainContent?.removeAttribute("inert");
      themeToggle?.removeAttribute("inert");
      isResumeTransitioning = false;
      restoreFocus();
    };

    if (reduceMotion) {
      document.body.classList.remove("is-resume-open");
      finalizeClose();
      return;
    }

    isResumeTransitioning = true;
    resumeScreen.classList.add("is-closing");
    resumeScreen.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-resume-open");

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;
    const maxRadius = Math.hypot(originX, originY);
    const minRadius = 1;
    resumeScreen.style.setProperty("--resume-clip-radius", `${maxRadius}px`);

    let previousFrameMs = window.performance.now();
    let shrinkElapsedMs = 0;

    const stepShrink = (nowMs) => {
      const deltaMs = Math.min(40, Math.max(8, nowMs - previousFrameMs));
      previousFrameMs = nowMs;
      shrinkElapsedMs += deltaMs;
      const progress = Math.min(1, shrinkElapsedMs / resumeShrinkDurationMs);
      const easedProgress = smootherStep(progress);
      const currentRadius = lerp(maxRadius, minRadius, easedProgress);
      resumeScreen.style.setProperty("--resume-clip-radius", `${currentRadius}px`);

      if (progress === 1) {
        finalizeClose();
        return;
      }

      window.requestAnimationFrame(stepShrink);
    };

    window.requestAnimationFrame(stepShrink);
  };

  const openResumeScreen = () => {
    if (!resumeScreen || isResumeOpen() || isResumeTransitioning) return;

    closeProjectModal();
    closeWorkFilterMenu();
    pauseCycle();
    focusedBeforeResume =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const revealResume = () => {
      if (!resumeScreen) return;
      document.body.classList.add("is-resume-open");
      mainContent?.setAttribute("inert", "");
      themeToggle?.setAttribute("inert", "");
      resumeScreen.classList.remove("is-hidden", "is-closing");
      resumeScreen.style.removeProperty("--resume-clip-radius");
      resumeScreen.setAttribute("aria-hidden", "false");
      window.requestAnimationFrame(() => {
        resumeScreen.classList.add("is-open");
        window.setTimeout(() => {
          resumeScreen.focus();
        }, 0);
      });
    };

    if (reduceMotion) {
      revealResume();
      return;
    }

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;
    const radius = Math.hypot(originX, originY);
    const diameter = radius * 2;
    const circle = document.createElement("span");
    circle.className = "resume-transition-circle";
    circle.style.left = `${originX}px`;
    circle.style.top = `${originY}px`;
    circle.style.width = `${diameter}px`;
    circle.style.height = `${diameter}px`;
    circle.style.setProperty("--resume-transition-scale", String(resumeMinimumScale));
    document.body.appendChild(circle);

    isResumeTransitioning = true;
    let currentScale = resumeMinimumScale;
    let currentOpacity = 1;
    let phase = "grow";
    let growElapsedMs = 0;
    let holdElapsedMs = 0;
    let previousFrameMs = window.performance.now();
    let resumeRevealed = false;

    const finalizeTransition = () => {
      circle.remove();
      isResumeTransitioning = false;
    };

    const stepTransition = (nowMs) => {
      const deltaMs = Math.min(40, Math.max(8, nowMs - previousFrameMs));
      previousFrameMs = nowMs;

      if (phase === "grow") {
        growElapsedMs += deltaMs;
        const progress = Math.min(1, growElapsedMs / resumeGrowDurationMs);
        currentScale = lerp(resumeMinimumScale, 1, smootherStep(progress));
        if (!resumeRevealed && progress >= 0.82) {
          revealResume();
          resumeRevealed = true;
        }
        if (progress === 1) {
          currentScale = 1;
          if (!resumeRevealed) {
            revealResume();
            resumeRevealed = true;
          }
          phase = "hold";
        }
      } else if (phase === "hold") {
        holdElapsedMs += deltaMs;
        currentScale = 1;
        if (holdElapsedMs >= resumeHoldDurationMs) {
          phase = "fade";
        }
      } else {
        currentScale = 1;
        const amount = getFrameLerpAmount(resumeFadeLerp, deltaMs);
        currentOpacity = lerp(currentOpacity, 0, amount);
        if (currentOpacity <= resumeOpacitySnapThreshold) {
          currentOpacity = 0;
        }
      }

      circle.style.setProperty("--resume-transition-scale", `${currentScale}`);
      circle.style.opacity = `${currentOpacity}`;

      if (phase === "fade" && currentOpacity === 0) {
        finalizeTransition();
        return;
      }

      window.requestAnimationFrame(stepTransition);
    };

    window.requestAnimationFrame(stepTransition);
  };

  const createProjectModalButton = (
    labelText,
    href,
    isPrimary = false,
    arrowOnly = false
  ) => {
    const button = document.createElement("a");
    button.className = "project-modal-button";
    if (isPrimary) {
      button.classList.add("is-primary");
    }

    const label = String(labelText ?? "").trim();
    const normalizedLabel = label.toLowerCase();
    const url = String(href ?? "").trim();
    if (arrowOnly) {
      button.classList.add("is-arrow-only");
      button.setAttribute("aria-label", "open link");
      const arrow = document.createElement("span");
      arrow.className = "project-modal-button-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      button.replaceChildren(arrow);
    } else if (normalizedLabel.includes("github")) {
      button.classList.add("is-github-icon");
      button.setAttribute("aria-label", "github");
      const githubIcon = document.createElement("i");
      githubIcon.className = "fa-brands fa-github project-modal-button-github-icon";
      githubIcon.setAttribute("aria-hidden", "true");
      button.replaceChildren(githubIcon);
    } else {
      button.textContent = label || "open";
    }

    if (!url || url === "#") {
      button.removeAttribute("href");
      button.tabIndex = -1;
      button.classList.add("is-disabled");
      button.setAttribute("aria-disabled", "true");
      return button;
    }

    button.href = url;
    if (/^https?:\/\//i.test(url)) {
      button.target = "_blank";
      button.rel = "noopener noreferrer";
    }

    return button;
  };

  const restartProjectModalTitleMarquee = () => {
    if (!projectModalTitleMarquee || reduceMotion) return;
    projectModalTitleMarquee.style.animation = "none";
    void projectModalTitleMarquee.offsetWidth;
    projectModalTitleMarquee.style.animation = "";
  };

  const setProjectModalPlaceholderText = (text) => {
    if (!projectModalPlaceholder) return;
    projectModalPlaceholder.textContent = text;
  };

  const toAbsoluteUrl = (path) => {
    const normalizedPath = String(path ?? "").trim();
    if (!normalizedPath) return "";
    try {
      return new URL(normalizedPath, window.location.href).href;
    } catch (_error) {
      return "";
    }
  };

  const preloadProjectScreenshot = (screenshotPath) => {
    const absolutePath = toAbsoluteUrl(screenshotPath);
    if (!absolutePath) return Promise.resolve(false);

    const cachedPreload = projectScreenshotPreloadCache.get(absolutePath);
    if (cachedPreload) {
      return cachedPreload;
    }

    const preloadPromise = new Promise((resolve) => {
      const preloadImage = new Image();
      let settled = false;
      const finish = (loaded) => {
        if (settled) return;
        settled = true;
        preloadImage.onload = null;
        preloadImage.onerror = null;
        resolve(loaded);
      };

      preloadImage.onload = () => finish(true);
      preloadImage.onerror = () => finish(false);
      preloadImage.decoding = "async";
      preloadImage.src = absolutePath;

      if (typeof preloadImage.decode === "function") {
        preloadImage.decode().then(() => finish(true)).catch(() => {
          // Keep load/error handlers as fallback for browsers with partial decode support.
        });
      }
    });

    projectScreenshotPreloadCache.set(absolutePath, preloadPromise);
    return preloadPromise;
  };

  const preloadWorkProjectScreenshots = (projects) => {
    projects.forEach((project) => {
      void preloadProjectScreenshot(project?.screenshot);
    });
  };

  const clearProjectModalImage = () => {
    if (!projectModalImage || !projectModalMedia) return;
    projectModalImage.removeAttribute("src");
    projectModalImage.alt = "";
    projectModalMedia.classList.add("is-empty");
    projectModalMedia.classList.remove("is-loading");
  };

  const loadProjectModalImage = async (screenshotPath, screenshotAlt, requestId) => {
    if (!projectModalMedia || !projectModalImage) return;

    const absolutePath = toAbsoluteUrl(screenshotPath);
    if (!absolutePath) {
      setProjectModalPlaceholderText("there was a problem loading this preview.");
      clearProjectModalImage();
      return;
    }

    setProjectModalPlaceholderText("loading preview...");
    projectModalImage.removeAttribute("src");
    projectModalImage.alt = "";
    projectModalMedia.classList.add("is-empty", "is-loading");

    const loaded = await preloadProjectScreenshot(absolutePath);
    if (requestId !== activeProjectImageRequestId) return;

    if (!loaded) {
      setProjectModalPlaceholderText("there was a problem loading this preview.");
      clearProjectModalImage();
      return;
    }

    projectModalImage.src = absolutePath;
    projectModalImage.alt = screenshotAlt;
    window.requestAnimationFrame(() => {
      if (requestId !== activeProjectImageRequestId) return;
      projectModalMedia.classList.remove("is-empty", "is-loading");
    });
  };

  const openProjectModal = (project, triggerElement = null) => {
    if (
      !projectModal ||
      !projectModalTitle ||
      !projectModalDescription ||
      !projectModalButtons
    ) {
      return;
    }

    focusedBeforeModal =
      triggerElement instanceof HTMLElement
        ? triggerElement
        : document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;

    const projectName = String(project?.name ?? "").trim() || "project";
    const projectDescription = String(project?.description ?? "").trim();
    const projectImageSrc = String(project?.screenshot ?? "").trim();
    const projectImageAlt =
      String(project?.screenshotAlt ?? "").trim() || `${projectName} screenshot`;
    const projectYear = Number(project?.year);
    const projectButtons = Array.isArray(project?.buttons) ? project.buttons : [];

    projectModalTitle.textContent = projectName;
    if (projectModalTitleDisplay) {
      projectModalTitleDisplay.textContent = projectName;
    }
    if (projectModalYearDisplay) {
      if (Number.isFinite(projectYear)) {
        projectModalYearDisplay.textContent = String(projectYear);
        projectModalYearDisplay.classList.remove("is-empty");
      } else {
        projectModalYearDisplay.textContent = "";
        projectModalYearDisplay.classList.add("is-empty");
      }
    }
    if (projectModalTitleRunA && projectModalTitleRunB) {
      const titleRunText = `${`${projectName} • `.repeat(22)} `;
      projectModalTitleRunA.textContent = titleRunText;
      projectModalTitleRunB.textContent = titleRunText;
    }
    projectModalDescription.textContent = projectDescription || "No description provided yet.";

    const modalImageRequestId = ++activeProjectImageRequestId;
    void loadProjectModalImage(projectImageSrc, projectImageAlt, modalImageRequestId);

    const extraButtons = projectButtons.filter(
      (buttonConfig) =>
        String(buttonConfig?.label ?? "").trim().toLowerCase() !== "case study"
    );
    const modalButtons = [];
    const projectNameKey = projectName.toLowerCase();
    if (
      projectNameKey !== "pask" &&
      projectNameKey !== "wayvilo" &&
      projectNameKey !== "matchai"
    ) {
      modalButtons.push(createProjectModalButton("open link", project?.link, true, true));
    }
    modalButtons.push(
      ...extraButtons.map((buttonConfig) =>
        createProjectModalButton(buttonConfig?.label, buttonConfig?.link)
      )
    );
    projectModalButtons.replaceChildren(...modalButtons);

    projectModal.classList.remove("is-hidden");
    projectModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("is-project-modal-open");
    restartProjectModalTitleMarquee();

    window.setTimeout(() => {
      projectModalClose?.focus();
    }, 0);
  };
  
  const createWorkLink = (project) => {
    const link = document.createElement("a");
    link.dataset.workLink = "";
    link.href = "#";
    link.tabIndex = -1;
    link.setAttribute("aria-haspopup", "dialog");
    link.setAttribute("aria-label", `view ${project.name} details`);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openProjectModal(project, link);
    });
    link.addEventListener(
      "pointerenter",
      () => {
        void preloadProjectScreenshot(project?.screenshot);
      },
      { once: true }
    );
    link.addEventListener(
      "focus",
      () => {
        void preloadProjectScreenshot(project?.screenshot);
      },
      { once: true }
    );

    const icon = document.createElement("span");
    icon.className = "hover-icon";
    icon.setAttribute("aria-hidden", "true");
    const iconGlyph = document.createElement("span");
    iconGlyph.className = "material-symbols-rounded material-glyph";
    iconGlyph.textContent = "deployed_code";
    icon.appendChild(iconGlyph);
  
    link.append(icon, document.createTextNode(project.name));
  
    return link;
  };
  
  const renderWorkLinks = () => {
    if (!workLinksContainer) return;
  
    syncSelectedWorkYear();
    const visibleProjects =
      selectedWorkYear === "all"
        ? workProjects
        : workProjects.filter((project) => String(project.year) === selectedWorkYear);
    const links = visibleProjects.map((project) => createWorkLink(project));
    workLinksContainer.replaceChildren(...links);
    recomputeWorkLinksLockedHeight();
    setLinksHidden(getWorkLinks(), !projectsOpen);
  };
  
  const applyWorkFilter = (nextYear) => {
    if (nextYear === selectedWorkYear) {
      closeWorkFilterMenu();
      return;
    }
  
    selectedWorkYear = nextYear;
    updateWorkFilterLabel(true);
    renderWorkFilterMenu();
    renderWorkLinks();
    closeWorkFilterMenu();
  };
  
  const normalizeWorkProjects = (payload) => {
    const source = Array.isArray(payload) ? payload : payload?.projects;
    if (!Array.isArray(source)) return [];

    const normalizeProjectButtons = (buttons) => {
      if (!Array.isArray(buttons)) return [];
      return buttons
        .map((button) => {
          const label = String(button?.label ?? "").trim();
          const link = String(button?.link ?? button?.href ?? button?.url ?? "").trim();
          if (!label) return null;
          return { label, link };
        })
        .filter(Boolean);
    };

    return source
      .map((project) => {
        const name = String(project?.name ?? "").trim();
        const link = String(project?.link ?? "").trim();
        const numericYear = Number(project?.year);
        if (!name || !Number.isFinite(numericYear)) {
          return null;
        }
        return {
          name,
          year: numericYear,
          link,
          screenshot: String(project?.screenshot ?? project?.image ?? "").trim(),
          screenshotAlt: String(project?.screenshotAlt ?? project?.imageAlt ?? "").trim(),
          description: String(project?.description ?? "").trim(),
          buttons: normalizeProjectButtons(project?.buttons),
        };
      })
      .filter(Boolean)
      .sort(byNewestYearThenName);
  };
  
  const loadWorkProjects = async () => {
    try {
      let normalizedProjects = [];
      for (const path of workDataPaths) {
        let response;
        try {
          response = await window.fetch(path, { cache: "no-store" });
        } catch (_fetchError) {
          continue;
        }

        if (!response.ok) {
          continue;
        }

        const responseBody = await response.text();
        if (!responseBody) {
          continue;
        }

        let payload;
        try {
          payload = JSON.parse(responseBody);
        } catch (_parseError) {
          continue;
        }

        const candidateProjects = normalizeWorkProjects(payload);
        if (candidateProjects.length === 0) {
          continue;
        }

        normalizedProjects = candidateProjects;
        break;
      }

      if (normalizedProjects.length === 0) {
        throw new Error("Unable to load work data");
      }

      workProjects = normalizedProjects;
      preloadWorkProjectScreenshots(workProjects);
    } catch (_error) {
      workProjects = [];
    }
  
    syncSelectedWorkYear();
    updateWorkFilterLabel();
    renderWorkFilterMenu();
    renderWorkLinks();
  };
  
  const setLinksHidden = (
    links,
    hidden,
    useIntroDelay = false,
    baseDelayMs = mainLinkBaseDelayMs
  ) => {
    if (hidden || !useIntroDelay || reduceMotion) {
      clearWorkLinksEnterDelayResetTimer();
      links.forEach((link) => {
        link.style.setProperty("--work-link-enter-delay", "0ms");
      });
    } else {
      const normalizedBaseDelayMs = Math.max(0, Math.round(baseDelayMs));
      links.forEach((link, index) => {
        const delayMs = normalizedBaseDelayMs + index * mainLinkStaggerMs;
        link.style.setProperty("--work-link-enter-delay", `${delayMs}ms`);
      });
  
      const longestDelayMs =
        normalizedBaseDelayMs + Math.max(0, links.length - 1) * mainLinkStaggerMs;
      clearWorkLinksEnterDelayResetTimer();
      workLinksEnterDelayResetTimer = window.setTimeout(() => {
        links.forEach((link) => {
          link.style.setProperty("--work-link-enter-delay", "0ms");
        });
        workLinksEnterDelayResetTimer = null;
      }, longestDelayMs + workLinkTransitionSettleMs);
    }
  
    links.forEach((link) => {
      if (hidden && document.activeElement === link) {
        projectsToggle?.focus();
      }
      link.classList.toggle("is-faded-out", hidden);
      if (hidden) {
        link.setAttribute("tabindex", "-1");
      } else {
        link.removeAttribute("tabindex");
      }
    });
  };
  
  const swapProjectsLabel = (nextLabel) => {
    if (!projectsToggle || !projectsLabel) return;
  
    if (labelSwapTimer) {
      labelSwapTimer = clearTimer(labelSwapTimer);
      projectsToggle.classList.remove("is-label-swapping");
    }
  
    if (reduceMotion) {
      projectsLabel.textContent = nextLabel;
      return;
    }
  
    projectsToggle.classList.add("is-label-swapping");
    labelSwapTimer = window.setTimeout(() => {
      projectsLabel.textContent = nextLabel;
      projectsToggle.classList.remove("is-label-swapping");
      labelSwapTimer = null;
    }, labelSwapMs);
  };
  
  const toggleProjectsView = () => {
    projectsOpen = !projectsOpen;
    projectsToggle?.setAttribute("aria-expanded", String(projectsOpen));
    projectsToggle?.classList.toggle("is-back-state", projectsOpen);
  
    if (projectsOpen) {
      pauseCycle();
      clearOutAnimationTimer();
      clearWorkFilterRevealTimer();
      restoredPhrase = {
        first: firstPart.textContent || phrases[index].first,
        second:
          secondPart.style.display === "none"
            ? ""
            : secondPart.textContent || phrases[index].second,
      };
      setLinksHidden(secondaryLinks, true);
      setLinksHidden(getWorkLinks(), false, true, getProjectsEnterBaseDelayMs());
      setWorkFilterHidden(true);
      applyWorkLinksLockedHeight();
      animateToPhrase(projectsPhrase);
      revealWorkFilterAfterGreetingSwap();
      swapProjectsLabel("back");
      return;
    }

    closeProjectModal();
    clearWorkFilterRevealTimer();
    setLinksHidden(secondaryLinks, false, true, mainLinkBaseDelayMs);
    setLinksHidden(getWorkLinks(), true);
    setWorkFilterHidden(true);
    applyWorkLinksLockedHeight();
    animateToPhrase(restoredPhrase || phrases[index]);
    swapProjectsLabel("work");
    resumeCycle();
  };
  
  const animateGreeting = () => {
    if (reduceMotion) {
      swapPhrase(false);
      return;
    }
  
    animateOutParts(() => {
      swapPhrase(true);
    });
  };

  const triggerGreetingWaveRain = () => {
    startWaveRain();
  };
  
  if (projectsToggle) {
    projectsToggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggleProjectsView();
    });
  }
  
  if (resumeLink) {
    resumeLink.addEventListener("click", (event) => {
      event.preventDefault();
      openResumeScreen();
    });
  }

  greeting.addEventListener("click", () => {
    triggerGreetingWaveRain();
  });

  greeting.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      triggerGreetingWaveRain();
    }
  });

  if (workFilterToggle) {
    workFilterToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!workFilter || workFilter.classList.contains("is-hidden")) return;
  
      const open = !workFilter.classList.contains("is-open");
      workFilter.classList.toggle("is-open", open);
      workFilterToggle.setAttribute("aria-expanded", String(open));
    });
  }
  
  if (workFilterMenu) {
    workFilterMenu.addEventListener("click", (event) => {
      if (!(event.target instanceof Element)) return;
      const target = event.target.closest("button[data-work-year]");
      if (!target) return;
      const nextYear = target.getAttribute("data-work-year") || "all";
      applyWorkFilter(nextYear);
    });
  }
  
  if (workFilter) {
    workFilter.addEventListener("animationend", (event) => {
      if (
        event.target instanceof SVGPathElement &&
        event.animationName === "work-filter-squiggle-draw"
      ) {
        workFilter.classList.remove("is-squiggle-anim");
      }
    });
  }

  if (projectModalClose) {
    projectModalClose.addEventListener("click", () => {
      closeProjectModal();
    });
  }

  if (projectModalBackdrop) {
    projectModalBackdrop.addEventListener("click", () => {
      closeProjectModal();
    });
  }

  document.addEventListener("click", (event) => {
    if (!workFilter || !workFilter.contains(event.target)) {
      closeWorkFilterMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (isResumeOpen()) {
        closeResumeScreen();
        return;
      }
      if (isModalOpen()) {
        closeProjectModal();
        return;
      }
      closeWorkFilterMenu();
    }
  });
  
  window.addEventListener(
    "resize",
    () => {
      recomputeWorkLinksLockedHeight();
    },
    { passive: true }
  );
  
  setWorkFilterHidden(true);
  updateWorkFilterLabel();
  renderWorkFilterMenu();
  renderWorkLinks();
  void loadWorkProjects();
  
  renderPhrase(index, !reduceMotion);
  if (reduceMotion) {
    document.body.classList.add("intro-complete");
  } else {
    window.setTimeout(() => {
      document.body.classList.add("intro-complete");
    }, introAnimClearMs);
  }
  
  const runCycle = () => {
    if (remainingSteps === 0) return;
    if (projectsOpen) {
      if (pausedCycleDelayMs === null) {
        pausedCycleDelayMs = rotationIntervalMs;
      }
      return;
    }
  
    animateGreeting();
    remainingSteps -= 1;
    if (remainingSteps > 0) {
      scheduleCycle(rotationIntervalMs);
    } else {
      cycleTimer = null;
      cycleDeadlineMs = null;
      pausedCycleDelayMs = null;
    }
  };
  
  scheduleCycle(startDelayMs);
};
