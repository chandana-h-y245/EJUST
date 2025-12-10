
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
          assignedProfessionals: selectedProfessionals,
          assignedPublicViewers: selectedPublics,
          assignedJudge: selectedJudge || null,
        },
        { headers: authHeaders }
      );

      setMessage("Case created");
      setCases(prev => [...prev, res.data]);
      setCaseTitle("");
      setCaseNumber("");
      setCaseDescription("");
      setSelectedProfessionals([]);
      setSelectedPublics([]);
      setSelectedJudge("");
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
      formData.append("file", evidenceFile);

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

  const verifyEvidence = async id => {
    try {
      await axios.patch(`/evidences/${id}/verify`, {}, { headers: authHeaders });
      setMessage("Evidence verified");
      if (selectedCaseId) fetchEvidences();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to verify evidence");
    }
  };

  const approveEvidence = async (id, decision) => {
    try {
      await axios.patch(
        `/evidences/${id}/approve`,
        { decision },
        { headers: authHeaders }
      );
      setMessage(`Evidence ${decision.toLowerCase()}`);
      if (selectedCaseId) fetchEvidences();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update evidence");
    }
  };

  return (
    <div className="app-root">
      <div className="app-container">
        <header className="app-header">
          <div className="card-header-row">
            <div>
              <h2 className="app-title">E-JUST</h2>
              <p className="app-subtitle">
                Secure Evidence Tracking & Authentication System
              </p>
            </div>
            {user && (
              <button
                className="btn btn-secondary btn-sm"
                type="button"
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
          <div className="status status-info">
            <b>Status:</b> {message}
          </div>
        )}

        {/* LOGIN */}
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

        {/* AFTER LOGIN */}
        {user && (
          <>
            <div className="card" style={{ marginBottom: "12px" }}>
              <p>
                Logged in as <b>{user.name}</b> ({user.role})
              </p>
            </div>

            {/* LAWYER DASHBOARD */}
            {user.role === "LAWYER" && (
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
                        <label className="form-label">Assign Professionals</label>
                        <select
                          className="select"
                          multiple
                          value={selectedProfessionals}
                          onChange={e =>
                            setSelectedProfessionals(
                              Array.from(
                                e.target.selectedOptions,
                                opt => opt.value
                              )
                            )
                          }
                        >
                          {professionals.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                        <p className="meta">
                          Hold Ctrl (Cmd on Mac) to select multiple.
                        </p>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Assign Public Viewers</label>
                        <select
                          className="select"
                          multiple
                          value={selectedPublics}
                          onChange={e =>
                            setSelectedPublics(
                              Array.from(
                                e.target.selectedOptions,
                                opt => opt.value
                              )
                            )
                          }
                        >
                          {publicViewers.map(p => (
                            <option key={p._id} value={p._id}>
                              {p.name} ({p.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Assign Judge</label>
                        <select
                          className="select"
                          value={selectedJudge}
                          onChange={e => setSelectedJudge(e.target.value)}
                        >
                          <option value="">None</option>
                          {judges.map(j => (
                            <option key={j._id} value={j._id}>
                              {j.name} ({j.email})
                            </option>
                          ))}
                        </select>
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
                            onClick={() => {
                              setSelectedCaseId(c._id);
                              setSelectedProfessionals(
                                (c.assignedProfessionals || []).map(
                                  p => p._id || p
                                )
                              );
                              setSelectedPublics(
                                (c.assignedPublicViewers || []).map(
                                  p => p._id || p
                                )
                              );
                              setSelectedJudge(
                                c.assignedJudge?._id ||
                                  c.assignedJudge ||
                                  ""
                              );
                            }}
                          >
                            Select
                          </button>
                          <div style={{ marginLeft: "8px", flex: 1 }}>
                            <div>
                              {c.caseNumber} — {c.title} ({c.status})
                            </div>
                            <div className="meta">ID: {c._id}</div>
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
            )}

            {/* PROFESSIONAL DASHBOARD */}
            {user.role === "PROFESSIONAL" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Assigned Cases & Evidence (PROFESSIONAL)</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchCases}
                  >
                    Load My Cases
                  </button>
                </div>

                <div className="card-section">
                  <h4>Cases</h4>
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
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-section">
                  <h4>Evidence for Selected Case</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchEvidences}
                    disabled={!selectedCaseId}
                  >
                    Load Evidence
                  </button>
                  <p className="meta">
                    Selected case ID: {selectedCaseId || "None"}
                  </p>

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

                        {ev.status === "UPLOADED" && (
                          <button
                            className="btn btn-primary btn-sm"
                            type="button"
                            onClick={() => verifyEvidence(ev._id)}
                          >
                            Verify
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* JUDGE DASHBOARD */}
            {user.role === "JUDGE" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Cases & Evidence (JUDGE)</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchCases}
                  >
                    Load My Cases
                  </button>
                </div>

                <div className="card-section">
                  <h4>Cases</h4>
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
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-section">
                  <h4>Evidence for Selected Case</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchEvidences}
                    disabled={!selectedCaseId}
                  >
                    Load Evidence
                  </button>
                  <p className="meta">
                    Selected case ID: {selectedCaseId || "None"}
                  </p>

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

                        {ev.status === "VERIFIED" && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              className="btn btn-primary btn-sm"
                              type="button"
                              onClick={() =>
                                approveEvidence(ev._id, "APPROVED")
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              type="button"
                              onClick={() =>
                                approveEvidence(ev._id, "REJECTED")
                              }
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* PUBLIC DASHBOARD */}
            {user.role === "PUBLIC" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Public View</h3>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchCases}
                  >
                    Load Public Cases
                  </button>
                </div>
                <p className="meta">
                  You can only see CLOSED cases and their evidence status.
                </p>

                <div className="card-section">
                  <h4>Cases</h4>
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
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="card-section">
                  <h4>Evidence for Selected Case</h4>
                  <button
                    className="btn btn-secondary btn-sm"
                    type="button"
                    onClick={fetchEvidences}
                    disabled={!selectedCaseId}
                  >
                    Load Evidence
                  </button>
                  <p className="meta">
                    Selected case ID: {selectedCaseId || "None"}
                  </p>

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
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
