"use client";

import { useEffect, useState } from "react";

const themeKey = "taytlo-next:theme";

function applyTheme(theme: "dark" | "light") {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.localStorage.setItem(themeKey, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  useEffect(() => {
    const stored = window.localStorage.getItem(themeKey);
    const preferred = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    const next = stored === "light" || stored === "dark" ? stored : preferred;
    setTheme(next);
    applyTheme(next);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  }

  return (
    <button className="theme-toggle" type="button" onClick={toggle} aria-label={theme === "dark" ? "Включить светлую тему" : "Включить тёмную тему"}>
      <span aria-hidden="true">{theme === "dark" ? "☀" : "☾"}</span>
    </button>
  );
}
