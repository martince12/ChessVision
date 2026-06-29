import { useState } from "react";
import { Link, useNavigate,useLocation } from "react-router";
import AuthLayout from "../components/auth/AuthLayout";
import { supabase } from "../lib/supabase";

function LoginPage() {
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [errorMessage, setErrorMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage("");
        setIsSubmitting(true);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: email.trim().toLowerCase(),
                password,
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            navigate(location.state?.from || "/dashboard", {
                replace: true,
            });
        } catch {
            setErrorMessage(
                "Something went wrong while logging in. Please try again.",
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <AuthLayout>
            <div className="auth-heading">
                <p className="eyebrow">Welcome back</p>
                <h2>Continue your chess journey.</h2>
                <p>Log in to access your games, insights, and analysis history.</p>
            </div>

            <form className="auth-form" onSubmit={handleSubmit}>
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
                    <span className="label-row">
                        Password
                        <a href="#forgot-password">Forgot password?</a>
                    </span>

                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </label>

                <label className="remember-row">
                    <input type="checkbox" defaultChecked />
                    <span>Keep me signed in on this device</span>
                </label>

                {errorMessage && (
                    <div className="auth-message auth-message-error">
                        <span>!</span>
                        {errorMessage}
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
                            Logging in...
                        </>
                    ) : (
                        <>
                            Log in to ChessVision
                            <span>→</span>
                        </>
                    )}
                </button>
            </form>

            <div className="auth-divider">
                <span />
                <p>or continue with</p>
                <span />
            </div>

            <button
                className="google-button google-button-disabled"
                type="button"
                disabled
                title="Google sign-in will be configured later."
            >
                <span className="google-icon">G</span>
                Google sign-in coming soon
            </button>

            <p className="auth-switch-text">
                New to ChessVision? <Link to="/register">Create an account</Link>
            </p>
        </AuthLayout>
    );
}

export default LoginPage;