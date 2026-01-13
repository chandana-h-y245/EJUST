import React, { useState, useEffect } from "react";
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

  const [evidenceCategory, setEvidenceCategory] = useState("DOCUMENT");
  const [evidenceDisplayName, setEvidenceDisplayName] = useState("");

  const [cases, setCases] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [message, setMessage] = useState("");

  const [professionals, setProfessionals] = useState([]);
  const [publicViewers, setPublicViewers] = useState([]);
  const [judges, setJudges] = useState([]);

  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [selectedPublics, setSelectedPublics] = useState([]);
  const [selectedJudge, setSelectedJudge] = useState("");

  const [verdictText, setVerdictText] = useState("");
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [closeCase, setCloseCase] = useState(false);

  // NEW: control whether closed cases are shown
  const [showClosed, setShowClosed] = useState(false);

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
      
      // Ensure we are sending the state variable 'evidenceCategory'
      formData.append("category", evidenceCategory); 
      formData.append("displayName", evidenceDisplayName);

      const res = await axios.post("/evidences", formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessage("Evidence uploaded successfully");
      setEvidences(prev => [...prev, res.data]);
      
      // Reset form
      setEvidenceFile(null);
      setEvidenceDisplayName("");
      setEvidenceCategory("DOCUMENT");
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

  const submitVerdict = async e => {
    e.preventDefault();
    if (!selectedCaseId) {
      setMessage("Select a case first");
      return;
    }
    setMessage("");
    try {
      await axios.patch(
        `/cases/${selectedCaseId}/verdict`,
        {
          verdictText,
          nextHearingDate: nextHearingDate || null,
          closeCase,
        },
        { headers: authHeaders }
      );
      setMessage("Verdict saved");
      setVerdictText("");
      setNextHearingDate("");
      setCloseCase(false);
      await fetchCases();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save verdict");
    }
  };

  useEffect(() => {
    if (!user || !token) return;
    fetchCases();
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCaseId) return;
    fetchEvidences();
  }, [selectedCaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  const evidenceLinkBase = API_BASE.replace("/api", "");

  const groupedEvidences = {
    DOCUMENT: evidences.filter(ev => ev.category === "DOCUMENT"),
    IMAGE: evidences.filter(ev => ev.category === "IMAGE"),
    VIDEO: evidences.filter(ev => ev.category === "VIDEO"),
    OTHER: evidences.filter(ev => ev.category === "OTHER"),
  };

  const statusClass = status => {
    switch (status) {
      case "VERIFIED": return "status-verified";
      case "APPROVED": return "status-approved";
      case "REJECTED": return "status-rejected";
      default: return "status-uploaded";
    }
  };

  const renderGroupedEvidenceList = (showActions, role) => {
  const categories = ["DOCUMENT", "IMAGE", "VIDEO", "OTHER"];

  return (
    <div className="evidence-section">
      <h3>Case Evidence Repository</h3>
      
      {categories.map(cat => {
        const files = groupedEvidences[cat] || [];
        return (
          <div key={cat} style={{ marginBottom: '28px' }}>
            <div className="category-title">
              {cat}S ({files.length})
            </div>

            <div className="evidence-grid">
              {files.map(ev => (
                <div key={ev._id} className="evidence-card">
                  <div className="card-top">
                    <div className="file-name-text">
                      {ev.displayName || ev.originalFileName}
                    </div>
                    {/* Using your existing statusClass logic */}
                    <span className={statusClass(ev.status)}>
                      {ev.status}
                    </span>
                  </div>

                  <div className="card-details">
                    <div>Hash: <code>{ev.sha256Hash?.slice(0, 12)}...</code></div>
                    <div style={{ marginTop: '4px' }}>
                      Timestamp: {new Date(ev.createdAt || Date.now()).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="card-actions-row">
                    {ev.fileUrl && (
                      <button
                        type="button"
                        className="btn-view-evidence-card"
                        onClick={() => {
                          const fullUrl = evidenceLinkBase + ev.fileUrl;
                          window.open(fullUrl, "_blank");
                        }}
                      >
                        Open File
                      </button>
                    )}

                    {/* Role-based actions */}
                    {showActions && role === "PROFESSIONAL" && ev.status === "UPLOADED" && (
                      <button className="btn btn-primary btn-sm" onClick={() => verifyEvidence(ev._id)}>
                        Verify
                      </button>
                    )}

                    {showActions && role === "JUDGE" && ev.status === "VERIFIED" && (
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button className="btn btn-primary btn-sm" onClick={() => approveEvidence(ev._id, "APPROVED")}>
                          Approve
                        </button>
                        <button className="btn btn-secondary btn-sm" onClick={() => approveEvidence(ev._id, "REJECTED")}>
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {files.length === 0 && (
              <div className="meta" style={{ padding: '8px', border: '1px dashed #374151', borderRadius: '8px' }}>
                No {cat.toLowerCase()} evidence found.
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

  const selectedCase = cases.find(c => c._id === selectedCaseId);

  // filtered lists: by default hide CLOSED unless showClosed is true
  const visibleCases = cases.filter(
    c => showClosed || c.status !== "CLOSED"
  );

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

            {user.role === "LAWYER" && (
              <div className="app-grid">
                <div className="card card-lawyer">
                  <div className="card-header-row">
                    <h3>Cases</h3>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={fetchCases}
                      >
                        Load My Cases
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        type="button"
                        onClick={() => setShowClosed(s => !s)}
                      >
                        {showClosed ? "Hide closed cases" : "Show closed cases"}
                      </button>
                    </div>
                  </div>

                  <div className="card-section lawyer-assign-section">
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

                      <div className="form-group lawyer-assign-block">
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

                      <div className="form-group lawyer-assign-block">
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

                      <div className="form-group lawyer-assign-block">
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
                      {visibleCases.map(c => (
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
                            {c.verdictText && (
                              <div className="meta">Verdict: {c.verdictText}</div>
                            )}
                            {c.nextHearingDate && (
                              <div className="meta">
                                Next session:{" "}
                                {new Date(c.nextHearingDate).toLocaleString()}
                              </div>
                            )}
                            <div className="meta">ID: {c._id}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

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
                        <label className="form-label">Display Name</label>
                        <input
                          className="input"
                          value={evidenceDisplayName}
                          onChange={e =>
                            setEvidenceDisplayName(e.target.value)
                          }
                          placeholder="Optional readable name"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                          className="select"
                          value={evidenceCategory}
                          onChange={e =>
                            setEvidenceCategory(e.target.value)
                          }
                        >
                          <option value="DOCUMENT">Document</option>
                          <option value="IMAGE">Image</option>
                          <option value="VIDEO">Video</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

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

                  {renderGroupedEvidenceList(false, "LAWYER")}
                </div>
              </div>
            )}

            {user.role === "PROFESSIONAL" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Assigned Cases & Evidence (PROFESSIONAL)</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={fetchCases}
                    >
                      Load My Cases
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setShowClosed(s => !s)}
                    >
                      {showClosed ? "Hide closed cases" : "Show closed cases"}
                    </button>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Cases</h4>
                  <ul className="list">
                    {visibleCases.map(c => (
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
                          {c.verdictText && (
                            <div className="meta">Verdict: {c.verdictText}</div>
                          )}
                          {c.nextHearingDate && (
                            <div className="meta">
                              Next session:{" "}
                              {new Date(c.nextHearingDate).toLocaleString()}
                            </div>
                          )}
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="meta">
                  Selected case ID: {selectedCaseId || "None"}
                </p>

                {renderGroupedEvidenceList(true, "PROFESSIONAL")}
              </div>
            )}

            {user.role === "JUDGE" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Cases & Evidence (JUDGE)</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={fetchCases}
                    >
                      Load My Cases
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setShowClosed(s => !s)}
                    >
                      {showClosed ? "Hide closed cases" : "Show closed cases"}
                    </button>
                  </div>
                </div>

                <div className="card-section">
                  <h4>Cases</h4>
                  <ul className="list">
                    {visibleCases.map(c => (
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
                            setVerdictText(c.verdictText || "");
                            setNextHearingDate(
                              c.nextHearingDate
                                ? new Date(c.nextHearingDate)
                                    .toISOString()
                                    .slice(0, 16)
                                : ""
                            );
                            setCloseCase(c.status === "CLOSED");
                          }}
                        >
                          Select
                        </button>
                        <div style={{ marginLeft: "8px", flex: 1 }}>
                          <div>
                            {c.caseNumber} — {c.title} ({c.status})
                          </div>
                          {c.verdictText && (
                            <div className="meta">Verdict: {c.verdictText}</div>
                          )}
                          {c.nextHearingDate && (
                            <div className="meta">
                              Next session:{" "}
                              {new Date(c.nextHearingDate).toLocaleString()}
                            </div>
                          )}
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="meta">
                  Selected case ID: {selectedCaseId || "None"}
                </p>

                {selectedCase && (
                  <div className="card-section">
                    <h4>Set Verdict / Next Session</h4>
                    <form onSubmit={submitVerdict}>
                      <div className="form-group">
                        <label className="form-label">Verdict</label>
                        <textarea
                          className="textarea"
                          value={verdictText}
                          onChange={e => setVerdictText(e.target.value)}
                          placeholder="Enter final verdict or notes"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Next Hearing</label>
                        <input
                          className="input"
                          type="datetime-local"
                          value={nextHearingDate}
                          onChange={e => setNextHearingDate(e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">
                          <input
                            type="checkbox"
                            checked={closeCase}
                            onChange={e => setCloseCase(e.target.checked)}
                            style={{ marginRight: 6 }}
                          />
                          Close case now (status = CLOSED)
                        </label>
                      </div>
                      <button className="btn btn-primary" type="submit">
                        Save Verdict
                      </button>
                    </form>
                  </div>
                )}

                {renderGroupedEvidenceList(true, "JUDGE")}
              </div>
            )}

            {user.role === "PUBLIC" && (
              <div className="card">
                <div className="card-header-row">
                  <h3>Public View</h3>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={fetchCases}
                    >
                      Load Public Cases
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      type="button"
                      onClick={() => setShowClosed(s => !s)}
                    >
                      {showClosed ? "Hide closed cases" : "Show closed cases"}
                    </button>
                  </div>
                </div>
                <p className="meta">
                  You can only see pending cases, their current status, and next
                  session details.
                </p>

                <div className="card-section">
                  <h4>Cases</h4>
                  <ul className="list">
                    {visibleCases.map(c => (
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
                          {c.nextHearingDate && (
                            <div className="meta">
                              Next session:{" "}
                              {new Date(c.nextHearingDate).toLocaleString()}
                            </div>
                          )}
                          <div className="meta">ID: {c._id}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="meta">
                  Selected case ID: {selectedCaseId || "None"}
                </p>

                {selectedCase && (
                  <div className="case-detail-panel">
                    <h4>Case Details</h4>
                    <p>
                      <b>Title:</b> {selectedCase.title}
                    </p>
                    <p>
                      <b>Status:</b> {selectedCase.status}</p>
                    {selectedCase.nextHearingDate && (
                      <p>
                        <b>Next session:</b>{" "}
                        {new Date(
                          selectedCase.nextHearingDate
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default App;
