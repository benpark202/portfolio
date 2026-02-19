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

  const isPrecisePointerEvent = (event) =>
    precisePointerTypes.has(event.pointerType);

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

  let cursorFrame = null;
  let pointerX = 0;
  let pointerY = 0;
  let pointerTarget = null;

  const flushCursorPosition = () => {
    cursorFrame = null;
    cursorElement.style.left = `${pointerX}px`;
    cursorElement.style.top = `${pointerY}px`;
    cursorElement.classList.add("is-visible");
    updateCursorLinkHover(pointerTarget);
  };

  const scheduleCursorPositionUpdate = () => {
    if (cursorFrame !== null) return;
    cursorFrame = window.requestAnimationFrame(flushCursorPosition);
  };

  window.addEventListener(
    "pointermove",
    (event) => {
      if (!isPrecisePointerEvent(event)) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
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
  window.addEventListener("blur", () => {
    cursorElement.classList.remove("is-pressed");
    cursorElement.classList.remove("is-link-hover");
  });

  window.addEventListener(
    "mouseout",
    (event) => {
      if (!event.relatedTarget) {
        cursorElement.classList.remove("is-visible");
        cursorElement.classList.remove("is-pressed");
        cursorElement.classList.remove("is-link-hover");
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
