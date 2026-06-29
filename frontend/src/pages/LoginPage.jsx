import { Link, useNavigate } from "react-router";
import AuthLayout from "../components/auth/AuthLayout";

function LoginPage() {
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();

        // Privremeno dodeka ne go povrzeme Supabase Auth.
        navigate("/dashboard");
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
                        required
                    />
                </label>

                <label className="remember-row">
                    <input type="checkbox" />
                    <span>Remember me for 30 days</span>
                </label>

                <button className="auth-submit-button" type="submit">
                    Log in to ChessVision
                    <span>→</span>
                </button>
            </form>

            <div className="auth-divider">
                <span />
                <p>or continue with</p>
                <span />
            </div>

            <button className="google-button" type="button">
                <span className="google-icon">G</span>
                Continue with Google
            </button>

            <p className="auth-switch-text">
                New to ChessVision? <Link to="/register">Create an account</Link>
            </p>
        </AuthLayout>
    );
}

export default LoginPage;