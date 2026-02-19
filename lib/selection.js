export const selection = () => {
  const selectionOverlay = document.createElement("div");
  selectionOverlay.className = "selection-overlay";
  selectionOverlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(selectionOverlay);

  const clearSelectionOverlay = () => {
    selectionOverlay.replaceChildren();
  };

  const renderSelectionOverlay = () => {
    const selectedText = window.getSelection();
    if (!selectedText || selectedText.rangeCount === 0 || selectedText.isCollapsed) {
      clearSelectionOverlay();
      return;
    }

    const range = selectedText.getRangeAt(0);
    if (!document.body.contains(range.commonAncestorContainer)) {
      clearSelectionOverlay();
      return;
    }

    const rects = Array.from(range.getClientRects()).filter(
      (rect) => rect.width > 0 && rect.height > 0
    );
    if (rects.length === 0) {
      clearSelectionOverlay();
      return;
    }

    const fragment = document.createDocumentFragment();
    rects.forEach((rect) => {
      const pill = document.createElement("span");
      pill.className = "selection-pill";
      pill.style.left = `${rect.left}px`;
      pill.style.top = `${rect.top}px`;
      pill.style.width = `${rect.width}px`;
      pill.style.height = `${rect.height}px`;
      fragment.appendChild(pill);
    });
    selectionOverlay.replaceChildren(fragment);
  };

  let selectionOverlayFrame = null;
  const scheduleSelectionOverlayRender = () => {
    if (selectionOverlayFrame !== null) return;
    selectionOverlayFrame = window.requestAnimationFrame(() => {
      selectionOverlayFrame = null;
      renderSelectionOverlay();
    });
  };

  document.addEventListener("selectionchange", scheduleSelectionOverlayRender);
  window.addEventListener("resize", scheduleSelectionOverlayRender, { passive: true });
  document.addEventListener(
    "scroll",
    () => {
      if (selectionOverlay.childElementCount > 0) {
        scheduleSelectionOverlayRender();
      }
    },
    { capture: true, passive: true }
  );
};
