import { useState } from "react";
import "./Register.css";

export default function Register() {
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
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName.trim(),
            phone: phone.trim(),
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Registration failed.");
      }

      setMessage("success:Account created successfully! You can now log in.");
      setFullName("");
      setPhone("");
      setPassword("");
    } catch (error) {
      setMessage(
        `error:${error.message || "Unable to connect. Please try again."}`
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="register-page">
      <section className="register-card">
        <div className="register-welcome">
          <span className="register-icon" aria-hidden="true">🌾</span>
          <p className="register-eyebrow">WELCOME TO KISANSETU</p>
          <h1>Create your farmer account</h1>
          <p className="register-description">
            Book procurement slots, find nearby centres, and track your
            harvest journey in one place.
          </p>
        </div>

        <form className="register-form" onSubmit={handleRegister}>
          <div className="register-field">
            <label htmlFor="fullName">Your full name</label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your name"
              autoComplete="name"
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="phone">Mobile number</label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(event) =>
                setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="Enter 10-digit mobile number"
              autoComplete="tel-national"
              maxLength={10}
              minLength={10}
              pattern="[0-9]{10}"
              title="Please enter a 10-digit mobile number"
              required
            />
          </div>

          <div className="register-field">
            <label htmlFor="password">Create a password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 6 characters"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          <button className="register-button" type="submit" disabled={loading}>
            {loading ? "Creating your account..." : "Create My Account"}
          </button>

          {message && (
            <p
              className={`register-message ${
                message.startsWith("success:") ? "is-success" : "is-error"
              }`}
              role="status"
            >
              {message.replace(/^(success|error):/, "")}
            </p>
          )}

          <p className="register-note">
            Your details are used to create your KisanSetu account.
          </p>
        </form>
      </section>
    </main>
  );
}
