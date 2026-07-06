import { Route, Routes } from "react-router";
import ProtectedRoute from "./components/auth/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyzeGamePage from "./pages/AnalyzeGamePage";
import ReviewGamePage from "./pages/ReviewGamePage";
import MyGamesPage from "./pages/MyGamesPage";
import AccountSettingsPage from "./pages/AccountSettingsPage";

function App() {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <DashboardPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/games"
                element={
                    <ProtectedRoute>
                        <MyGamesPage />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/settings"
                element={
                    <ProtectedRoute>
                        <AccountSettingsPage />
                    </ProtectedRoute>
                }
            />

            <Route path="/analyze" element={<AnalyzeGamePage />} />

            <Route path="/review" element={<ReviewGamePage />} />

            <Route
                path="/review/:gameId"
                element={
                    <ProtectedRoute>
                        <ReviewGamePage />
                    </ProtectedRoute>
                }
            />

        </Routes>
    );
}

export default App;