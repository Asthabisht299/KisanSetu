import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleLogin(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed. Please try again.");
      }

      localStorage.setItem("kisansetuToken", data.token);
      localStorage.setItem("kisansetuFarmer", JSON.stringify(data.farmer));

      navigate("/booking");
    } catch (error) {
      setMessage(error.message || "Unable to connect. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-welcome">
          <span className="login-icon" aria-hidden="true">🌾</span>
          <p className="login-eyebrow">WELCOME BACK</p>
          <h1>Login to KisanSetu</h1>
          <p>Continue your journey with easier procurement booking.</p>
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="loginPhone">Mobile number</label>
            <input
              id="loginPhone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter your 10-digit mobile number"
              minLength={10}
              maxLength={10}
              pattern="[0-9]{10}"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="loginPassword">Password</label>
            <input
              id="loginPassword"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button className="login-button" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>

          {message && <p className="login-error" role="alert">{message}</p>}

          <p className="login-register">
            New to KisanSetu? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </section>
    </main>
  );
}