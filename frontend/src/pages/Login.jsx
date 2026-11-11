import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "./Login.css";

export default function Login() {
  const { language } = useLanguage();
  const hi = language === "hi";
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
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || (hi ? "लॉगिन नहीं हो पाया। अपना मोबाइल नंबर और पासवर्ड जाँचें।" : "Login failed. Please check your mobile number and password."));
      }
      localStorage.setItem("kisansetuToken", data.token);
      localStorage.setItem("kisansetuFarmer", JSON.stringify(data.farmer));
      navigate("/booking");
    } catch (error) {
      setMessage(error.message || (hi ? "सर्वर से संपर्क नहीं हो पाया। दोबारा कोशिश करें।" : "Unable to connect. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-welcome">
          <span className="login-icon" aria-hidden="true">🌾</span>
          <p className="login-eyebrow">{hi ? "वापस स्वागत है" : "WELCOME BACK"}</p>
          <h1>{hi ? "किसानसेतु में लॉगिन करें" : "Login to KisanSetu"}</h1>
          <p>{hi ? "अपनी फसल की बुकिंग देखने और नई बुकिंग करने के लिए लॉगिन करें।" : "Log in to view your crop bookings and book a new time."}</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="loginPhone">{hi ? "मोबाइल नंबर" : "Mobile number"}</label>
            <input id="loginPhone" type="tel" inputMode="numeric" autoComplete="tel-national"
              value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder={hi ? "10 अंकों का मोबाइल नंबर लिखें" : "Enter your 10-digit mobile number"}
              minLength={10} maxLength={10} pattern="[0-9]{10}" required />
          </div>
          <div className="login-field">
            <label htmlFor="loginPassword">{hi ? "पासवर्ड" : "Password"}</label>
            <input id="loginPassword" type="password" autoComplete="current-password"
              value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder={hi ? "अपना पासवर्ड लिखें" : "Enter your password"} required />
          </div>
          <button className="login-button" type="submit" disabled={loading}>
            {loading ? (hi ? "लॉगिन हो रहा है..." : "Logging in...") : (hi ? "लॉगिन करें" : "Login")}
          </button>
          {message && <p className="login-error" role="alert">{message}</p>}
          <p className="login-register">
            {hi ? "क्या आपका खाता नहीं है?" : "New to KisanSetu?"}{" "}
            <Link to="/register">{hi ? "नया खाता बनाएं" : "Create an account"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
