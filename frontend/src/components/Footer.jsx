import { useLanguage } from "../context/LanguageContext";

export default function Footer() {
  const { language } = useLanguage();
  const hi = language === "hi";
  return (
    <footer className="footer">
      <strong>🌾 KisanSetu</strong>
      <p>{hi ? "किसानों को फसल बेचने की तैयारी आसान बनाने में मदद।" : "Helping farmers plan their crop procurement visits."}</p>
      <small>{hi ? "प्रोटोटाइप वेबसाइट · कुछ जानकारी नमूने के लिए है" : "Prototype website · Some information is sample data"}</small>
    </footer>
  );
}
