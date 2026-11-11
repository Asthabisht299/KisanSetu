
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";
import { useLanguage } from "../context/LanguageContext";

const API = "http://localhost:5000/api";

const initialForm = {
  crop_type: "Wheat",
  slot_date: "",
  start_time: "09:00",
  end_time: "10:00",
  capacity_quintals: "100",
};

const initialFilters = {
  date: "",
  crop: "",
  status: "",
  payment_status: "",
};

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState(initialForm);
  const [filters, setFilters] = useState(initialFilters);

  const token = localStorage.getItem("kisansetuStaffToken");

  async function loadSlots() {
    if (!token) {
      navigate("/staff-login");
      return;
    }

    try {
      setError("");

      const response = await fetch(`${API}/manager/slots`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (hi ? "स्लॉट की जानकारी नहीं मिल पाई।" : "Unable to load slots."));
      }

      setSlots(data.slots || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadBookings(activeFilters = filters) {
    if (!token) {
      navigate("/staff-login");
      return;
    }

    setBookingsLoading(true);

    try {
      setError("");

      const query = new URLSearchParams();

      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) query.append(key, value);
      });

      const queryString = query.toString();
      const url = `${API}/manager/bookings${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (hi ? "बुकिंग की जानकारी नहीं मिल पाई।" : "Unable to load bookings."));
      }

      setBookings(data.bookings || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setBookingsLoading(false);
    }
  }

  useEffect(() => {
    if (!token) {
      navigate("/staff-login");
      return;
    }

    loadSlots();
    loadBookings(initialFilters);
  }, []);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function updateFilter(event) {
    setFilters({
      ...filters,
      [event.target.name]: event.target.value,
    });
  }

  async function createSlot(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`${API}/manager/slots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (hi ? "समय नहीं जोड़ा जा सका।" : "Could not create slot."));
      }

      setMessage(hi ? "फसल लाने का समय जोड़ दिया गया है।" : "Slot created successfully!");
      setForm(initialForm);

      await loadSlots();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(slot) {
    const newStatus = slot.status === "open" ? "closed" : "open";

    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API}/manager/slots/${slot.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || (hi ? "समय की स्थिति नहीं बदली जा सकी।" : "Could not update slot."));
      }

      setMessage(data.message || (hi ? "समय की स्थिति बदल दी गई है।" : "Slot status updated."));
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  }

  function applyFilters(event) {
    event.preventDefault();
    loadBookings(filters);
  }

  function clearFilters() {
    setFilters(initialFilters);
    loadBookings(initialFilters);
  }
const totalSlots = slots.length;

const openSlots = slots.filter(
  (slot) => slot.status === "open"
).length;

const totalCapacity = slots.reduce(
  (total, slot) => total + Number(slot.capacity_quintals || 0),
  0
);

const bookedQuantity = slots.reduce(
  (total, slot) => total + Number(slot.booked_quintals || 0),
  0
);

const pendingBookings = bookings.filter(
  (booking) => booking.status === "pending"
).length;

