import { Route, Routes } from "react-router";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AnalyzeGamePage from "./pages/AnalyzeGamePage";
import ReviewGamePage from "./pages/ReviewGamePage";

function App() {
  return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/analyze" element={<AnalyzeGamePage />} />
        <Route path="/review" element={<ReviewGamePage />} />
      </Routes>
  );
}

export default App;