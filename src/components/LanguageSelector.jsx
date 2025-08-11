import React, { useEffect } from 'react';

const GoogleTranslate = () => {
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        window.google &&
        window.google.translate &&
        window.google.translate.TranslateElement &&
        window.google.translate.TranslateElement.InlineLayout
      ) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'en',
            includedLanguages: 'en,hi,gu',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
          },
          'google_translate_element'
        );
        clearInterval(interval); // ✅ stop once loaded
      }
    }, 500); // ✅ check every 500ms

    return () => clearInterval(interval); // ✅ cleanup on unmount
  }, []);

  return <div id="google_translate_element" />;
};

export default GoogleTranslate;
