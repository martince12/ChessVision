import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

function AppShell({ children }) {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [isSigningOut, setIsSigningOut] = useState(false);

    const displayName =
        user?.user_metadata?.display_name ||
        user?.user_metadata?.username ||
        user?.email?.split("@")[0] ||
        "Chess player";

    const profileInitial = displayName.charAt(0).toUpperCase();

    async function handleSignOut() {
        setIsSigningOut(true);

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                throw error;
            }

            navigate("/login", { replace: true });
        } catch (error) {
            console.error("Could not sign out:", error);
            setIsSigningOut(false);
        }
    }

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

                    <NavLink
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                        }
                        to="/games"
                    >
                        <span className="sidebar-icon">♟</span>
                        My Games
                    </NavLink>

                    <span className="sidebar-link sidebar-link-disabled">
                        <span className="sidebar-icon">↗</span>
                        Insights
                        <small>Soon</small>
                    </span>
                </nav>

                <div className="sidebar-bottom">
                    <div className="sidebar-section-label">Account</div>

                    <NavLink
                        className={({ isActive }) =>
                            `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                        }
                        to="/settings"
                    >
                        <span className="sidebar-icon">⚙</span>
                        Settings
                    </NavLink>

                    <div className="profile-preview">
                        <span className="profile-avatar">
                            {profileInitial}
                        </span>

                        <span className="profile-preview-info">
                            <strong>{displayName}</strong>
                            <small>{user?.email || "Signed in"}</small>
                        </span>

                        <span className="profile-more">•••</span>
                    </div>

                    <button
                        className="sidebar-logout-button"
                        type="button"
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                    >
                        <span>↪</span>

                        {isSigningOut ? "Signing out..." : "Log out"}
                    </button>
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

                <NavLink
                    className={({ isActive }) =>
                        `mobile-nav-link ${isActive ? "mobile-nav-active" : ""}`
                    }
                    to="/games"
                >
                    <span>♟</span>
                    Games
                </NavLink>

                <button
                    className="mobile-nav-link mobile-logout-button"
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                >
                    <span>↪</span>
                    Logout
                </button>
            </nav>
        </div>
    );
}

export default AppShell;