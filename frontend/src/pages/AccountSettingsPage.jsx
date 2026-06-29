import { useEffect, useState } from "react";
import AppShell from "../components/layout/AppShell";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../lib/api";

function AccountSettingsPage() {
    const { user } = useAuth();

    const [profile, setProfile] = useState(null);
    const [isProfileLoading, setIsProfileLoading] = useState(true);

    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [profileMessage, setProfileMessage] = useState("");
    const [profileError, setProfileError] = useState("");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState("");
    const [passwordError, setPasswordError] = useState("");

    useEffect(() => {
        const controller = new AbortController();

        async function loadProfile() {
            setIsProfileLoading(true);
            setProfileError("");

            try {
                const {
                    data: { session },
                    error: sessionError,
                } = await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    throw new Error(
                        "Your login session has expired. Please log in again.",
                    );
                }

                const response = await fetch(
                    `${API_BASE_URL}/api/account/profile`,
                    {
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                        },
                        signal: controller.signal,
                    },
                );

                const data = await response.json().catch(() => null);

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                        data?.detail ||
                        "Could not load your account profile.",
                    );
                }

                setProfile(data);
                setUsername(data.username || "");
                setDisplayName(data.displayName || "");
            } catch (error) {
                if (error.name !== "AbortError") {
                    setProfileError(
                        error.message ||
                        "Could not load your account profile.",
                    );
                }
            } finally {
                setIsProfileLoading(false);
            }
        }

        loadProfile();

        return () => controller.abort();
    }, []);

    async function handleProfileSubmit(event) {
        event.preventDefault();

        setProfileMessage("");
        setProfileError("");

        const normalizedUsername = username.trim();
        const normalizedDisplayName = displayName.trim();

        if (normalizedUsername.length < 3) {
            setProfileError(
                "Username must contain at least 3 characters.",
            );
            return;
        }

        if (!/^[A-Za-z0-9_]+$/.test(normalizedUsername)) {
            setProfileError(
                "Username may contain only letters, numbers, and underscores.",
            );
            return;
        }

        if (normalizedDisplayName.length < 2) {
            setProfileError(
                "Display name must contain at least 2 characters.",
            );
            return;
        }

        setIsSavingProfile(true);

        try {
            const {
                data: { session },
                error: sessionError,
            } = await supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                throw new Error(
                    "Your login session has expired. Please log in again.",
                );
            }

            const response = await fetch(
                `${API_BASE_URL}/api/account/profile`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        username: normalizedUsername,
                        displayName: normalizedDisplayName,
                    }),
                },
            );

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                    data?.detail ||
                    "Could not update your account profile.",
                );
            }

            const { error: metadataError } =
                await supabase.auth.updateUser({
                    data: {
                        username: data.username,
                        display_name: data.displayName,
                    },
                });

            if (metadataError) {
                throw new Error(
                    "Profile was saved, but the active session could not refresh. Please log in again.",
                );
            }

            setProfile(data);
            setUsername(data.username);
            setDisplayName(data.displayName);
            setProfileMessage("Your profile was updated successfully.");
        } catch (error) {
            setProfileError(
                error.message || "Could not update your account profile.",
            );
        } finally {
            setIsSavingProfile(false);
        }
    }

    async function handlePasswordSubmit(event) {
        event.preventDefault();

        setPasswordMessage("");
        setPasswordError("");

        if (newPassword.length < 8) {
            setPasswordError(
                "Your new password must contain at least 8 characters.",
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError("The passwords do not match.");
            return;
        }

        setIsSavingPassword(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });

            if (error) {
                throw error;
            }

            setNewPassword("");
            setConfirmPassword("");
            setPasswordMessage("Your password was updated successfully.");
        } catch (error) {
            setPasswordError(
                error.message || "Could not update your password.",
            );
        } finally {
            setIsSavingPassword(false);
        }
    }

    const profileInitial = (
        displayName ||
        profile?.displayName ||
        user?.email ||
        "C"
    )
        .charAt(0)
        .toUpperCase();

    return (
        <AppShell>
            <section className="settings-page">
                <header className="settings-page-header">
                    <div>
                        <p className="dashboard-date">ACCOUNT SETTINGS</p>

                        <h1>
                            Your <span>Profile</span>
                        </h1>

                        <p>
                            Manage how your ChessVision profile appears across
                            your dashboard, analyses, and saved game library.
                        </p>
                    </div>
                </header>

                {isProfileLoading ? (
                    <section className="settings-loading-card">
                        Loading your account settings...
                    </section>
                ) : (
                    <div className="settings-grid">
                        <section className="settings-card settings-profile-card">
                            <div className="settings-card-heading">
                                <div>
                                    <p className="panel-kicker">Public profile</p>
                                    <h2>Profile details</h2>
                                </div>

                                <span className="settings-profile-avatar">
                                    {profileInitial}
                                </span>
                            </div>

                            <p className="settings-card-description">
                                Your display name appears inside ChessVision.
                                Username is unique and used as your account handle.
                            </p>

                            <form
                                className="settings-form"
                                onSubmit={handleProfileSubmit}
                            >
                                <label>
                                    <span>Display name</span>

                                    <input
                                        type="text"
                                        value={displayName}
                                        maxLength="50"
                                        onChange={(event) =>
                                            setDisplayName(event.target.value)
                                        }
                                        placeholder="Your display name"
                                    />
                                </label>

                                <label>
                                    <span>Username</span>

                                    <div className="settings-username-input">
                                        <i>@</i>

                                        <input
                                            type="text"
                                            value={username}
                                            maxLength="30"
                                            onChange={(event) =>
                                                setUsername(
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="your_username"
                                        />
                                    </div>

                                    <small>
                                        3–30 characters. Letters, numbers, and
                                        underscores only.
                                    </small>
                                </label>

                                <label>
                                    <span>Email address</span>

                                    <input
                                        type="email"
                                        value={profile?.email || user?.email || ""}
                                        readOnly
                                    />

                                    <small>
                                        Email changes are not included in V1.
                                    </small>
                                </label>

                                {profileError && (
                                    <p className="settings-message settings-message-error">
                                        {profileError}
                                    </p>
                                )}

                                {profileMessage && (
                                    <p className="settings-message settings-message-success">
                                        {profileMessage}
                                    </p>
                                )}

                                <button
                                    className="settings-save-button"
                                    type="submit"
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile
                                        ? "Saving profile..."
                                        : "Save profile"}
                                </button>
                            </form>
                        </section>

                        <section className="settings-card settings-password-card">
                            <div className="settings-card-heading">
                                <div>
                                    <p className="panel-kicker">Security</p>
                                    <h2>Change password</h2>
                                </div>

                                <span className="settings-security-icon">⌁</span>
                            </div>

                            <p className="settings-card-description">
                                Use a strong password that you do not reuse on
                                another website.
                            </p>

                            <form
                                className="settings-form"
                                onSubmit={handlePasswordSubmit}
                            >
                                <label>
                                    <span>New password</span>

                                    <input
                                        type="password"
                                        value={newPassword}
                                        minLength="8"
                                        onChange={(event) =>
                                            setNewPassword(event.target.value)
                                        }
                                        placeholder="At least 8 characters"
                                    />
                                </label>

                                <label>
                                    <span>Confirm new password</span>

                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        minLength="8"
                                        onChange={(event) =>
                                            setConfirmPassword(
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Repeat your new password"
                                    />
                                </label>

                                {passwordError && (
                                    <p className="settings-message settings-message-error">
                                        {passwordError}
                                    </p>
                                )}

                                {passwordMessage && (
                                    <p className="settings-message settings-message-success">
                                        {passwordMessage}
                                    </p>
                                )}

                                <button
                                    className="settings-save-button"
                                    type="submit"
                                    disabled={isSavingPassword}
                                >
                                    {isSavingPassword
                                        ? "Updating password..."
                                        : "Update password"}
                                </button>
                            </form>
                        </section>

                        <section className="settings-card settings-account-note">
                            <span className="settings-note-icon">♞</span>

                            <div>
                                <p className="panel-kicker">ChessVision V1</p>

                                <h2>Your data stays yours.</h2>

                                <p>
                                    Your saved games, Stockfish analyses, and
                                    dashboard statistics are linked only to your
                                    authenticated ChessVision account.
                                </p>
                            </div>
                        </section>
                    </div>
                )}
            </section>
        </AppShell>
    );
}

export default AccountSettingsPage;