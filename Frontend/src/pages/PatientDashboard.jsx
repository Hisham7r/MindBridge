import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useRole } from '../context/RoleContext';
import SidebarLink from '../components/SidebarLink';

// Backend sessions don't carry an avatar colour, so derive a stable one per
// therapist id from a fixed palette (keeps avatars colourful + consistent).
const AVATAR_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#22C55E'];
function colorForId(id) {
  let h = 0;
  for (const ch of String(id || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const trackLabel = (track) => (track === 'CAREER' ? 'Career Guidance' : 'Mental Health Therapy');
const fmtDate = (dt) => (dt ? new Date(dt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
const fmtTime = (dt) => (dt ? new Date(dt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : '—');

// ── Reminder-banner helpers ──────────────────────────────────────────────────
// Relative day label: "today" / "tomorrow" / "on Jun 26, 2026".
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const daysFromToday = (dt) => Math.round((startOfDay(new Date(dt)) - startOfDay(new Date())) / 86400000);
const dayLabel = (dt) => {
  const diff = daysFromToday(dt);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  return `on ${fmtDate(dt)}`;
};
// Urdu reminder: day word + time-of-day period (صبح/دوپہر/شام/رات) + hour.
const urduBanner = (dt) => {
  const diff = daysFromToday(dt);
  if (diff !== 0 && diff !== 1) return `آپ کا اگلا سیشن ${fmtDate(dt)} کو ہے`;
  const h = new Date(dt).getHours();
  const period = h < 5 ? 'رات' : h < 12 ? 'صبح' : h < 16 ? 'دوپہر' : h < 19 ? 'شام' : 'رات';
  return `آپ کا سیشن ${diff === 0 ? 'آج' : 'کل'} ${period} ${(h % 12) || 12} بجے ہے`;
};

// Past-sessions table — shared by the Overview ("Past Sessions History") and the
// Schedule "Past" tab. Shows only the most recent session by default; "View All"
// (the 4th column) expands/collapses the full history.
function PastSessionsTable({ pastList, loading, showAll, onToggle }) {
  const rows = showAll ? pastList : pastList.slice(0, 1);
  const hasMore = pastList.length > 1;
  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full table-fixed">
        <thead>
          <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
            <th className="w-1/4 text-left px-6 py-4">Therapist</th>
            <th className="w-1/4 text-left px-4 py-4">Date</th>
            <th className="w-1/4 text-left px-4 py-4">Duration</th>
            <th className="w-1/4 text-right px-6 py-4">
              {hasMore && (
                <button onClick={onToggle} className="text-brand text-sm font-semibold hover:underline normal-case">
                  {showAll ? 'View Less' : 'View All'}
                </button>
              )}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {loading ? (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
          ) : pastList.length === 0 ? (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-400 text-sm">No attended sessions yet.</td></tr>
          ) : rows.map((s) => (
            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: s.color }}>
                    {s.initials}
                  </div>
                  <span className="font-medium text-sm text-gray-800">{s.therapist}</span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600">{s.date}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{s.duration}</td>
              <td className="px-6 py-4"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PatientDashboard() {
  const { currentUser, logout, setCurrentUser } = useRole();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [scheduleTab, setScheduleTab] = useState('upcoming');
  const [showAllPast, setShowAllPast] = useState(false);

  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [profileForm, setProfileForm] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone || '',
    language: currentUser.language || 'English',
  });
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    let active = true;
    api.getMySessions()
      .then((data) => { if (active) setSessions(data); })
      .catch(() => { if (active) setSessions([]); })
      .finally(() => { if (active) setLoadingSessions(false); });
    return () => { active = false; };
  }, []);

  // ── Derive views from real session data ──────────────────────────────────
  const now = new Date();
  const isPast = (s) => {
    if (['COMPLETED', 'CANCELLED'].includes(s.status)) return true;
    const dt = s.slot?.datetime ? new Date(s.slot.datetime) : null;
    return dt ? dt < now : false;
  };

  // A rejected payment sends the session back to PENDING_PAYMENT on the backend,
  // so hide those bookings from the schedule entirely (they remain in Payments).
  const isRejected = (s) => String(s.payment?.status || '').toUpperCase() === 'REJECTED';
  const visibleSessions = sessions.filter((s) => !isRejected(s));

  const upcomingRaw = visibleSessions
    .filter((s) => !isPast(s))
    .sort((a, b) => new Date(a.slot?.datetime || 0) - new Date(b.slot?.datetime || 0));
  // "Past" = attended sessions only (the therapist marked them COMPLETED).
  // Cancelled or unpaid-but-elapsed bookings are intentionally not shown here.
  const pastRaw = visibleSessions
    .filter((s) => s.status === 'COMPLETED')
    .sort((a, b) => new Date(b.slot?.datetime || 0) - new Date(a.slot?.datetime || 0));

  const upcomingSessions = upcomingRaw.map((s) => ({
    id: s.id,
    therapist: s.therapist?.name || 'Therapist',
    therapistInitials: s.therapist?.initials || '–',
    therapistColor: colorForId(s.therapist?.id),
    type: trackLabel(s.therapist?.track),
    date: fmtDate(s.slot?.datetime),
    time: fmtTime(s.slot?.datetime),
    status: s.status,
    zoomLink: s.zoomLink,
    sessionNumber: s.sessionNumber,
  }));

  const pastList = pastRaw.map((s) => ({
    id: s.id,
    therapist: s.therapist?.name || 'Therapist',
    initials: s.therapist?.initials || '–',
    color: colorForId(s.therapist?.id),
    date: fmtDate(s.slot?.datetime),
    duration: `${s.durationMins || 60} mins`,
  }));

  const paymentsList = sessions
    .filter((s) => s.payment)
    .sort((a, b) => new Date(b.slot?.datetime || b.createdAt || 0) - new Date(a.slot?.datetime || a.createdAt || 0))
    .map((s) => ({
      id: s.payment.id,
      therapist: s.therapist?.name || 'Therapist',
      therapistInitials: s.therapist?.initials || '–',
      therapistColor: colorForId(s.therapist?.id),
      sessionType: trackLabel(s.therapist?.track),
      date: fmtDate(s.slot?.datetime || s.createdAt),
      amount: `PKR ${Number(s.payment.totalPkr || 0).toLocaleString()}`,
      ref: `#${String(s.payment.id).slice(0, 8)}`,
      status: String(s.payment.status || '').toLowerCase(),
    }));

  // Payment summary stats (all computed from real data)
  const approvedCount = paymentsList.filter((p) => p.status === 'approved').length;
  const pendingPaymentsCount = paymentsList.filter((p) => p.status === 'pending').length;
  const totalPaid = sessions
    .filter((s) => s.payment && String(s.payment.status).toUpperCase() === 'APPROVED')
    .reduce((sum, s) => sum + Number(s.payment.totalPkr || 0), 0);
  const nextSession = upcomingRaw[0] || null;
  const nextFee = nextSession ? Number(nextSession.therapist?.feePkr || 0) + 250 : 0;

  const sectionMeta = {
    overview: { title: 'Patient Dashboard', subtitle: 'Manage your healing journey and therapist sessions.' },
    schedule: { title: 'My Schedule', subtitle: 'All your booked therapy sessions.' },
    payments: { title: 'My Payments', subtitle: 'Track your session payments and verification status.' },
    progress: { title: 'My Progress', subtitle: 'Track your wellness journey and session milestones.' },
    settings: { title: 'Settings', subtitle: 'Manage your profile and preferences.' },
  };

  // Persist profile changes via PATCH /auth/me (name/phone/language — email is
  // the login identity and can't be changed).
  const handleProfileSave = async () => {
    setProfileError('');
    setSavingProfile(true);
    try {
      const user = await api.updateMe({
        name: profileForm.name.trim(),
        language: profileForm.language,
        // Backend ignores empty strings; only send a phone if one was entered.
        ...(profileForm.phone.trim() && { phone: profileForm.phone.trim() }),
      });
      setCurrentUser({
        ...currentUser,
        name: user.name,
        phone: user.phone,
        language: user.language,
        initials: user.initials,
      });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (err) {
      const detail = err.details?.[0]?.message;
      setProfileError(detail || err.message || 'Could not save changes. Please try again.');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="flex items-center gap-3 mb-8 mt-2">
          <div className="w-12 h-12 rounded-full bg-primary-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
            <span className="font-bold text-primary-700">{currentUser.initials}</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Welcome back</p>
            <p className="text-sm font-bold text-gray-800">{currentUser.name}</p>
            <p className="text-xs text-gray-400">Your mental sanctuary</p>
          </div>
        </div>

        <nav className="space-y-1 flex-1">
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            }
            label="Overview"
            active={activeSection === 'overview'}
            onClick={() => setActiveSection('overview')}
          />
          <SidebarLink
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 opacity-90">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
                <path d="M8 14h.01"></path>
                <path d="M12 14h.01"></path>
                <path d="M16 14h.01"></path>
                <path d="M8 18h.01"></path>
                <path d="M12 18h.01"></path>
                <path d="M16 18h.01"></path>
              </svg>
            }
            label="Schedule"
            active={activeSection === 'schedule'}
            onClick={() => setActiveSection('schedule')}
          />
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            label="Payments"
            active={activeSection === 'payments'}
            onClick={() => setActiveSection('payments')}
          />
          <SidebarLink
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" strokeWidth="2.25">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            label="Settings"
            active={activeSection === 'settings'}
            onClick={() => setActiveSection('settings')}
          />
        </nav>

        <div className="mt-4 space-y-3">

          <Link to="/therapists" className="btn-primary w-full text-center py-2.5 text-sm block">
            Book Session
          </Link>

          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors w-full"
          >
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-56 flex-1 flex flex-col">
        {/* Reminder Banner — reflects the patient's next upcoming session */}
        {nextSession?.slot?.datetime && (
          <div className="bg-green-50 border-b border-green-100 px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">📅</span>
              <div>
                <p className="text-sm font-semibold text-green-800">
                  Your session is {dayLabel(nextSession.slot.datetime)} at {fmtTime(nextSession.slot.datetime)}
                </p>
                <p className="text-xs text-green-600" style={{ fontFamily: 'serif' }}>{urduBanner(nextSession.slot.datetime)}</p>
              </div>
            </div>
            <button
              onClick={() => setActiveSection('schedule')}
              className="bg-gray-800 text-white text-xs font-semibold px-4 py-1.5 rounded-full hover:bg-gray-700 transition-colors"
            >
              VIEW DETAILS
            </button>
          </div>
        )}

        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">{sectionMeta[activeSection].title}</h1>
            <p className="text-gray-500 mt-1">{sectionMeta[activeSection].subtitle}</p>
          </div>

          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && (
            <>
              {/* Upcoming Sessions */}
              <section className="mb-8">
                <h2 className="font-bold text-gray-800 text-lg mb-4">Upcoming Sessions</h2>
                {loadingSessions ? (
                  <p className="text-sm text-gray-400">Loading sessions…</p>
                ) : upcomingSessions.length === 0 ? (
                  <div className="card text-center text-gray-400 py-8">
                    No upcoming sessions. <Link to="/therapists" className="text-brand font-semibold hover:underline">Book one →</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {upcomingSessions.map(session => (
                      <div key={session.id} className="card flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                          style={{ backgroundColor: session.therapistColor }}
                        >
                          {session.therapistInitials}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{session.therapist}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" className="flex-shrink-0">
                              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                              <line x1="12" y1="12" x2="12" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <line x1="12" y1="12" x2="8.5" y2="15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                            </svg>
                            {session.status === 'upcoming' ? `Tomorrow, ${session.time}` : session.date + ' • ' + session.time}
                          </p>
                        </div>
                        {session.zoomLink ? (
                          <a href={session.zoomLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-4 whitespace-nowrap">
                            📹 Join Session
                          </a>
                        ) : (
                          <button className="btn-outline text-xs py-2 px-3">Reschedule</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Past Sessions */}
              <section>
                <h2 className="font-bold text-gray-800 text-lg mb-4">Past Sessions History</h2>
                <PastSessionsTable
                  pastList={pastList}
                  loading={loadingSessions}
                  showAll={showAllPast}
                  onToggle={() => setShowAllPast((v) => !v)}
                />
              </section>
            </>
          )}

          {/* SECTION 2: SCHEDULE */}
          {activeSection === 'schedule' && (
            <section>
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setScheduleTab('upcoming')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    scheduleTab === 'upcoming'
                      ? 'bg-brand text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
                  }`}
                >
                  Upcoming
                </button>
                <button
                  onClick={() => setScheduleTab('past')}
                  className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                    scheduleTab === 'past'
                      ? 'bg-brand text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'
                  }`}
                >
                  Past
                </button>
              </div>

              {scheduleTab === 'upcoming' && (
                loadingSessions ? (
                  <p className="text-sm text-gray-400">Loading sessions…</p>
                ) : upcomingSessions.length === 0 ? (
                  <div className="card text-center text-gray-400 py-8">
                    No upcoming sessions. <Link to="/therapists" className="text-brand font-semibold hover:underline">Book one →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {upcomingSessions.map(session => (
                      <div key={session.id} className="card flex items-center gap-4">
                        <div
                          className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0"
                          style={{ backgroundColor: session.therapistColor }}
                        >
                          {session.therapistInitials}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-gray-800">{session.therapist}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{session.type}</p>
                          <p className="text-xs text-gray-500 mt-1">📅 {session.date} at {session.time}</p>
                          <p className="text-xs text-brand mt-1">Session #{session.sessionNumber}</p>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {session.zoomLink ? (
                            <a href={session.zoomLink} target="_blank" rel="noreferrer" className="btn-primary text-xs py-2 px-3 text-center">
                              📹 Join
                            </a>
                          ) : (
                            <span className="badge badge-gray text-xs">Zoom link pending</span>
                          )}
                          <button className="btn-outline text-xs py-1.5 px-3">Cancel</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {scheduleTab === 'past' && (
                <PastSessionsTable
                  pastList={pastList}
                  loading={loadingSessions}
                  showAll={showAllPast}
                  onToggle={() => setShowAllPast((v) => !v)}
                />
              )}
            </section>
          )}

          {/* SECTION 3: PAYMENTS */}
          {activeSection === 'payments' && (
            <section>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Total Paid</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">PKR {totalPaid.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-1">{approvedCount} approved session{approvedCount === 1 ? '' : 's'}</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{pendingPaymentsCount} Payment{pendingPaymentsCount === 1 ? '' : 's'}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting admin review</p>
                </div>
                <div className="card">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest">Next Session Fee</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{nextSession ? `PKR ${nextFee.toLocaleString()}` : '—'}</p>
                  <p className="text-xs text-gray-500 mt-1">{nextSession ? `${trackLabel(nextSession.therapist?.track)}, ${fmtDate(nextSession.slot?.datetime)}` : 'No upcoming sessions'}</p>
                </div>
              </div>

              <div className="card overflow-hidden p-0 mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-xs font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">
                      <th className="text-left px-6 py-4">Session</th>
                      <th className="text-left px-4 py-4">Date</th>
                      <th className="text-left px-4 py-4">Amount</th>
                      <th className="text-left px-4 py-4">Reference</th>
                      <th className="text-left px-4 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loadingSessions ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">Loading…</td></tr>
                    ) : paymentsList.length === 0 ? (
                      <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 text-sm">No payments yet.</td></tr>
                    ) : paymentsList.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                              style={{ backgroundColor: p.therapistColor }}
                            >
                              {p.therapistInitials}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-800">{p.therapist}</p>
                              <p className="text-xs text-gray-400">{p.sessionType}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-sm text-gray-600">{p.date}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-gray-800">{p.amount}</td>
                        <td className="px-4 py-4 text-xs font-mono text-gray-500">{p.ref}</td>
                        <td className="px-4 py-4">
                          {p.status === 'approved' && <span className="badge badge-green">✓ Approved</span>}
                          {p.status === 'pending' && <span className="badge bg-yellow-100 text-yellow-700">⏳ Pending Review</span>}
                          {p.status === 'rejected' && <span className="badge badge-red">✗ Rejected</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <p className="text-sm text-blue-800">ℹ️ Payments are verified within 2 hours during working hours. You will receive a confirmation once your session is confirmed.</p>
              </div>
            </section>
          )}

          {/* SECTION 5: SETTINGS */}
          {activeSection === 'settings' && (
            <section className="max-w-2xl">
              <div className="card mb-6">
                <h3 className="font-bold text-gray-800 mb-6">Personal Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Full Name</label>
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Email Address</label>
                    <input
                      type="email"
                      value={profileForm.email}
                      readOnly
                      className="input-field w-full bg-gray-50 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-400 mt-1">Your email is your login and can't be changed.</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Preferred Language</label>
                    <select
                      value={profileForm.language}
                      onChange={(e) => setProfileForm({ ...profileForm, language: e.target.value })}
                      className="input-field w-full"
                    >
                      <option>English</option>
                      <option>Urdu</option>
                      <option>Punjabi</option>
                    </select>
                  </div>
                  <button onClick={handleProfileSave} disabled={savingProfile} className="btn-primary text-sm py-2 px-6 mt-4 disabled:opacity-60 disabled:cursor-not-allowed">
                    {savingProfile ? 'Saving…' : 'Save Changes'}
                  </button>
                  {profileSaved && <p className="text-xs text-green-600 mt-2">✅ Profile updated successfully!</p>}
                  {profileError && <p className="text-xs text-red-600 mt-2">{profileError}</p>}
                </div>
              </div>

            </section>
          )}
        </div>

        {/* Footer */}
        <div className="mt-auto border-t border-gray-100 px-8 py-6 bg-white">
          <div className="grid grid-cols-3 gap-8 text-sm">
            <div>
              <span className="font-bold text-brand">MindBridge</span>
              <p className="text-gray-500 mt-1 text-xs">Healing is a journey, not a destination. Your mental sanctuary, available 24/7.</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Resources</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer">Urdu Support</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Crisis Resources</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Contact Us</p>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Legal</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer">Privacy Policy</p>
              <p className="text-gray-400 text-xs hover:text-brand cursor-pointer mt-1">Terms of Service</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-4 border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-400">© 2026 MindBridge. Healing is a journey, not a destination.</p>
            <div className="flex gap-2">
              <span className="text-lg cursor-pointer">🌐</span>
              <span className="text-lg cursor-pointer">💙</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
