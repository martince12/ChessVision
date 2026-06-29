import { Link, useNavigate } from "react-router";
import AuthLayout from "../components/auth/AuthLayout";

function RegisterPage() {
    const navigate = useNavigate();

    function handleSubmit(event) {
        event.preventDefault();

        // Privremeno dodeka ne dodademe Supabase Auth.
        navigate("/dashboard");
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
                        required
                    />
                </label>

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
                    Password
                    <input
                        type="password"
                        name="password"
                        placeholder="Create a strong password"
                        minLength="6"
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

                <button className="auth-submit-button" type="submit">
                    Create account
                    <span>→</span>
                </button>
            </form>

            <p className="auth-switch-text">
                Already have an account? <Link to="/login">Log in</Link>
            </p>
        </AuthLayout>
    );
}

export default RegisterPage;