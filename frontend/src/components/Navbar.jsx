import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Navbar() {
  const { language, changeLanguage } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const isHindi = language === "hi";

  const closeMenu = () => setMenuOpen(false);
  const linkClass = ({ isActive }) => isActive ? "active" : "";

  return (
    <header className="navbar">
      <Link className="brand" to="/" onClick={closeMenu} aria-label="KisanSetu home">
        <span className="brand-icon" aria-hidden="true">🌾</span>
        <span>
          KisanSetu
          <small>
            {isHindi
              ? "किसानों को खरीद केंद्रों से जोड़ना"
              : "Connecting Farmers to Procurement"}
          </small>
        </span>
      </Link>

      <button
        className="nav-toggle"
        type="button"
        aria-expanded={menuOpen}
        aria-controls="primary-navigation"
        onClick={() => setMenuOpen((open) => !open)}
      >
        {menuOpen ? (isHindi ? "बंद करें ✕" : "Close ✕") : (isHindi ? "मेन्यू ☰" : "Menu ☰")}
      </button>

      <nav id="primary-navigation" className={`nav-links ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
        <NavLink className={linkClass} to="/" onClick={closeMenu}>{isHindi ? "होम" : "Home"}</NavLink>
        <NavLink className={linkClass} to="/booking" onClick={closeMenu}>{isHindi ? "स्लॉट बुक करें" : "Book a Slot"}</NavLink>
        <NavLink className={linkClass} to="/my-bookings" onClick={closeMenu}>{isHindi ? "मेरी बुकिंग" : "My Bookings"}</NavLink>
        <NavLink className={linkClass} to="/centres" onClick={closeMenu}>{isHindi ? "खरीद केंद्र" : "Procurement Centres"}</NavLink>
        <NavLink className={linkClass} to="/login" onClick={closeMenu}>{isHindi ? "लॉगिन" : "Login"}</NavLink>
        <NavLink className={linkClass} to="/register" onClick={closeMenu}>{isHindi ? "रजिस्टर करें" : "Register"}</NavLink>
        <label className="sr-only" htmlFor="language-select">Choose language</label>
        <select
          id="language-select"
          value={language}
          onChange={(event) => changeLanguage(event.target.value)}
          aria-label="Choose language"
        >
          <option value="en">English</option>
          <option value="hi">हिंदी</option>
        </select>
      </nav>
    </header>
  );
}
