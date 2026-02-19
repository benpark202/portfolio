const theme = () => {
  const themeToggle = document.getElementById("theme-toggle");
  const root = document.documentElement;
  const themeKey = "theme-preference";

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
    const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    setSavedTheme(nextTheme);
  });
};

export default theme;
