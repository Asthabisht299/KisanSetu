import { useEffect, useState, useCallback } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function MyBookings() {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [cancellingId, setCancellingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchBookings = useCallback(async () => {
    const token = localStorage.getItem("kisansetuToken");

    if (!token) {
      setError(
        isHindi
          ? "अपनी बुकिंग देखने के लिए पहले लॉगिन करें।"
          : "Please log in to view your bookings."
      );
      setLoading(false);
      return;
    }

    try {
      setError("");

      const response = await fetch("http://localhost:5000/api/bookings", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isHindi
              ? "बुकिंग की जानकारी नहीं मिल पाई।"
              : "Unable to load bookings.")
        );
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(
        err.message ||
          (isHindi
            ? "बुकिंग की जानकारी नहीं मिल पाई।"
            : "Unable to load your bookings.")
      );
    } finally {
      setLoading(false);
    }
  }, [isHindi]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  async function handleCancel(booking) {
    const confirmed = window.confirm(
      isHindi
        ? `क्या आप बुकिंग नंबर ${booking.booking_reference} रद्द करना चाहते हैं?`
        : `Are you sure you want to cancel booking ${booking.booking_reference}?`
    );

    if (!confirmed) return;

    const token = localStorage.getItem("kisansetuToken");

    if (!token) {
      setError(
        isHindi
          ? "बुकिंग रद्द करने के लिए पहले लॉगिन करें।"
          : "Please log in to cancel a booking."
      );
      return;
    }

    setCancellingId(booking.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/bookings/${booking.id}/cancel`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isHindi
              ? "बुकिंग रद्द नहीं हो पाई।"
              : "Unable to cancel this booking.")
        );
      }

      setMessage(
        isHindi
          ? `बुकिंग नंबर ${booking.booking_reference} रद्द हो गई है।`
          : `Booking ${booking.booking_reference} has been cancelled.`
      );

      await fetchBookings();
    } catch (err) {
      setError(
        err.message ||
          (isHindi
            ? "बुकिंग रद्द करते समय परेशानी हुई। दोबारा कोशिश करें।"
            : "Something went wrong while cancelling.")
      );
    } finally {
      setCancellingId(null);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) return isHindi ? "उपलब्ध नहीं" : "Not available";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return isHindi ? "उपलब्ध नहीं" : "Not available";
    }

    return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  function getStatus(booking) {
    return String(booking.status || "pending").toLowerCase();
  }

  function getStatusLabel(status) {
    if (isHindi) {
      const labels = {
        pending: "पुष्टि बाकी है",
        confirmed: "बुकिंग पक्की है",
        checked_in: "आप केंद्र पहुँच गए",
        procurement_in_progress: "फसल की जाँच चल रही है",
        completed: "काम पूरा हो गया",
        cancelled: "बुकिंग रद्द है",
      };

      return labels[status] || "स्थिति की जानकारी उपलब्ध नहीं";
    }

    const labels = {
      pending: "Pending confirmation",
      confirmed: "Confirmed",
      checked_in: "Arrived at centre",
      procurement_in_progress: "Procurement in progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return labels[status] || "Status unavailable";
  }

  const totalBookings = bookings.length;

  const confirmedBookings = bookings.filter(
    (booking) => getStatus(booking) === "confirmed"
  ).length;

  const completedBookings = bookings.filter(
    (booking) => getStatus(booking) === "completed"
  ).length;

  const cancelledBookings = bookings.filter(
    (booking) => getStatus(booking) === "cancelled"
  ).length;

  const filteredBookings = bookings.filter((booking) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch = [
      booking.crop_type,
      booking.booking_reference,
      booking.centre_name,
      booking.district,
    ].some((value) =>
      String(value || "").toLowerCase().includes(searchText)
    );

    const matchesStatus =
      statusFilter === "all" || getStatus(booking) === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      label: isHindi ? "कुल बुकिंग" : "Total bookings",
      value: totalBookings,
      icon: "📋",
    },
    {
      label: isHindi ? "पक्की बुकिंग" : "Confirmed",
      value: confirmedBookings,
      icon: "✅",
    },
    {
      label: isHindi ? "काम पूरा" : "Completed",
      value: completedBookings,
      icon: "🌾",
    },
    {
      label: isHindi ? "रद्द बुकिंग" : "Cancelled",
      value: cancelledBookings,
      icon: "❌",
    },
  ];

  if (loading) {
    return (
      <section className="main-section">
        <h2>
          {isHindi
            ? "आपकी बुकिंग की जानकारी आ रही है..."
            : "Loading your bookings..."}
        </h2>
      </section>
    );
  }

  return (
    <section className="main-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {isHindi ? "आपकी फसल की बुकिंग" : "YOUR CROP BOOKINGS"}
          </span>

          <h1>{isHindi ? "मेरी बुकिंग" : "My Bookings"}</h1>

          <p>
            {isHindi
              ? "यहाँ आप अपनी बुकिंग की तारीख, मात्रा और स्थिति देख सकते हैं।"
              : "View your booking dates, crop quantities and current status here."}
          </p>
        </div>
      </div>

      {error && (
        <p className="booking-error" role="alert">
          {error}
        </p>
      )}

      {message && (
        <p className="booking-success" role="status">
          {message}
        </p>
      )}

      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="stat-card" key={stat.label}>
            <span className="stat-icon">{stat.icon}</span>
            <p>{stat.label}</p>
            <h2>{stat.value}</h2>
          </article>
        ))}
      </div>

      <div className="booking-filters">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={
            isHindi
              ? "फसल, बुकिंग नंबर या केंद्र खोजें..."
              : "Search crop, booking number or centre..."
          }
          aria-label={isHindi ? "बुकिंग खोजें" : "Search bookings"}
        />

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          aria-label={isHindi ? "बुकिंग की स्थिति चुनें" : "Filter by status"}
        >
          <option value="all">
            {isHindi ? "सभी बुकिंग" : "All bookings"}
          </option>
          <option value="pending">
            {isHindi ? "पुष्टि बाकी है" : "Pending confirmation"}
          </option>
          <option value="confirmed">
            {isHindi ? "पक्की बुकिंग" : "Confirmed"}
          </option>
          <option value="checked_in">
            {isHindi ? "केंद्र पर पहुँच गए" : "Arrived at centre"}
          </option>
          <option value="procurement_in_progress">
            {isHindi ? "फसल की जाँच चल रही है" : "Procurement in progress"}
          </option>
          <option value="completed">
            {isHindi ? "काम पूरा" : "Completed"}
          </option>
          <option value="cancelled">
            {isHindi ? "रद्द बुकिंग" : "Cancelled"}
          </option>
        </select>
      </div>

      {filteredBookings.length === 0 ? (
        <div className="empty-state">
          <span>🌾</span>
          <h3>
            {bookings.length === 0
              ? isHindi
                ? "अभी आपकी कोई बुकिंग नहीं है"
                : "You don't have any bookings yet"
              : isHindi
                ? "कोई बुकिंग नहीं मिली"
                : "No bookings found"}
          </h3>
          <p>
            {bookings.length === 0
              ? isHindi
                ? "खाली समय देखें और अपनी फसल के लिए बुकिंग करें।"
                : "Check available slots and book a time for your crop."
              : isHindi
                ? "दूसरा नाम या दूसरी स्थिति चुनकर देखें।"
                : "Try a different search or status filter."}
          </p>
        </div>
      ) : (
        <div className="centre-grid">
          {filteredBookings.map((booking) => {
            const status = getStatus(booking);

            const canCancel =
              status === "pending" || status === "confirmed";

            return (
              <article className="centre-card" key={booking.id}>
                <span className="centre-icon">🌾</span>

                <h3>{booking.crop_type || (isHindi ? "फसल" : "Crop")}</h3>

                <p>
                  <strong>{isHindi ? "बुकिंग नंबर:" : "Booking reference:"}</strong>{" "}
                  {booking.booking_reference || "—"}
                </p>

                <p>
                  <strong>{isHindi ? "खरीद केंद्र:" : "Centre:"}</strong>{" "}
                  {booking.centre_name || "—"}
                </p>

                <p>
                  <strong>{isHindi ? "जिला:" : "District:"}</strong>{" "}
                  {booking.district || "—"}
                </p>

                <p>
                  <strong>{isHindi ? "तारीख:" : "Date:"}</strong>{" "}
                  {formatDate(booking.slot_date)}
                </p>

                <p>
                  <strong>{isHindi ? "मात्रा:" : "Quantity:"}</strong>{" "}
                  {booking.quantity_quintals ?? "—"}{" "}
                  {isHindi ? "क्विंटल" : "quintals"}
                </p>

                <p>
                  <strong>{isHindi ? "स्थिति:" : "Status:"}</strong>{" "}
                  <span className={`status-badge status-${status}`}>
                    {getStatusLabel(status)}
                  </span>
                </p>

                {canCancel && (
                  <button
                    type="button"
                    className="booking-button"
                    onClick={() => handleCancel(booking)}
                    disabled={cancellingId === booking.id}
                  >
                    {cancellingId === booking.id
                      ? isHindi
                        ? "रद्द हो रहा है..."
                        : "Cancelling..."
                      : isHindi
                        ? "बुकिंग रद्द करें"
                        : "Cancel Booking"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}