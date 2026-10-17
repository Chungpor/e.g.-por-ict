import React, { useState, useEffect, useRef } from "react";
import "./PorIctNavbar.css";

export default function PorIctNavbar({
  activeTab = "home",
  onNavigate,
  onToggleTheme,
  onLogout
}) {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [lang, setLang] = useState("EN");
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || "dark"
  );

  const profileRef = useRef(null);
  const langRef = useRef(null);

  const navItems = [
    { id: "home", label: "Home", href: "index.html", className: "" },
    { id: "news", label: "Por ICT News", href: "index.html#news", className: "" },
    {
      id: "live-chart",
      label: "Live Chart",
      href: "index.html#livechart",
      className: "nav-link-golden-chestnut"
    },
    {
      id: "triumm-delta",
      label: "Triumm Delta",
      href: "triumm-delta.html",
      className: "nav-terminal-accent"
    },
    { id: "analysis", label: "Analysis", href: "chart-analysis.html", className: "" },
    {
      id: "indicators",
      label: "Indicators",
      href: "indicators.html",
      className: "nav-link-flamingo"
    },
    {
      id: "por-ai-chat",
      label: "Por AI Chat",
      href: "por-ai-chat.html",
      className: "nav-link-aquamarine"
    },
    {
      id: "goal",
      label: "Goal Future",
      href: "goal.html",
      className: "nav-link-yellow"
    },
    {
      id: "preview",
      label: "Preview - recent signals",
      href: "Preview%20-recent%20signals.html",
      className: "nav-link-red"
    },
    { id: "membership", label: "Membership", href: "index.html#membership", className: "" },
    { id: "contact", label: "Contact Us", href: "index.html#contact", className: "" }
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target)) {
        setIsLangOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const toggleMusic = () => {
    setIsMusicPlaying((prev) => !prev);
  };

  const handleThemeSwitch = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("por_theme", nextTheme);
    if (onToggleTheme) onToggleTheme(nextTheme);
  };

  const handleSelectLang = (selected) => {
    setLang(selected);
    localStorage.setItem("por_lang", selected);
    setIsLangOpen(false);
  };

  const handleLinkClick = (e, item) => {
    setIsMobileDrawerOpen(false);
    if (onNavigate) {
      e.preventDefault();
      onNavigate(item.id, item.href);
    }
  };

  return (
    <>
      <header className="global-top-bar">
        <div className="top-bar-inner">
          {/* Brand Logo & Title */}
          <a href="index.html" className="nav-brand">
            <div className="brand-badge-circle">
              <img
                src="por.jpg"
                alt="Por ICT Logo"
                className="brand-nav-logo"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src =
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80";
                }}
              />
            </div>
            <span className="brand-title">
              <strong>Por</strong> ICT
            </span>
          </a>

          {/* Single-Line Center Navigation Links */}
          <nav className="nav-center-links" aria-label="Primary Navigation">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={item.href}
                onClick={(e) => handleLinkClick(e, item)}
                className={`nav-link ${item.className} ${
                  activeTab === item.id ? "active" : ""
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="nav-controls-group">
            {/* Sound Toggle Pill */}
            <button
              type="button"
              onClick={toggleMusic}
              className={`sound-toggle-pill ${isMusicPlaying ? "is-playing" : ""}`}
              aria-label="Toggle Sound"
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

            {/* Theme Toggle Switch */}
            <div
              className="theme-switch-pill"
              role="button"
              aria-label="Toggle Theme"
              tabIndex={0}
              onClick={handleThemeSwitch}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleThemeSwitch();
                }
              }}
            >
              <span className="theme-icon-track moon-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              </span>
              <span className="theme-icon-track sun-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              </span>
              <div className="theme-switch-thumb">
                {theme === "light" ? (
                  <svg className="thumb-sun" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg className="thumb-moon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </div>
            </div>

            {/* Profile Popover Trigger */}
            <div className="nav-profile-wrapper" ref={profileRef}>
              <button
                type="button"
                className="nav-avatar-btn"
                aria-label="Open Profile Details"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileOpen((prev) => !prev);
                  setIsLangOpen(false);
                }}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>

              <div className={`profile-popover-card ${isProfileOpen ? "show" : ""}`}>
                <div className="popover-header">
                  <img src="por.jpg" alt="Avatar" className="popover-avatar" />
                  <div className="popover-user-info">
                    <h4 className="popover-name">Chungpor</h4>
                    <p className="popover-email">chungpor908@gmail.com</p>
                  </div>
                </div>
                <div className="popover-divider" />
                <div className="popover-row">
                  <span className="popover-label">Status</span>
                  <span className="popover-badge badge-approved">● Approved</span>
                </div>
                <div className="popover-row">
                  <span className="popover-label">Tier</span>
                  <span className="popover-badge badge-member">Admin</span>
                </div>
                <div className="popover-row">
                  <span className="popover-label">Email verified</span>
                  <span className="popover-value-bold">Yes</span>
                </div>
                <a
                  href="index.html"
                  className="popover-action-btn"
                  style={{ textDecoration: "none", textAlign: "center" }}
                >
                  View full profile
                </a>
              </div>
            </div>

            {/* Language Selector Pill */}
            <div className="lang-dropdown-wrapper" ref={langRef}>
              <button
                type="button"
                className="lang-pill-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLangOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
              >
                <span>{lang}</span>
                <svg className="chevron-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              <div className={`lang-dropdown-menu ${isLangOpen ? "show" : ""}`}>
                <div
                  className={`lang-option ${lang === "EN" ? "active" : ""}`}
                  onClick={() => handleSelectLang("EN")}
                >
                  EN
                </div>
                <div
                  className={`lang-option ${lang === "KH" ? "active" : ""}`}
                  onClick={() => handleSelectLang("KH")}
                >
                  KH
                </div>
              </div>
            </div>

            {/* Logout Pill */}
            <a
              href="index.html"
              className="nav-logout-pill"
              onClick={(e) => {
                if (onLogout) {
                  e.preventDefault();
                  onLogout();
                }
              }}
            >
              Log out
            </a>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              aria-label="Toggle Mobile Menu"
              onClick={() => setIsMobileDrawerOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {isMobileDrawerOpen && (
        <div className="mobile-menu-drawer">
          <div
            className="mobile-drawer-backdrop"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div className="mobile-drawer-sheet">
            <div className="mobile-user-header">
              <div className="mobile-avatar-circle">
                <img src="por.jpg" alt="Avatar" className="mobile-user-avatar" />
              </div>
              <div className="mobile-user-details">
                <h4 className="mobile-user-name">Chungpor</h4>
                <p className="mobile-user-email">chungpor908@gmail.com</p>
              </div>
            </div>
            <div className="mobile-drawer-divider" />
            <nav className="mobile-nav-links">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleLinkClick(e, item)}
                  className={`mobile-nav-link-item ${item.className} ${
                    activeTab === item.id ? "active" : ""
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mobile-drawer-divider" />
            <a
              href="index.html"
              className="mobile-logout-link"
              onClick={() => setIsMobileDrawerOpen(false)}
            >
              Log out
            </a>
          </div>
        </div>
      )}
    </>
  );
}