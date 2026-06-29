import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

function ProtectedRoute({ children }) {
    const { user, isAuthLoading } = useAuth();
    const location = useLocation();

    if (isAuthLoading) {
        return (
            <div className="auth-route-loading">
                <span className="button-spinner" />
                Restoring your session...
            </div>
        );
    }

    if (!user) {
        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: location.pathname,
                }}
            />
        );
    }

    return children;
}

export default ProtectedRoute;