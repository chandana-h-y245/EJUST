import React, { useState } from "react";
import axios from "axios";
import { API_BASE } from "./config";

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

  const authHeaders = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const handleLogin = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      setToken(res.data.token);
      setUser(res.data.user);
      setMessage("Login successful");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  const fetchCases = async () => {
    setMessage("");
    try {
      const res = await axios.get("/cases", { headers: authHeaders });
      setCases(res.data);
      setMessage("Cases loaded");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load cases");
    }
  };

  const createCase = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.post(
        "/cases",
        {
          title: caseTitle,
          caseNumber,
          description: caseDescription,
        },
        { headers: authHeaders }
      );
      setMessage("Case created");
      setCases(prev => [...prev, res.data]);
      setCaseTitle("");
      setCaseNumber("");
      setCaseDescription("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create case");
    }
  };

  const fetchEvidences = async () => {
    if (!selectedCaseId) {
      setMessage("Select a case first");
      return;
    }
    setMessage("");
    try {
      const res = await axios.get(
        `/evidences/by-case/${selectedCaseId}`,
        { headers: authHeaders }
      );
      setEvidences(res.data);
      setMessage("Evidences loaded");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load evidences");
    }
  };

  const uploadEvidence = async e => {
    e.preventDefault();
    if (!selectedCaseId || !evidenceFile) {
      setMessage("Select case and file first");
      return;
    }
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("caseId", selectedCaseId);
      formData.append("file", evidenceFile); // field name must match multer

      const res = await axios.post("/evidences", formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Evidence uploaded");
      setEvidences(prev => [...prev, res.data]);
      setEvidenceFile(null);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to upload evidence");
    }
  };

    return (
  <div className="app-root">
    <div className="app-container">
      <header className="app-header">
        <h2 className="app-title">E-JUST Test UI</h2>
        <p className="app-subtitle">
          Login, create cases and upload evidences to test your backend.
        </p>
      </header>

      {message && (
        <div className="status status-info">
          <b>Status:</b> {message}
        </div>
      )}

      {!user && (
        <div className="card">
          <h3>Login</h3>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                className="input"
                type="email"
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="input"
                type="password"
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit">
              Login
            </button>
          </form>
        </div>
      )}

      {user && (
        <>
          <div className="card" style={{ marginBottom: "12px" }}>
            <p>
              Logged in as <b>{user.name}</b> ({user.role})
            </p>
          </div>

          <div className="app-grid">
            {/* Cases card */}
            <div className="card">
              <div className="card-header-row">
                <h3>Cases</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={fetchCases}
                >
                  Load My Cases
                </button>
              </div>

              {user.role === "LAWYER" && (
                <div className="card-section">
                  <h4>Create Case (LAWYER)</h4>
                  <form onSubmit={createCase}>
                    <div className="form-group">
                      <label className="form-label">Title</label>
                      <input
                        className="input"
                        value={caseTitle}
                        onChange={e => setCaseTitle(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Case Number</label>
                      <input
                        className="input"
                        value={caseNumber}
                        onChange={e => setCaseNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea
                        className="textarea"
                        value={caseDescription}
                        onChange={e => setCaseDescription(e.target.value)}
                      />
                    </div>
                    <button className="btn btn-primary" type="submit">
                      Create Case
                    </button>
                  </form>
                </div>
              )}

              <div className="card-section">
                <h4>Your Cases</h4>
                <ul className="list">
                  {cases.map(c => (
                    <li
                      key={c._id}
                      className={
                        "list-item" +
                        (selectedCaseId === c._id ? " selected" : "")
                      }
                    >
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => setSelectedCaseId(c._id)}
                      >
                        Select
                      </button>
                      <div style={{ marginLeft: "8px", flex: 1 }}>
                        <div>
                          {c.caseNumber} — {c.title} ({c.status})
                        </div>
                        <div className="meta">
                          ID: {c._id}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Evidence card */}
            <div className="card">
              <div className="card-header-row">
                <h3>Evidence</h3>
                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={fetchEvidences}
                  disabled={!selectedCaseId}
                >
                  Load for Selected Case
                </button>
              </div>

              <p className="meta">
                Selected case ID: {selectedCaseId || "None"}
              </p>

              {user.role === "LAWYER" && (
                <div className="card-section">
                  <h4>Upload Evidence (LAWYER)</h4>
                  <form onSubmit={uploadEvidence}>
                    <div className="form-group">
                      <input
                        className="file-input"
                        type="file"
                        onChange={e => setEvidenceFile(e.target.files[0])}
                      />
                    </div>
                    <button className="btn btn-primary" type="submit">
                      Upload
                    </button>
                  </form>
                </div>
              )}

              <div className="card-section">
                <h4>Evidence List</h4>
                <ul className="list">
                  {evidences.map(ev => (
                    <li key={ev._id} className="list-item">
                      <div>
                        <div>
                          {ev.originalFileName} — {ev.status}
                        </div>
                        <div className="meta">
                          hash: {ev.sha256Hash?.slice(0, 16)}...
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);

}

export default App;
