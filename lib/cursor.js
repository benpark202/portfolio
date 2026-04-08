export const cursor = () => {
  const cursorElement = document.getElementById("custom-cursor");
  const canUseCustomCursor = window.matchMedia("(pointer: fine)").matches;
  const precisePointerTypes = new Set(["mouse", "pen"]);
  const interactiveCursorSelector = "a, #theme-toggle, button";

  if (!cursorElement || !canUseCustomCursor) {
    if (cursorElement) {
      cursorElement.style.display = "none";
    }
    return;
  }

  document.body.classList.add("cursor-enabled");

  const isPrecisePointerEvent = (event) => precisePointerTypes.has(event.pointerType);

  const updateCursorLinkHover = (target) => {
    if (!(target instanceof Element)) {
      cursorElement.classList.remove("is-link-hover");
      return;
    }

    cursorElement.classList.toggle(
      "is-link-hover",
      Boolean(target.closest(interactiveCursorSelector))
    );
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

    cursorElement.style.left = `${cursorCurrentX}px`;
    cursorElement.style.top = `${cursorCurrentY}px`;
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
    },
    { passive: true }
  );

  const resetCursorScale = (event) => {
    if (event && event.pointerType && !precisePointerTypes.has(event.pointerType)) {
      return;
    }
    cursorElement.classList.remove("is-pressed");
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
};
