import { useState, useEffect, type ReactNode } from "react";
import { isAuthenticated, clearToken, isBrandUser, isUsherUser } from "./adminApi";
import { AdminLogin } from "./AdminLogin";
import { DashboardPage } from "./DashboardPage";
import { BoothsPage } from "./BoothsPage";
import { BoothActivitiesPage } from "./BoothActivitiesPage";
import { SymposiumsPage } from "./SymposiumsPage";
import { PostTestsPage } from "./PostTestsPage";
import { RewardsPage } from "./RewardsPage";
import { UsersListPage } from "./UsersListPage";
import { ToastProvider } from "../context/ToastContext";
import "./admin.css";

// ─── Navigation Icons (SVGs Identik dengan Theme Glassmorphism) ────────────

function IconGrid() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconUserPlus() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="17" y1="11" x2="23" y2="11" />
    </svg>
  );
}

function IconUserCheck() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  );
}

function IconBooth() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" />
      <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}

function IconClipboardCheck() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <polyline points="9 14 11 16 15 12" />
    </svg>
  );
}

function IconSymposium() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconGift() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </svg>
  );
}

function IconMysteryBox() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 12v10" />
    </svg>
  );
}

function IconQrCode() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <path d="M7 7h.01" />
      <path d="M18 7h.01" />
      <path d="M7 18h.01" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg
      className="nav-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

// ─── Navigation Configuration (Grouped as Requested) ────────────────────────

type AdminPage =
  | "dashboard"
  | "users"
  | "register-user"
  | "visitors"
  | "symposium-checkin"
  | "claim-reward"
  | "visit-booth"
  | "booths"
  | "booth-activities"
  | "symposiums"
  | "post-tests"
  | "rewards"
  | "mystery-box";

interface NavItem {
  id: AdminPage;
  label: string;
  icon: ReactNode;
  section: string;
}

const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: <IconGrid />, section: "Overview" },
  { id: "users", label: "Daftar Users", icon: <IconUsers />, section: "Operations" },
  { id: "register-user", label: "Registrasi User", icon: <IconUserPlus />, section: "Operations" },
  { id: "visitors", label: "Data Visitor", icon: <IconUsers />, section: "Operations" },
  {
    id: "symposium-checkin",
    label: "Check-In Symposium",
    icon: <IconUserCheck />,
    section: "Operations",
  },
  {
    id: "claim-reward",
    label: "Scanner Klaim Reward",
    icon: <IconGift />,
    section: "Operations",
  },
  {
    id: "visit-booth",
    label: "Scanner Visit Booth",
    icon: <IconQrCode />,
    section: "Operations",
  },

  // Grouping 1: Booth Management
  {
    id: "booths",
    label: "Daftar Booths",
    icon: <IconBooth />,
    section: "Booth Management",
  },
  {
    id: "booth-activities",
    label: "Activities & Podcast",
    icon: <IconMic />,
    section: "Booth Management",
  },

  // Grouping 2: Symposium Management
  {
    id: "symposiums",
    label: "Daftar Symposiums",
    icon: <IconSymposium />,
    section: "Symposium Management",
  },
  {
    id: "post-tests",
    label: "Post-Tests",
    icon: <IconClipboardCheck />,
    section: "Symposium Management",
  },

  // Grouping 3: Rewards Management (Rewards dan Mystery Box dipisah)
  {
    id: "rewards",
    label: "Rewards Merchandise",
    icon: <IconGift />,
    section: "Rewards Management",
  },
  {
    id: "mystery-box",
    label: "Mystery Box",
    icon: <IconMysteryBox />,
    section: "Rewards Management",
  },
];

// ─── Placeholder Page for Sub-Pages ─────────────────────────────────────────

function UnderDevelopmentPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{title}</h1>
          <p className="admin-page-subtitle">{description}</p>
        </div>
      </div>

      <div className="admin-table-container" style={{ padding: 60, textAlign: "center" }}>
        <div style={{ fontSize: 44, marginBottom: 16, opacity: 0.5 }}>⚙️</div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 8,
            color: "var(--admin-text)",
          }}
        >
          Modul Sedang Disiapkan
        </h3>
        <p
          style={{
            color: "var(--admin-text-secondary)",
            fontSize: 13.5,
            maxWidth: 420,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          Halaman {title} telah disiapkan dan siap dihubungkan dengan endpoint backend
          Kalbe.
        </p>
      </div>
    </div>
  );
}

// ─── Main Admin Layout ──────────────────────────────────────────────────────

