import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import RiskScoring from "./pages/RiskScoring";
import Decision from "./pages/Decision";
import Confirmation from "./pages/Confirmation";
import Navbar from "./components/Navbar";

function App() {
  const [token, setToken] = useState(sessionStorage.getItem("token"));
  const [submission, setSubmission] = useState(null);
  const [riskResult, setRiskResult] = useState(null);

  const handleLogin = (t) => {
    sessionStorage.setItem("token", t);
    setToken(t);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    setToken(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Navbar onLogout={handleLogout} />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route
            path="/upload"
            element={<Upload onSubmit={(fields) => { setSubmission(fields); }} />}
          />
          <Route
            path="/risk"
            element={
              <RiskScoring
                submission={submission}
                onResult={(r) => setRiskResult(r)}
              />
            }
          />
          <Route
            path="/decision/:id"
            element={<Decision />}
          />
          <Route
            path="/confirmation"
            element={<Confirmation />}
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
