import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';
import SidebarLink from '../components/SidebarLink';
import { THERAPIST_NAV } from '../config/sidebarConfig.jsx';

const statusBadge = {
  'in-progress': <span className="badge bg-blue-100 text-blue-700 text-xs">IN PROGRESS</span>,
  'upcoming': <span className="badge badge-gray text-xs">Upcoming</span>,
  'done': <span className="badge badge-green text-xs">Done</span>,
  'cancelled': <span className="badge badge-red text-xs">Cancelled</span>,
};

// Map backend SessionStatus enum onto the UI's badge keys.
function uiStatusOf(status) {
  if (status === 'IN_PROGRESS') return 'in-progress';
  if (status === 'COMPLETED') return 'done';
  if (status === 'CANCELLED') return 'cancelled';
  return 'upcoming'; // PENDING_PAYMENT, CONFIRMED
}

const trackLabel = (track) => (track === 'CAREER' ? 'Career Guidance' : 'Mental Health Therapy');
const fmtTime = (dt) => (dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—');
const fmtDate = (dt) => (dt ? new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

// Monday-based start of the week containing d.
function weekStart(d) {
  const x = new Date(d);
  const offset = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - offset);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function TherapistDashboard() {
  const { currentUser, logout } = useRole();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [zoomLinks, setZoomLinks] = useState({});
  const [zoomBusy, setZoomBusy] = useState({}); // { [sessionId]: 'saving' | 'saved' | 'error' }
  const [markBusy, setMarkBusy] = useState({}); // { [sessionId]: 'saving' | 'error' }
  const [activeSection, setActiveSection] = useState('overview');

  const today = new Date();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  useEffect(() => {
    let active = true;
    api.getTherapistSessions()
      .then((data) => {
        if (!active) return;
        setSessions(data);
        const seed = {};
        data.forEach((s) => { if (s.zoomLink) seed[s.id] = s.zoomLink; });
        setZoomLinks(seed);
      })
      .catch(() => { if (active) setSessions([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function handleZoomLink(sessionId, value) {
    setZoomLinks(prev => ({ ...prev, [sessionId]: value }));
  }

  async function handleSendZoom(sessionId) {
    const link = (zoomLinks[sessionId] || '').trim();
    if (!link) return;
    setZoomBusy(prev => ({ ...prev, [sessionId]: 'saving' }));
    try {
      await api.setSessionZoomLink(sessionId, link);
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, zoomLink: link } : s)));
      setZoomBusy(prev => ({ ...prev, [sessionId]: 'saved' }));
      setTimeout(() => setZoomBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2000);
    } catch {
      setZoomBusy(prev => ({ ...prev, [sessionId]: 'error' }));
      setTimeout(() => setZoomBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2500);
    }
  }

  // Therapist marks a session attended. Updates the shared `sessions` state so
  // BOTH "Today's Schedule" (overview) and "Today's Appointments" reflect it at
  // once (they derive from the same array), and the patient sees it in their
  // history on their next load.
  async function handleMarkComplete(sessionId) {
    setMarkBusy(prev => ({ ...prev, [sessionId]: 'saving' }));
    try {
      await api.updateSessionStatus(sessionId, 'COMPLETED');
      setSessions(prev => prev.map(s => (s.id === sessionId ? { ...s, status: 'COMPLETED' } : s)));
      setMarkBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; });
    } catch {
      setMarkBusy(prev => ({ ...prev, [sessionId]: 'error' }));
      setTimeout(() => setMarkBusy(prev => { const n = { ...prev }; delete n[sessionId]; return n; }), 2500);
    }
  }

  // ── Derive views from real session data ──────────────────────────────────
  const now = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const withDate = sessions.map(s => ({ ...s, _dt: s.slot?.datetime ? new Date(s.slot.datetime) : null }));

  const todaySessions = withDate.filter(s => s._dt && sameDay(s._dt, today)).sort((a, b) => a._dt - b._dt);
  const tomorrowSessions = withDate.filter(s => s._dt && sameDay(s._dt, tomorrow)).sort((a, b) => a._dt - b._dt);
  const upcomingSessions = withDate.filter(s => s._dt && s._dt > now && !sameDay(s._dt, today)).sort((a, b) => a._dt - b._dt);

  const toCard = (s) => ({
    id: s.id,
    status: uiStatusOf(s.status),
    rawStatus: s.status,        // backend enum — gates the "Mark Complete" action
    time: fmtTime(s.slot?.datetime),
    patient: s.patient?.name || 'Patient',
    sessionNumber: s.sessionNumber,
    type: trackLabel(s.therapist?.track),
  });
  const toBrief = (s) => ({
    id: s.id,
    patient: s.patient?.name || 'Patient',
    time: fmtTime(s.slot?.datetime),
    task: `Session #${s.sessionNumber} — ${trackLabel(s.therapist?.track)}`,
  });
  const todayCards = todaySessions.map(toCard);
  // Overview "Today's Schedule" demotes completed sessions below the active ones.
  const todayActiveCards = todayCards.filter(c => c.status !== 'done');
  const todayDoneCards = todayCards.filter(c => c.status === 'done');
  const tomorrowBrief = tomorrowSessions.map(toBrief);
  const upcomingBrief = upcomingSessions.map(toBrief);

  // Stats
  const ws = weekStart(today);
  const we = new Date(ws); we.setDate(ws.getDate() + 7);
  const weeklyCount = withDate.filter(s => s._dt && s._dt >= ws && s._dt < we).length;
  const todayDone = todaySessions.filter(s => s.status === 'COMPLETED').length;
  const todayRemaining = todaySessions.filter(s => s.status !== 'COMPLETED' && s.status !== 'CANCELLED').length;
  const pendingPayAmount = sessions
    .filter(s => s.payment && String(s.payment.status).toUpperCase() === 'PENDING')
    .reduce((sum, s) => sum + Number(s.therapist?.feePkr || 0), 0);

  // My Patients — distinct patients derived from sessions
  const patientMap = {};
  withDate.forEach(s => {
    const p = s.patient;
    if (!p) return;
    if (!patientMap[p.id]) patientMap[p.id] = { name: p.name, count: 0, last: null };
    patientMap[p.id].count += 1;
    if (s._dt && (!patientMap[p.id].last || s._dt > patientMap[p.id].last)) patientMap[p.id].last = s._dt;
  });
  const thirtyAgo = new Date(today); thirtyAgo.setDate(today.getDate() - 30);
  const patientRows = Object.values(patientMap)
    .map(p => ({
      name: p.name,
      lastSession: p.last ? fmtDate(p.last) : '—',
      count: p.count,
      status: p.last && p.last >= thirtyAgo ? 'Active' : 'On Hold',
    }))
    .sort((a, b) => b.count - a.count);

  const statsRow = [
    { label: 'Total Patients Today', value: String(todayDone), sub: 'sessions done' },
    { label: 'Weekly Sessions', value: String(weeklyCount), sub: 'this week' },
    { label: 'Pending Payments', value: `PKR ${pendingPayAmount.toLocaleString()}`, sub: 'awaiting admin' },
  ];

  const zoomButtonLabel = (id) => {
    if (zoomBusy[id] === 'saving') return 'Saving…';
    if (zoomBusy[id] === 'saved') return 'Sent ✓';
    if (zoomBusy[id] === 'error') return 'Retry';
    return 'Send';
  };

  const markButtonLabel = (id) => {
    if (markBusy[id] === 'saving') return 'Saving…';
    if (markBusy[id] === 'error') return 'Retry';
    return '✓ Mark Complete';
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="mb-2 mt-1">
          <span className="text-lg font-bold text-brand">MindBridge</span>
        </div>
        <div className="flex items-center gap-2 mb-6 mt-1">
          <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">{currentUser?.initials || '··'}</div>
          <div>
            <p className="text-xs text-gray-400">WELCOME BACK</p>
            <p className="text-sm font-bold text-gray-800">{currentUser?.name || 'Therapist'}</p>
            <p className="text-xs text-gray-400">Your mental hours.</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          {THERAPIST_NAV.map((item) => (
            <SidebarLink
              key={item.section}
              icon={item.svg || item.icon}
              label={item.label}
              active={activeSection === item.section}
              onClick={() => setActiveSection(item.section)}
            />
          ))}
        </nav>

        <div className="mt-4 space-y-3">
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
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeSection === 'overview' && 'Therapist Dashboard'}
              {activeSection === 'appointments' && 'Appointments'}
              {activeSection === 'patients' && 'My Patients'}
              {activeSection === 'settings' && 'Settings'}
            </h1>
            <p className="text-gray-500 text-sm">
              {activeSection === 'overview' && `${dayName} — You have ${todaySessions.length} sessions today.`}
              {activeSection === 'appointments' && 'Manage your professional bookings and session links.'}
              {activeSection === 'patients' && 'View your assigned patients.'}
              {activeSection === 'settings' && 'Manage your profile and availability hours.'}
            </p>
          </div>
        </div>

        {/* Content based on active section */}
        {activeSection === 'overview' && (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4 mb-6 mt-5">
              {statsRow.map((s, i) => (
                <div key={i} className="card">
                  <p className="text-xs font-semibold text-gray-400">{s.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${i === 2 ? 'text-brand' : 'text-gray-900'}`}>{s.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{s.sub}</p>
                </div>
               ))}
            </div>

            {/* Sessions remaining + Tomorrow */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="card flex items-center gap-3 py-3">
                <span className="text-2xl">🗓</span>
                <div>
                  <p className="text-xs text-gray-400">Sessions remaining</p>
                  <p className="text-sm font-bold text-gray-800">{todayRemaining} today</p>
                </div>
              </div>
              <div className="card py-3">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-bold text-gray-800 text-sm">Tomorrow</h2>
                  {tomorrowBrief.length > 1 && (
                    <button onClick={() => setActiveSection('appointments')} className="text-brand text-xs font-semibold hover:underline">View All</button>
                  )}
                </div>
                {loading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : tomorrowBrief.length === 0 ? (
                  <p className="text-sm text-gray-400">Nothing scheduled tomorrow.</p>
                ) : (
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{tomorrowBrief[0].patient}</p>
                    <p className="text-xs text-brand">{tomorrowBrief[0].time}</p>
                    <p className="text-xs text-gray-500 mt-1 italic">{tomorrowBrief[0].task}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Schedule */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-800">Today's Schedule</h2>
              </div>
              <div className="space-y-3">
                {loading ? (
                  <p className="text-sm text-gray-400">Loading…</p>
                ) : todayCards.length === 0 ? (
                  <div className="card shadow-none text-sm text-gray-400 text-center py-6">No sessions today.</div>
                ) : (
                  <>
                    {/* Active (upcoming / in-progress) sessions — full cards */}
                    {todayActiveCards.map(session => (
                      <div key={session.id} className={`card shadow-none ${session.status === 'in-progress' ? 'bg-blue-50' : ''}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {statusBadge[session.status]}
                              <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                            </div>
                            <p className="font-bold text-gray-900">{session.patient}</p>
                            <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                          </div>
                          <div className="flex flex-col gap-1 items-end">
                            {session.rawStatus === 'CONFIRMED' && (
                              <button
                                onClick={() => handleMarkComplete(session.id)}
                                disabled={markBusy[session.id] === 'saving'}
                                className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                              >
                                {markButtonLabel(session.id)}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Zoom link input */}
                        <div className="mt-3 flex gap-2">
                          <input
                            type="url"
                            placeholder="Paste Zoom link..."
                            value={zoomLinks[session.id] || ''}
                            onChange={e => handleZoomLink(session.id, e.target.value)}
                            className="input-field text-xs py-2 flex-1"
                          />
                          <button
                            onClick={() => handleSendZoom(session.id)}
                            disabled={!zoomLinks[session.id] || zoomBusy[session.id] === 'saving'}
                            className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] && zoomBusy[session.id] !== 'saving' ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                          >
                            {zoomButtonLabel(session.id)}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* All of today's sessions complete */}
                    {todayActiveCards.length === 0 && (
                      <div className="card shadow-none text-center py-6">
                        <p className="text-sm font-semibold text-green-600">✓ All of today's sessions are complete</p>
                      </div>
                    )}

                    {/* Completed sessions — demoted, compact, no actions */}
                    {todayDoneCards.map(session => (
                      <div key={session.id} className="card shadow-none bg-gray-50 py-3 opacity-70">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              {statusBadge[session.status]}
                              <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                            </div>
                            <p className="font-semibold text-sm text-gray-700 mt-1">{session.patient}</p>
                          </div>
                          <span className="text-xs text-gray-400">Session #{session.sessionNumber}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {/* Appointments Section */}
        {activeSection === 'appointments' && (
          <div className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Today's Appointments</h2>
                </div>
                <div className="space-y-3">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                  ) : todayCards.length === 0 ? (
                    <div className="card shadow-none text-sm text-gray-400 text-center py-6">No sessions today.</div>
                  ) : (
                    <>
                      {/* Active (upcoming / in-progress) sessions — full cards */}
                      {todayActiveCards.map(session => (
                        <div key={session.id} className={`card shadow-none ${session.status === 'in-progress' ? 'bg-blue-50' : ''}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {statusBadge[session.status]}
                                <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                              </div>
                              <p className="font-bold text-gray-900">{session.patient}</p>
                              <p className="text-xs text-gray-500">Session #{session.sessionNumber} — {session.type}</p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              {session.rawStatus === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleMarkComplete(session.id)}
                                  disabled={markBusy[session.id] === 'saving'}
                                  className="text-xs text-green-600 hover:text-green-700 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                  {markButtonLabel(session.id)}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Zoom link input */}
                          <div className="mt-3 flex gap-2">
                            <input
                              type="url"
                              placeholder="Paste Zoom link..."
                              value={zoomLinks[session.id] || ''}
                              onChange={e => handleZoomLink(session.id, e.target.value)}
                              className="input-field text-xs py-2 flex-1"
                            />
                            <button
                              onClick={() => handleSendZoom(session.id)}
                              disabled={!zoomLinks[session.id] || zoomBusy[session.id] === 'saving'}
                              className={`text-xs px-3 py-2 rounded-lg font-semibold transition-colors ${zoomLinks[session.id] && zoomBusy[session.id] !== 'saving' ? 'bg-brand text-white hover:bg-primary-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                              {zoomButtonLabel(session.id)}
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* All of today's sessions complete */}
                      {todayActiveCards.length === 0 && (
                        <div className="card shadow-none text-center py-6">
                          <p className="text-sm font-semibold text-green-600">✓ All of today's sessions are complete</p>
                        </div>
                      )}

                      {/* Completed sessions — demoted, compact, no actions */}
                      {todayDoneCards.map(session => (
                        <div key={session.id} className="card shadow-none bg-gray-50 py-3 opacity-70">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                {statusBadge[session.status]}
                                <span className="text-xs text-gray-400 font-semibold">{session.time}</span>
                              </div>
                              <p className="font-semibold text-sm text-gray-700 mt-1">{session.patient}</p>
                            </div>
                            <span className="text-xs text-gray-400">Session #{session.sessionNumber}</span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-gray-800">Upcoming Appointments</h2>
                  <button className="text-brand text-xs font-semibold hover:underline">View All</button>
                </div>
                <div className="space-y-2">
                  {loading ? (
                    <p className="text-sm text-gray-400">Loading…</p>
                  ) : upcomingBrief.length === 0 ? (
                    <div className="card py-3 text-sm text-gray-400 text-center">No upcoming appointments.</div>
                  ) : upcomingBrief.map((s) => (
                    <div key={s.id} className="card py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-gray-800">{s.patient}</p>
                          <p className="text-xs text-brand">{s.time}</p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 italic">{s.task}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* My Patients Section */}
        {activeSection === 'patients' && (
          <div className="mt-6">
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-gray-800">Assigned Patients</h2>
                <button className="btn-primary text-sm py-2 px-4">Add Patient</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-100">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Patient Name</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Last Session</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Session Count</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
                    ) : patientRows.length === 0 ? (
                      <tr><td colSpan={4} className="py-8 text-center text-gray-400 text-sm">No patients yet.</td></tr>
                    ) : patientRows.map((patient, i) => (
                      <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4 text-sm text-gray-800 font-medium">{patient.name}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.lastSession}</td>
                        <td className="py-3 px-4 text-sm text-gray-500">{patient.count} sessions</td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded-full ${patient.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {patient.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="mt-6 max-w-2xl">
            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Profile Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" defaultValue={currentUser?.name || ''} className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                  <input type="text" defaultValue="PSY-2024-001234" className="input-field w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                  <input type="text" defaultValue="Cognitive Behavioral Therapy, Career Counseling" className="input-field w-full" />
                </div>
              </div>
            </div>

            <div className="card mb-6">
              <h3 className="font-bold text-gray-800 mb-4">Availability Hours</h3>
              <div className="space-y-3">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{day}</span>
                    <div className="flex items-center gap-2">
                      <input type="time" defaultValue="09:00" className="input-field w-24 text-sm py-2" />
                      <span className="text-gray-400">—</span>
                      <input type="time" defaultValue="18:00" className="input-field w-24 text-sm py-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button className="btn-primary text-sm py-2 px-6">Save Changes</button>
              <button className="btn-outline text-sm py-2 px-6">Cancel</button>
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-xs text-gray-400">© 2024 MindBridge. Healing is a journey, not a destination.</p>
        </div>
      </main>
    </div>
  );
}
