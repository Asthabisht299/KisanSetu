
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";

export default function Home() {
  const { language } = useLanguage();
  const isHindi = language === "hi";

  return (
    <>
      <section className="hero" id="home">
        <div className="hero-content">
          <span className="eyebrow">
            {isHindi ? "किसानों के काम को आसान बनाने के लिए" : "SMART FARMER ASSISTANCE"}
          </span>

          <h1>
            {isHindi ? (
              <>
                आपकी फसल।
                <br />
                आपका समय। <span>आपका फैसला।</span>
              </>
            ) : (
              <>
                Your harvest.
                <br />
                Your time. <span>Your choice.</span>
              </>
            )}
          </h1>

          <p>
            {isHindi
              ? "अपनी फसल की खरीद के लिए यात्रा की योजना बनाएं, नज़दीकी केंद्र देखें और अपनी अगली तैयारी करें—सब एक ही जगह।"
              : "Plan your procurement visit, explore nearby centres, and prepare for your next step—all in one place."}
          </p>

          <Link className="primary-button" to="/booking">
            {isHindi ? "फसल लाने का समय चुनें →" : "Plan Your Visit →"}
          </Link>

          <div className="hero-note">
            <span>✓</span>{" "}
            {isHindi
              ? "पहले से समय चुनें, केंद्र पर अपनी बारी से पहुंचें"
              : "Simple scheduling for farmers"}
          </div>
        </div>

        <div className="hero-visual">
          <div className="sun" />
          <div className="hill hill-back" />
          <div className="hill hill-front" />
          <div className="field-label">
            <span>🌱</span>
            <div>
              <strong>
                {isHindi ? "बेहतर योजना" : "Better planning"}
              </strong>
              <small>
                {isHindi ? "कम इंतज़ार" : "Less time waiting"}
              </small>
            </div>
          </div>
        </div>
      </section>

      <section className="quick-stats">
        <div className="stat">
          <span className="stat-icon">📅</span>
          <div>
            <strong>{isHindi ? "पहले से योजना बनाएं" : "Plan ahead"}</strong>
            <small>
              {isHindi ? "अपनी पसंद की तारीख चुनें" : "Choose a preferred date"}
            </small>
          </div>
        </div>

        <div className="stat">
          <span className="stat-icon">📍</span>
          <div>
            <strong>
              {isHindi ? "खरीद केंद्र देखें" : "Explore centres"}
            </strong>
            <small>
              {isHindi ? "कहाँ-कहाँ फसल खरीदी जाती है, देखें" : "View centre listings"}
            </small>
          </div>
        </div>

        <div className="stat">
          <span className="stat-icon">🔔</span>
          <div>
            <strong>{isHindi ? "जानकारी पाएं" : "Stay informed"}</strong>
            <small>
              {isHindi
                ? "अपनी बुकिंग की स्थिति यहाँ देखें"
                : "Tracking is coming later"}
            </small>
          </div>
        </div>
      </section>

      <section className="main-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">
              {isHindi ? "शुरू करें" : "GET STARTED"}
            </span>
            <h2>
              {isHindi ? "आप क्या करना चाहेंगे?" : "What would you like to do?"}
            </h2>
            <p>
              {isHindi
                ? "नीचे दिए गए विकल्पों में से चुनें कि आपको क्या करना है।"
                : "Choose an option to explore the prototype."}
            </p>
          </div>
        </div>

        <div className="centre-grid">
          <article className="centre-card">
            <span className="centre-icon">📅</span>
            <h3>
              {isHindi ? "फसल की खरीद की योजना बनाएं" : "Plan a procurement visit"}
            </h3>
            <p>
              {isHindi
                ? "फसल और केंद्र चुनें। फिर फसल लाने का खाली समय बुक करें।"
                : "Enter your crop details and preferred date."}
            </p>
            <Link className="text-button" to="/booking">
              {isHindi ? "खाली समय देखें →" : "Open booking page →"}
            </Link>
          </article>

          <article className="centre-card">
            <span className="centre-icon">🏢</span>
            <h3>{isHindi ? "खरीद केंद्र देखें" : "Explore centres"}</h3>
            <p>
              {isHindi
                ? "अपने इलाके के खरीद केंद्र का पता और जानकारी देखें।"
                : "View sample procurement centre listings."}
            </p>
            <Link className="text-button" to="/centres">
              {isHindi ? "केंद्र देखें →" : "View centres →"}
            </Link>
          </article>
        </div>
      </section>
    </>
  );
}
