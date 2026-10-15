import React, { useState } from "react";
import "./PorIctNavbar.css";

export default function PorIctNavbar({ activeTab = "triumm-delta", onNavigate }) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [lang, setLang] = useState("EN");

  const navItems = [
    { id: "home", label: "Home", href: "index.html", className: "" },
    { id: "news", label: "Por ICT News", href: "index.html#news", className: "" },
    { id: "live-chart", label: "Live Chart", href: "index.html#livechart", className: "nav-link-golden-chestnut" },
    { id: "triumm-delta", label: "Triumm Delta", href: "triumm-delta.html", className: "nav-terminal-accent" },
    { id: "analysis", label: "Analysis", href: "chart-analysis.html", className: "" },
    { id: "goal", label: "Goal Future", href: "goal.html", className: "nav-link-yellow" },
    { id: "preview", label: "Preview - recent signals", href: "Preview -recent signals.html", className: "nav-link-red" },
    { id: "membership", label: "Membership", href: "index.html#membership", className: "" },
    { id: "contact", label: "Contact Us", href: "index.html#contact", className: "" }
  ];

  const toggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
  };

  return (
    <header className="global-top-bar">
      <div className="top-bar-inner">
        {/* Brand */}
        <a href="index.html" className="nav-brand" style={{ textDecoration: "none" }}>
          <div className="brand-badge-circle">
            <img src="por.jpg" alt="Por ICT" className="brand-nav-logo" />
          </div>
          <span className="brand-title">
            <strong>Por</strong> ICT
          </span>
        </a>

        {/* Single-Line Center Links */}
        <nav className="nav-center-links">
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={(e) => {
                if (onNavigate) {
                  e.preventDefault();
                  onNavigate(item.id);
                }
              }}
              className={`nav-link ${item.className} ${activeTab === item.id ? "active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Right Controls */}
        <div className="nav-controls-group">
          <button
            type="button"
            onClick={toggleMusic}
            className={`sound-toggle-pill ${isMusicPlaying ? "is-playing" : ""}`}
          >
            <span className="sound-wave-track">
              <span className="sound-wave-bar" />
              <span className="sound-wave-bar" />
              <span className="sound-wave-bar" />
            </span>
            <span className="sound-label-text">
              {isMusicPlaying ? "Music: ON" : "Music: OFF"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setLang(lang === "EN" ? "KH" : "EN")}
            className="lang-pill-btn"
          >
            <span>{lang}</span>
          </button>

          <a href="index.html" className="nav-logout-pill" style={{ textDecoration: "none" }}>
            Log out
          </a>
        </div>
      </div>
    </header>
  );
}