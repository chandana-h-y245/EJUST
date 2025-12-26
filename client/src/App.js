import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";
import { FaGavel, FaUserShield } from "react-icons/fa";

axios.defaults.baseURL = API_BASE;

function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [caseTitle, setCaseTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [cases, setCases] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [message, setMessage] = useState("");

  const [professionals, setProfessionals] = useState([]);
  const [publicViewers, setPublicViewers] = useState([]);
  const [judges, setJudges] = useState([]);

  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [selectedPublics, setSelectedPublics] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadAssignableUsers = async tokenValue => {
    try {
      const res = await axios.get("/users/by-role", {
        headers: { Authorization: `Bearer ${tokenValue}` },
      });
      setProfessionals(res.data.professionals || []);
      setPublicViewers(res.data.publics || []);
      setJudges(res.data.judges || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load users");
    }
  };

  const handleLogin = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });

      const tokenValue = res.data.token;
      setToken(tokenValue);
      setUser(res.data.user);

      if (res.data.user.role === "LAWYER") {
        await loadAssignableUsers(tokenValue);
      }

      setMessage("Login successful");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  return (
    <div
      className="app-root"
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #eef2f7, #f9fafb)",
      }}
    >
      <div className="app-container" style={{ padding: "20px" }}>
        <header
          className="app-header"
          style={{
            borderRadius: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          }}
        >
          <div className="card-header-row">
            <div>
              <h2 className="app-title">
                <FaGavel style={{ marginRight: 8 }} />
                E-JUST
              </h2>
              <p className="app-subtitle">
                Secure Evidence Tracking & Authentication System
              </p>
            </div>

            {user && (
              <button
                className="btn btn-secondary btn-sm"
                style={{ borderRadius: "10px" }}
                onClick={() => {
                  setUser(null);
                  setToken("");
                  setCases([]);
                  setEvidences([]);
                  setSelectedCaseId("");
                  setMessage("Logged out");
                }}
              >
                Logout
              </button>
            )}
          </div>
        </header>

        {message && (
          <div
            className="status status-info"
            style={{
              borderRadius: "12px",
              boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
            }}
          >
            <b>Status:</b> {message}
          </div>
        )}

        {!user && (
          <div
            className="card"
            style={{
              borderRadius: "16px",
              boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
            }}
          >
            <h3>
              <FaUserShield style={{ marginRight: 6 }} />
              Login
            </h3>

            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  className="input"
                  type="email"
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password</label>
                <input
                  className="input"
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary"
                style={{ borderRadius: "12px" }}
              >
                Login
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
