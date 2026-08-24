import React, { createContext, useContext, useLayoutEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("rbf_app_theme") || "light";
  });

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.setAttribute("data-theme", "dark");
    } else {
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
    }
    localStorage.setItem("rbf_app_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const updateTheme = () => {
      setTheme((prev) => {
        const next = prev === "light" ? "dark" : "light";
        const root = document.documentElement;
        if (next === "dark") {
          root.classList.add("dark");
          root.setAttribute("data-theme", "dark");
        } else {
          root.classList.remove("dark");
          root.setAttribute("data-theme", "light");
        }
        localStorage.setItem("rbf_app_theme", next);
        return next;
      });
    };

    if (typeof document !== "undefined" && document.startViewTransition) {
      document.startViewTransition(() => {
        updateTheme();
      });
    } else {
      updateTheme();
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
