import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "./context/LanguageContext";
import "./StaffLogin.css";

function StaffLogin() {
  const { language } = useLanguage();
  const hi = language === "hi";
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/staff/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || (hi ? "लॉगिन नहीं हो पाया। जानकारी जाँचें।" : "Staff login failed."));
      localStorage.setItem("kisansetuStaffToken", data.token);
      localStorage.setItem("kisansetuStaff", JSON.stringify(data.staff || data.user || {}));
      navigate("/staff-dashboard");
    } catch (err) {
      setError(err.message || (hi ? "सर्वर से संपर्क नहीं हो पाया।" : "Unable to connect to the server."));
    } finally { setLoading(false); }
  };

  return (
    <div className="staff-login-page">
      <form className="staff-login-card" onSubmit={handleLogin}>
        <div className="staff-login-icon">🌾</div>
        <h1 className="staff-login-title">{hi ? "कर्मचारी लॉगिन" : "Staff Login"}</h1>
        <p className="staff-login-subtitle">{hi ? "किसानसेतु खरीद केंद्र प्रबंधन" : "KisanSetu Procurement Management"}</p>
        {error && <div className="staff-login-error" role="alert">{error}</div>}
        <label className="staff-login-label" htmlFor="staff-phone">{hi ? "रजिस्टर्ड मोबाइल नंबर" : "Registered phone number"}</label>
        <input id="staff-phone" className="staff-login-input" type="tel" inputMode="numeric" value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          placeholder={hi ? "मोबाइल नंबर लिखें" : "Enter your phone number"} autoComplete="username" required />
        <label className="staff-login-label" htmlFor="staff-password">{hi ? "पासवर्ड" : "Password"}</label>
        <input id="staff-password" className="staff-login-input" type="password" value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder={hi ? "पासवर्ड लिखें" : "Enter your password"}
          autoComplete="current-password" required />
        <button className="staff-login-button" type="submit" disabled={loading}>
          {loading ? (hi ? "लॉगिन हो रहा है..." : "Signing in...") : (hi ? "कर्मचारी के रूप में लॉगिन करें" : "Sign In as Staff")}
        </button>
        <button className="staff-login-back" type="button" onClick={() => navigate("/")}>{hi ? "← होम पेज पर जाएं" : "← Back to Home"}</button>
        <p className="staff-login-footer">{hi ? "यह लॉगिन केवल अधिकृत केंद्र कर्मचारियों के लिए है।" : "Authorized procurement staff only"}</p>
      </form>
    </div>
  );
}
export default StaffLogin;
