
import { createContext, useContext, useEffect, useState } from "react";

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(
    () => localStorage.getItem("kisansetuLanguage") || "en"
  );

  useEffect(() => {
    function handleLanguageChange(event) {
      setLanguage(event.detail);
    }

    window.addEventListener(
      "kisansetuLanguageChange",
      handleLanguageChange
    );

    return () => {
      window.removeEventListener(
        "kisansetuLanguageChange",
        handleLanguageChange
      );
    };
  }, []);

  const changeLanguage = (newLanguage) => {
    localStorage.setItem("kisansetuLanguage", newLanguage);
    setLanguage(newLanguage);
    window.dispatchEvent(
      new CustomEvent("kisansetuLanguageChange", {
        detail: newLanguage,
      })
    );
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
