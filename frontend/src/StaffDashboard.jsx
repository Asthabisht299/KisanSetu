
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffDashboard.css";
import { useLanguage } from "./context/LanguageContext";

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "checked_in", label: "Checked In" },
  { value: "procurement_in_progress", label: "Procurement In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export default function StaffDashboard() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const requestInProgress = useRef(false);

  const staffToken = localStorage.getItem("kisansetuStaffToken");

  const staffData = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("kisansetuStaff") || "null"
      );
    } catch {
      return null;
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    if (!staffToken || !staffData) {
      navigate("/staff-login");
      return;
    }

    // Prevent overlapping requests.
    if (requestInProgress.current) return;

    requestInProgress.current = true;

    try {
      const response = await fetch(
        "http://localhost:5000/api/staff/bookings",
        {
          headers: {
            Authorization: `Bearer ${staffToken}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("kisansetuStaffToken");
        localStorage.removeItem("kisansetuStaff");
        navigate("/staff-login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || hi ? "बुकिंग की जानकारी नहीं मिल पाई।" : "Unable to load bookings."
        );
      }

      setBookings((previousBookings) => {
        const previousById = new Map(
          previousBookings.map((booking) => [booking.id, booking])
        );

        return (data.bookings || []).map((booking) => {
          const previous = previousById.get(booking.id);

          return {
            ...booking,
            // Preserve an unsaved dropdown selection during refresh.
            selectedStatus:
              previous &&
              previous.selectedStatus !== previous.status
                ? previous.selectedStatus
                : booking.status,
          };
        });
      });

      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
      requestInProgress.current = false;
    }
  }, [staffToken, staffData, navigate]);

  useEffect(() => {
    fetchBookings();

    // Automatically fetch the latest bookings every 10 seconds.
    const intervalId = setInterval(() => {
      fetchBookings();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [fetchBookings]);

  const handleLogout = () => {
    localStorage.removeItem("kisansetuStaffToken");
    localStorage.removeItem("kisansetuStaff");
    navigate("/staff-login");
  };

  const handleStatusSelection = (bookingId, selectedStatus) => {
    setBookings((previousBookings) =>
      previousBookings.map((booking) =>
        booking.id === bookingId
          ? { ...booking, selectedStatus }
          : booking
      )
    );

    setNotice("");
  };

  const handleStatusUpdate = async (booking) => {
    const newStatus = booking.selectedStatus || booking.status;

    if (newStatus === booking.status) {
      setNotice(hi ? "बदलने के लिए कोई नई स्थिति नहीं है।" : "No status changes to save.");
      return;
    }

    setSavingId(booking.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `http://localhost:5000/api/staff/bookings/${booking.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${staffToken}`,
          },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      const data = await response.json();

      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem("kisansetuStaffToken");
        localStorage.removeItem("kisansetuStaff");
        navigate("/staff-login");
        return;
      }

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || hi ? "बुकिंग की स्थिति नहीं बदली जा सकी।" : "Unable to update booking status."
        );
      }

      setBookings((previousBookings) =>
        previousBookings.map((item) =>
          item.id === booking.id
            ? {
                ...item,
                status: newStatus,
                selectedStatus: newStatus,
              }
            : item
        )
      );

      setNotice(
        `Booking ${booking.booking_reference} updated successfully.`
      );

      // Fetch again immediately after a successful update.
      await fetchBookings();
    } catch (err) {
      setError(err.message || hi ? "बुकिंग की स्थिति नहीं बदली जा सकी।" : "Unable to update booking status.");
    } finally {
      setSavingId(null);
    }
  };

  const cropLabel = (crop) => hi ? ({ Wheat: "गेहूँ", Rice: "धान", Maize: "मक्का", Mustard: "सरसों", Barley: "जौ", Other: "अन्य" }[crop] || crop) : crop;

  const totalQuantity = bookings.reduce(
    (total, booking) =>
      total + Number(booking.quantity_{hi ? "क्विंटल" : "quintals"} || 0),
    0
  );

  const confirmedBookings = bookings.filter(
    (booking) => booking.status === "confirmed"
  ).length;

  const pendingBookings = bookings.filter(
    (booking) => booking.status === "pending"
  ).length;

  return (
    <div className="staff-dashboard">
      <div className="staff-dashboard-header">
        <div>
          <h1>{hi ? "कर्मचारी डैशबोर्ड" : "Staff Dashboard"}</h1>
          <p>
            Welcome, {staffData?.full_name || hi ? "कर्मचारी" : "Staff Member"}!
          </p>
          <p>
            Centre:{" "}
            {staffData?.centre_name || hi ? "आपका तय किया गया केंद्र" : "Your assigned centre"}
          </p>
          <p>
            <small>
              {hi ? "हर 10 सेकंड में जानकारी अपने आप अपडेट होगी" : "Auto-refresh: every 10 seconds"}
              {lastUpdated &&
                ` · Last updated: ${lastUpdated.toLocaleTimeString()}`}
            </small>
          </p>
        </div>

        <button type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="staff-stats">
        <div className="staff-stat-card">
          <h3>{hi ? "कुल बुकिंग" : "Total Bookings"}</h3>
          <p>{loading ? "..." : bookings.length}</p>
        </div>

        <div className="staff-stat-card">
          <h3>{hi ? "पक्की बुकिंग" : "Confirmed"}</h3>
          <p>{loading ? "..." : confirmedBookings}</p>
        </div>

        <div className="staff-stat-card">
          <h3>{hi ? "पुष्टि बाकी" : "Pending"}</h3>
          <p>{loading ? "..." : pendingBookings}</p>
        </div>

        <div className="staff-stat-card">
          <h3>{hi ? "कुल फसल" : "Total Quantity"}</h3>
          <p>
            {loading ? "..." : `${totalQuantity.toFixed(2)} {hi ? "क्विंटल" : "quintals"}`}
          </p>
        </div>
      </div>

      <div className="staff-bookings-section">
        <h2>{hi ? "आपके केंद्र की बुकिंग" : "Bookings for Your Centre"}</h2>

        {loading && <p>{hi ? "बुकिंग की जानकारी आ रही है..." : "Loading bookings..."}</p>}

        {!loading && error && (
          <p className="staff-error" role="alert">
            {error}
          </p>
        )}

        {!loading && notice && <p role="status">{notice}</p>}

        {!loading && !error && bookings.length === 0 && (
          <p>{hi ? "अभी आपके केंद्र पर कोई बुकिंग नहीं हुई है।" : "No bookings found for your centre yet."}</p>
        )}

        {!loading && bookings.length > 0 && (
          <div className="staff-bookings-list">
            {bookings.map((booking) => {
              const isSaving = savingId === booking.id;

              return (
                <div
                  className="staff-booking-card"
                  key={booking.id}
                >
                  <div className="staff-booking-top">
                    <h3>{booking.booking_reference}</h3>

                    <span
                      className={`booking-status ${booking.status}`}
                    >
                      {hi ? ({ pending: "पुष्टि बाकी", confirmed: "पक्की", checked_in: "केंद्र पहुँच गए", procurement_in_progress: "फसल की जाँच चल रही है", completed: "पूरी हुई", cancelled: "रद्द" }[booking.status] || booking.status) : booking.status.replaceAll("_", " ")}
                    </span>
                  </div>

                  <p>
                    <strong>{hi ? "किसान:" : "Farmer:"}</strong> {booking.farmer_name}
                  </p>
                  <p>
                    <strong>{hi ? "मोबाइल नंबर:" : "Phone:"}</strong> {booking.farmer_phone}
                  </p>
                  <p>
                    <strong>{hi ? "फसल:" : "Crop:"}</strong> {cropLabel(booking.crop_type)}
                  </p>
                  <p>
                    <strong>{hi ? "मात्रा:" : "Quantity:"}</strong>{" "}
                    {booking.quantity_{hi ? "क्विंटल" : "quintals"}} {hi ? "क्विंटल" : "quintals"}
                  </p>
                  <p>
                    <strong>{hi ? "तारीख:" : "Date:"}</strong>{" "}
                    {String(booking.slot_date).slice(0, 10)}
                  </p>
                  <p>
                    <strong>{hi ? "समय:" : "Time:"}</strong>{" "}
                    {String(booking.start_time).slice(0, 5)} –{" "}
                    {String(booking.end_time).slice(0, 5)}
                  </p>
                  <p>
                    <strong>{hi ? "भुगतान:" : "Payment:"}</strong> {hi ? ({ unpaid: "भुगतान बाकी", processing: "जाँच में", paid: "भुगतान हो गया" }[booking.payment_status] || booking.payment_status) : booking.payment_status}
                  </p>

                  <div className="staff-status-controls">
                    <label htmlFor={`status-${booking.id}`}>
                      {hi ? "बुकिंग की स्थिति बदलें" : "Update Booking Status"}
                    </label>

                    <select
                      id={`status-${booking.id}`}
                      value={
                        booking.selectedStatus || booking.status
                      }
                      disabled={isSaving}
                      onChange={(event) =>
                        handleStatusSelection(
                          booking.id,
                          event.target.value
                        )
                      }
                    >
                      {STATUS_OPTIONS.map((option) => (
                        <option
                          key={option.value}
                          value={option.value}
                        >
                          {hi ? ({ pending: "पुष्टि बाकी", confirmed: "पक्की", checked_in: "केंद्र पहुँच गए", procurement_in_progress: "फसल की जाँच चल रही है", completed: "पूरी हुई", cancelled: "रद्द" }[option.value]) : option.label}
                        </option>
                      ))}
                    </select>

                    <button
                      type="button"
                      disabled={
                        isSaving ||
                        (booking.selectedStatus || booking.status) ===
                          booking.status
                      }
                      onClick={() => handleStatusUpdate(booking)}
                    >
                      {isSaving ? hi ? "सेव हो रहा है..." : "{hi ? "सेव हो रहा है..." : "Saving..."}" : hi ? "स्थिति सेव करें" : "{hi ? "स्थिति सेव करें" : "Save Status"}"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
