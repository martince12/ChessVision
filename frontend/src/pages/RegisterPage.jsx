import { useState } from "react";
import { Link, useNavigate } from "react-router";
import AuthLayout from "../components/auth/AuthLayout";
import { supabase } from "../lib/supabase";

function RegisterPage() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        const normalizedUsername = username.trim();
        const normalizedEmail = email.trim().toLowerCase();

        setErrorMessage("");
        setSuccessMessage("");

        if (!/^[A-Za-z0-9_]{3,30}$/.test(normalizedUsername)) {
            setErrorMessage(
                "Username must contain 3–30 letters, numbers, or underscores.",
            );
            return;
        }

        if (password.length < 6) {
            setErrorMessage("Password must contain at least 6 characters.");
            return;
        }

        setIsSubmitting(true);

        try {
            const { data, error } = await supabase.auth.signUp({
                email: normalizedEmail,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/login`,
                    data: {
                        username: normalizedUsername,
                        display_name: normalizedUsername,
                    },
                },
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            /*
             * When email confirmation is enabled, Supabase creates the account
             * but does not return an active session yet.
             */
            if (!data.session) {
                setSuccessMessage(
                    "Account created. Check your email and confirm your address before logging in.",
                );
                return;
            }

            navigate("/dashboard", { replace: true });
        } catch {
            setErrorMessage(
                "Something went wrong while creating your account. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <div className="auth-heading">
                <p className="eyebrow">Create your account</p>
                <h2>Start seeing every move differently.</h2>
                <p>
                    Create your ChessVision account and turn every played game into a
                    lesson.
                </p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Username
                    <input
                        type="text"
                        name="username"
                        placeholder="Choose a username"
                        minLength="3"
                        maxLength="30"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoComplete="username"
                        required
                    />
                </label>

                <label>
                    Email address
                    <input
                        type="email"
                        name="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoComplete="email"
                        required
                    />
                </label>

                <label>
                    Password
                    <input
                        type="password"
                        name="password"
                        placeholder="Create a strong password"
                        minLength="6"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="new-password"
                        required
                    />
                </label>

                <label className="terms-row">
                    <input type="checkbox" required />
                    <span>
                        I agree to the <a href="#terms">Terms of Service</a> and{" "}
                        <a href="#privacy">Privacy Policy</a>.
                    </span>
                </label>

                {errorMessage && (
                    <div className="auth-message auth-message-error">
                        <span>!</span>
                        {errorMessage}
                    </div>
                )}

                {successMessage && (
                    <div className="auth-message auth-message-success">
                        <span>✓</span>
                        {successMessage}
                    </div>
                )}

                <button
                    className="auth-submit-button"
                    type="submit"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? (
                        <>
                            <span className="button-spinner" />
                            Creating account...
                        </>
                    ) : (
                        <>
                            Create account
                            <span>→</span>
                        </>
                    )}
                </button>
            </form>

            <p className="auth-switch-text">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </AuthLayout>
    );
}

export default RegisterPage;