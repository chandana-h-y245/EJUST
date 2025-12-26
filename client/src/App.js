import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaGavel, FaShieldAlt, FaUser, FaLock, FaEnvelope, FaBriefcase, 
  FaEye, FaEyeOff, FaSignOutAlt, FaPlus, FaFolderOpen, FaFileUpload,
  FaCheckCircle, FaTimesCircle, FaClock, FaSearch
} from "react-icons/fa";
import { API_BASE } from "./config";

axios.defaults.baseURL = API_BASE;

const AuthPage = ({ onLoginSuccess, message, setMessage }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [regData, setRegData] = useState({ name: "", email: "", userName: "", password: "", role: "LAWYER" });

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("/auth/login", loginData);
      onLoginSuccess(res.data.user, res.data.token);
    } catch (err) {
      setMessage(err.response?.data?.message || "Login failed");
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post("/auth/register", regData);
      setMessage("Account created! Please login.");
      setIsLogin(true);
    } catch (err) {
      setMessage(err.response?.data?.message || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-100 via-slate-50 to-indigo-100">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl w-full bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col md:row border border-white">
        <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-8 text-blue-400"><FaGavel size={30} /><h1 className="text-2xl font-bold text-white tracking-tight">E-JUST</h1></div>
            <h2 className="text-3xl font-extrabold mb-4 leading-tight">Digital Integrity <br/><span className="text-blue-400">for Modern Law.</span></h2>
            <p className="text-slate-400 text-sm">Blockchain-grade SHA-256 evidence hashing and role-based court management.</p>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-2"><FaShieldAlt className="text-emerald-400" /> Secure Evidence Portal v2.0</div>
        </div>
        <div className="md:w-7/12 p-8 lg:p-12">
          <div className="flex justify-end mb-8"><button onClick={() => setIsLogin(!isLogin)} className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{isLogin ? "Register" : "Login"}</button></div>
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.form key="l" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleLogin} className="space-y-4">
                <h3 className="text-2xl font-bold text-slate-800">Sign In</h3>
                <div className="space-y-4">
                  <input type="email" placeholder="Email" className="w-full p-3 rounded-xl border bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} required />
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} placeholder="Password" className="w-full p-3 rounded-xl border bg-slate-50/50 outline-none focus:ring-2 focus:ring-indigo-500" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} required />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-4 text-slate-400">{showPassword ? <FaEyeOff /> : <FaEye />}</button>
                  </div>
                </div>
                <button className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-slate-800 transition-all">Access Dashboard</button>
              </motion.form>
            ) : (
              <motion.form key="r" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleRegister} className="grid grid-cols-2 gap-3">
                <h3 className="col-span-2 text-2xl font-bold text-slate-800 mb-2">Create Profile</h3>
                <input type="text" placeholder="Full Name" className="p-3 rounded-xl border bg-slate-50/50 outline-none" onChange={(e) => setRegData({...regData, name: e.target.value})} required />
                <input type="text" placeholder="Username" className="p-3 rounded-xl border bg-slate-50/50 outline-none" onChange={(e) => setRegData({...regData, userName: e.target.value})} required />
                <input type="email" placeholder="Email" className="col-span-2 p-3 rounded-xl border bg-slate-50/50 outline-none" onChange={(e) => setRegData({...regData, email: e.target.value})} required />
                <select className="p-3 rounded-xl border bg-slate-50/50 outline-none" onChange={(e) => setRegData({...regData, role: e.target.value})}>
                  <option value="LAWYER">LAWYER</option>
                  <option value="PROFESSIONAL">PROFESSIONAL</option>
                  <option value="JUDGE">JUDGE</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
                <input type="password" placeholder="Password" className="p-3 rounded-xl border bg-slate-50/50 outline-none" onChange={(e) => setRegData({...regData, password: e.target.value})} required />
                <button className="col-span-2 bg-indigo-600 text-white py-4 rounded-xl font-bold mt-2">Complete Registration</button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

