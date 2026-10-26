
import { Link } from "react-router-dom";

export default function CentreCard({ centre }) {
  return (
    <article className="centre-card">
      <div className="centre-top">
        <span className="centre-icon">🏢</span>
        <span className="availability">Demo listing</span>
      </div>

      <h3>{centre.name}</h3>
      <p className="centre-location">📍 {centre.location}</p>

      <div className="centre-details">
        <span>🚜 {centre.distance}</span>
        <span>⏱ {centre.wait}</span>
      </div>

      <Link className="text-button" to="/booking">
        Plan a visit →
      </Link>
    </article>
  );
}