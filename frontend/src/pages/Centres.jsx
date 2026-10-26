import { useEffect, useState } from "react";
import CentreCard from "../components/CentreCard";

export default function Centres() {
  const [centres, setCentres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/centres")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch centres");
        }

        return response.json();
      })
      .then((data) => {
        setCentres(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setError("Unable to load procurement centres.");
        setLoading(false);
      });
  }, []);

  return (
    <section className="main-section centres-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">FIND A LOCATION</span>

          <h2>Procurement centres</h2>

          <p>
            Centres are being loaded from the KisanSetu database.
          </p>
        </div>
      </div>

      {loading && <p>Loading procurement centres...</p>}

      {error && <p className="form-message">{error}</p>}

      {!loading && !error && centres.length === 0 && (
        <p>No procurement centres are available.</p>
      )}

      {!loading && !error && centres.length > 0 && (
        <div className="centre-grid">
          {centres.map((centre) => (
            <CentreCard
              key={centre.id}
              centre={{
                name: centre.name,
                location: `${centre.address}, ${centre.district}, ${centre.state}`,
                distance: "Distance will be calculated later",
                wait: "Waiting time will be calculated later",
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}