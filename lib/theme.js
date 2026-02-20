const theme = () => {
  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const body = document.body;
  const themeKey = "theme-preference";
  const themeSurfaceColors = {
    light: "#e9e6dc",
    dark: "#111213",
  };
  const transitionShapes = [
    { className: "is-circle", widthScale: 1, heightScale: 1 },
    { className: "is-triangle", widthScale: 1.35, heightScale: 1.35 },
    { className: "is-diamond", widthScale: 1.2, heightScale: 1.2 },
    { className: "is-pill", widthScale: 1.45, heightScale: 0.8 },
  ];
  const themeSwapScaleThreshold = 0.58;
  const fadeLerp = 0.1;
  const growDurationMs = 920;
  const holdDurationMs = 120;
  const minimumScale = 0.001;
  const opacitySnapThreshold = 0.02;
  const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  let isThemeTransitioning = false;
  let lastTransitionShapeIndex = -1;

  const lerp = (startValue, endValue, amount) =>
    startValue + (endValue - startValue) * amount;

  const smootherStep = (value) => value * value * value * (value * (value * 6 - 15) + 10);

  const getFrameLerpAmount = (baseAmount, deltaTimeMs) => {
    const normalizedFrames = Math.max(0.5, deltaTimeMs / (1000 / 60));
    return 1 - Math.pow(1 - baseAmount, normalizedFrames);
  };

  const applyTheme = (mode) => {
    root.setAttribute("data-theme", mode);
    if (!themeToggle) return;
    themeToggle.setAttribute(
      "aria-label",
      mode === "dark" ? "switch to light mode" : "switch to dark mode"
    );
  };

  const getSavedTheme = () => {
    try {
      const savedTheme = window.localStorage.getItem(themeKey);
      return savedTheme === "light" || savedTheme === "dark" ? savedTheme : null;
    } catch (_error) {
      return null;
    }
  };

  const setSavedTheme = (mode) => {
    try {
      window.localStorage.setItem(themeKey, mode);
    } catch (_error) {
      // Storage can be unavailable in some private contexts.
    }
  };

  const savedTheme = getSavedTheme();
  const initialTheme = savedTheme === "light" || savedTheme === "dark" ? savedTheme : "light";
  applyTheme(initialTheme);

  if (!themeToggle) return;
  themeToggle.addEventListener("click", () => {
    if (isThemeTransitioning) return;
    const currentTheme = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    const isReverseToLight = nextTheme === "light";
    if (reduceMotionQuery.matches) {
      applyTheme(nextTheme);
      setSavedTheme(nextTheme);
      return;
    }

    const originX = window.innerWidth / 2;
    const originY = window.innerHeight / 2;
    const radius = Math.hypot(originX, originY);
    const diameter = radius * 2;
    const availableShapeIndices = transitionShapes
      .map((_shape, index) => index)
      .filter((index) => index !== lastTransitionShapeIndex);
    const randomShapeIndex = availableShapeIndices[
      Math.floor(Math.random() * availableShapeIndices.length)
    ];
    const shapeIndex = Number.isInteger(randomShapeIndex)
      ? randomShapeIndex
      : 0;
    const shape = transitionShapes[shapeIndex] ?? transitionShapes[0];
    lastTransitionShapeIndex = shapeIndex;
    const width = diameter * shape.widthScale;
    const height = diameter * shape.heightScale;

    const circle = document.createElement("span");
    circle.className = `theme-transition-circle ${shape.className}`;
    circle.style.left = `${originX}px`;
    circle.style.top = `${originY}px`;
    circle.style.width = `${width}px`;
    circle.style.height = `${height}px`;
    circle.style.setProperty(
      "--theme-transition-scale",
      isReverseToLight ? "1" : String(minimumScale)
    );
    circle.style.backgroundColor = isReverseToLight
      ? themeSurfaceColors[currentTheme] ?? themeSurfaceColors.dark
      : themeSurfaceColors[nextTheme] ?? themeSurfaceColors.light;

    isThemeTransitioning = true;
    body.classList.add("theme-switching");
    document.body.appendChild(circle);

    let currentScale = isReverseToLight ? 1 : minimumScale;
    let currentOpacity = 1;
    let themeApplied = false;
    let phase = isReverseToLight ? "shrink" : "grow";
    let previousFrameTime = window.performance.now();
    let growElapsedMs = 0;
    let holdElapsedMs = 0;
    let shrinkElapsedMs = 0;

    if (isReverseToLight) {
      applyTheme(nextTheme);
      setSavedTheme(nextTheme);
      themeApplied = true;
    }

    const stepTransition = (nowMs) => {
      const deltaMs = Math.min(40, Math.max(8, nowMs - previousFrameTime));
      previousFrameTime = nowMs;

      if (phase === "grow") {
        growElapsedMs += deltaMs;
        const growProgress = Math.min(1, growElapsedMs / growDurationMs);
        const easedGrowProgress = smootherStep(growProgress);
        currentScale = lerp(minimumScale, 1, easedGrowProgress);
        if (!themeApplied && currentScale >= themeSwapScaleThreshold) {
          applyTheme(nextTheme);
          setSavedTheme(nextTheme);
          themeApplied = true;
        }
        if (growProgress === 1) {
          currentScale = 1;
          phase = "hold";
        }
      } else if (phase === "shrink") {
        shrinkElapsedMs += deltaMs;
        const shrinkProgress = Math.min(1, shrinkElapsedMs / growDurationMs);
        const easedShrinkProgress = smootherStep(shrinkProgress);
        currentScale = lerp(1, minimumScale, easedShrinkProgress);
        if (shrinkProgress === 1) {
          currentScale = minimumScale;
          circle.style.setProperty("--theme-transition-scale", `${currentScale}`);
          circle.remove();
          body.classList.remove("theme-switching");
          isThemeTransitioning = false;
          return;
        }
      } else if (phase === "hold") {
        currentScale = 1;
        holdElapsedMs += deltaMs;
        if (holdElapsedMs >= holdDurationMs) {
          phase = "fade";
        }
      } else {
        const amount = getFrameLerpAmount(fadeLerp, deltaMs);
        currentOpacity = lerp(currentOpacity, 0, amount);
        if (currentOpacity <= opacitySnapThreshold) {
          currentOpacity = 0;
        }
      }

      circle.style.setProperty("--theme-transition-scale", `${currentScale}`);
      circle.style.opacity = `${currentOpacity}`;

      if (phase === "fade" && currentOpacity === 0) {
        if (!themeApplied) {
          applyTheme(nextTheme);
          setSavedTheme(nextTheme);
        }
        circle.remove();
        body.classList.remove("theme-switching");
        isThemeTransitioning = false;
        return;
      }

      window.requestAnimationFrame(stepTransition);
    };

    window.requestAnimationFrame(stepTransition);
  });
};

export default theme;
