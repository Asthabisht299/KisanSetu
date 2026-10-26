
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StaffLogin.css";

function StaffLogin() {
  const navigate = useNavigate();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/staff/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Staff login failed.");
      }

      localStorage.setItem("kisansetuStaffToken", data.token);
      localStorage.setItem(
        "kisansetuStaff",
        JSON.stringify(data.staff || data.user || {})
      );

      navigate("/staff-dashboard");
    } catch (err) {
      setError(err.message || "Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="staff-login-page">
      <form className="staff-login-card" onSubmit={handleLogin}>
        <div className="staff-login-icon">🌾</div>

        <h1 className="staff-login-title">Staff Login</h1>

        <p className="staff-login-subtitle">
          KisanSetu Procurement Management
        </p>

        {error && (
          <div className="staff-login-error" role="alert">
            {error}
          </div>
        )}

        <label className="staff-login-label" htmlFor="staff-phone">
          Registered phone number
        </label>

        <input
          id="staff-phone"
          className="staff-login-input"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Enter your phone number"
          autoComplete="username"
          required
        />

        <label className="staff-login-label" htmlFor="staff-password">
          Password
        </label>

        <input
          id="staff-password"
          className="staff-login-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <button
          className="staff-login-button"
          type="submit"
          disabled={loading}
        >
          {loading ? "Signing in..." : "Sign In as Staff"}
        </button>

        <button
          className="staff-login-back"
          type="button"
          onClick={() => navigate("/")}
        >
          ← Back to Home
        </button>

        <p className="staff-login-footer">
          Authorized procurement staff only
        </p>
      </form>
    </div>
  );
}

export default StaffLogin;