const completedBookings = bookings.filter(
  (booking) => booking.status === "completed"
).length;


  function logout() {
    localStorage.removeItem("kisansetuStaffToken");
    localStorage.removeItem("kisansetuStaff");
    navigate("/staff-login");
  }

  function cropLabel(crop) {
    return hi ? ({ Wheat: "गेहूँ", Rice: "धान", Maize: "मक्का", Mustard: "सरसों", Barley: "जौ", Other: "अन्य" }[crop] || crop) : crop;
  }

  function formatDate(date) {
    if (!date) return "—";

    const dateString = String(date).slice(0, 10);
    const parts = dateString.split("-");

    if (parts.length !== 3) return dateString;

    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  function formatTime(time) {
    return time ? String(time).slice(0, 5) : "—";
  }

  return (
    <div className="manager-page">
      <header className="manager-header">
        <div>
          <p className="manager-eyebrow">{hi ? "किसानसेतु प्रबंधन" : "KISANSETU MANAGEMENT"}</p>
          <h1>{hi ? "मैनेजर डैशबोर्ड" : "Manager Dashboard"}</h1>
          <p>{hi ? "किसान कब फसल लाएंगे, उसका समय और बुकिंग संभालें।" : "Manage procurement slots and farmer bookings."}</p>
        </div>

        <button className="manager-logout" onClick={logout}>
          {hi ? "लॉगआउट" : "Log out"}
        </button>
      </header>

      {message && <div className="manager-message">{message}</div>}
      {error && <div className="manager-error">{error}</div>}
{/* MANAGER OVERVIEW */}
<section className="manager-overview">
  <div className="manager-overview-heading">
    <h2>{hi ? "केंद्र का हाल" : "Procurement Overview"}</h2>
    <p>A quick summary of your centre's activity.</p>
  </div>

  <div className="manager-stats-grid">
    <div className="manager-stat-card">
      <span className="manager-stat-icon">📋</span>
      <p>{hi ? "कुल समय" : "Total Slots"}</p>
      <h3>{totalSlots}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">🟢</span>
      <p>{hi ? "खाली समय" : "Open Slots"}</p>
      <h3>{openSlots}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">🌾</span>
      <p>{hi ? "कुल क्षमता" : "Total Capacity"}</p>
      <h3>{totalCapacity.toFixed(2)} <small>{hi ? "क्विंटल" : "qtl"}</small></h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">📦</span>
      <p>{hi ? "बुक हुई फसल" : "Booked Quantity"}</p>
      <h3>{bookedQuantity.toFixed(2)} <small>{hi ? "क्विंटल" : "qtl"}</small></h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">⏳</span>
      <p>{hi ? "पुष्टि बाकी" : "Pending Bookings"}</p>
      <h3>{pendingBookings}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">✅</span>
      <p>{hi ? "पूरी हुई बुकिंग" : "Completed Bookings"}</p>
      <h3>{completedBookings}</h3>
    </div>
  </div>
</section>


      {/* CREATE SLOT */}
      <section className="manager-panel">
        <h2>{hi ? "फसल लाने का समय जोड़ें" : "Create a procurement slot"}</h2>
        <p>{hi ? "तारीख और समय चुनें, ताकि किसान उस समय फसल ला सकें।" : "Add a date and time for farmers to bring their crops."}</p>

        <form className="manager-form" onSubmit={createSlot}>
          <label>
            {hi ? "फसल" : "Crop"}
            <select
              name="crop_type"
              value={form.crop_type}
              onChange={updateForm}
              required
            >
              <option value="Wheat">{hi ? "गेहूँ" : "Wheat"}</option>
              <option value="Rice">{hi ? "धान" : "Rice"}</option>
              <option value="Maize">{hi ? "मक्का" : "Maize"}</option>
              <option value="Mustard">{hi ? "सरसों" : "Mustard"}</option>
              <option value="Barley">{hi ? "जौ" : "Barley"}</option>
              <option value="Other">{hi ? "अन्य" : "Other"}</option>
            </select>
          </label>

          <label>
            {hi ? "तारीख" : "Slot date"}
            <input
              type="date"
              name="slot_date"
              value={form.slot_date}
              onChange={updateForm}
              min={new Date().toLocaleDateString("en-CA")}
              required
            />
          </label>

          <label>
            {hi ? "शुरू होने का समय" : "Start time"}
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            {hi ? "खत्म होने का समय" : "End time"}
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            {hi ? "कितनी फसल ले सकेंगे (क्विंटल)" : "Capacity (quintals)"}
            <input
              type="number"
              name="capacity_quintals"
              value={form.capacity_quintals}
              onChange={updateForm}
              min="0.01"
              step="0.01"
              required
            />
          </label>

          <button className="manager-primary" disabled={saving}>
            {saving ? hi ? "जोड़ा जा रहा है..." : "Creating..." : hi ? "＋ समय जोड़ें" : "＋ Create Slot"}
          </button>
        </form>
      </section>

      {/* PROCUREMENT SLOTS */}
      <section className="manager-panel">
        <div className="manager-slots-heading">
          <div>
            <h2>{hi ? "फसल लाने के समय" : "Procurement slots"}</h2>
            <p>{hi ? "यहाँ आपके केंद्र के सभी समय दिखेंगे।" : "Slots belonging to your assigned centre."}</p>
          </div>

          <button
            className="manager-refresh"
            onClick={loadSlots}
            disabled={loading}
          >
            {loading ? hi ? "लोड हो रहा है..." : "Loading..." : hi ? "फिर से देखें" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>{hi ? "समय की जानकारी आ रही है..." : "Loading slots..."}</p>
        ) : slots.length === 0 ? (
          <p>{hi ? "अभी कोई समय नहीं जोड़ा गया है। ऊपर से पहला समय जोड़ें।" : "No slots found. Create your first slot above."}</p>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>{hi ? "फसल" : "Crop"}</th>
                  <th>{hi ? "तारीख" : "Date"}</th>
                  <th>{hi ? "समय" : "Time"}</th>
                  <th>{hi ? "कुल क्षमता" : "Capacity"}</th>
                  <th>{hi ? "बुक हुई मात्रा" : "Booked"}</th>
                  <th>{hi ? "खाली जगह" : "Available"}</th>
                  <th>{hi ? "स्थिति" : "Status"}</th>
                  <th>{hi ? "काम" : "Action"}</th>
                </tr>
              </thead>

              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{cropLabel(slot.crop_type)}</td>
                    <td>{formatDate(slot.slot_date)}</td>
                    <td>
                      {formatTime(slot.start_time)}–
                      {formatTime(slot.end_time)}
                    </td>
                    <td>{slot.capacity_quintals}</td>
                    <td>{slot.booked_quintals ?? 0}</td>
                    <td>{slot.available_quintals}</td>
                    <td>
                      <span className={`manager-status ${slot.status}`}>
                        {hi ? ({ open: "खुला", closed: "बंद", cancelled: "रद्द" }[slot.status] || slot.status) : slot.status}
                      </span>
                    </td>
                    <td>
                      {slot.status !== "cancelled" && (
                        <button
                          className="manager-toggle"
                          onClick={() => changeStatus(slot)}
                        >
                          {slot.status === "open" ? hi ? "बंद करें" : "Close" : hi ? "फिर खोलें" : "Reopen"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* MANAGER BOOKINGS */}
      <section className="manager-panel manager-bookings-panel">
        <div className="manager-slots-heading">
          <div>
            <h2>{hi ? "किसानों की बुकिंग" : "Farmer bookings"}</h2>
            <p>{hi ? "अपने केंद्र पर किसानों की बुकिंग देखें।" : "View bookings made at your assigned procurement centre."}</p>
          </div>

          <button
            className="manager-refresh"
            onClick={() => loadBookings()}
            disabled={bookingsLoading}
          >
            {bookingsLoading ? hi ? "लोड हो रहा है..." : "Loading..." : hi ? "फिर से देखें" : "Refresh"}
          </button>
        </div>

        <form className="manager-filters" onSubmit={applyFilters}>
          <label>
            {hi ? "बुकिंग की तारीख" : "Booking date"}
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={updateFilter}
            />
          </label>

          <label>
            {hi ? "फसल" : "Crop"}
            <select
              name="crop"
              value={filters.crop}
              onChange={updateFilter}
            >
              <option value="">{hi ? "सभी फसलें" : "All crops"}</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Mustard">Mustard</option>
              <option value="Barley">Barley</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            {hi ? "बुकिंग की स्थिति" : "Booking status"}
            <select
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="">{hi ? "सभी स्थितियाँ" : "All statuses"}</option>
              <option value="pending">{hi ? "पुष्टि बाकी" : "Pending"}</option>
              <option value="confirmed">{hi ? "पक्की" : "Confirmed"}</option>
              <option value="checked_in">{hi ? "केंद्र पहुँच गए" : "Checked in"}</option>
              <option value="procurement_in_progress">
                Procurement in progress
              </option>
              <option value="completed">{hi ? "पूरी हुई" : "Completed"}</option>
              <option value="cancelled">{hi ? "रद्द" : "Cancelled"}</option>
            </select>
          </label>

          <label>
            {hi ? "भुगतान की स्थिति" : "Payment status"}
            <select
              name="payment_status"
              value={filters.payment_status}
              onChange={updateFilter}
            >
              <option value="">{hi ? "सभी भुगतान" : "All payments"}</option>
              <option value="unpaid">{hi ? "भुगतान बाकी" : "Unpaid"}</option>
              <option value="processing">{hi ? "जाँच में" : "Processing"}</option>
              <option value="paid">{hi ? "भुगतान हो गया" : "Paid"}</option>
            </select>
          </label>

          <div className="manager-filter-actions">
            <button className="manager-primary" type="submit">
              Apply Filters
            </button>

            <button
              className="manager-refresh"
              type="button"
              onClick={clearFilters}
            >
              Clear
            </button>
          </div>
        </form>

        <div className="manager-bookings-summary">
          <span>
            Total bookings: <strong>{bookings.length}</strong>
          </span>
        </div>

        {bookingsLoading ? (
          <p>{hi ? "किसानों की बुकिंग आ रही है..." : "Loading farmer bookings..."}</p>
        ) : bookings.length === 0 ? (
          <div className="manager-empty">
            <h3>{hi ? "कोई बुकिंग नहीं मिली" : "No bookings found"}</h3>
            <p>
              There are no bookings matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table manager-bookings-table">
              <thead>
                <tr>
                  <th>{hi ? "बुकिंग नंबर" : "Booking ID"}</th>
                  <th>{hi ? "किसान" : "Farmer"}</th>
                  <th>{hi ? "मोबाइल नंबर" : "Phone"}</th>
                  <th>{hi ? "फसल" : "Crop"}</th>
                  <th>{hi ? "तारीख" : "Date"}</th>
                  <th>{hi ? "समय" : "Time"}</th>
                  <th>{hi ? "मात्रा" : "Quantity"}</th>
                  <th>{hi ? "बुकिंग की स्थिति" : "Booking status"}</th>
                  <th>{hi ? "भुगतान" : "Payment"}</th>
                </tr>
              </thead>

              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>
                      <strong>
                        {booking.booking_reference || `#${booking.id}`}
                      </strong>
                    </td>
                    <td>{booking.farmer_name || booking.full_name || "—"}</td>
                    <td>{booking.farmer_phone || booking.phone || "—"}</td>
                    <td>{cropLabel(booking.crop_type) || "—"}</td>
                    <td>{formatDate(booking.slot_date)}</td>
                    <td>
                      {formatTime(booking.start_time)}–
                      {formatTime(booking.end_time)}
                    </td>
                    <td>
                      {booking.quantity_quintals ?? "—"} qtl
                    </td>
                    <td>
                      <span
                        className={`manager-status ${booking.status}`}
                      >
                        {String(booking.status || "unknown").replaceAll(
                          "_",
                          " "
                        )}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`manager-status ${booking.payment_status}`}
                      >
                        {hi ? ({ unpaid: "भुगतान बाकी", processing: "जाँच में", paid: "भुगतान हो गया" }[booking.payment_status] || "जानकारी नहीं") : (booking.payment_status || "unknown")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
