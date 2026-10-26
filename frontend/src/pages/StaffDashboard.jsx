import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function StaffDashboard() {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBookings() {
      try {
        const token = localStorage.getItem("kisansetuToken");

        if (!token) {
          setError(
            isHindi
              ? "बुकिंग देखने के लिए पहले लॉगिन करें।"
              : "Please log in to continue."
          );
          return;
        }

        const response = await fetch(
          "http://localhost:5000/api/bookings",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            isHindi
              ? "बुकिंग की जानकारी नहीं मिल पाई।"
              : "Could not load bookings."
          );
        }

        setBookings(data.bookings || []);
      } catch (err) {
        setError(
          err.message ||
            (isHindi
              ? "कुछ गड़बड़ हुई। दोबारा कोशिश करें।"
              : "Something went wrong. Please try again.")
        );
      } finally {
        setLoading(false);
      }
    }

    loadBookings();
  }, [isHindi]);

  const total = bookings.length;
  const confirmed = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;
  const completed = bookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  if (loading) {
    return (
      <section className="main-section">
        <h2>
          {isHindi ? "जानकारी आ रही है..." : "Loading dashboard..."}
        </h2>
      </section>
    );
  }

  return (
    <section className="main-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {isHindi ? "केंद्र का काम" : "CENTRE OPERATIONS"}
          </span>
          <h1>
            {isHindi ? "खरीद केंद्र डैशबोर्ड" : "Procurement Staff Dashboard"}
          </h1>
          <p>
            {isHindi
              ? "बुकिंग और फसल की खरीद से जुड़ी जानकारी यहाँ देख सकेंगे।"
              : "View booking information and prepare for crop procurement operations."}
          </p>
        </div>
      </div>

      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}

      <div className="stats-grid">
        <article className="stat-card">
          <span className="stat-icon">📋</span>
          <p>{isHindi ? "कुल बुकिंग" : "Total bookings"}</p>
          <h2>{total}</h2>
        </article>

        <article className="stat-card">
          <span className="stat-icon">✅</span>
          <p>{isHindi ? "पक्की बुकिंग" : "Confirmed bookings"}</p>
          <h2>{confirmed}</h2>
        </article>

        <article className="stat-card">
          <span className="stat-icon">🌾</span>
          <p>{isHindi ? "काम पूरा" : "Completed procurement"}</p>
          <h2>{completed}</h2>
        </article>
      </div>

      <div className="section-heading">
        <div>
          <h2>{isHindi ? "बुकिंग की सूची" : "Booking list"}</h2>
          <p>
            {isHindi
              ? "अभी यह सूची आपके लॉगिन अकाउंट की बुकिंग दिखाती है।"
              : "This initial view shows bookings belonging to your logged-in account."}
          </p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <span>🌱</span>
          <h3>
            {isHindi ? "अभी कोई बुकिंग नहीं है" : "No bookings yet"}
          </h3>
        </div>
      ) : (
        <div className="centre-grid">
          {bookings.map((booking) => (
            <article className="centre-card" key={booking.id}>
              <span className="centre-icon">🌾</span>
              <h3>{booking.crop_type}</h3>

              <p>
                <strong>{isHindi ? "बुकिंग नंबर:" : "Reference:"}</strong>{" "}
                {booking.booking_reference}
              </p>

              <p>
                <strong>{isHindi ? "केंद्र:" : "Centre:"}</strong>{" "}
                {booking.centre_name}
              </p>

              <p>
                <strong>{isHindi ? "मात्रा:" : "Quantity:"}</strong>{" "}
                {booking.quantity_quintals}{" "}
                {isHindi ? "क्विंटल" : "quintals"}
              </p>

              <p>
                <strong>{isHindi ? "स्थिति:" : "Status:"}</strong>{" "}
                {booking.status}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}