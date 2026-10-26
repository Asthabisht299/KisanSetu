
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ManagerDashboard.css";

const API = "http://localhost:5000/api";

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    crop_type: "Wheat",
    slot_date: "",
    start_time: "09:00",
    end_time: "10:00",
    capacity_quintals: "100",
  });

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

  useEffect(() => {
    loadSlots();
  }, []);

  function updateForm(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
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
      setForm({
        crop_type: "Wheat",
        slot_date: "",
        start_time: "09:00",
        end_time: "10:00",
        capacity_quintals: "100",
      });

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

      setMessage(data.message);
      await loadSlots();
    } catch (err) {
      setError(err.message);
    }
  }

  function logout() {
    localStorage.removeItem("kisansetuStaffToken");
    localStorage.removeItem("kisansetuStaff");
    navigate("/staff-login");
  }

  return (
    <div className="manager-page">
      <header className="manager-header">
        <div>
          <p className="manager-eyebrow">KISANSETU MANAGEMENT</p>
          <h1>Manager Dashboard</h1>
          <p>Manage procurement slots and available capacity.</p>
        </div>
        <button className="manager-logout" onClick={logout}>
          Log out
        </button>
      </header>

      {message && <div className="manager-message">{message}</div>}
      {error && <div className="manager-error">{error}</div>}

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
            Refresh
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
                    <td>
                      {String(slot.slot_date).slice(0, 10)}
                    </td>
                    <td>
                      {String(slot.start_time).slice(0, 5)}–
                      {String(slot.end_time).slice(0, 5)}
                    </td>
                    <td>{slot.capacity_quintals}</td>
                    <td>{slot.booked_quintals ?? 0}</td>
                    <td>{slot.available_quintals}</td>
                    <td>
                      <span
                        className={`manager-status ${slot.status}`}
                      >
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
    </div>
  );
}
