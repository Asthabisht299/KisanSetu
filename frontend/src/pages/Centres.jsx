import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import CentreCard from "../components/CentreCard";

export default function Centres() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/centres")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch centres");
        return response.json();
      })
      .then((data) => { setCentres(data); setLoading(false); })
      .catch((err) => {
        console.error(err);
        setError(hi ? "खरीद केंद्रों की जानकारी नहीं मिल पाई। कृपया कुछ देर बाद फिर कोशिश करें।" : "Unable to load procurement centres. Please try again later.");
        setLoading(false);
      });
  }, [hi]);

  return (
    <section className="main-section centres-section">
      <div className="section-heading"><div>
        <span className="eyebrow">{hi ? "अपने पास का केंद्र देखें" : "FIND A LOCATION"}</span>
        <h1>{hi ? "फसल खरीद केंद्र" : "Procurement centres"}</h1>
        <p>{hi ? "यहाँ उन केंद्रों की सूची है जहाँ आप अपनी फसल ले जा सकते हैं।" : "Find a centre where you can take your crop."}</p>
      </div></div>
      {loading && <p>{hi ? "केंद्रों की जानकारी आ रही है..." : "Loading procurement centres..."}</p>}
      {error && <p className="booking-error" role="alert">{error}</p>}
      {!loading && !error && centres.length === 0 && <div className="empty-state"><span>🏢</span><h3>{hi ? "अभी कोई केंद्र सूची में नहीं है" : "No centres available yet"}</h3><p>{hi ? "कृपया बाद में फिर देखें।" : "Please check again later."}</p></div>}
      {!loading && !error && centres.length > 0 && <div className="centre-grid">
        {centres.map((centre) => <CentreCard key={centre.id} centre={{
          name: centre.name,
          location: [centre.address, centre.district, centre.state].filter(Boolean).join(", "),
          distance: null, wait: null,
        }} language={language} />)}
      </div>}
    </section>
  );
}
