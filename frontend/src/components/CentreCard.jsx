import { Link } from "react-router-dom";

export default function CentreCard({ centre, language = "en" }) {
  const hi = language === "hi";
  return (
    <article className="centre-card">
      <div className="centre-top">
        <span className="centre-icon">🏢</span>
        <span className="availability">{hi ? "खरीद केंद्र" : "Procurement centre"}</span>
      </div>
      <h3>{centre.name}</h3>
      <p className="centre-location">📍 {centre.location}</p>
      <div className="centre-details">
        {centre.distance && <span>🚜 {centre.distance}</span>}
        {centre.wait && <span>⏱ {centre.wait}</span>}
      </div>
      <Link className="text-button" to="/booking">
        {hi ? "इस केंद्र के लिए समय देखें →" : "View available times →"}
      </Link>
    </article>
  );
}
