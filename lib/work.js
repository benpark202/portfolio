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
  const workDataPaths = ["/api/work", "work.json"];
  const currentWorkYear = String(new Date().getFullYear());
  const fallbackWorkProjects = [
    { name: "matchai", year: 2026, link: "/matchai" },
    { name: "wayvilo", year: 2026, link: "/wayvilo" },
    { name: "pask", year: 2025, link: "/pask" },
  ];
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
  const sortedFallbackWorkProjects = [...fallbackWorkProjects].sort(
    byNewestYearThenName
  );
  
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
  let workProjects = [...sortedFallbackWorkProjects];
  let selectedWorkYear = currentWorkYear;
  let workLinksLockedHeightPx = 0;
  let workFilterLabelSwapTimer = null;
  let workFilterLabelShowCleanupTimer = null;
  let workFilterSquiggleTimer = null;
  let workFilterRevealTimer = null;
  let workLinksEnterDelayResetTimer = null;
  
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
  
  const renderPhraseText = (phrase, animateParts) => {
    if (!phrase) return;
  
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
      ? Array.from(workLinksContainer.querySelectorAll("a[data-work-link]"))
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
  
  const createWorkLink = (project) => {
    const link = document.createElement("a");
    link.dataset.workLink = "";
    link.href = project.link;
    link.tabIndex = -1;
  
    if (/^https?:\/\//i.test(project.link)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
  
    const icon = document.createElement("span");
    icon.className = "hover-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.innerHTML =
      '<span class="material-symbols-rounded material-glyph">arrow_circle_up</span>';
  
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
  
    return source
      .map((project) => {
        const name = String(project?.name ?? "").trim().toLowerCase();
        const link = String(project?.link ?? "").trim();
        const numericYear = Number(project?.year);
        if (!name || !link || !Number.isFinite(numericYear)) {
          return null;
        }
        return { name, year: numericYear, link };
      })
      .filter(Boolean)
      .sort(byNewestYearThenName);
  };
  
  const loadWorkProjects = async () => {
    try {
      let payload = null;
      for (const path of workDataPaths) {
        const response = await window.fetch(path, { cache: "no-store" });
        if (!response.ok) {
          continue;
        }
        payload = await response.json();
        break;
      }

      if (!payload) {
        throw new Error("Unable to load work data");
      }

      const normalizedProjects = normalizeWorkProjects(payload);
      if (normalizedProjects.length > 0) {
        workProjects = normalizedProjects;
      }
    } catch (_error) {
      workProjects = [...sortedFallbackWorkProjects];
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
  
  document.addEventListener("click", (event) => {
    if (!workFilter || !workFilter.contains(event.target)) {
      closeWorkFilterMenu();
    }
  });
  
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
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
