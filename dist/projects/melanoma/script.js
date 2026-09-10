(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const board = document.querySelector(".board");
  const treatmentLines = Array.from(document.querySelectorAll(".treatment-line"));
  const mitigationCard = document.querySelector("[data-mitigation-card]");
  const mitigationImage = document.getElementById("mitigation-image");
  const mitigationTitle = document.getElementById("mitigation-title");
  const riskSlider = document.querySelector(".risk-slider");
  const abcdeCard = document.querySelector(".card-abcde");
  const abcdeLetter = document.getElementById("abcde-letter");
  const abcdeMeaning = document.getElementById("abcde-meaning");
  const abcdeDescription = document.getElementById("abcde-description");
  const treatmentStepDelayMs = 1900;
  const treatmentInitialIndex = 2;
  const mitigationStepDelayMs = 3000;
  const mitigationTransitionMs = 220;
  const abcdeStepDelayMs = 5400;
  const abcdeTransitionMs = 220;
  const riskSliderTargetProgress = 0.82;
  const mitigationItems = [
    [
      "/assets/cancer-project/sunscreenBottle.png",
      'Wear sunscreen with at least <span class="mitigation-emphasis">SPF 30+</span>',
      "Wear sunscreen with at least SPF 30+",
      "cover",
    ],
    [
      "/assets/cancer-project/office.png",
      'Visit a <span class="mitigation-emphasis">Dermatologist</span> for monthly skin checkups',
      "Visit a Dermatologist for monthly skin checkups",
      "cover",
    ],
    [
      "/assets/cancer-project/tanningBed.png",
      '<span class="mitigation-emphasis">Avoid</span> tanning beds or sitting under the sun for too long',
      "Avoid tanning beds or sitting under the sun for too long",
      "cover",
    ],
    [
      "/assets/cancer-project/sunglasses.png",
      'Wear <span class="mitigation-emphasis">sunglasses</span> and protective clothing',
      "Wear sunglasses and protective clothing",
      "contain",
    ],
  ];
  const abcdeItems = [
    ["A", "Asymmetry", "One half of the mole does not match the other."],
    ["B", "Border", "Edges look ragged, blurred, or uneven instead of smooth."],
    ["C", "Color", "Look for multiple shades like tan, brown, black, red, or blue."],
    ["D", "Diameter", "A spot larger than about a pencil eraser deserves attention."],
    ["E", "Evolution", "Any mole changing in size, shape, color, or symptoms is concerning."],
  ];

  if (!board) return;

  const normalizeTreatmentSlot = (lineIndex, activeIndex, lineCount) => {
    const midpoint = Math.floor(lineCount / 2);
    return ((lineIndex - activeIndex + lineCount + midpoint) % lineCount) - midpoint;
  };

  const syncTreatmentRotation = (activeIndex) => {
    if (treatmentLines.length === 0) return;

    treatmentLines.forEach((line, lineIndex) => {
      const slot = normalizeTreatmentSlot(lineIndex, activeIndex, treatmentLines.length);
      line.dataset.slot = String(slot);
      line.setAttribute("aria-hidden", String(slot !== 0));
    });
  };

  let mitigationTransitionTimeoutId = 0;

  const syncMitigationRotation = (activeIndex, options = {}) => {
    const activeMitigation = mitigationItems[activeIndex];
    if (!activeMitigation || !mitigationImage || !mitigationTitle) return;

    const { immediate = false } = options;
    const [imageSrc, mitigationHtml, mitigationLabel, imageFit = "cover"] = activeMitigation;

    const applyMitigation = () => {
      mitigationImage.src = imageSrc;
      mitigationImage.alt = "";
      mitigationImage.classList.toggle("mitigation-image-fit", imageFit === "contain");
      mitigationTitle.innerHTML = mitigationHtml;
      mitigationTitle.setAttribute("aria-label", mitigationLabel);
      mitigationTitle.classList.add("is-ready");

      if (mitigationImage.complete && mitigationImage.naturalWidth > 0) {
        mitigationImage.classList.add("is-ready");
      }
    };

    window.clearTimeout(mitigationTransitionTimeoutId);
    mitigationImage.classList.remove("is-ready");
    mitigationTitle.classList.remove("is-ready");

    if (immediate || reduceMotion) {
      applyMitigation();
      return;
    }

    mitigationTransitionTimeoutId = window.setTimeout(applyMitigation, mitigationTransitionMs);
  };

  const syncAbcdeRotation = (activeIndex, options = {}) => {
    const activeItem = abcdeItems[activeIndex];
    if (!activeItem || !abcdeLetter || !abcdeMeaning || !abcdeDescription) return;

    const { immediate = false } = options;
    const [letter, meaning, description] = activeItem;

    if (immediate) {
      abcdeLetter.textContent = letter;
      abcdeMeaning.textContent = meaning;
      abcdeDescription.textContent = description;
      abcdeLetter.classList.add("is-ready");
      abcdeMeaning.classList.add("is-ready");
      abcdeDescription.classList.add("is-ready");
      return;
    }

    abcdeLetter.classList.remove("is-ready");
    abcdeMeaning.classList.remove("is-ready");
    abcdeDescription.classList.remove("is-ready");

    window.setTimeout(() => {
      abcdeLetter.textContent = letter;
      abcdeMeaning.textContent = meaning;
      abcdeDescription.textContent = description;
      abcdeLetter.classList.add("is-ready");
      abcdeMeaning.classList.add("is-ready");
      abcdeDescription.classList.add("is-ready");
    }, abcdeTransitionMs);
  };

  const syncRiskSlider = (progress) => {
    if (!riskSlider) return;
    riskSlider.style.setProperty("--risk-slider-progress", String(progress));
  };

  const animateRiskSliderIn = () => {
    if (!riskSlider) return;

    let currentProgress = 0;

    const step = () => {
      currentProgress += (riskSliderTargetProgress - currentProgress) * 0.12;

      if (Math.abs(riskSliderTargetProgress - currentProgress) < 0.0015) {
        syncRiskSlider(riskSliderTargetProgress);
        return;
      }

      syncRiskSlider(currentProgress);
      window.requestAnimationFrame(step);
    };

    syncRiskSlider(0);
    window.requestAnimationFrame(step);
  };

  let hasAnimatedRiskSlider = false;

  const revealBoardWithRiskSlider = () => {
    revealBoard();

    if (hasAnimatedRiskSlider) return;
    hasAnimatedRiskSlider = true;
    animateRiskSliderIn();
  };

  if (mitigationImage) {
    mitigationImage.addEventListener("load", () => {
      mitigationImage.classList.add("is-ready");
    });
  };

  const revealBoard = () => {
    board.classList.add("is-open");
  };

  syncTreatmentRotation(Math.min(treatmentInitialIndex, treatmentLines.length - 1));
  syncMitigationRotation(0, { immediate: true });
  syncAbcdeRotation(0, { immediate: true });
  syncRiskSlider(0);

  if (reduceMotion) {
    syncRiskSlider(riskSliderTargetProgress);
    revealBoard();
    return;
  }

  if (treatmentLines.length > 1) {
    let activeTreatmentIndex = Math.min(treatmentInitialIndex, treatmentLines.length - 1);

    const advanceTreatmentRotation = () => {
      activeTreatmentIndex = (activeTreatmentIndex + 1) % treatmentLines.length;
      syncTreatmentRotation(activeTreatmentIndex);
      window.setTimeout(advanceTreatmentRotation, treatmentStepDelayMs);
    };

    window.setTimeout(advanceTreatmentRotation, treatmentStepDelayMs);
  }

  if (mitigationItems.length > 1) {
    let activeMitigationIndex = 0;
    let mitigationAutoRotateEnabled = true;

    const advanceMitigationRotation = () => {
      activeMitigationIndex = (activeMitigationIndex + 1) % mitigationItems.length;
      syncMitigationRotation(activeMitigationIndex);

      if (mitigationAutoRotateEnabled) {
        window.setTimeout(advanceMitigationRotation, mitigationStepDelayMs);
      }
    };

    mitigationCard?.addEventListener("click", () => {
      mitigationAutoRotateEnabled = false;
      activeMitigationIndex = (activeMitigationIndex + 1) % mitigationItems.length;
      syncMitigationRotation(activeMitigationIndex);
    });

    mitigationCard?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      mitigationAutoRotateEnabled = false;
      activeMitigationIndex = (activeMitigationIndex + 1) % mitigationItems.length;
      syncMitigationRotation(activeMitigationIndex);
    });

    window.setTimeout(advanceMitigationRotation, mitigationStepDelayMs);
  }

  if (abcdeItems.length > 1) {
    let activeAbcdeIndex = 0;
    let abcdeAutoRotateEnabled = true;

    const advanceAbcdeRotation = () => {
      if (!abcdeAutoRotateEnabled) return;
      activeAbcdeIndex = (activeAbcdeIndex + 1) % abcdeItems.length;
      syncAbcdeRotation(activeAbcdeIndex);
      window.setTimeout(advanceAbcdeRotation, abcdeStepDelayMs);
    };

    abcdeCard?.addEventListener("click", () => {
      abcdeAutoRotateEnabled = false;
      activeAbcdeIndex = (activeAbcdeIndex + 1) % abcdeItems.length;
      syncAbcdeRotation(activeAbcdeIndex);
    });

    abcdeCard?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      abcdeAutoRotateEnabled = false;
      activeAbcdeIndex = (activeAbcdeIndex + 1) % abcdeItems.length;
      syncAbcdeRotation(activeAbcdeIndex);
    });

    window.setTimeout(advanceAbcdeRotation, abcdeStepDelayMs);
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      revealBoardWithRiskSlider();
    });
  });

  window.addEventListener(
    "pageshow",
    () => {
      revealBoardWithRiskSlider();
    },
    { once: true },
  );
})();
