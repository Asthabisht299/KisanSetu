
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function Booking() {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  const [slots, setSlots] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingSlot, setBookingSlot] = useState(null);
  const [bookingMessage, setBookingMessage] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);

  async function fetchSlots() {
    try {
      const response = await fetch("http://localhost:5000/api/slots");
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || (isHindi ? "बुकिंग का समय नहीं मिल पाया।" : "Unable to load slots."));
      }

      setSlots(data.slots || []);
      setError("");
    } catch {
      setError(
        isHindi
          ? "बुकिंग की जानकारी नहीं मिल रही है। कृपया कुछ देर बाद दोबारा कोशिश करें।"
          : "बुकिंग के समय नहीं मिल पाए। कृपया इंटरनेट या सर्वर चालू होने की जाँच करें।"
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSlots();
  }, []);

  function cropLabel(crop) {
    if (!isHindi) return crop;
    return ({ Wheat: "गेहूँ", Rice: "धान", Maize: "मक्का", Mustard: "सरसों", Barley: "जौ", Other: "अन्य" })[crop] || crop;
  }

  function formatDate(dateValue) {
    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return isHindi ? "तारीख उपलब्ध नहीं है" : "Date unavailable";
    }

    return new Intl.DateTimeFormat(isHindi ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(date);
  }

  async function handleBooking(slot) {
    setBookingMessage("");
    setBookingError("");

    const token = localStorage.getItem("kisansetuToken");

    if (!token) {
      setBookingError(
        isHindi
          ? "बुकिंग करने के लिए पहले लॉगिन करें।"
          : "Please log in before booking a slot."
      );
      return;
    }

    const quantity = Number(quantities[slot.id]);
    const available = Number(slot.available_quintals);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setBookingError(
        isHindi
          ? "कृपया फसल की सही मात्रा क्विंटल में लिखें।"
          : "Please enter a valid quantity greater than zero."
      );
      return;
    }

    if (quantity > available) {
      setBookingError(
        isHindi
          ? `इस समय ${available} क्विंटल ही जगह खाली है। कृपया इससे कम या इतनी मात्रा लिखें।`
          : `Only ${available} quintals are available. Please enter a smaller quantity.`
      );
      return;
    }

    setBookingLoading(true);
    setBookingSlot(slot.id);

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slot_id: slot.id,
          quantity_quintals: quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            (isHindi ? "बुकिंग नहीं हो पाई।" : "Unable to create booking.")
        );
      }

      const reference = data.booking.booking_reference;

      setBookingMessage(
        isHindi
          ? `आपकी बुकिंग हो गई है। बुकिंग नंबर: ${reference}। इसे संभालकर रखें।`
          : `Booking successful! Your reference number is ${reference}. Keep it safe.`
      );

      setQuantities((previous) => ({
        ...previous,
        [slot.id]: "",
      }));

      await fetchSlots();
    } catch (err) {
      setBookingError(
        err.message ||
          (isHindi ? "बुकिंग नहीं हो पाई। दोबारा कोशिश करें।" : "Unable to create booking.")
      );
    } finally {
      setBookingLoading(false);
      setBookingSlot(null);
    }
  }

  if (loading) {
    return (
      <section className="main-section">
        <h2>{isHindi ? "बुकिंग की जानकारी आ रही है..." : "Loading available slots..."}</h2>
      </section>
    );
  }

  if (error && slots.length === 0) {
    return (
      <section className="main-section">
        <h2>{isHindi ? "बुकिंग के समय" : "Available booking times"}</h2>
        <p role="alert">{error}</p>
        <button type="button" onClick={fetchSlots}>
          {isHindi ? "दोबारा कोशिश करें" : "Try again"}
        </button>
      </section>
    );
  }

  return (
    <section className="main-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">
            {isHindi ? "अपनी फसल लाने का समय चुनें" : "PLAN YOUR VISIT"}
          </span>

          <h1>
            {isHindi ? "बुकिंग के लिए खाली समय" : "Available booking times"}
          </h1>

          <p>
            {isHindi
              ? "अपनी फसल, खरीद केंद्र और आने का समय चुनें। फिर बताएं कि आप कितनी फसल लाएंगे।"
              : "नीचे दिए गए समय में से चुनें कि आप किस दिन और किस समय अपनी फसल केंद्र पर ला सकते हैं।"}
          </p>
        </div>
      </div>

      {bookingMessage && (
        <p role="status" className="booking-success">
          {bookingMessage}
        </p>
      )}

      {bookingError && (
        <p role="alert" className="booking-error">
          {bookingError}
        </p>
      )}

      {error && slots.length > 0 && (
        <p role="alert">{error}</p>
      )}

      {slots.length === 0 ? (
        <p>
          {isHindi
            ? "अभी कोई खाली समय नहीं है। कृपया बाद में फिर देखें।"
            : "फिलहाल फसल लाने के लिए कोई समय खाली नहीं है। कृपया कुछ समय बाद फिर देखें।"}
        </p>
      ) : (
        <div className="centre-grid">
          {slots.map((slot) => {
            const available = Number(slot.available_quintals);
            const isOpen = slot.status === "open" && available > 0;

            return (
              <article className="centre-card" key={slot.id}>
                <span className="centre-icon">🌾</span>
                <h3>{cropLabel(slot.crop_type)}</h3>

                <p>
                  <strong>{isHindi ? "खरीद केंद्र:" : "Centre:"}</strong>{" "}
                  {slot.centre_name}
                </p>

                <p>
                  <strong>{isHindi ? "जिला:" : "District:"}</strong>{" "}
                  {slot.district}
                </p>

                <p>
                  <strong>{isHindi ? "तारीख:" : "Date:"}</strong>{" "}
                  {formatDate(slot.slot_date)}
                </p>

                <p>
                  <strong>{isHindi ? "समय:" : "Time:"}</strong>{" "}
                  {String(slot.start_time || "").slice(0, 5)}–
                  {String(slot.end_time || "").slice(0, 5)}
                </p>

                <p>
                  <strong>
                    {isHindi ? "इस समय की कुल क्षमता:" : "Total capacity:"}
                  </strong>{" "}
                  {Number(slot.capacity_quintals)}{" "}
                  {isHindi ? "क्विंटल" : "quintals"}
                </p>

                <p>
                  <strong>
                    {isHindi ? "अभी कितनी फसल और ली जा सकती है:" : "Available:"}
                  </strong>{" "}
                  {available} {isHindi ? "क्विंटल" : "quintals"}
                </p>

                <p>
                  <strong>{isHindi ? "स्थिति:" : "Status:"}</strong>{" "}
                  {isOpen
                    ? isHindi
                      ? "समय उपलब्ध है"
                      : "Open for booking"
                    : isHindi
                      ? "समय भर चुका है"
                      : "Not available"}
                </p>

                {isOpen && (
                  <div className="booking-actions">
                    <label htmlFor={`quantity-${slot.id}`}>
                      {isHindi
                        ? "आप कितनी फसल लाएंगे? मात्रा क्विंटल में लिखें।"
                        : "How much crop will you bring? (quintals)"}
                    </label>

                    <input
                      id={`quantity-${slot.id}`}
                      type="number"
                      min="0.01"
                      max={available}
                      step="0.01"
                      value={quantities[slot.id] ?? ""}
                      onChange={(event) =>
                        setQuantities((previous) => ({
                          ...previous,
                          [slot.id]: event.target.value,
                        }))
                      }
                      placeholder={
                        isHindi
                          ? `अधिकतम ${available} क्विंटल`
                          : `Up to ${available} quintals`
                      }
                    />

                    <button
                      type="button"
                      className="booking-button"
                      onClick={() => handleBooking(slot)}
                      disabled={bookingLoading}
                    >
                      {bookingLoading && bookingSlot === slot.id
                        ? isHindi
                          ? "बुकिंग हो रही है..."
                          : "Booking..."
                        : isHindi
                          ? "यह समय बुक करें"
                          : "Book This Slot"}
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
