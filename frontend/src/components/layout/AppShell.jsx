import { Link, NavLink } from "react-router";

function AppShell({ children }) {
    return (
        <div className="dashboard-shell">
            <aside className="dashboard-sidebar">
                <Link className="dashboard-logo" to="/">
                    <span className="logo-mark">♞</span>
                    Chess<span>Vision</span>
                </Link>

                <div className="sidebar-section-label">Workspace</div>

                <nav className="sidebar-nav">
                    <NavLink
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                        }
                        to="/dashboard"
                    >
                        <span className="sidebar-icon">▦</span>
                        Dashboard
                    </NavLink>

                    <NavLink
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                        }
                        to="/analyze"
                    >
                        <span className="sidebar-icon">⌕</span>
                        Analyze Game
                    </NavLink>

                    <span className="sidebar-link sidebar-link-disabled">
            <span className="sidebar-icon">♟</span>
            My Games
            <small>Soon</small>
          </span>

                    <span className="sidebar-link sidebar-link-disabled">
            <span className="sidebar-icon">↗</span>
            Insights
            <small>Soon</small>
          </span>
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-section-label">Account</div>

                    <span className="sidebar-link sidebar-link-disabled">
            <span className="sidebar-icon">⚙</span>
            Settings
            <small>Soon</small>
          </span>

                    <Link className="profile-preview" to="/dashboard">
                        <span className="profile-avatar">M</span>

                        <span className="profile-preview-info">
              <strong>Martin</strong>
              <small>Chess learner</small>
            </span>

                        <span className="profile-more">•••</span>
                    </Link>
                </div>
            </aside>

            <main className="dashboard-main">{children}</main>

            <nav className="mobile-bottom-nav">
                <NavLink
                    className={({ isActive }) =>
                        `mobile-nav-link ${isActive ? "mobile-nav-active" : ""}`
                    }
                    to="/dashboard"
                >
                    <span>▦</span>
                    Home
                </NavLink>

                <NavLink
                    className={({ isActive }) =>
                        `mobile-nav-link ${isActive ? "mobile-nav-active" : ""}`
                    }
                    to="/analyze"
                >
                    <span>⌕</span>
                    Analyze
                </NavLink>

                <span className="mobile-nav-link mobile-nav-disabled">
          <span>♟</span>
          Games
        </span>

                <span className="mobile-nav-link mobile-nav-disabled">
          <span>◉</span>
          Profile
        </span>
            </nav>
        </div>
    );
}

export default AppShell;