import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'it' ? 'en' : 'it';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="absolute top-3 right-3 z-40 w-10 h-10 rounded-full bg-card border border-border shadow-sm flex items-center justify-center text-2xl active:scale-95 transition-transform"
      aria-label="Toggle language"
    >
      {i18n.language === 'it' ? '🇮🇹' : '🇬🇧'}
    </button>
  );
};

export default LanguageSwitcher;