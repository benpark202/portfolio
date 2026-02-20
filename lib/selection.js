export const selection = () => {
  const selectionOverlay = document.createElement("div");
  selectionOverlay.className = "selection-overlay";
  selectionOverlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(selectionOverlay);
  const selectionLerpFactor = 0.26;
  const selectionSnapThreshold = 0.18;
  const selectionFadeMs = 220;
  const selectionRectKeys = ["left", "top", "width", "height"];
  const selectionPills = [];
  let selectionAnimationFrame = null;
  let selectionOverlayFrame = null;
  let selectionClearTimer = null;

  const areRectsNearEqual = (leftRect, rightRect) => {
    const epsilon = 1.5;
    return (
      Math.abs(leftRect.left - rightRect.left) <= epsilon &&
      Math.abs(leftRect.top - rightRect.top) <= epsilon &&
      Math.abs(leftRect.width - rightRect.width) <= epsilon &&
      Math.abs(leftRect.height - rightRect.height) <= epsilon
    );
  };

  const getMedian = (values) => {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((left, right) => left - right);
    const middleIndex = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[middleIndex];
    }
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  };

  const applyPillRect = (pillElement, rect) => {
    pillElement.style.left = `${rect.left}px`;
    pillElement.style.top = `${rect.top}px`;
    pillElement.style.width = `${rect.width}px`;
    pillElement.style.height = `${rect.height}px`;
  };

  const stopSelectionAnimation = () => {
    if (selectionAnimationFrame !== null) {
      window.cancelAnimationFrame(selectionAnimationFrame);
      selectionAnimationFrame = null;
    }
  };

  const clearSelectionClearTimer = () => {
    if (selectionClearTimer !== null) {
      window.clearTimeout(selectionClearTimer);
      selectionClearTimer = null;
    }
  };

  const showSelectionOverlay = () => {
    clearSelectionClearTimer();
    selectionOverlay.classList.add("is-active");
  };

  const clearSelectionOverlay = () => {
    stopSelectionAnimation();
    selectionOverlay.classList.remove("is-active");
    if (selectionPills.length === 0) return;

    clearSelectionClearTimer();
    selectionClearTimer = window.setTimeout(() => {
      selectionPills.splice(0, selectionPills.length);
      selectionOverlay.replaceChildren();
      selectionClearTimer = null;
    }, selectionFadeMs);
  };

  const syncSelectionPills = (rects) => {
    while (selectionPills.length > rects.length) {
      const removedPill = selectionPills.pop();
      removedPill?.element.remove();
    }

    rects.forEach((rect, index) => {
      let pillState = selectionPills[index];
      if (!pillState) {
        const pillElement = document.createElement("span");
        pillElement.className = "selection-pill";
        selectionOverlay.appendChild(pillElement);
        pillState = {
          element: pillElement,
          currentRect: { ...rect },
          targetRect: { ...rect },
        };
        selectionPills.push(pillState);
        applyPillRect(pillElement, rect);
        return;
      }

      pillState.targetRect = { ...rect };
    });
  };

  const animateSelectionOverlay = () => {
    let hasActiveMotion = false;

    selectionPills.forEach((pillState) => {
      selectionRectKeys.forEach((rectKey) => {
        const delta = pillState.targetRect[rectKey] - pillState.currentRect[rectKey];
        if (Math.abs(delta) > selectionSnapThreshold) {
          pillState.currentRect[rectKey] += delta * selectionLerpFactor;
          hasActiveMotion = true;
          return;
        }
        pillState.currentRect[rectKey] = pillState.targetRect[rectKey];
      });

      applyPillRect(pillState.element, pillState.currentRect);
    });

    if (hasActiveMotion) {
      selectionAnimationFrame = window.requestAnimationFrame(animateSelectionOverlay);
      return;
    }

    selectionAnimationFrame = null;
  };

  const startSelectionAnimation = () => {
    if (selectionAnimationFrame !== null) return;
    selectionAnimationFrame = window.requestAnimationFrame(animateSelectionOverlay);
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

    const rawRects = Array.from(range.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }));
    if (rawRects.length === 0) {
      clearSelectionOverlay();
      return;
    }

    const medianRectHeight = getMedian(rawRects.map((rect) => rect.height));
    const maxReasonableHeight = Math.max(26, medianRectHeight * 2.4);
    const filteredRects = rawRects.filter((rect) => rect.height <= maxReasonableHeight);
    const selectionRects = filteredRects.length > 0 ? filteredRects : rawRects;
    const uniqueRects = [];
    selectionRects.forEach((rect) => {
      const hasDuplicate = uniqueRects.some((existingRect) =>
        areRectsNearEqual(existingRect, rect)
      );
      if (!hasDuplicate) {
        uniqueRects.push(rect);
      }
    });

    showSelectionOverlay();
    syncSelectionPills(uniqueRects);
    startSelectionAnimation();
  };

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
