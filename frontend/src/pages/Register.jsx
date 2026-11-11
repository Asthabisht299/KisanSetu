import { useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import "./Register.css";

export default function Register() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister(event) {
    event.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (hi ? "खाता नहीं बन पाया। दोबारा कोशिश करें।" : "Registration failed."));
      setMessage("success:" + (hi ? "आपका खाता बन गया है। अब मोबाइल नंबर और पासवर्ड से लॉगिन करें।" : "Account created successfully! You can now log in."));
      setFullName(""); setPhone(""); setPassword("");
    } catch (error) {
      setMessage("error:" + (error.message || (hi ? "सर्वर से संपर्क नहीं हो पाया।" : "Unable to connect. Please try again.")));
    } finally { setLoading(false); }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-welcome">
          <span className="register-icon" aria-hidden="true">🌾</span>
          <p className="register-eyebrow">{hi ? "किसानसेतु में आपका स्वागत है" : "WELCOME TO KISANSETU"}</p>
          <h1>{hi ? "किसान खाता बनाएं" : "Create your farmer account"}</h1>
          <p className="register-description">
            {hi ? "खरीद केंद्र पर फसल लाने का समय बुक करें और अपनी बुकिंग की जानकारी यहाँ देखें।" : "Book a time to take your crop to a procurement centre and track your bookings here."}
          </p>
        </div>
        <form className="register-form" onSubmit={handleRegister}>
          <div className="register-field">
            <label htmlFor="fullName">{hi ? "पूरा नाम" : "Your full name"}</label>
            <input id="fullName" type="text" value={fullName} onChange={(event) => setFullName(event.target.value)}
              placeholder={hi ? "अपना नाम लिखें" : "Enter your name"} autoComplete="name" required />
          </div>
          <div className="register-field">
            <label htmlFor="phone">{hi ? "मोबाइल नंबर" : "Mobile number"}</label>
            <input id="phone" type="tel" inputMode="numeric" value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
              placeholder={hi ? "10 अंकों का मोबाइल नंबर लिखें" : "Enter 10-digit mobile number"}
              autoComplete="tel-national" maxLength={10} minLength={10} pattern="[0-9]{10}"
              title={hi ? "10 अंकों का मोबाइल नंबर लिखें" : "Please enter a 10-digit mobile number"} required />
          </div>
          <div className="register-field">
            <label htmlFor="password">{hi ? "पासवर्ड बनाएं" : "Create a password"}</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)}
              placeholder={hi ? "कम से कम 8 अक्षर रखें" : "At least 8 characters"}
              autoComplete="new-password" minLength={8} required />
            <small className="form-note">{hi ? "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।" : "Your password must be at least 8 characters long."}</small>
          </div>
          <button className="register-button" type="submit" disabled={loading}>
            {loading ? (hi ? "खाता बन रहा है..." : "Creating your account...") : (hi ? "खाता बनाएं" : "Create My Account")}
          </button>
          {message && <p className={`register-message ${message.startsWith("success:") ? "is-success" : "is-error"}`} role="status">
            {message.replace(/^(success|error):/, "")}
          </p>}
          <p className="register-note">
            {hi ? "पहले से खाता है?" : "Already have an account?"}{" "}
            <Link to="/login">{hi ? "लॉगिन करें" : "Log in"}</Link>
          </p>
        </form>
      </section>
    </main>
  );
}
