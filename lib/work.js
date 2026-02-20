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
  const nameRegex = /\bben\b|벤/gi;
  const byNewestYearThenName = (left, right) =>
    right.year - left.year || left.name.localeCompare(right.name);
  const benSquiggleSvg =
    '<svg class="name-squiggle" viewBox="0 0 120 16" preserveAspectRatio="none" aria-hidden="true"><path d="M1 9 C6 9 6 3 13 3 C20 3 20 9 27 9 C34 9 34 3 41 3 C48 3 48 9 55 9 C62 9 62 3 69 3 C76 3 76 9 83 9 C90 9 90 3 97 3 C104 3 104 9 111 9 C116 9 118 6 119 5"/></svg>';
  
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
  
  const escapeHtml = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  
  const renderSecondPartMarkup = (value) => {
    const escaped = escapeHtml(value);
    return escaped.replace(
      nameRegex,
      (name) =>
        `<span class="name-with-squiggle"><span class="name-text">${name}</span>${benSquiggleSvg}</span>`
    );
  };
  
  greeting.innerHTML =
    '<span class="greeting-part greeting-first"></span><span class="greeting-part greeting-second"></span>';
  const firstPart = greeting.querySelector(".greeting-first");
  const secondPart = greeting.querySelector(".greeting-second");
  const projectsToggle = document.getElementById("projects-toggle");
  const projectsLabel = projectsToggle?.querySelector(".projects-label") ?? null;
  const resumeLink = document.getElementById("resume-link");
  const secondaryLinks = Array.from(document.querySelectorAll("a[data-secondary-link]"));
  const workLinksContainer = document.getElementById("work-links");
  const workFilter = document.getElementById("work-filter");
  const workFilterToggle = document.getElementById("work-filter-toggle");
  const workFilterMenu = document.getElementById("work-filter-menu");
  const workFilterYearLabel = document.getElementById("work-filter-current-year");
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
  const projectModalDescription = document.getElementById("project-modal-description");
  const projectModalButtons = document.getElementById("project-modal-buttons");
  if (!firstPart || !secondPart) return;
  
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
    secondPart.innerHTML = renderSecondPartMarkup(phrase.second);
  
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
      if (option.value === selectedWorkYear) {
        button.classList.add("is-selected");
        button.setAttribute("aria-selected", "true");
      } else {
        button.setAttribute("aria-selected", "false");
      }
      return button;
    });
  
    workFilterMenu.replaceChildren(...optionButtons);
  };

  const isModalOpen = () =>
    !!projectModal && !projectModal.classList.contains("is-hidden");

  const closeProjectModal = () => {
    if (!projectModal || !isModalOpen()) return;

    projectModal.classList.add("is-hidden");
    projectModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-project-modal-open");

    if (focusedBeforeModal && document.contains(focusedBeforeModal)) {
      focusedBeforeModal.focus();
    }
    focusedBeforeModal = null;
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

    if (projectModalImage && projectModalMedia) {
      if (projectImageSrc) {
        projectModalImage.onload = () => {
          projectModalMedia.classList.remove("is-empty");
        };
        projectModalImage.onerror = () => {
          projectModalImage.removeAttribute("src");
          projectModalImage.alt = "";
          projectModalMedia.classList.add("is-empty");
        };
        projectModalImage.src = projectImageSrc;
        projectModalImage.alt = projectImageAlt;
        projectModalMedia.classList.remove("is-empty");
      } else {
        projectModalImage.onload = null;
        projectModalImage.onerror = null;
        projectModalImage.removeAttribute("src");
        projectModalImage.alt = "";
        projectModalMedia.classList.add("is-empty");
      }
    }

    const extraButtons = projectButtons.filter(
      (buttonConfig) =>
        String(buttonConfig?.label ?? "").trim().toLowerCase() !== "case study"
    );
    const modalButtons = [
      createProjectModalButton("open link", project?.link, true, true),
      ...extraButtons.map((buttonConfig) =>
        createProjectModalButton(buttonConfig?.label, buttonConfig?.link)
      ),
    ];
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

    const icon = document.createElement("span");
    icon.className = "hover-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<span class="material-symbols-rounded material-glyph">deployed_code</span>';
  
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
    setLinksHidden(secondaryLinks, false);
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
  
  if (projectsToggle) {
    projectsToggle.addEventListener("click", (event) => {
      event.preventDefault();
      toggleProjectsView();
    });
  }
  
  if (resumeLink) {
    resumeLink.addEventListener("click", (event) => {
      event.preventDefault();
      window.alert("site still in progress! check back again for more.");
    });
  }
  
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
