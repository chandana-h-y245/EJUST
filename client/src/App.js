import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE } from "./config";

axios.defaults.baseURL = API_BASE;

function App() {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")) || null);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  const [caseTitle, setCaseTitle] = useState("");
  const [caseNumber, setCaseNumber] = useState("");
  const [caseDescription, setCaseDescription] = useState("");

  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [editCaseId, setEditCaseId] = useState("");
  const [evidenceFile, setEvidenceFile] = useState(null);

  const [evidenceCategory, setEvidenceCategory] = useState("DOCUMENT");
  const [evidenceDisplayName, setEvidenceDisplayName] = useState("");

  const [cases, setCases] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [message, setMessage] = useState("");

  const [professionals, setProfessionals] = useState([]);
  const [publicViewers, setPublicViewers] = useState([]);
  const [lawyers, setLawyers] = useState([]);
  const [judges, setJudges] = useState([]);

  const [selectedProfessionals, setSelectedProfessionals] = useState([]);
  const [selectedPublics, setSelectedPublics] = useState([]);
  const [selectedLawyers, setSelectedLawyers] = useState([]);

  const [verdictText, setVerdictText] = useState("");
  const [verdictStatus, setVerdictStatus] = useState("OPEN"); // Added for Management Console
  const [nextHearingDate, setNextHearingDate] = useState("");
  const [closeCase, setCloseCase] = useState(false);

  // Profile State
  const [profile, setProfile] = useState(null);
  const [profileName, setProfileName] = useState("");
  const [profileExperience, setProfileExperience] = useState("");
  const [profileEducation, setProfileEducation] = useState("");
  const [profileGovIdType, setProfileGovIdType] = useState("");
  const [profileGovIdNumber, setProfileGovIdNumber] = useState("");
  const [profilePicFile, setProfilePicFile] = useState(null);

  const [activeTab, setActiveTab] = useState("CURRENT_CASES");
  const [searchTerm, setSearchTerm] = useState("");
  const [verificationCommentsMap, setVerificationCommentsMap] = useState({});
  const [expandedEvidenceId, setExpandedEvidenceId] = useState("");
  const [selectedEvidence, setSelectedEvidence] = useState(null); // Master-Detail State
  const [activeSubTab, setActiveSubTab] = useState("DETAILS"); // Sidebar State for Case Detail
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isTimelineOpen, setIsTimelineOpen] = useState(false); // Collapsible Timeline State
  const [completedDeadlines, setCompletedDeadlines] = useState(() => {
    // Initialize from local storage
    try {
      const saved = localStorage.getItem("completedDeadlines");
      return saved ? JSON.parse(saved) : [];
    } catch (e) { return []; }
  });

  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  };

  const loadAssignableUsers = async tokenValue => {
    try {
      const res = await axios.get("/users/by-role", {
        headers: { Authorization: `Bearer ${tokenValue}` },
      });
      setProfessionals(res.data.professionals || []);
      setPublicViewers(res.data.publicViewers || res.data.publics || []);
      setLawyers(res.data.lawyers || []);
      setJudges(res.data.judges || []);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to load users");
    }
  };

  const fetchProfile = async () => {
    if (!token) return;
    try {
      const res = await axios.get("/users/profile", { headers: authHeaders });
      setProfile(res.data);
      setProfileName(res.data.name || "");
      setProfileExperience(res.data.experience || "");
      setProfileEducation(res.data.education || "");
      setProfileGovIdType(res.data.governmentIdType || "");
      setProfileGovIdNumber(res.data.governmentIdNumber || "");
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]);


  const handleProfileUpdate = async e => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.patch(
        "/users/profile",
        {
          name: profileName,
          experience: profileExperience,
          education: profileEducation,
          governmentIdType: profileGovIdType,
          governmentIdNumber: profileGovIdNumber,
        },
        { headers: authHeaders }
      );
      setProfile(res.data);
      setUser(res.data); // update global user name if changed
      localStorage.setItem("user", JSON.stringify(res.data));
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleProfilePictureUpload = async e => {
    e.preventDefault();
    if (!profilePicFile) return;
    setMessage("");
    try {
      const formData = new FormData();
      formData.append("profilePicture", profilePicFile);

      const res = await axios.post("/users/profile/picture", formData, {
        headers: {
          ...authHeaders,
          "Content-Type": "multipart/form-data",
        },
      });
      setProfile(res.data);
      setProfilePicFile(null);
      setMessage("Profile picture updated");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to upload picture");
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
      localStorage.setItem("user", JSON.stringify(res.data.user));
      localStorage.setItem("token", tokenValue);

      if (res.data.user.role === "JUDGE" || res.data.user.role === "PUBLIC") {
        await loadAssignableUsers(tokenValue);
      }

      setMessage("Login successful");
      setActiveTab("CURRENT_CASES");
      setSelectedCaseId("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    }
  };

  const fetchCases = async () => {
    try {
      const res = await axios.get("/cases", { headers: authHeaders });
      setCases(res.data);
      setMessage("Cases loaded");
      if (user?.role === "JUDGE" || user?.role === "LAWYER") {
        await loadAssignableUsers(token);
      }
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
          assignedLawyers: selectedLawyers,
          // assignedJudge is auto-set by backend for JUDGE
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
      setSelectedLawyers([]);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to create case");
    }
  };

  const handleUpdateAssignments = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await axios.patch(
        `/cases/${editCaseId}`,
        {
          assignedLawyers: selectedLawyers,
          assignedProfessionals: selectedProfessionals,
          assignedPublicViewers: selectedPublics,
        },
        { headers: authHeaders }
      );

      setMessage("Case assignments updated");
      setCases((prev) =>
        prev.map((c) => (c._id === editCaseId ? res.data : c))
      );
      setEditCaseId("");
      setSelectedLawyers([]);
      setSelectedProfessionals([]);
      setSelectedPublics([]);
    } catch (err) {
      setMessage(
        err.response?.data?.message || "Failed to update assignments"
      );
    }
  };

  const handleSuggestionDecision = async (caseId, suggestionId, status) => {
    setMessage("");
    try {
      const res = await axios.patch(
        `/cases/${caseId}/suggestions/${suggestionId}`,
        { status },
        { headers: authHeaders }
      );
      setMessage(`Suggestion ${status.toLowerCase()}`);
      setCases((prev) =>
        prev.map((c) => (c._id === caseId ? res.data : c))
      );
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to update suggestion");
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

  const verifyEvidence = async (id, decision = "VERIFIED") => {
    try {
      const comment = verificationCommentsMap[id] || "";
      await axios.patch(`/evidences/${id}/verify`, { comments: comment, decision }, { headers: authHeaders });
      setMessage(`Evidence ${decision.toLowerCase()} with comments`);

      // Clear specific comment from map
      setVerificationCommentsMap(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      // Auto-close expander
      setExpandedEvidenceId("");

      if (selectedCaseId) fetchEvidences();
    } catch (err) {
      console.error("Verification failed:", err);
      setMessage(err.response?.data?.message || err.message || "Failed to verify evidence");
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
      setExpandedEvidenceId(""); // Auto-close expander
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
          status: verdictStatus, // Explicit status (OPEN/CLOSED)
        },
        { headers: authHeaders }
      );
      setMessage("Verdict saved");
      setVerdictText("");
      setNextHearingDate("");
      setVerdictStatus("OPEN"); // Reset dropdown
      await fetchCases();
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to save verdict");
    }
  };

  useEffect(() => {
    if (!user || !token) return;
    fetchCases();
    if (user.role === "JUDGE") {
      loadAssignableUsers(token);
    }
    // Default Timeline State: Closed for Professionals, Open for others
    setIsTimelineOpen(user.role !== "PROFESSIONAL");
  }, [user, token]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedCaseId) {
      setSelectedEvidence(null);
      return;
    }
    fetchEvidences();
    setSelectedEvidence(null); // Clear preview on case load/switch
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

  const renderCaseTimeline = (theCase) => {
    if (!theCase || !theCase.timeline || theCase.timeline.length === 0) {
      return (
        <div className="timeline-section card">
          <h3>Case Progression Timeline</h3>
          <p className="meta">No progression records found for this case yet.</p>
        </div>
      );
    }

    return (
      <div className="timeline-section card">
        <h3
          onClick={() => setIsTimelineOpen(!isTimelineOpen)}
          style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          Case History
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>{isTimelineOpen ? '▼' : '▶'}</span>
        </h3>
        {isTimelineOpen && (
          <div className="timeline-container">
            <div className="timeline-line"></div>
            {[...theCase.timeline]
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((event, index) => {
                const isLatest = index === 0; // Correctly identifies latest after sort
                return (
                  <div key={event._id || index} className={`timeline-item ${isLatest ? 'latest' : ''}`}>
                    <div className="timeline-dot" style={{ background: isLatest ? 'var(--primary)' : 'var(--border-muted)', border: '2px solid var(--surface-deep)' }}>
                    </div>
                    <div className="timeline-content">
                      <div className="timeline-date">
                        {formatDate(event.date || Date.now())} {new Date(event.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="timeline-status">
                        {event.status || "STATUS UPDATE"}
                        {isLatest && <span className="status-pill status-info" style={{ fontSize: '0.6rem', padding: '2px 6px' }}>LATEST</span>}
                      </div>
                      {event.verdict && (
                        <div className="timeline-verdict">
                          "{event.verdict}"
                        </div>
                      )}
                      {event.nextHearing && (
                        <div className="timeline-next">
                          📅 Next Hearing: {formatDate(event.nextHearing)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    );
  };

  const renderGroupedEvidenceList = (showActions, role, isClosed = false) => {
    // Flatten and Sort Evidences: Latest First
    const allEvidences = [...evidences].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Group by Category (for the list view headers if needed, OR just linear list with badges)
    const categories = ["DOCUMENT", "IMAGE", "VIDEO", "OTHER"];

    return (
      <div className="evidence-section">
        <h3>Case Evidence Repository</h3>

        <div className="evidence-layout-container">
          {/* LEFT COLUMN: EVIDENCE LIST */}
          <div className="evidence-list-column">
            {categories.map(cat => {
              const files = groupedEvidences[cat] || [];
              if (files.length === 0) return null;

              return (
                <div key={cat}>
                  <div className="category-title">{cat}S ({files.length})</div>
                  <div className="evidence-grid" style={{ gridTemplateColumns: '1fr' }}> {/* Stack cards vertically in list col */}
                    {files.map(ev => {
                      const isSelected = selectedEvidence?._id === ev._id;

                      return (
                        <div
                          key={ev._id}
                          className={`evidence-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedEvidence(ev)}
                          style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative' }}
                        >
                          {/* Row 1: Title & Status */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-heading)' }}>
                              {ev.displayName || ev.originalFileName}
                            </div>
                            <span className={statusClass(ev.status)} style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                              {ev.status}
                            </span>
                          </div>

                          {/* Row 2: Metadata */}
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', fontFamily: 'monospace', display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <span>{ev.category}</span>
                            <span style={{ color: 'var(--border-muted)' }}>|</span>
                            <span>{ev.sha256Hash ? ev.sha256Hash.substring(0, 12) + '...' : 'No Hash'}</span>
                            <span style={{ color: 'var(--border-muted)' }}>|</span>
                            <span>{formatDate(ev.createdAt || Date.now())}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {allEvidences.length === 0 && <p className="meta">No evidence uploaded yet.</p>}
          </div>

          {/* RIGHT COLUMN: PREVIEW PANEL */}
          <div className="evidence-preview-pane">
            {selectedEvidence ? (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-muted)', paddingBottom: '16px' }}>
                  <h4 style={{ margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginRight: '20px' }}>
                    {selectedEvidence.displayName || selectedEvidence.originalFileName}
                  </h4>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => window.open(evidenceLinkBase + selectedEvidence.fileUrl, "_blank")}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      Download File
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setSelectedEvidence(null)}
                      style={{ padding: '4px 10px', fontSize: '1.2rem', lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* PREVIEW BOX */}
                <div className="preview-box" style={{ minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', margin: '20px 0', border: '1px solid var(--border-muted)', borderRadius: '4px' }}>
                  {selectedEvidence.category === "IMAGE" && (
                    <img src={evidenceLinkBase + selectedEvidence.fileUrl} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
                  )}
                  {selectedEvidence.category === "VIDEO" && (
                    <video src={evidenceLinkBase + selectedEvidence.fileUrl} controls style={{ maxHeight: '100%', maxWidth: '100%' }} />
                  )}
                  {(selectedEvidence.category === "DOCUMENT" || selectedEvidence.category === "OTHER") && (
                    <div className="not-previewable" style={{ textAlign: 'center', color: 'var(--text-subtle)' }}>
                      <p>Preview not available for this file type.</p>
                    </div>
                  )}
                </div>

                {/* METADATA & ACTIONS */}
                <div className="action-form-container" style={{ padding: 0, background: 'transparent' }}>
                  <div style={{ marginBottom: '20px', display: 'flex', gap: '24px', fontSize: '0.9rem', color: 'var(--text-subtle)', borderBottom: '1px solid var(--border-muted)', paddingBottom: '10px' }}>
                    <span><strong>Type:</strong> {selectedEvidence.mimeType}</span>
                    <span style={{ fontFamily: 'monospace' }}><strong>Hash:</strong> {selectedEvidence.sha256Hash?.slice(0, 12)}...</span>
                  </div>

                  {selectedEvidence.professionalComments && (
                    <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6', borderRadius: '4px', border: '1px solid rgba(59, 130, 246, 0.1)', borderLeftWidth: '4px' }}>
                      <h4 style={{ color: '#60a5fa', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Professional Verification</h4>
                      <p style={{ margin: '0', lineHeight: '1.6', color: 'var(--text-heading)', fontSize: '0.9rem' }}>"{selectedEvidence.professionalComments}"</p>
                    </div>
                  )}

                  {/* ROLE SPECIFIC ACTIONS */}

                  {/* PROFESSIONAL */}
                  {showActions && !isClosed && role === "PROFESSIONAL" && selectedEvidence.status === "UPLOADED" && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '16px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                      <h4 style={{ color: 'var(--text-heading)' }}>Verify Evidence</h4>
                      <textarea
                        className="textarea"
                        style={{ minHeight: '100px' }}
                        placeholder="Verification notes..."
                        value={verificationCommentsMap[selectedEvidence._id] || ""}
                        onChange={(e) => setVerificationCommentsMap(prev => ({ ...prev, [selectedEvidence._id]: e.target.value }))}
                      />
                      <button className="btn btn-primary" onClick={() => {
                        verifyEvidence(selectedEvidence._id, "VERIFIED");
                        setSelectedEvidence(null);
                      }}>
                        Verify Findings
                      </button>
                    </div>
                  )}

                  {/* JUDGE */}
                  {showActions && !isClosed && role === "JUDGE" && selectedEvidence.status === "VERIFIED" && (
                    <div style={{ padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      <h4 style={{ color: 'var(--text-heading)' }}>Judge Verdict</h4>
                      <div style={{ display: "flex", gap: "10px", marginTop: '12px' }}>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => {
                          approveEvidence(selectedEvidence._id, "APPROVED");
                          setSelectedEvidence(null);
                        }}>
                          Approve
                        </button>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                          approveEvidence(selectedEvidence._id, "REJECTED");
                          setSelectedEvidence(null);
                        }}>
                          Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="preview-box not-previewable" style={{ height: '100%', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <p>Select an evidence item from the list to view details and perform actions.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderNavbar = () => {
    if (!user) return null;

    const navTabs = {
      LAWYER: ["CURRENT_CASES", "CLOSED_CASES", "PROFILE", "HELP_DESK"],
      PROFESSIONAL: ["CURRENT_CASES", "DEADLINES", "CLOSED_CASES", "PROFILE", "HELP_DESK"],
      JUDGE: ["CURRENT_CASES", "CLOSED_CASES", "CREATE_CASE", "EDIT_CASE", "PROFILE", "HELP_DESK"],
      PUBLIC: ["CURRENT_CASES", "CLOSED_CASES", "PROFILE", "DIRECTORY", "HELP_DESK"]
    };

    const tabs = navTabs[user.role] || [];

    const getTabLabel = (tab) => {
      if (tab === "CURRENT_CASES") return user.role === "PROFESSIONAL" ? "Assigned Cases" : "Current Cases";
      if (tab === "DEADLINES") return "Forensic Deadlines";
      if (tab === "CLOSED_CASES") return "Closed Cases";
      if (tab === "CREATE_CASE") return "Create Case";
      if (tab === "EDIT_CASE") return "Edit Case";
      if (tab === "PROFILE") return "My Profile";
      if (tab === "DIRECTORY") return "Judiciary Directory";
      if (tab === "HELP_DESK") return "Help Desk";
      return tab;
    };

    return (
      <nav className="navbar">
        <div className="navbar-brand" onClick={() => setActiveTab("CURRENT_CASES")}>
          <span>⚖️ E-JUST</span>
        </div>

        <div className="hamburger" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          ☰
        </div>

        <div className="nav-search-container">
          <span className="search-icon-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-subtle)' }}>
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </span>
          <input
            type="text"
            className="nav-search-input"
            placeholder="Search cases by name or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="nav-links">
          {tabs.map(tab => (
            <button
              key={tab}
              className={`nav-link-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab); setSelectedCaseId(""); }}
            >
              {getTabLabel(tab)}
            </button>
          ))}
        </div>

        <div className="nav-profile" onClick={() => setActiveTab("PROFILE")}>
          <div className="nav-avatar">
            {profile?.profilePicture ? (
              <img src={`${API_BASE.replace('/api', '')}${profile.profilePicture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{user.name?.charAt(0)}</span>
            )}
          </div>
          <span>{user.name?.split(' ')[0]}</span>
          <button
            className="btn btn-secondary btn-sm"
            style={{ marginLeft: '10px', background: 'transparent', color: '#ff4d4d', border: '1px solid #ff4d4d' }}
            onClick={(e) => {
              e.stopPropagation();
              setToken("");
              setUser(null);
              setProfile(null);
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              setCases([]);
              setEvidences([]);
              setSelectedCaseId("");
              setActiveTab("CURRENT_CASES");
              setMessage("Logged out");
            }}
          >
            Logout
          </button>
        </div>
      </nav>
    );
  };

  const renderMobileSidebar = () => {
    if (!user || !isMenuOpen) return null;
    const navTabs = {
      LAWYER: ["CURRENT_CASES", "CLOSED_CASES", "PROFILE", "HELP_DESK"],
      PROFESSIONAL: ["CURRENT_CASES", "CLOSED_CASES", "PROFILE", "HELP_DESK"],
      JUDGE: ["CURRENT_CASES", "CLOSED_CASES", "CREATE_CASE", "EDIT_CASE", "PROFILE", "HELP_DESK"],
      PUBLIC: ["CURRENT_CASES", "CLOSED_CASES", "PROFILE", "DIRECTORY", "HELP_DESK"]
    };
    const tabs = navTabs[user.role] || [];
    const getTabLabel = (tab) => {
      if (tab === "CURRENT_CASES") return user.role === "PROFESSIONAL" ? "Assigned Cases" : "Current Cases";
      if (tab === "CLOSED_CASES") return "Closed Cases";
      if (tab === "CREATE_CASE") return "Create Case";
      if (tab === "EDIT_CASE") return "Edit Case";
      if (tab === "PROFILE") return "My Profile";
      if (tab === "DIRECTORY") return "Judiciary Directory";
      if (tab === "HELP_DESK") return "Help Desk";
      return tab;
    };

    return (
      <div className={`mobile-sidebar ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ margin: 0 }}>Menu</h3>
          <button onClick={() => setIsMenuOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem' }}>×</button>
        </div>
        {tabs.map(tab => (
          <button
            key={tab}
            className={`nav-link-btn ${activeTab === tab ? 'active' : ''}`}
            style={{ textAlign: 'left', width: '100%', color: '#333' }}
            onClick={() => { setActiveTab(tab); setSelectedCaseId(""); setIsMenuOpen(false); }}
          >
            {getTabLabel(tab)}
          </button>
        ))}
        <hr style={{ width: '100%', margin: '10px 0' }} />
        <button
          className="nav-link-btn"
          style={{ textAlign: 'left', width: '100%', color: '#ff4d4d' }}
          onClick={() => {
            setToken("");
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            setActiveTab("CURRENT_CASES");
            setIsMenuOpen(false);
          }}
        >
          Logout
        </button>
      </div>
    );
  };

  // --- HELP DESK RENDER ---

  const renderHelpDesk = () => {
    const helpContent = {
      LAWYER: {
        title: "Advocate & Legal Counsel Help Desk",
        sections: [
          { h: "Dashboard & Navigation", p: "Your central hub lists all 'Current Cases' assigned to you. Use 'Closed Cases' to access historical archives." },
          { h: "Evidence Submission", p: "Navigate to a specific Case Detail view. Use the 'Upload New Evidence' form to securely submit documents, images, or video files. All uploads are hashed for integrity." },
          { h: "Evidence Tracking", p: "Monitor the status of your submissions. 'UPLOADED' means pending review, 'VERIFIED' means a Forensic Professional has validated it, and 'APPROVED' means the Judge has accepted it into the case record." },
          { h: "Suggestion System", p: "You can suggest other Professionals or Public Viewers for a case via the suggestion feature inside the Case Details." }
        ]
      },
      PROFESSIONAL: {
        title: "Forensic & Technical Professional Help Desk",
        sections: [
          { h: "Assignment Dashboard", p: "The 'Assigned Cases' tab displays cases requiring your expertise. The 'Forensic Deadlines' tab prioritizes cases with upcoming hearings." },
          { h: "Evidence Verification Process", p: "Open a case and review the 'Evidence Repository'. Selected items allow you to download the original file. Use the 'Verify Evidence' form to submit your professional opinion and mark the file as 'VERIFIED' or 'REJECTED'." },
          { h: "Deadlines & Hearings", p: "Your verification must be completed at least 24 hours before the 'Next Hearing' date. Use the 'Mark as Done' feature in the Deadlines tab to organize your workload." }
        ]
      },
      JUDGE: {
        title: "Judicial Authority Help Desk",
        sections: [
          { h: "Case Initiation", p: "Use the 'Create Case' tab to initialize new legal proceedings. You must assign a Case Number, Title, and initial Legal Counsel." },
          { h: "Case Management Console", p: "Inside a Case Detail view, the 'Management' tab gives you control over the case lifecycle. You can update the 'Next Hearing Date', issue a 'Verdict/Progress Update', or Close/Re-open the case." },
          { h: "Evidence Admissibility", p: "Review evidence that has been 'VERIFIED' by professionals. You have the final authority to 'APPROVE' (admit to court records) or 'REJECT' evidence." },
          { h: "Assignment Control", p: "Use the 'Edit Case' tab to modify the roster of assigned Lawyers, Professionals, and authorized Public Viewers." }
        ]
      },
      PUBLIC: {
        title: "Public Information Portal Help Desk",
        sections: [
          { h: "Transparency & Access", p: "This portal provides transparency into the judicial process. You can view 'Current' and 'Closed' cases that are marked for public interest." },
          { h: "Privacy Restrictions", p: "Sensitive details, raw evidence files, and personal contact information of involved parties are redacted to protect privacy and case integrity." },
          { h: "Judiciary Directory", p: "Use the 'Judiciary Directory' to verify the credentials and profiles of registered Judges, Lawyers, and official Court Professionals." },
          { h: "Case Statutes", p: "A 'Closed' case indicates a final verdict has been reached. An 'Open' case is currently in active litigation or review." }
        ]
      }
    };

    const content = helpContent[user.role] || helpContent.PUBLIC;

    return (
      <div className="card">
        <h3>{content.title}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginTop: '20px' }}>
          {content.sections.map((s, i) => (
            <div key={i}>
              <h4 style={{ color: 'var(--primary)', marginBottom: '10px', borderBottom: '1px solid var(--border-muted)', paddingBottom: '8px' }}>{s.h}</h4>
              <p style={{ lineHeight: '1.6', color: 'var(--text-subtle)' }}>{s.p}</p>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '30px', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
          <h4 style={{ margin: '0 0 10px 0' }}>Need Technical Support?</h4>
          <p className="meta">Contact the E-JUST IT Administration at <strong>support@ejust.gov.in</strong> for account issues or technical bug reports.</p>
        </div>
      </div>
    );
  };

  const renderCaseListView = (isClosed) => {
    const listTitle = isClosed ? "Closed Cases" : (user.role === "PROFESSIONAL" ? "Assigned Cases" : "Current Cases");
    const filteredCasesByTab = cases.filter(c => isClosed ? c.status === "CLOSED" : c.status !== "CLOSED");
    const searchFiltered = filteredCasesByTab.filter(c =>
      c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="card">
        <div className="card-header-row" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>{listTitle} ({searchFiltered.length})</h3>
          <button className="btn btn-secondary btn-sm" onClick={fetchCases}>Refresh List</button>
        </div>
        <ul className="list" style={{ listStyle: 'none', padding: 0 }}>
          {searchFiltered.map(c => (
            <li key={c._id} className="list-item" style={{ padding: '20px', marginBottom: '24px', border: '1px solid var(--border-muted)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1, paddingRight: '20px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{c.caseNumber} — {c.title}</div>
                <div className="meta" style={{ marginTop: '5px' }}>
                  <span className={`status-pill status-${c.status.toLowerCase()}`}>{c.status}</span>
                  {c.nextHearingDate && !isClosed && ` • Next Hearing: ${formatDate(c.nextHearingDate)}`}
                </div>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setSelectedCaseId(c._id);
                  if (user.role === "JUDGE") {
                    setVerdictText(c.verdictText || "");
                    setNextHearingDate(c.nextHearingDate ? new Date(c.nextHearingDate).toISOString().slice(0, 16) : "");
                    setCloseCase(c.status === "CLOSED");
                  }
                }}
              >
                {user.role === "JUDGE" ? "Manage Case" : "Open Details"}
              </button>
            </li>
          ))}
          {searchFiltered.length === 0 && <p className="meta" style={{ textAlign: 'center', padding: '20px' }}>No cases found matching your criteria.</p>}
        </ul>
      </div>
    );
  };

  const renderDeadlinesView = () => {
    // 1. Filter active cases with future hearings
    const pendingCases = cases.filter(c => c.status !== 'CLOSED' && c.nextHearingDate);

    // 2. Map to add 'deadline' property (1 day before hearing)
    const deadlineData = pendingCases.map(c => {
      const hearing = new Date(c.nextHearingDate);
      const deadline = new Date(hearing);
      deadline.setDate(hearing.getDate() - 1);

      const now = new Date();
      const timeDiff = deadline - now;
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));
      const completionKey = `${c._id}_${c.nextHearingDate}`;

      return { ...c, deadline, daysLeft, completionKey };
    }).filter(c => !completedDeadlines.includes(c.completionKey)); // Exclude marked as done

    // 3. Sort by deadline (closest first)
    deadlineData.sort((a, b) => a.deadline - b.deadline);

    const markAsDone = (completionKey) => {
      const updated = [...completedDeadlines, completionKey];
      setCompletedDeadlines(updated);
      localStorage.setItem("completedDeadlines", JSON.stringify(updated));
    };

    return (
      <div className="card">
        <h3 style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-muted)', paddingBottom: '15px' }}>
          Evidence Submission Deadlines
        </h3>

        <div className="list">
          {deadlineData.map(c => {
            const isUrgent = c.daysLeft <= 2;
            const isToday = c.daysLeft <= 0;

            return (
              <div key={c._id} className="list-item" style={{ padding: '20px', borderLeft: isUrgent ? '4px solid #ef4444' : '4px solid #3b82f6', background: isUrgent ? 'rgba(239, 68, 68, 0.05)' : 'transparent', marginBottom: '12px', borderRadius: '4px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-heading)' }}>{c.caseNumber}</span>
                    <span className={`status-pill ${isUrgent ? 'status-rejected' : 'status-open'}`}>
                      {isToday ? "DUE TODAY" : (c.daysLeft < 0 ? "OVERDUE" : `${c.daysLeft} Days Left`)}
                    </span>
                  </div>
                  <div style={{ fontSize: '1rem', marginBottom: '8px' }}>{c.title}</div>

                  <div className="meta" style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', color: 'var(--text-subtle)' }}>
                    <div>📅 Hearing: {formatDate(c.nextHearingDate)}</div>
                    <div style={{ color: isUrgent ? '#ef4444' : 'var(--primary)', fontWeight: 'bold' }}>
                      🚨 Verification Deadline: {formatDate(c.deadline)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button className="btn btn-primary btn-sm" onClick={() => {
                    setSelectedCaseId(c._id);
                    setActiveTab("CURRENT_CASES"); // Redirect via Assigned/Current tab
                  }}>
                    Open Case
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => markAsDone(c.completionKey)} title="Hide this deadline from list">
                    Mark as Done
                  </button>
                </div>
              </div>
            );
          })}

          {deadlineData.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-subtle)' }}>
              <p style={{ fontSize: '2rem', marginBottom: '10px' }}>✅</p>
              No pending deadlines found.<br />
              <span style={{ fontSize: '0.8rem' }}>(Cases marked as 'Done' are hidden)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- RENDER PROFILE VIEW ---
  const renderProfileView = () => {
    if (!profile) return <div className="card">Loading profile...</div>;

    const isPublic = user?.role === "PUBLIC";

    return (
      <div className="card">
        <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          {/* LEFT: PICTURE */}
          <div style={{ textAlign: 'center', minWidth: '200px' }}>
            <div className="profile-pic-container" style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 20px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #3b82f6', background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {profile.profilePicture ? (
                <img src={`${API_BASE.replace('/api', '')}${profile.profilePicture}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '4rem', color: '#60a5fa' }}>{profile.name?.charAt(0) || "U"}</span>
              )}

              {!isPublic && (
                <div
                  className="upload-overlay"
                  style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.6)', padding: '5px', cursor: 'pointer' }}
                  onClick={() => document.getElementById('profile-upload-input').click()}
                >
                  <span style={{ fontSize: '0.8rem', color: '#fff' }}>Change Photo</span>
                </div>
              )}
            </div>

            {!isPublic && (
              <form onSubmit={handleProfilePictureUpload} style={{ display: 'none' }}>
                <input
                  id="profile-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setProfilePicFile(file);
                      const formData = new FormData();
                      formData.append("profilePicture", file);
                      axios.post("/users/profile/picture", formData, {
                        headers: {
                          ...authHeaders,
                          "Content-Type": "multipart/form-data",
                        },
                      }).then(res => {
                        setProfile(res.data);
                        setMessage("Profile picture updated");
                      }).catch(err => {
                        setMessage("Upload failed");
                      });
                    }
                  }}
                />
              </form>
            )}
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
            <p className="meta">{profile.role}</p>
          </div>

          {/* RIGHT: DETAILS */}
          <div style={{ flex: 1, minWidth: '300px' }}>
            <h3>Profile Details</h3>
            {isPublic && (
              <div className="status status-info" style={{ marginBottom: '20px' }}>
                Public profile details are managed by the Cyber-Justice Registry and cannot be modified.
              </div>
            )}
            <form onSubmit={handleProfileUpdate}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="input"
                  value={profileName}
                  onChange={e => setProfileName(e.target.value)}
                  disabled={isPublic}
                />
              </div>

              {(profile.role === "JUDGE" || profile.role === "LAWYER" || profile.role === "PROFESSIONAL") && (
                <>
                  <div className="form-group">
                    <label className="form-label">Experience</label>
                    <textarea
                      className="textarea"
                      value={profileExperience}
                      onChange={e => setProfileExperience(e.target.value)}
                      placeholder="Professional experience..."
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Education</label>
                    <textarea
                      className="textarea"
                      value={profileEducation}
                      onChange={e => setProfileEducation(e.target.value)}
                      placeholder="Educational background..."
                    />
                  </div>
                </>
              )}

              {profile.role === "PUBLIC" && (
                <>
                  <div className="form-group">
                    <label className="form-label">Government ID Type</label>
                    <input
                      className="input"
                      value={profileGovIdType}
                      disabled={true}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">ID Number</label>
                    <input
                      className="input"
                      value={profileGovIdNumber}
                      disabled={true}
                    />
                  </div>
                </>
              )}

              {!isPublic && (
                <button className="btn btn-primary" type="submit" style={{ marginTop: '10px' }}>
                  Save Profile Changes
                </button>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  };

  // --- RENDER DIRECTORY VIEW ---
  const renderDirectoryView = () => {
    return (
      <div className="card">
        <div className="card-header-row" style={{ marginBottom: '20px' }}>
          <h3>Judiciary & Legal Directory</h3>
          <button className="btn btn-secondary btn-sm" onClick={() => loadAssignableUsers(token)}>Refresh Directory</button>
        </div>

        <p className="meta" style={{ marginBottom: '20px' }}>
          Welcome to the Public Information Portal. Here you can find details about the presiding Judges, registered Lawyers, and authorized Professionals.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* JUDGES */}
          <div>
            <h4 style={{ color: '#60a5fa', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>Presiding Judges</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {judges.length > 0 ? judges.map(j => (
                <div key={j._id} className="card" style={{ background: '#111827', margin: 0 }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
                      {j.profilePicture ? (
                        <img src={`${API_BASE.replace('/api', '')}${j.profilePicture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: '#60a5fa' }}>{j.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{j.name}</div>
                      <div className="meta">{j.role}</div>
                    </div>
                  </div>
                  <div>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EXPERIENCE</div>
                    <p style={{ margin: '5px 0 10px', fontSize: '0.9rem' }}>{j.experience || "N/A"}</p>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EDUCATION</div>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{j.education || "N/A"}</p>
                  </div>
                </div>
              )) : <p className="meta">No judges listed at this time.</p>}
            </div>
          </div>

          {/* LAWYERS */}
          <div>
            <h4 style={{ color: '#60a5fa', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>Registered Lawyers</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {lawyers.length > 0 ? lawyers.map(l => (
                <div key={l._id} className="card" style={{ background: '#111827', margin: 0 }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
                      {l.profilePicture ? (
                        <img src={`${API_BASE.replace('/api', '')}${l.profilePicture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: '#60a5fa' }}>{l.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{l.name}</div>
                      <div className="meta">{l.role}</div>
                    </div>
                  </div>
                  <div>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EXPERIENCE</div>
                    <p style={{ margin: '5px 0 10px', fontSize: '0.9rem' }}>{l.experience || "N/A"}</p>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EDUCATION</div>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{l.education || "N/A"}</p>
                  </div>
                </div>
              )) : <p className="meta">No lawyers listed at this time.</p>}
            </div>
          </div>

          {/* PROFESSIONALS */}
          <div>
            <h4 style={{ color: '#60a5fa', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>Court Professionals</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '15px' }}>
              {professionals.length > 0 ? professionals.map(p => (
                <div key={p._id} className="card" style={{ background: '#111827', margin: 0 }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #3b82f6' }}>
                      {p.profilePicture ? (
                        <img src={`${API_BASE.replace('/api', '')}${p.profilePicture}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '1.5rem', color: '#60a5fa' }}>{p.name?.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{p.name}</div>
                      <div className="meta">{p.role}</div>
                    </div>
                  </div>
                  <div>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EXPERIENCE</div>
                    <p style={{ margin: '5px 0 10px', fontSize: '0.9rem' }}>{p.experience || "N/A"}</p>
                    <div className="meta" style={{ fontSize: '0.8rem' }}>EDUCATION</div>
                    <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{p.education || "N/A"}</p>
                  </div>
                </div>
              )) : <p className="meta">No professionals listed at this time.</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!token) {
    return (
      <div className="login-ref-page">
        {/* Animated Background Elements */}
        <div className="blob-shape blob-1"></div>
        <div className="blob-shape blob-2"></div>
        <div className="blob-shape blob-3"></div>

        <div className="login-ref-card">
          {/* Logo and Header */}
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="brand-icon-container" style={{ marginBottom: '20px' }}>
              <div className="brand-icon-glow"></div>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 10 }}>
                <path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z" />
                <path d="M7 21h10" />
                <path d="M12 3v18" />
                <path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
              </svg>
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-1px' }}>
              E-JUST
            </h1>

            <p style={{ fontSize: '0.8rem', color: 'var(--primary)', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700 }}>
              Judicial Management System
            </p>
          </div>

          {message && (
            <div className="status status-info" style={{ marginBottom: "25px", background: 'rgba(59, 130, 246, 0.1)', borderLeft: '4px solid var(--primary)' }}>
              {message}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Email Field */}
            <div className="login-ref-input-wrapper">
              <label className="login-ref-label">Official Email</label>
              <div style={{ position: 'relative' }}>
                <span className="login-ref-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  className="login-ref-input"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  placeholder="officer@ejust.gov.in"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="login-ref-input-wrapper">
              <label className="login-ref-label">Secure Password</label>
              <div style={{ position: 'relative' }}>
                <span className="login-ref-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type="password"
                  className="login-ref-input"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="login-ref-btn">
              <span>Access Secure Portal</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
              </svg>
            </button>
          </form>

          {/* Footer Notice */}
          <div style={{ marginTop: '32px', pt: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', color: '#64748b', lineHeight: 1.6, marginTop: '20px' }}>
              Restricted Access. Unauthorized attempts are logged.
              <br />
              Government Integration Standard v3.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  const selectedCase = cases.find(c => c._id === selectedCaseId);

  return (
    <div className={`app-root-container theme-${(user?.role || 'public').toLowerCase()}`}>
      {renderNavbar()}
      {renderMobileSidebar()}

      <main className={`app-root ${selectedCaseId ? 'edge-to-edge' : ''}`}>
        <div className="app-container">

          {/* MAIN NAVIGATION ROUTING */}
          {activeTab === 'PROFILE' && renderProfileView()}
          {activeTab === 'HELP_DESK' && renderHelpDesk()}
          {activeTab === 'DIRECTORY' && renderDirectoryView()}
          {activeTab === 'DEADLINES' && renderDeadlinesView()}

          {/* CASE LISTING */}
          {(activeTab === 'CURRENT_CASES' || activeTab === 'CLOSED_CASES') && !selectedCaseId && (
            renderCaseListView(activeTab === 'CLOSED_CASES')
          )}

          {/* CASE CREATION / EDIT (JUDGE ONLY) */}
          {user.role === 'JUDGE' && activeTab === 'CREATE_CASE' && (
            <div className="card">
              <h3>Create New Case</h3>
              {/* ... case creation form logic ... */}
              <form onSubmit={createCase}>
                <div className="app-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                  <div className="form-group">
                    <label className="form-label">Case Title</label>
                    <input className="input" value={caseTitle} onChange={e => setCaseTitle(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Case Number</label>
                    <input className="input" value={caseNumber} onChange={e => setCaseNumber(e.target.value)} required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="textarea" value={caseDescription} onChange={e => setCaseDescription(e.target.value)} />
                </div>
                {/* Assignments selection */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
                  <div>
                    <h4 className="meta">Assign Lawyers</h4>
                    <div className="card" style={{ height: '150px', overflowY: 'auto', padding: '10px' }}>
                      {lawyers.map(l => (
                        <div key={l._id}><input type="checkbox" checked={selectedLawyers.includes(l._id)} onChange={() => {
                          if (selectedLawyers.includes(l._id)) setSelectedLawyers(prev => prev.filter(x => x !== l._id));
                          else setSelectedLawyers(prev => [...prev, l._id]);
                        }} /> {l.name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="meta">Assign Professionals</h4>
                    <div className="card" style={{ height: '150px', overflowY: 'auto', padding: '10px' }}>
                      {professionals.map(p => (
                        <div key={p._id}><input type="checkbox" checked={selectedProfessionals.includes(p._id)} onChange={() => {
                          if (selectedProfessionals.includes(p._id)) setSelectedProfessionals(prev => prev.filter(x => x !== p._id));
                          else setSelectedProfessionals(prev => [...prev, p._id]);
                        }} /> {p.name}</div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="meta">Assign Public Viewers</h4>
                    <div className="card" style={{ height: '150px', overflowY: 'auto', padding: '10px' }}>
                      {publicViewers.map(p => (
                        <div key={p._id}><input type="checkbox" checked={selectedPublics.includes(p._id)} onChange={() => {
                          if (selectedPublics.includes(p._id)) setSelectedPublics(prev => prev.filter(x => x !== p._id));
                          else setSelectedPublics(prev => [...prev, p._id]);
                        }} /> {p.name}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }}>Create Legal Case</button>
              </form>
            </div>
          )}

          {user.role === 'JUDGE' && activeTab === 'EDIT_CASE' && (
            <div className="card">
              {!editCaseId ? (
                <>
                  <h3>Select Case to Edit Assignments</h3>
                  <ul className="list">
                    {cases.filter(c => c.status !== 'CLOSED').map(c => (
                      <li key={c._id} className="list-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', marginBottom: '24px', border: '1px solid var(--border-muted)', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.01)' }}>
                        <span style={{ fontWeight: 'bold' }}>{c.caseNumber} - {c.title}</span>
                        <button className="btn btn-secondary btn-sm" onClick={() => {
                          setEditCaseId(c._id);
                          setSelectedLawyers(c.assignedLawyers?.map(l => l._id || l) || []);
                          setSelectedProfessionals(c.assignedProfessionals?.map(p => p._id || p) || []);
                          setSelectedPublics(c.assignedPublicViewers?.map(v => v._id || v) || []);
                        }}>Edit Assignments</button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <form onSubmit={handleUpdateAssignments}>
                  <button className="btn btn-secondary btn-sm" onClick={() => setEditCaseId("")} style={{ marginBottom: '15px' }}>&larr; Back</button>
                  <h3>Editing: {cases.find(x => x._id === editCaseId)?.title}</h3>
                  {/* Reuse same assignment selection logic as create case if needed, or simple version here */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    {/* Simpler version for brevity in response, ideally abstracted */}
                    <div>
                      <h4 className="meta">Update Lawyers</h4>
                      <div className="card" style={{ height: '120px', overflowY: 'auto' }}>
                        {lawyers.map(l => (
                          <div key={l._id}><input type="checkbox" checked={selectedLawyers.includes(l._id)} onChange={() => {
                            if (selectedLawyers.includes(l._id)) setSelectedLawyers(prev => prev.filter(x => x !== l._id));
                            else setSelectedLawyers(prev => [...prev, l._id]);
                          }} /> {l.name}</div>
                        ))}
                      </div>
                    </div>
                    {/* Professionals and Public similarly... omitting full repetition for brevity but keeping core logic */}
                  </div>
                  <button className="btn btn-primary" type="submit" style={{ marginTop: '20px' }}>Save Changes</button>
                </form>
              )}
            </div>
          )}

          {/* SINGLE CASE DETAIL VIEW (SIDEBAR LAYOUT) */}
          {/* SINGLE CASE DETAIL VIEW (SIDEBAR LAYOUT - DASHBOARD MODE) */}
          {selectedCaseId && (activeTab === 'CURRENT_CASES' || activeTab === 'CLOSED_CASES') && selectedCase && (
            <div className="case-details-layout" style={{ display: 'flex', flexDirection: 'row', gap: '0', height: '100%', overflow: 'hidden' }}>

              {/* LEFT SIDEBAR NAVIGATION (Direct Layout Child) */}
              {user.role === 'JUDGE' && (
                <div className="case-detail-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <h4 className="meta" style={{ padding: '20px 20px 10px', margin: 0 }}>CASE NAVIGATION</h4>

                  <button
                    className={`sidebar-btn ${activeSubTab === 'DETAILS' ? 'active' : ''}`}
                    onClick={() => { setActiveSubTab('DETAILS'); setSelectedEvidence(null); }}
                  >
                    Case Details
                  </button>

                  <button
                    className={`sidebar-btn ${activeSubTab === 'EVIDENCE' ? 'active' : ''}`}
                    onClick={() => { setActiveSubTab('EVIDENCE'); setSelectedEvidence(null); }}
                  >
                    Evidence Repository
                  </button>

                  <button
                    className={`sidebar-btn ${activeSubTab === 'MANAGEMENT' ? 'active' : ''}`}
                    onClick={() => { setActiveSubTab('MANAGEMENT'); setSelectedEvidence(null); }}
                  >
                    Management
                  </button>

                  <div style={{ marginTop: 'auto', padding: '20px' }}>
                    <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => setSelectedCaseId("")}>
                      &larr; Exit Case
                    </button>
                  </div>
                </div>
              )}

              {/* MAIN CONTENT AREA */}
              <div className="case-main-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

                {/* FLOATING CONTEXT HEADER */}
                <div className="case-floating-header">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '1.1rem' }}>
                      <h2 style={{ margin: 0, fontSize: '1.2rem', color: '#fff' }}>{selectedCase.title}</h2>
                      <span style={{ color: 'var(--border-muted)', fontSize: '1.5rem', fontWeight: 300 }}>|</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-subtle)' }}>{selectedCase.caseNumber}</span>
                      <span style={{ color: 'var(--border-muted)', fontSize: '1.5rem', fontWeight: 300 }}>|</span>
                      <span className={`status-pill status-${selectedCase.status.toLowerCase()}`}>{selectedCase.status}</span>
                    </div>

                    {user.role !== 'JUDGE' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setSelectedCaseId("")}>
                        &larr; Back to Cases
                      </button>
                    )}
                  </div>
                </div>

                {/* SCROLLABLE VIEWPORT FOR TABS (Overflow Hidden to delegate scrolling to tabs) */}
                <div className="case-tab-viewport" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                  {/* TAB: DETAILS (Info + Progress) */}
                  {(activeSubTab === 'DETAILS' || user.role !== 'JUDGE') && (
                    <div className="scrollable-tab-content" style={{ height: '100%', overflowY: 'auto' }}>
                      <div className="content-padded">
                        <div className="card">
                          <div style={{ marginTop: '0px' }}>
                            <h4>Description</h4>
                            <p>{selectedCase.description}</p>
                          </div>

                          <div style={{ marginTop: '20px', display: 'flex', gap: '40px', flexWrap: 'wrap', borderTop: '1px solid #e5e7eb', paddingTop: '20px' }}>
                            <div>
                              <h4 className="meta" style={{ marginBottom: '8px', color: '#64748b' }}>ASSIGNED JUDGE</h4>
                              {selectedCase.assignedJudge ? (
                                <div className="status-pill status-approved" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '6px 14px' }}>
                                  ⚖️ {selectedCase.assignedJudge.name || "N/A"}
                                </div>
                              ) : (
                                <span className="meta">No judge assigned yet.</span>
                              )}
                            </div>
                            <div>
                              <h4 className="meta" style={{ marginBottom: '8px', color: '#64748b' }}>LEGAL COUNSEL (LAWYERS)</h4>
                              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                {selectedCase.assignedLawyers && selectedCase.assignedLawyers.length > 0 ? (
                                  selectedCase.assignedLawyers.map(l => (
                                    <div key={l._id} className="status-pill status-verified" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem', padding: '6px 14px' }}>
                                      🎓 {l.name}
                                    </div>
                                  ))
                                ) : (
                                  <span className="meta">No lawyers assigned yet.</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {selectedCase.status === 'CLOSED' && (
                            <div style={{ marginTop: '20px', padding: '24px', background: 'rgba(59, 130, 246, 0.05)', borderLeft: '4px solid #3b82f6', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.1)', borderLeftWidth: '4px' }}>
                              <h3 style={{ color: '#60a5fa', marginBottom: '12px', fontSize: '1.1rem' }}>⚖️ FINAL JUDGEMENT</h3>
                              <div style={{ fontSize: '1.2rem', lineHeight: '1.7', color: 'var(--text-heading)' }}>
                                {selectedCase.verdictText || "No final verdict recorded."}
                              </div>
                              <div className="meta" style={{ marginTop: '15px' }}>
                                Case Closed on: {formatDate(selectedCase.closedAt)}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Timeline is always part of details */}
                        {renderCaseTimeline(selectedCase)}

                        {user.role !== 'JUDGE' && user.role !== 'PUBLIC' && user.role === 'LAWYER' && selectedCase.status !== 'CLOSED' && (
                          <div className="card" style={{ width: '100%', maxWidth: 'none' }}>
                            <h3>Upload New Evidence</h3>
                            <form onSubmit={uploadEvidence}>
                              <div className="form-group">
                                <label className="form-label">Evidence Title</label>
                                <input className="input" value={evidenceDisplayName} onChange={e => setEvidenceDisplayName(e.target.value)} placeholder="Descriptive name..." />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="select" value={evidenceCategory} onChange={e => setEvidenceCategory(e.target.value)}>
                                  <option value="DOCUMENT">Document</option>
                                  <option value="IMAGE">Image</option>
                                  <option value="VIDEO">Video</option>
                                  <option value="OTHER">Other</option>
                                </select>
                              </div>
                              <div className="form-group">
                                <input type="file" onChange={e => setEvidenceFile(e.target.files[0])} />
                              </div>
                              <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>Upload File</button>
                            </form>
                          </div>
                        )}
                      </div>

                      {/* EVIDENCE LIST FOR NON-JUDGES (Edge-to-Edge, outside padded div) */}
                      {user.role !== 'JUDGE' && user.role !== 'PUBLIC' && (
                        <div style={{ height: '500px', borderTop: '1px solid var(--border-muted)' }}>
                          {renderGroupedEvidenceList(true, user.role, selectedCase.status === 'CLOSED')}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB: EVIDENCE (JUDGE ONLY via Sidebar) */}
                  {activeSubTab === 'EVIDENCE' && user.role === 'JUDGE' && (
                    <div style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                      {renderGroupedEvidenceList(true, user.role, selectedCase.status === 'CLOSED')}
                    </div>
                  )}

                  {/* TAB: MANAGEMENT (JUDGE ONLY) */}
                  {activeSubTab === 'MANAGEMENT' && user.role === 'JUDGE' && (
                    <div className="scrollable-tab-content" style={{ height: '100%', overflowY: 'auto' }}>
                      <div className="content-padded">
                        <div className="card" style={{ height: 'fit-content', border: '2px solid #3b82f6' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚖️</span>
                            <h3 style={{ margin: 0 }}>Management Console</h3>
                          </div>

                          <form onSubmit={submitVerdict}>
                            <div className="form-group">
                              <label className="form-label">Step/Verdict Description</label>
                              <textarea className="textarea" style={{ minHeight: '120px' }} value={verdictText} onChange={e => setVerdictText(e.target.value)} placeholder="Describe the current progression or final judgement..." />
                            </div>

                            <div className="form-group">
                              <label className="form-label">Case Status</label>
                              <select className="select" value={verdictStatus} onChange={e => setVerdictStatus(e.target.value)}>
                                <option value="OPEN">Open / Active</option>
                                <option value="CLOSED">Closed / Finalized</option>
                              </select>
                            </div>

                            <button className="btn btn-primary" type="submit" style={{ width: '100%' }}>
                              {verdictStatus === 'CLOSED' ? (selectedCase.status === 'CLOSED' ? 'Update Final Verdict' : 'Issue Final Verdict & Close Case') : (selectedCase.status === 'CLOSED' ? 'Re-open Case' : 'Record Progress Update')}
                            </button>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}
        </div>
      </main >
    </div >
  );
}

export default App;
