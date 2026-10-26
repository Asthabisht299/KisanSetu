
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Booking from "./pages/Booking";
import Centres from "./pages/Centres";
import Register from "./pages/Register";
import Login from "./pages/Login";
import MyBookings from "./pages/MyBookings";

import StaffLogin from "./StaffLogin";
import StaffDashboard from "./StaffDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";

import { LanguageProvider } from "./context/LanguageContext";

import "./index.css";

export default function App() {
  return (
    <LanguageProvider>
      <div className="app">
        <Navbar />

        <main>
          <Routes>
            {/* Farmer pages */}
            <Route path="/" element={<Home />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/centres" element={<Centres />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route
  path="/manager-dashboard"
  element={<ManagerDashboard />}
/>

            {/* Staff pages */}
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route
              path="/staff-dashboard"
              element={<StaffDashboard />}
            />
          </Routes>
        </main>

        <Footer />
      </div>
    </LanguageProvider>
  );
}
