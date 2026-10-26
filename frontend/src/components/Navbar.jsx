
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { language, changeLanguage } = useLanguage();
  const isHindi = language === "hi";

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        <span className="brand-icon">🌾</span>
        <span>
          KisanSetu
          <small>
            {isHindi
              ? "किसानों को खरीद केंद्रों से जोड़ना"
              : "Connecting Farmers to Procurement"}
          </small>
        </span>
      </Link>

      <nav className="nav-links">
        <Link to="/">{isHindi ? "होम" : "Home"}</Link>
        <Link to="/booking">
          {isHindi ? "स्लॉट बुक करें" : "Book a Slot"}
        </Link>
        <Link to="/my-bookings">
          {isHindi ? "मेरी बुकिंग" : "My Bookings"}
        </Link>
        <Link to="/centres">
          {isHindi ? "खरीद केंद्र" : "Procurement Centres"}
        </Link>
        <Link to="/login">{isHindi ? "लॉगिन" : "Login"}</Link>
        <Link to="/register">
          {isHindi ? "रजिस्टर करें" : "Register"}
        </Link>

        <select
          aria-label="Choose language"
          value={language}
          onChange={(event) => changeLanguage(event.target.value)}
          style={{
            padding: "8px",
            borderRadius: "8px",
            border: "1px solid #ccc",
            background: "white",
            cursor: "pointer",
          }}
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </nav>
    </header>
  );
}