export function AdminLayout() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated());
  const [activePage, setActivePage] = useState<AdminPage>("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    clearToken();
    setLoggedIn(false);
  };

  useEffect(() => {
    setLoggedIn(isAuthenticated());
  }, []);

  if (!loggedIn) {
    return (
      <div className="admin-root">
        <AdminLogin onLoginSuccess={() => setLoggedIn(true)} />
      </div>
    );
  }

  const pageTitles: Record<AdminPage, string> = {
    dashboard: "Dashboard",
    users: "Daftar All Users",
    "register-user": "Registrasi User Manual",
    visitors: "Data Visitor (Booth & Symposium)",
    "symposium-checkin": "Symposium Check-In",
    "claim-reward": "Scanner Klaim Reward",
    "visit-booth": "Scanner Visit Booth",
    booths: "Booths Management",
    "booth-activities": "Booth Activities & Podcast",
    symposiums: "Symposiums Management",
    "post-tests": "Post-Tests Management (Symposium)",
    rewards: "Rewards Merchandise Management",
    "mystery-box": "Mystery Box Management",
  };

  const isBrand = isBrandUser();
  const isUsher = isUsherUser();

  const brandAllowedPages: AdminPage[] = [
    "dashboard",
    "users",
    "register-user",
    "visitors",
    "booths",
    "booth-activities",
    "symposiums",
    "post-tests",
    "rewards",
    "mystery-box",
  ];

  const usherAllowedPages: AdminPage[] = [
    "register-user",
    "claim-reward",
    "symposium-checkin",
    "visit-booth",
  ];

  const visibleNavItems = isBrand
    ? navItems.filter((item) => brandAllowedPages.includes(item.id))
    : isUsher
      ? navItems.filter((item) => usherAllowedPages.includes(item.id))
      : navItems;

  const sections = [...new Set(visibleNavItems.map((item) => item.section))];

  const renderPage = () => {
    if (isBrand && !brandAllowedPages.includes(activePage)) {
      return <DashboardPage />;
    }
    if (isUsher && !usherAllowedPages.includes(activePage)) {
      return (
        <UnderDevelopmentPage
          title="Scanner Klaim Reward"
          description="Scan QR atau validasi PIN klaim reward peserta"
        />
      );
    }

    switch (activePage) {
      case "dashboard":
        return <DashboardPage />;
      case "users":
        return <UsersListPage />;
      case "register-user":
        return <UsersListPage initialOpenRegister={true} />;
      case "visitors":
        return (
          <UnderDevelopmentPage
            title="Data Visitor"
            description="Rekap kunjungan peserta ke booth dan simposium"
          />
        );
      case "symposium-checkin":
        return (
          <UnderDevelopmentPage
            title="Symposium Check-In"
            description="Validasi kehadiran peserta simposium"
          />
        );
      case "claim-reward":
        return (
          <UnderDevelopmentPage
            title="Scanner Klaim Reward"
            description="Validasi penukaran hadiah merchandise dan mystery box"
          />
        );
      case "visit-booth":
        return (
          <UnderDevelopmentPage
            title="Scanner Visit Booth"
            description="Catat check-in pengunjung booth"
          />
        );
      case "booths":
        return <BoothsPage />;
      case "booth-activities":
        return <BoothActivitiesPage />;
      case "symposiums":
        return <SymposiumsPage />;
      case "post-tests":
        return <PostTestsPage />;
      case "rewards":
        return <RewardsPage />;
      case "mystery-box":
        return (
          <UnderDevelopmentPage
            title="Mystery Box Management"
            description="Kelola reward khusus mystery box untuk pengunjung yang menyelesaikan semua booth & simposium aktif"
          />
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <ToastProvider>
      <div className="admin-root">
        <div className="admin-layout">
          {/* Mobile Backdrop Overlay */}
          {mobileMenuOpen && (
            <div
              className="admin-sidebar-overlay"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`admin-sidebar ${mobileMenuOpen ? "mobile-open" : ""}`}>
            <div className="admin-sidebar-header">
              <div className="admin-sidebar-logo">
                <span className="highlight">K</span>ALBE
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className={`admin-sidebar-badge ${isBrand ? "admin-badge-info" : isUsher ? "admin-badge-warning" : ""}`}
                >
                  {isBrand ? "Brand (View Only)" : isUsher ? "Usher" : "Admin"}
                </span>
                <button
                  className="admin-sidebar-close-btn"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close sidebar"
                >
                  ×
                </button>
              </div>
            </div>

            <nav className="admin-sidebar-nav">
              {sections.map((section) => (
                <div key={section} className="admin-nav-section">
                  <div className="admin-nav-section-title">{section}</div>
                  {visibleNavItems
                    .filter((item) => item.section === section)
                    .map((item) => (
                      <button
                        key={item.id}
                        className={`admin-nav-item ${activePage === item.id ? "active" : ""}`}
                        onClick={() => {
                          setActivePage(item.id);
                          setMobileMenuOpen(false);
                        }}
                      >
                        {item.icon}
                        <span className="nav-label">{item.label}</span>
                      </button>
                    ))}
                </div>
              ))}
            </nav>

            <div className="admin-sidebar-footer">
              <button className="admin-nav-item" onClick={handleLogout}>
                <IconLogout />
                <span className="nav-label">Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="admin-main">
            <header className="admin-topbar">
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button
                  className="admin-mobile-toggle"
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  aria-label="Toggle navigation menu"
                >
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                </button>
                <h2 className="admin-topbar-title">{pageTitles[activePage]}</h2>
              </div>
              <div className="admin-topbar-actions">
                <span
                  className="admin-topbar-subtext"
                  style={{ fontSize: 13, color: "var(--admin-text-muted)" }}
                >
                  Kalbe Admin Portal
                </span>
              </div>
            </header>

            <div className="admin-page-content" key={activePage}>
              {renderPage()}
            </div>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
