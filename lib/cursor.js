export const cursor = () => {
  const cursorElement = document.getElementById("custom-cursor");
  const canUseCustomCursor = window.matchMedia("(pointer: fine)").matches;
  const precisePointerTypes = new Set(["mouse", "pen"]);
  const interactiveCursorSelector = "a, #theme-toggle, button";
  const cursorBaseSize = 24;
  const cursorEdgePadding = 4;

  if (!cursorElement || !canUseCustomCursor) {
    if (cursorElement) {
      cursorElement.style.display = "none";
    }
    return;
  }

  document.body.classList.add("cursor-enabled");

  const isPrecisePointerEvent = (event) => precisePointerTypes.has(event.pointerType);
  const getViewportMetrics = () => {
    const viewport = window.visualViewport;
    return {
      width: viewport?.width ?? window.innerWidth,
      height: viewport?.height ?? window.innerHeight,
      scale: viewport?.scale ?? 1,
    };
  };

  const syncCursorZoomScale = () => {
    const { scale } = getViewportMetrics();
    const compensatedScale = Math.min(1.15, Math.max(0.8, 1 / scale));
    cursorElement.style.setProperty("--cursor-zoom-scale", String(compensatedScale));
  };

  const getCursorStateScale = () => {
    if (cursorElement.classList.contains("is-link-hover") && cursorElement.classList.contains("is-pressed")) {
      return 2.05;
    }
    if (cursorElement.classList.contains("is-link-hover")) {
      return 2;
    }
    if (cursorElement.classList.contains("is-pressed")) {
      return 1.85;
    }
    return 1;
  };

  const clampCursorPoint = (x, y) => {
    const { width, height } = getViewportMetrics();
    const renderedSize = cursorBaseSize * getCursorStateScale() * (Number.parseFloat(cursorElement.style.getPropertyValue("--cursor-zoom-scale")) || 1);
    const halfSize = renderedSize / 2;
    const minX = halfSize + cursorEdgePadding;
    const minY = halfSize + cursorEdgePadding;
    const maxX = width - halfSize - cursorEdgePadding;
    const maxY = height - halfSize - cursorEdgePadding;

    return {
      x: maxX >= minX ? Math.min(Math.max(x, minX), maxX) : width / 2,
      y: maxY >= minY ? Math.min(Math.max(y, minY), maxY) : height / 2,
    };
  };

  const applyCursorPosition = () => {
    const clampedPoint = clampCursorPoint(cursorCurrentX, cursorCurrentY);
    cursorCurrentX = clampedPoint.x;
    cursorCurrentY = clampedPoint.y;
    cursorElement.style.left = `${cursorCurrentX}px`;
    cursorElement.style.top = `${cursorCurrentY}px`;
  };

  const syncCursorViewportState = () => {
    syncCursorZoomScale();
    if (!hasCursorPosition) return;
    applyCursorPosition();
  };

  const updateCursorLinkHover = (target) => {
    if (!(target instanceof Element)) {
      cursorElement.classList.remove("is-link-hover");
      syncCursorViewportState();
      return;
    }

    cursorElement.classList.toggle(
      "is-link-hover",
      Boolean(target.closest(interactiveCursorSelector))
    );
    syncCursorViewportState();
  };

  const cursorLerpFactor = 0.24;
  const cursorSnapThreshold = 0.2;
  let cursorFrame = null;
  let cursorCurrentX = 0;
  let cursorCurrentY = 0;
  let cursorTargetX = 0;
  let cursorTargetY = 0;
  let hasCursorPosition = false;
  let pointerTarget = null;

  const animateCursorPosition = () => {
    const deltaX = cursorTargetX - cursorCurrentX;
    const deltaY = cursorTargetY - cursorCurrentY;
    const shouldLerpX = Math.abs(deltaX) > cursorSnapThreshold;
    const shouldLerpY = Math.abs(deltaY) > cursorSnapThreshold;

    if (shouldLerpX) {
      cursorCurrentX += deltaX * cursorLerpFactor;
    } else {
      cursorCurrentX = cursorTargetX;
    }

    if (shouldLerpY) {
      cursorCurrentY += deltaY * cursorLerpFactor;
    } else {
      cursorCurrentY = cursorTargetY;
    }

    applyCursorPosition();
    cursorElement.classList.add("is-visible");
    updateCursorLinkHover(pointerTarget);

    if (shouldLerpX || shouldLerpY) {
      cursorFrame = window.requestAnimationFrame(animateCursorPosition);
      return;
    }

    cursorFrame = null;
  };

  const scheduleCursorPositionUpdate = () => {
    if (cursorFrame !== null) return;
    cursorFrame = window.requestAnimationFrame(animateCursorPosition);
  };

  syncCursorViewportState();

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!isPrecisePointerEvent(event)) return;

      cursorTargetX = event.clientX;
      cursorTargetY = event.clientY;

      if (!hasCursorPosition) {
        cursorCurrentX = cursorTargetX;
        cursorCurrentY = cursorTargetY;
        hasCursorPosition = true;
      }
      pointerTarget = event.target;
      syncCursorViewportState();
      scheduleCursorPositionUpdate();
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerover",
    (event) => {
      if (!isPrecisePointerEvent(event)) return;
      updateCursorLinkHover(event.target);
    },
    { passive: true }
  );

  window.addEventListener(
    "pointerdown",
    (event) => {
      if (!isPrecisePointerEvent(event)) return;
      cursorElement.classList.add("is-pressed");
      syncCursorViewportState();
    },
    { passive: true }
  );

  const resetCursorScale = (event) => {
    if (event && event.pointerType && !precisePointerTypes.has(event.pointerType)) {
      return;
    }
    cursorElement.classList.remove("is-pressed");
    syncCursorViewportState();
  };

  window.addEventListener("pointerup", resetCursorScale, { passive: true });
  window.addEventListener("pointercancel", resetCursorScale, { passive: true });

  const hideCursor = () => {
    cursorElement.classList.remove("is-visible");
    cursorElement.classList.remove("is-pressed");
    cursorElement.classList.remove("is-link-hover");
  };

  window.addEventListener("blur", () => {
    if (cursorFrame !== null) {
      window.cancelAnimationFrame(cursorFrame);
      cursorFrame = null;
    }
    hideCursor();
  });

  window.addEventListener(
    "mouseout",
    (event) => {
      if (!event.relatedTarget) {
        hideCursor();
      }
    },
    { passive: true }
  );

  window.addEventListener(
    "mouseover",
    () => {
      cursorElement.classList.add("is-visible");
    },
    { passive: true }
  );

  const viewport = window.visualViewport;
  if (viewport) {
    viewport.addEventListener("resize", syncCursorViewportState, { passive: true });
    viewport.addEventListener("scroll", syncCursorViewportState, { passive: true });
  }
  window.addEventListener("resize", syncCursorViewportState, { passive: true });
};
