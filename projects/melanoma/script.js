(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const board = document.querySelector(".board");

  if (!board) return;

  const revealBoard = () => {
    board.classList.add("is-open");
  };

  if (reduceMotion) {
    revealBoard();
    return;
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(revealBoard);
  });

  window.addEventListener("pageshow", revealBoard, { once: true });
})();