function App() {
  const [token, setToken] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [cases, setCases] = useState([]);
  const [evidences, setEvidences] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [professionals, setProfessionals] = useState([]);
  const [publicViewers, setPublicViewers] = useState([]);
  const [judges, setJudges] = useState([]);
  
  const [newCase, setNewCase] = useState({ title: "", caseNumber: "", description: "", assignedProfessionals: [], assignedPublicViewers: [], assignedJudge: "" });
  const [evidenceFile, setEvidenceFile] = useState(null);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const loadAssignableUsers = async (t) => {
    try {
      const res = await axios.get("/users/by-role", { headers: { Authorization: `Bearer ${t}` } });
      setProfessionals(res.data.professionals || []);
      setPublicViewers(res.data.publics || []);
      setJudges(res.data.judges || []);
    } catch (err) { console.error(err); }
  };

  const fetchCases = async () => {
    try {
      const res = await axios.get("/cases", authHeaders);
      setCases(res.data);
    } catch (err) { setMessage("Failed to load cases"); }
  };

  const fetchEvidences = async (caseId) => {
    try {
      const res = await axios.get(`/evidences/by-case/${caseId}`, authHeaders);
      setEvidences(res.data);
      setSelectedCaseId(caseId);
    } catch (err) { setMessage("Failed to load evidence"); }
  };

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/cases", newCase, authHeaders);
      setMessage("Case created successfully");
      fetchCases();
    } catch (err) { setMessage("Creation failed"); }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!evidenceFile || !selectedCaseId) return;
    const formData = new FormData();
    formData.append("file", evidenceFile);
    formData.append("caseId", selectedCaseId);
    try {
      await axios.post("/evidences", formData, authHeaders);
      setMessage("Evidence uploaded and hashed");
      fetchEvidences(selectedCaseId);
    } catch (err) { setMessage("Upload failed"); }
  };

  const updateEvidence = async (id, action, body = {}) => {
    try {
      await axios.patch(`/evidences/${id}/${action}`, body, authHeaders);
      fetchEvidences(selectedCaseId);
      setMessage(`Evidence ${action} successful`);
    } catch (err) { setMessage("Action failed"); }
  };

  if (!user) return <AuthPage onLoginSuccess={(u, t) => { setUser(u); setToken(t); if(u.role === "LAWYER") loadAssignableUsers(t); }} message={message} setMessage={setMessage} />;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-slate-900 text-white px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3"><FaGavel className="text-blue-400 text-2xl" /><span className="font-bold tracking-tighter text-xl">E-JUST</span></div>
        <div className="flex items-center gap-6 text-sm">
          <div className="bg-slate-800 px-4 py-1.5 rounded-full border border-slate-700">
            <span className="text-slate-400 uppercase text-[10px] font-bold mr-2">Role:</span>
            <span className="font-bold text-blue-400">{user.role}</span>
          </div>
          <button onClick={() => { setUser(null); setToken(""); }} className="flex items-center gap-2 hover:text-red-400 transition-colors"><FaSignOutAlt /> Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          {user.role === "LAWYER" && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-indigo-600"><FaPlus /> New Case</h3>
              <form onSubmit={handleCreateCase} className="space-y-3">
                <input placeholder="Title" className="w-full p-2.5 rounded-lg border bg-slate-50 text-sm" onChange={e => setNewCase({...newCase, title: e.target.value})} />
                <input placeholder="Case ID (Unique)" className="w-full p-2.5 rounded-lg border bg-slate-50 text-sm" onChange={e => setNewCase({...newCase, caseNumber: e.target.value})} />
                <textarea placeholder="Description" className="w-full p-2.5 rounded-lg border bg-slate-50 text-sm" onChange={e => setNewCase({...newCase, description: e.target.value})} />
                
                <label className="text-[10px] font-bold text-slate-500 uppercase">Assigned Judge</label>
                <select className="w-full p-2 rounded-lg border bg-white text-sm" onChange={e => setNewCase({...newCase, assignedJudge: e.target.value})}>
                  <option value="">Select Judge</option>
                  {judges.map(j => <option key={j._id} value={j._id}>{j.name}</option>)}
                </select>

                <button className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700">Initialize Case</button>
              </form>
            </section>
          )}

          <section className="bg-white p-6 rounded-2xl shadow-sm border min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg flex items-center gap-2"><FaFolderOpen className="text-amber-500" /> Active Cases</h3>
              <button onClick={fetchCases} className="p-2 hover:bg-slate-100 rounded-lg text-indigo-600"><FaSearch /></button>
            </div>
            <div className="space-y-3">
              {cases.map(c => (
                <div key={c._id} onClick={() => fetchEvidences(c._id)} className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedCaseId === c._id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'hover:bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-indigo-400 tracking-tighter">{c.caseNumber}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${c.status === 'CLOSED' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>{c.status}</span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mt-1">{c.title}</h4>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedCaseId ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5"><FaGavel size={100} /></div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Case Evidence Ledger</h2>
                  <p className="text-slate-500 text-sm mt-1">Reviewing evidence for Case Ref: <span className="text-indigo-600 font-bold">{selectedCaseId.slice(-6).toUpperCase()}</span></p>

                  {user.role === "LAWYER" && (
                    <form onSubmit={handleUpload} className="mt-8 p-4 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex items-center gap-4">
                      <div className="bg-white p-3 rounded-full shadow-sm text-indigo-600"><FaFileUpload size={24}/></div>
                      <input type="file" className="text-xs text-slate-500 flex-1" onChange={e => setEvidenceFile(e.target.files[0])} />
                      <button className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-bold hover:bg-indigo-600 transition-colors">Upload</button>
                    </form>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {evidences.map(ev => (
                    <motion.div key={ev._id} layout className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="bg-slate-100 p-2 rounded-lg text-slate-500 group-hover:text-indigo-600 transition-colors"><FaFolderOpen /></div>
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          ev.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 
                          ev.status === 'REJECTED' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                        }`}>{ev.status}</div>
                      </div>
                      <h5 className="font-bold text-slate-800 truncate text-sm">{ev.originalFileName}</h5>
                      <div className="mt-2 text-[10px] text-slate-400 font-mono bg-slate-50 p-2 rounded border truncate">SHA256: {ev.sha256Hash}</div>
                      
                      <div className="mt-4 flex gap-2">
                        <a href={`${axios.defaults.baseURL.replace('/api', '')}${ev.fileUrl}`} target="_blank" rel="noreferrer" className="flex-1 bg-slate-100 text-center py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200">View File</a>
                        
                        {user.role === "PROFESSIONAL" && ev.status === "UPLOADED" && (
                          <button onClick={() => updateEvidence(ev._id, "verify")} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-indigo-700">Verify</button>
                        )}
                        {user.role === "JUDGE" && ev.status === "VERIFIED" && (
                          <div className="flex-1 flex gap-2">
                            <button onClick={() => updateEvidence(ev._id, "approve", { decision: "APPROVED" })} className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 underline">Approve</button>
                            <button onClick={() => updateEvidence(ev._id, "approve", { decision: "REJECTED" })} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700">Reject</button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[60vh] text-slate-300">
                <FaGavel size={80} className="mb-4 opacity-20" />
                <p className="font-medium">Select a case from the sidebar to view evidence ledger</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {message && (
        <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="fixed bottom-6 right-6 bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 z-[100]">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span className="text-xs font-bold tracking-tight uppercase">{message}</span>
          <button onClick={() => setMessage("")} className="ml-4 text-slate-500 hover:text-white">×</button>
        </motion.div>
      )}
    </div>
  );
}

export default App;
