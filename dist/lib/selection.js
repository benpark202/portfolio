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

  const getRectArea = (rect) => rect.width * rect.height;

  const getIntersectionArea = (leftRect, rightRect) => {
    const intersectionLeft = Math.max(leftRect.left, rightRect.left);
    const intersectionTop = Math.max(leftRect.top, rightRect.top);
    const intersectionRight = Math.min(
      leftRect.left + leftRect.width,
      rightRect.left + rightRect.width
    );
    const intersectionBottom = Math.min(
      leftRect.top + leftRect.height,
      rightRect.top + rightRect.height
    );
    const intersectionWidth = intersectionRight - intersectionLeft;
    const intersectionHeight = intersectionBottom - intersectionTop;
    if (intersectionWidth <= 0 || intersectionHeight <= 0) {
      return 0;
    }
    return intersectionWidth * intersectionHeight;
  };

  const isRectContainedBy = (innerRect, outerRect) => {
    const containmentEpsilon = 1.5;
    return (
      innerRect.left >= outerRect.left - containmentEpsilon &&
      innerRect.top >= outerRect.top - containmentEpsilon &&
      innerRect.left + innerRect.width <=
        outerRect.left + outerRect.width + containmentEpsilon &&
      innerRect.top + innerRect.height <=
        outerRect.top + outerRect.height + containmentEpsilon
    );
  };

  const pruneOverlappingRects = (rects) => {
    if (rects.length <= 1) return rects;
    const overlapThreshold = 0.92;
    const rectsByAreaDesc = [...rects].sort(
      (leftRect, rightRect) => getRectArea(rightRect) - getRectArea(leftRect)
    );
    const prunedRects = [];

    rectsByAreaDesc.forEach((rect) => {
      const rectArea = getRectArea(rect);
      if (rectArea <= 0) return;
      const isDuplicateOrContained = prunedRects.some((existingRect) => {
        if (areRectsNearEqual(existingRect, rect)) return true;
        if (isRectContainedBy(rect, existingRect)) return true;
        const overlapArea = getIntersectionArea(existingRect, rect);
        if (overlapArea <= 0) return false;
        return overlapArea / rectArea >= overlapThreshold;
      });
      if (!isDuplicateOrContained) {
        prunedRects.push({ ...rect });
      }
    });

    return prunedRects.sort(
      (leftRect, rightRect) =>
        leftRect.top - rightRect.top || leftRect.left - rightRect.left
    );
  };

  const mergeInlineSelectionFragments = (rects) => {
    if (rects.length <= 1) return rects;
    const topTolerance = 3;
    const heightTolerance = 4;
    const gapTolerance = 10;
    const mergedRects = [];

    rects.forEach((rect) => {
      const previousRect = mergedRects[mergedRects.length - 1];
      if (!previousRect) {
        mergedRects.push({ ...rect });
        return;
      }

      const previousBottom = previousRect.top + previousRect.height;
      const rectBottom = rect.top + rect.height;
      const verticalOverlap = Math.max(
        0,
        Math.min(previousBottom, rectBottom) - Math.max(previousRect.top, rect.top)
      );
      const minRectHeight = Math.min(previousRect.height, rect.height);
      const hasSameLineGeometry =
        Math.abs(previousRect.top - rect.top) <= topTolerance &&
        Math.abs(previousRect.height - rect.height) <= heightTolerance &&
        minRectHeight > 0 &&
        verticalOverlap / minRectHeight >= 0.65;
      const isAdjacentOrOverlapping =
        rect.left <= previousRect.left + previousRect.width + gapTolerance;

      if (hasSameLineGeometry && isAdjacentOrOverlapping) {
        const mergedLeft = Math.min(previousRect.left, rect.left);
        const mergedTop = Math.min(previousRect.top, rect.top);
        const mergedRight = Math.max(
          previousRect.left + previousRect.width,
          rect.left + rect.width
        );
        const mergedBottom = Math.max(previousBottom, rectBottom);
        previousRect.left = mergedLeft;
        previousRect.top = mergedTop;
        previousRect.width = mergedRight - mergedLeft;
        previousRect.height = mergedBottom - mergedTop;
        return;
      }

      mergedRects.push({ ...rect });
    });

    return mergedRects;
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

  const rangeIntersectsNode = (selectionRange, node) => {
    if (!node) return false;
    if (typeof selectionRange.intersectsNode === "function") {
      try {
        return selectionRange.intersectsNode(node);
      } catch (_error) {
        return false;
      }
    }

    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(node);
    return !(
      selectionRange.compareBoundaryPoints(Range.END_TO_START, nodeRange) <= 0 ||
      selectionRange.compareBoundaryPoints(Range.START_TO_END, nodeRange) >= 0
    );
  };

  const getTextNodeClientRects = (selectionRange, textNode) => {
    const nodeRange = document.createRange();
    nodeRange.selectNodeContents(textNode);

    if (textNode === selectionRange.startContainer) {
      nodeRange.setStart(textNode, selectionRange.startOffset);
    }
    if (textNode === selectionRange.endContainer) {
      nodeRange.setEnd(textNode, selectionRange.endOffset);
    }

    return Array.from(nodeRange.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }));
  };

  const getSelectionTextRects = (selectionRange) => {
    const commonAncestor = selectionRange.commonAncestorContainer;
    const walkerRoot =
      commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentNode : commonAncestor;

    if (!(walkerRoot instanceof Node)) {
      return [];
    }

    const walker = document.createTreeWalker(
      walkerRoot,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!(node instanceof Text) || node.data.length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return rangeIntersectsNode(selectionRange, node)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        },
      }
    );

    const rects = [];
    let currentNode = walker.nextNode();
    while (currentNode) {
      rects.push(...getTextNodeClientRects(selectionRange, currentNode));
      currentNode = walker.nextNode();
    }

    return rects;
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

    const selectedString = selectedText.toString().trim();
    if (selectedString.length === 0) {
      clearSelectionOverlay();
      return;
    }

    const rawRects = getSelectionTextRects(range);
    if (rawRects.length === 0) {
      clearSelectionOverlay();
      return;
    }

    const medianRectHeight = getMedian(rawRects.map((rect) => rect.height));
    const maxReasonableHeight = Math.max(26, medianRectHeight * 2.4);
    const filteredRects = rawRects.filter((rect) => rect.height <= maxReasonableHeight);
    const selectionRects = filteredRects.length > 0 ? filteredRects : rawRects;
    const uniqueRects = mergeInlineSelectionFragments(
      pruneOverlappingRects(selectionRects)
    );

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
