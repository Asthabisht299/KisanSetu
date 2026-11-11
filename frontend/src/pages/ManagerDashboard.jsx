
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";

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
        throw new Error(data.message || "Unable to load slots.");
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
        throw new Error(data.message || "Unable to load bookings.");
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
        throw new Error(data.message || "Could not create slot.");
      }

      setMessage("Slot created successfully!");
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
        throw new Error(data.message || "Could not update slot.");
      }

      setMessage(data.message || "Slot status updated.");
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
          <p className="manager-eyebrow">KISANSETU MANAGEMENT</p>
          <h1>Manager Dashboard</h1>
          <p>Manage procurement slots and farmer bookings.</p>
        </div>

        <button className="manager-logout" onClick={logout}>
          Log out
        </button>
      </header>

      {message && <div className="manager-message">{message}</div>}
      {error && <div className="manager-error">{error}</div>}
{/* MANAGER OVERVIEW */}
<section className="manager-overview">
  <div className="manager-overview-heading">
    <h2>Procurement Overview</h2>
    <p>A quick summary of your centre's activity.</p>
  </div>

  <div className="manager-stats-grid">
    <div className="manager-stat-card">
      <span className="manager-stat-icon">📋</span>
      <p>Total Slots</p>
      <h3>{totalSlots}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">🟢</span>
      <p>Open Slots</p>
      <h3>{openSlots}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">🌾</span>
      <p>Total Capacity</p>
      <h3>{totalCapacity.toFixed(2)} <small>qtl</small></h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">📦</span>
      <p>Booked Quantity</p>
      <h3>{bookedQuantity.toFixed(2)} <small>qtl</small></h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">⏳</span>
      <p>Pending Bookings</p>
      <h3>{pendingBookings}</h3>
    </div>

    <div className="manager-stat-card">
      <span className="manager-stat-icon">✅</span>
      <p>Completed Bookings</p>
      <h3>{completedBookings}</h3>
    </div>
  </div>
</section>


      {/* CREATE SLOT */}
      <section className="manager-panel">
        <h2>Create a procurement slot</h2>
        <p>Add a date and time for farmers to bring their crops.</p>

        <form className="manager-form" onSubmit={createSlot}>
          <label>
            Crop
            <select
              name="crop_type"
              value={form.crop_type}
              onChange={updateForm}
              required
            >
              <option>Wheat</option>
              <option>Rice</option>
              <option>Maize</option>
              <option>Mustard</option>
              <option>Barley</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            Slot date
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
            Start time
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            End time
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={updateForm}
              required
            />
          </label>

          <label>
            Capacity (quintals)
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
            {saving ? "Creating..." : "＋ Create Slot"}
          </button>
        </form>
      </section>

      {/* PROCUREMENT SLOTS */}
      <section className="manager-panel">
        <div className="manager-slots-heading">
          <div>
            <h2>Procurement slots</h2>
            <p>Slots belonging to your assigned centre.</p>
          </div>

          <button
            className="manager-refresh"
            onClick={loadSlots}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <p>Loading slots...</p>
        ) : slots.length === 0 ? (
          <p>No slots found. Create your first slot above.</p>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table">
              <thead>
                <tr>
                  <th>Crop</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Capacity</th>
                  <th>Booked</th>
                  <th>Available</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {slots.map((slot) => (
                  <tr key={slot.id}>
                    <td>{slot.crop_type}</td>
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
                        {slot.status}
                      </span>
                    </td>
                    <td>
                      {slot.status !== "cancelled" && (
                        <button
                          className="manager-toggle"
                          onClick={() => changeStatus(slot)}
                        >
                          {slot.status === "open" ? "Close" : "Reopen"}
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
            <h2>Farmer bookings</h2>
            <p>View bookings made at your assigned procurement centre.</p>
          </div>

          <button
            className="manager-refresh"
            onClick={() => loadBookings()}
            disabled={bookingsLoading}
          >
            {bookingsLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        <form className="manager-filters" onSubmit={applyFilters}>
          <label>
            Booking date
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={updateFilter}
            />
          </label>

          <label>
            Crop
            <select
              name="crop"
              value={filters.crop}
              onChange={updateFilter}
            >
              <option value="">All crops</option>
              <option value="Wheat">Wheat</option>
              <option value="Rice">Rice</option>
              <option value="Maize">Maize</option>
              <option value="Mustard">Mustard</option>
              <option value="Barley">Barley</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            Booking status
            <select
              name="status"
              value={filters.status}
              onChange={updateFilter}
            >
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked in</option>
              <option value="procurement_in_progress">
                Procurement in progress
              </option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>

          <label>
            Payment status
            <select
              name="payment_status"
              value={filters.payment_status}
              onChange={updateFilter}
            >
              <option value="">All payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="processing">Processing</option>
              <option value="paid">Paid</option>
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
          <p>Loading farmer bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="manager-empty">
            <h3>No bookings found</h3>
            <p>
              There are no bookings matching the selected filters.
            </p>
          </div>
        ) : (
          <div className="manager-table-wrap">
            <table className="manager-table manager-bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Farmer</th>
                  <th>Phone</th>
                  <th>Crop</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Quantity</th>
                  <th>Booking status</th>
                  <th>Payment</th>
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
                    <td>{booking.crop_type || "—"}</td>
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
                        {booking.payment_status || "unknown"}
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
