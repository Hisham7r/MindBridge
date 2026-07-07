import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';
import { getNavByRole, shouldShowBookSessionButton } from '../config/sidebarConfig.jsx';

function SidebarLink({ icon, label, active, onClick, purpose, isSubItem = false }) {
  return (
    <button
      onClick={onClick}
      className={`${active ? 'sidebar-link-active' : 'sidebar-link'} w-full text-left transition-all ${isSubItem ? 'pl-8 text-sm' : ''}`}
      title={purpose}
    >
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default function AdminConsole() {
  const { logout, role, currentUser } = useRole();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [activeSubSection, setActiveSubSection] = useState(null);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPayId, setBusyPayId] = useState(null);
  const [payError, setPayError] = useState('');

  // Therapist application review queue (Security section)
  const [applications, setApplications] = useState([]);
  const [busyAppId, setBusyAppId] = useState(null);
  const [appError, setAppError] = useState('');
  const [rejectingId, setRejectingId] = useState(null); // app showing the reason input
  const [rejectReason, setRejectReason] = useState('');

  // Therapist roster (Overview + People tables) + detail modal
  const [therapists, setTherapists] = useState([]);
  const [selectedTherapist, setSelectedTherapist] = useState(null); // opens the profile modal
  const [busyTherapistId, setBusyTherapistId] = useState(null);
  const [therapistError, setTherapistError] = useState('');

  // Patients table (People → Patients) + detail modal
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState(null); // loaded patient detail
  const [loadingPatient, setLoadingPatient] = useState(false);
  const [patientError, setPatientError] = useState('');

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [hoursSaved, setHoursSaved] = useState(false);

  const navItems = getNavByRole(role);

  useEffect(() => {
    let active = true;
    Promise.all([
      api.getAdminStats().catch(() => null),
      api.getAdminPayments().catch(() => []),
      api.getAdminUsers().catch(() => []),
      api.getTherapistApplications('PENDING').catch(() => []),
      api.getAdminTherapists().catch(() => []),
    ]).then(([s, pays, us, apps, ther]) => {
      if (!active) return;
      setStats(s);
      setPayments((pays || []).map(p => ({
        id: p.id,
        user: p.patient?.name || 'Unknown',
        email: p.patient?.email || '',
        amount: `PKR ${Number(p.totalPkr || 0).toLocaleString()}`,
        status: String(p.status || '').toLowerCase(),
      })));
      setUsers(us || []);
      setApplications(apps || []);
      setTherapists(ther || []);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function approvePayment(id) {
    setBusyPayId(id); setPayError('');
    try {
      await api.approvePayment(id);
      setPayments(p => p.map(pay => (pay.id === id ? { ...pay, status: 'approved' } : pay)));
    } catch (e) {
      setPayError(e.message || 'Could not approve payment.');
    } finally {
      setBusyPayId(null);
    }
  }
  async function rejectPayment(id) {
    setBusyPayId(id); setPayError('');
    try {
      await api.rejectPayment(id);
      setPayments(p => p.map(pay => (pay.id === id ? { ...pay, status: 'rejected' } : pay)));
    } catch (e) {
      setPayError(e.message || 'Could not reject payment.');
    } finally {
      setBusyPayId(null);
    }
  }

  async function approveApplication(id) {
    setBusyAppId(id); setAppError('');
    try {
      await api.approveTherapist(id);
      setApplications(a => a.map(app => (app.id === id ? { ...app, status: 'APPROVED' } : app)));
    } catch (e) {
      setAppError(e.message || 'Could not approve application.');
    } finally {
      setBusyAppId(null);
    }
  }
  async function rejectApplication(id) {
    const reason = rejectReason.trim();
    if (reason.length < 3) {
      setAppError('Please provide a rejection reason (at least 3 characters).');
      return;
    }
    setBusyAppId(id); setAppError('');
    try {
      await api.rejectTherapist(id, reason);
      setApplications(a => a.map(app => (app.id === id ? { ...app, status: 'REJECTED' } : app)));
      setRejectingId(null);
      setRejectReason('');
    } catch (e) {
      setAppError(e.message || 'Could not reject application.');
    } finally {
      setBusyAppId(null);
    }
  }

  // Apply a therapist change to both the roster list and the open modal.
  function applyTherapistPatch(id, patch) {
    setTherapists(list => list.map(t => (t.id === id ? { ...t, ...patch } : t)));
    setSelectedTherapist(sel => (sel && sel.id === id ? { ...sel, ...patch } : sel));
  }
  async function handleSuspend(id) {
    setBusyTherapistId(id); setTherapistError('');
    try {
      await api.suspendTherapist(id);
      applyTherapistPatch(id, { isActive: false });
    } catch (e) {
      setTherapistError(e.message || 'Could not suspend therapist.');
    } finally {
      setBusyTherapistId(null);
    }
  }
  async function handleReactivate(id) {
    setBusyTherapistId(id); setTherapistError('');
    try {
      await api.reactivateTherapist(id);
      applyTherapistPatch(id, { isActive: true });
    } catch (e) {
      setTherapistError(e.message || 'Could not reactivate therapist.');
    } finally {
      setBusyTherapistId(null);
    }
  }

  const pending = payments.filter(p => p.status === 'pending');
  const pendingApps = applications.filter(a => a.status === 'PENDING');
  const trackLabel = (t) => (t === 'CAREER' ? 'Career' : 'Mental Health');

  // Real display status for a therapist row/modal (review state + suspension).
  const therapistStatus = (t) => {
    if (t.status === 'APPROVED') return t.isActive ? { label: 'Active', cls: 'badge-green' } : { label: 'Suspended', cls: 'badge-red' };
    if (t.status === 'PENDING') return { label: 'Pending', cls: 'badge-gray' };
    if (t.status === 'REJECTED') return { label: 'Rejected', cls: 'badge-red' };
    return { label: 'Draft', cls: 'badge-gray' };
  };

  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');

  // Patients derived from the users list (real /admin/users data), searchable by name/email.
  const patientList = users.filter(u => u.role === 'PATIENT');
  const filteredPatients = patientList.filter(u => {
    const q = patientSearch.trim().toLowerCase();
    if (!q) return true;
    return (u.name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q);
  });

  async function openPatient(id) {
    setLoadingPatient(true); setPatientError('');
    try {
      const detail = await api.getAdminUser(id);
      setSelectedPatient(detail);
    } catch (e) {
      setPatientError(e.message || 'Could not load patient.');
    } finally {
      setLoadingPatient(false);
    }
  }

  // ── Real stat-card values ─────────────────────────────────────────────────
  const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
  const newThisWeek = users.filter(u => u.createdAt && new Date(u.createdAt) >= weekAgo).length;
  const patients = stats?.users?.patients ?? 0;
  const revenuePkr = stats?.revenuePkr ?? 0;

  const statCards = [
    { label: 'ACTIVE PATIENTS', value: loading ? '…' : String(patients), change: 'Registered patients', icon: '👥', positive: true },
    { label: 'NEW SIGNUPS', value: loading ? '…' : String(newThisWeek), change: 'New this week', icon: '📈', positive: true },
    { label: 'RETENTION RATE', value: '—', change: 'Not tracked yet', icon: '📊', positive: null },
    { label: 'REVENUE', value: loading ? '…' : `PKR ${revenuePkr.toLocaleString()}`, change: 'From approved payments', icon: '💰', positive: true },
  ];

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="mb-3 mt-1">
          <span className="text-lg font-bold text-brand">MindBridge</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
            <span className="font-bold text-gray-600 text-sm">{currentUser?.initials || 'AD'}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Welcome back</p>
            <p className="text-sm font-bold text-gray-800">{currentUser?.name || 'Admin'}</p>
            <p className="text-xs text-gray-400">Your mental sanctuary</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <div key={item.section}>
              <SidebarLink
                icon={item.icon}
                label={item.label}
                purpose={item.purpose}
                active={activeSection === item.section}
                onClick={() => {
                  setActiveSection(item.section);
                  setActiveSubSection(null);
                }}
              />
              {item.subItems && activeSection === item.section && (
                <div className="mt-1 bg-gray-50 rounded-lg p-2">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.value}
                      onClick={() => setActiveSubSection(subItem.value)}
                      className={`w-full text-left pl-8 py-2 text-sm rounded transition-colors ${
                        activeSubSection === subItem.value
                          ? 'text-brand font-medium bg-white'
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      → {subItem.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          {shouldShowBookSessionButton(role) && (
            <Link to="/book/1" className="btn-primary w-full text-center py-2.5 text-sm block">
              Book Session
            </Link>
          )}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="ml-56 flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {navItems.find(item => item.section === activeSection)?.label || 'Admin Console'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {navItems.find(item => item.section === activeSection)?.purpose || 'Platform administration and oversight.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors text-lg">🔔</button>
            <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white font-bold text-sm">{currentUser?.initials || 'AD'}</div>
          </div>
        </div>

        {/* Overview Section */}
        {activeSection === 'overview' && (
          <>
        {/* Stats */}
        <div className="grid grid-cols-4 gap-5 mb-8">
          {statCards.map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl">{s.icon}</div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-3">{s.value}</p>
              <p className={`text-xs mt-1 font-medium ${s.positive === null ? 'text-gray-400' : s.positive ? 'text-green-600' : 'text-red-500'}`}>
                {s.positive === null ? s.change : `${s.positive ? '↑' : '↘'} ${s.change}`}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Payment Verification */}
          <div className="lg:col-span-2 card">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-bold text-gray-800">Payment Verification</h2>
                <p className="text-xs text-gray-400">Review manual bank transfers and deposits.</p>
              </div>
              {pending.length > 0 && (
                <span className="badge bg-brand text-white">{pending.length} Pending</span>
              )}
            </div>

            {payError && <p className="text-xs text-red-500 mt-2">{payError}</p>}

            <div className="mt-4">
              <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pb-2 border-b border-gray-50">
                <span>User</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Proof</span>
              </div>
              <div className="divide-y divide-gray-50 mt-2">
                {loading ? (
                  <p className="text-sm text-gray-400 py-3 px-2">Loading…</p>
                ) : payments.length === 0 ? (
                  <p className="text-sm text-gray-400 py-3 px-2">No payments yet.</p>
                ) : payments.map(pay => (
                  <div key={pay.id} className={`grid grid-cols-3 items-center py-3 px-2 rounded-xl transition-colors ${pay.status === 'approved' ? 'bg-green-50' : pay.status === 'rejected' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                        {pay.user.split(' ').map(w => w[0]).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{pay.user}</p>
                        <p className="text-xs text-gray-400">{pay.email}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 text-center">{pay.amount}</p>
                    <div className="flex items-center justify-end gap-2">
                      {pay.status === 'pending' ? (
                        <>
                          <button className="text-brand text-xs font-semibold flex items-center gap-1 hover:underline">
                            🖼 View Screenshot
                          </button>
                          <button onClick={() => approvePayment(pay.id)} disabled={busyPayId === pay.id} className="text-green-600 hover:text-green-700 text-xl transition-colors disabled:opacity-40">✓</button>
                          <button onClick={() => rejectPayment(pay.id)} disabled={busyPayId === pay.id} className="text-red-400 hover:text-red-600 text-xl transition-colors disabled:opacity-40">✗</button>
                        </>
                      ) : (
                        <span className={`badge ${pay.status === 'approved' ? 'badge-green' : 'badge-red'} capitalize`}>{pay.status}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full text-center text-brand text-sm font-semibold mt-3 hover:underline">View All Transactions</button>
            </div>
          </div>

          {/* Operation Hours */}
          <div className="card">
            <h2 className="font-bold text-gray-800">Operation Hours</h2>
            <p className="text-xs text-gray-400 mt-1">Set the global timeframe for active therapy sessions.</p>

            <div className="mt-5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">Start Time</label>
                  <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>شروع وقت</span>
                </div>
                <input
                  type="time"
                  value={startTime}
                  onChange={e => { setStartTime(e.target.value); setHoursSaved(false); }}
                  className="input-field"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-sm font-medium text-gray-700">End Time</label>
                  <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>اختتامی وقت</span>
                </div>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => { setEndTime(e.target.value); setHoursSaved(false); }}
                  className="input-field"
                />
              </div>
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <span className="text-blue-500 text-sm shrink-0 mt-0.5">ℹ</span>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Changes will apply to all therapists globally. Users already in sessions will not be disconnected.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setHoursSaved(true)}
                className="btn-primary w-full py-3.5"
              >
                Update Global Hours
              </button>
              {hoursSaved && (
                <p className="text-center text-xs text-green-600">✅ Hours updated successfully!</p>
              )}
            </div>
          </div>
        </div>

        {/* Therapist Performance Snapshot (real data) */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Therapist Performance Snapshot</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                  <th className="text-left px-4 py-3">Therapist Name</th>
                  <th className="text-left px-4 py-3">Patients Today</th>
                  <th className="text-left px-4 py-3">This Week</th>
                  <th className="text-left px-4 py-3">All-Time</th>
                  <th className="text-left px-4 py-3">Upcoming</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
                ) : therapists.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">No therapists yet.</td></tr>
                ) : therapists.map(t => {
                  const st = therapistStatus(t);
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-sm text-gray-800">{t.name}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.patientsToday}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.patientsWeek}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.patientsAllTime}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{t.upcomingSessions}</td>
                      <td className="px-4 py-3"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setTherapistError(''); setSelectedTherapist(t); }} className="text-brand text-xs hover:underline font-medium">View</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          </>
        )}

        {/* People Section */}
        {activeSection === 'people' && (
          <div className="card">
            <h2 className="font-bold text-gray-800 text-xl mb-4">
              {activeSubSection === 'therapists' ? 'Therapist Management' : 'Patient Management'}
            </h2>
            <p className="text-xs text-gray-400 mb-6">
              {activeSubSection === 'therapists'
                ? 'View, edit, and manage all therapist profiles and performance.'
                : 'View, search, and support patient accounts.'}
            </p>

            {activeSubSection === 'therapists' ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left px-4 py-3">Therapist Name</th>
                      <th className="text-left px-4 py-3">Specialization</th>
                      <th className="text-left px-4 py-3">Patients</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
                    ) : therapists.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No therapists yet.</td></tr>
                    ) : therapists.map(t => {
                      const st = therapistStatus(t);
                      return (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-sm text-gray-800">{t.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{t.specializations?.length ? t.specializations.join(', ') : '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{t.patientsAllTime}</td>
                          <td className="px-4 py-3"><span className={`badge ${st.cls}`}>{st.label}</span></td>
                          <td className="px-4 py-3">
                            <button onClick={() => { setTherapistError(''); setSelectedTherapist(t); }} className="text-brand text-xs hover:underline font-medium">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search patients by name or email…"
                    className="input-field w-full max-w-md"
                  />
                </div>
                {patientError && <p className="text-xs text-red-500 mb-2">{patientError}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                        <th className="text-left px-4 py-3">Name</th>
                        <th className="text-left px-4 py-3">Email</th>
                        <th className="text-left px-4 py-3">Phone</th>
                        <th className="text-left px-4 py-3">Verified</th>
                        <th className="text-left px-4 py-3">Joined</th>
                        <th className="text-left px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {loading ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Loading…</td></tr>
                      ) : filteredPatients.length === 0 ? (
                        <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">{patientSearch ? 'No patients match your search.' : 'No patients yet.'}</td></tr>
                      ) : filteredPatients.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 font-medium text-sm text-gray-800">{p.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{p.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${p.isVerified ? 'badge-green' : 'badge-gray'}`}>{p.isVerified ? 'Verified' : 'Unverified'}</span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{fmtDate(p.createdAt)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => openPatient(p.id)} disabled={loadingPatient} className="text-brand text-xs hover:underline font-medium disabled:opacity-50">
                              {loadingPatient ? 'Loading…' : 'View'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Finance Section */}
        {activeSection === 'finance' && (
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="font-bold text-gray-800">Transaction Verification</h2>
                  <p className="text-xs text-gray-400">Therapist payouts and revenue tracking.</p>
                </div>
                {pending.length > 0 && (
                  <span className="badge bg-red-500 text-white">{pending.length} Pending</span>
                )}
              </div>

              {payError && <p className="text-xs text-red-500 mt-2">{payError}</p>}

              <div className="mt-4">
                <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pb-2 border-b border-gray-50">
                  <span>Therapist</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Bank Proof</span>
                </div>
                <div className="divide-y divide-gray-50 mt-2">
                  {loading ? (
                    <p className="text-sm text-gray-400 py-3 px-2">Loading…</p>
                  ) : payments.length === 0 ? (
                    <p className="text-sm text-gray-400 py-3 px-2">No payments yet.</p>
                  ) : payments.map(pay => (
                    <div key={pay.id} className={`grid grid-cols-3 items-center py-3 px-2 rounded-xl transition-colors ${pay.status === 'approved' ? 'bg-green-50' : pay.status === 'rejected' ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs font-bold shrink-0">
                          {pay.user.split(' ').map(w => w[0]).join('')}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{pay.user}</p>
                          <p className="text-xs text-gray-400">{pay.email}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-800 text-center">{pay.amount}</p>
                      <div className="flex items-center justify-end gap-2">
                        {pay.status === 'pending' ? (
                          <>
                            <button className="text-brand text-xs font-semibold flex items-center gap-1 hover:underline">
                              🖼 View Proof
                            </button>
                            <button onClick={() => approvePayment(pay.id)} disabled={busyPayId === pay.id} className="text-green-600 hover:text-green-700 text-xl transition-colors disabled:opacity-40" title="Approve">✓</button>
                            <button onClick={() => rejectPayment(pay.id)} disabled={busyPayId === pay.id} className="text-red-400 hover:text-red-600 text-xl transition-colors disabled:opacity-40" title="Reject">✗</button>
                          </>
                        ) : (
                          <span className={`badge ${pay.status === 'approved' ? 'badge-green' : 'badge-red'} capitalize`}>{pay.status}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Operations Section */}
        {activeSection === 'operations' && (
          <div className="space-y-6">
            <div className="card">
              <h2 className="font-bold text-gray-800 mb-4">Global Configuration</h2>

              <div className="space-y-6">
                {/* Operation Hours */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 mb-3">Operation Hours</h3>
                  <p className="text-xs text-gray-400 mb-4">Set the global timeframe for active therapy sessions.</p>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">Start Time</label>
                        <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>شروع وقت</span>
                      </div>
                      <input
                        type="time"
                        value={startTime}
                        onChange={e => { setStartTime(e.target.value); setHoursSaved(false); }}
                        className="input-field"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-sm font-medium text-gray-700">End Time</label>
                        <span className="text-xs text-gray-400" style={{fontFamily:'serif'}}>اختتامی وقت</span>
                      </div>
                      <input
                        type="time"
                        value={endTime}
                        onChange={e => { setEndTime(e.target.value); setHoursSaved(false); }}
                        className="input-field"
                      />
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <div className="flex items-start gap-2">
                        <span className="text-blue-500 text-sm shrink-0 mt-0.5">ℹ</span>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          Changes will apply to all therapists globally. Users already in sessions will not be disconnected.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setHoursSaved(true)}
                      className="btn-primary w-full py-3.5"
                    >
                      Update Global Hours
                    </button>
                    {hoursSaved && (
                      <p className="text-center text-xs text-green-600">✅ Hours updated successfully!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security Section — Therapist application review queue */}
        {activeSection === 'security' && (
          <div className="card">
            <div className="flex items-center justify-between mb-1">
              <div>
                <h2 className="font-bold text-gray-800">Therapist Applications</h2>
                <p className="text-xs text-gray-400">Vet new therapist profiles before they go live and become bookable.</p>
              </div>
              {pendingApps.length > 0 && (
                <span className="badge bg-brand text-white">{pendingApps.length} Pending</span>
              )}
            </div>

            {appError && <p className="text-xs text-red-500 mt-2">{appError}</p>}

            <div className="divide-y divide-gray-50 mt-4">
              {loading ? (
                <p className="text-sm text-gray-400 py-3">Loading…</p>
              ) : applications.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">No pending applications — new therapist submissions will appear here.</p>
              ) : applications.map(app => (
                <div key={app.id} className={`py-5 px-2 rounded-xl transition-colors ${app.status === 'APPROVED' ? 'bg-green-50' : app.status === 'REJECTED' ? 'bg-red-50' : ''}`}>
                  {/* Header row: applicant + actions */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 text-xs font-bold shrink-0">
                        {app.initials || '··'}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{app.name}</p>
                        <p className="text-xs text-gray-400">{app.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {app.status === 'PENDING' ? (
                        <>
                          <button
                            onClick={() => approveApplication(app.id)}
                            disabled={busyAppId === app.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-40"
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => { setRejectingId(rejectingId === app.id ? null : app.id); setRejectReason(''); setAppError(''); }}
                            disabled={busyAppId === app.id}
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                          >
                            ✗ Reject
                          </button>
                        </>
                      ) : (
                        <span className={`badge ${app.status === 'APPROVED' ? 'badge-green' : 'badge-red'} capitalize`}>{app.status.toLowerCase()}</span>
                      )}
                    </div>
                  </div>

                  {/* Application details */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 mt-3">
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Title</p><p className="text-xs text-gray-700">{app.title || '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Track</p><p className="text-xs text-gray-700">{trackLabel(app.track)}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">License No</p><p className="text-xs text-gray-700">{app.licenseNumber || '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Fee</p><p className="text-xs text-gray-700">{app.feePkr ? `PKR ${Number(app.feePkr).toLocaleString()}` : '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Education</p><p className="text-xs text-gray-700">{app.credentials || '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Languages</p><p className="text-xs text-gray-700">{(app.languages || []).join(', ') || '—'}</p></div>
                  </div>
                  <div className="mt-2">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">Specializations</p>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {(app.specializations || []).map(s => (
                        <span key={s} className="badge badge-blue text-xs">{s}</span>
                      ))}
                    </div>
                  </div>
                  {app.about && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">About</p>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{app.about}</p>
                    </div>
                  )}
                  {app.methodology && (
                    <div className="mt-2">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase">Methodology</p>
                      <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{app.methodology}</p>
                    </div>
                  )}

                  {/* Inline rejection reason */}
                  {rejectingId === app.id && app.status === 'PENDING' && (
                    <div className="mt-3 flex gap-2">
                      <input
                        type="text"
                        placeholder="Reason for rejection (sent to the applicant)…"
                        value={rejectReason}
                        onChange={e => setRejectReason(e.target.value)}
                        className="input-field text-xs py-2 flex-1"
                        autoFocus
                      />
                      <button
                        onClick={() => rejectApplication(app.id)}
                        disabled={busyAppId === app.id || rejectReason.trim().length < 3}
                        className="text-xs px-3 py-2 rounded-lg font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {busyAppId === app.id ? 'Rejecting…' : 'Confirm Reject'}
                      </button>
                      <button
                        onClick={() => { setRejectingId(null); setRejectReason(''); }}
                        className="text-xs px-3 py-2 rounded-lg font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Support Section */}
        {activeSection === 'support' && (
          <div className="card text-center py-12">
            <p className="text-3xl mb-4">💬</p>
            <h2 className="font-bold text-gray-800 mb-2">Support Tickets</h2>
            <p className="text-xs text-gray-400">Technical support system and user help requests coming soon.</p>
          </div>
        )}

        <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-between">
          <div className="flex gap-6 text-xs text-gray-400">
            <a href="#" className="hover:text-brand">Contact Us</a>
            <a href="#" className="hover:text-brand">Terms of Service</a>
            <a href="#" className="hover:text-brand">Privacy Policy</a>
            <a href="#" className="hover:text-brand">Urdu Support</a>
          </div>
          <div className="flex gap-2">
            <span className="text-lg cursor-pointer">🌐</span>
            <span className="text-lg cursor-pointer">✉</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-300 mt-2">ADMINISTRATIVE ACCESS ONLY</p>

        {/* Therapist detail modal (opened by the "View" action) */}
        {selectedTherapist && (() => {
          const t = selectedTherapist;
          const st = therapistStatus(t);
          const canToggle = t.status === 'APPROVED';
          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedTherapist(null)}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-brand font-bold text-lg shrink-0">{t.initials || '··'}</div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{t.name}</h3>
                      <p className="text-sm text-gray-500">{t.title || 'Therapist'}</p>
                      <p className="text-xs text-gray-400">{t.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                    <button onClick={() => setSelectedTherapist(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                  </div>
                </div>

                {/* Real stats */}
                <div className="grid grid-cols-4 gap-3 p-6 border-b border-gray-100">
                  {[
                    { label: 'Patients', value: t.patientsAllTime },
                    { label: 'Upcoming', value: t.upcomingSessions },
                    { label: 'This Week', value: t.patientsWeek },
                    { label: 'Today', value: t.patientsToday },
                  ].map(s => (
                    <div key={s.label} className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                      <p className="text-xs text-gray-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Profile */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Track</p><p className="text-sm text-gray-700">{trackLabel(t.track)}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Fee</p><p className="text-sm text-gray-700">{t.feePkr ? `PKR ${Number(t.feePkr).toLocaleString()}` : '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">License No</p><p className="text-sm text-gray-700">{t.licenseNumber || '—'}</p></div>
                    <div><p className="text-[10px] font-semibold text-gray-400 uppercase">Education</p><p className="text-sm text-gray-700">{t.credentials || '—'}</p></div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Specializations</p>
                    <div className="flex flex-wrap gap-1.5">
                      {(t.specializations || []).length ? t.specializations.map(s => <span key={s} className="badge badge-blue text-xs">{s}</span>) : <span className="text-sm text-gray-400">—</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Languages</p>
                    <p className="text-sm text-gray-700">{(t.languages || []).length ? t.languages.join(', ') : '—'}</p>
                  </div>
                  {t.about && (<div><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">About</p><p className="text-sm text-gray-600 leading-relaxed">{t.about}</p></div>)}
                  {t.methodology && (<div><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Methodology</p><p className="text-sm text-gray-600 leading-relaxed">{t.methodology}</p></div>)}
                  {t.status === 'REJECTED' && t.rejectionReason && (<div><p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">Rejection Reason</p><p className="text-sm text-red-600">{t.rejectionReason}</p></div>)}
                </div>

                {/* Suspend / Reactivate */}
                <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                  {therapistError ? <span className="text-sm text-red-600">{therapistError}</span> : <span />}
                  {canToggle ? (
                    t.isActive ? (
                      <button onClick={() => handleSuspend(t.id)} disabled={busyTherapistId === t.id} className="text-sm font-semibold px-5 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50">
                        {busyTherapistId === t.id ? 'Suspending…' : 'Suspend therapist'}
                      </button>
                    ) : (
                      <button onClick={() => handleReactivate(t.id)} disabled={busyTherapistId === t.id} className="text-sm font-semibold px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                        {busyTherapistId === t.id ? 'Reactivating…' : 'Reactivate therapist'}
                      </button>
                    )
                  ) : (
                    <span className="text-xs text-gray-400">Suspension applies to approved therapists only.</span>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Patient detail modal (opened by the Patients "View" action) — read-only */}
        {selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelectedPatient(null)}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-brand font-bold text-lg shrink-0">{selectedPatient.initials || '··'}</div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{selectedPatient.name}</h3>
                    <p className="text-sm text-gray-500">{selectedPatient.email}</p>
                    <p className="text-xs text-gray-400">{selectedPatient.phone || 'No phone'} · Joined {fmtDate(selectedPatient.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`badge ${selectedPatient.isVerified ? 'badge-green' : 'badge-gray'}`}>{selectedPatient.isVerified ? 'Verified' : 'Unverified'}</span>
                  <button onClick={() => setSelectedPatient(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
                </div>
              </div>

              {/* Sessions */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Sessions ({selectedPatient.sessions.length})</h4>
                {selectedPatient.sessions.length === 0 ? (
                  <p className="text-sm text-gray-400">No sessions booked yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatient.sessions.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium text-gray-800">{s.therapistName || 'Therapist'}</p>
                          <p className="text-xs text-gray-400">{s.slotDatetime ? fmtDate(s.slotDatetime) : '—'} · {s.type || 'Session'}</p>
                        </div>
                        <span className="badge badge-gray text-xs capitalize">{String(s.status).replace('_', ' ').toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Payments */}
              <div className="p-6">
                <h4 className="text-sm font-bold text-gray-800 mb-3">Payments ({selectedPatient.payments.length})</h4>
                {selectedPatient.payments.length === 0 ? (
                  <p className="text-sm text-gray-400">No payments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedPatient.payments.map(p => (
                      <div key={p.id} className="flex items-center justify-between text-sm border border-gray-100 rounded-lg px-3 py-2">
                        <div>
                          <p className="font-medium text-gray-800">PKR {Number(p.totalPkr || 0).toLocaleString()}</p>
                          <p className="text-xs text-gray-400">Txn: {p.txnId || '—'} · {fmtDate(p.createdAt)}</p>
                        </div>
                        <span className={`badge ${p.status === 'APPROVED' ? 'badge-green' : p.status === 'REJECTED' ? 'badge-red' : 'badge-gray'} text-xs capitalize`}>{String(p.status).toLowerCase()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
