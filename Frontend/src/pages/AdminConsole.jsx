import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminPayments, adminTherapists } from '../data/mockData';
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
  const { setRole, role, currentUser } = useRole();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('overview');
  const [activeSubSection, setActiveSubSection] = useState(null);
  const [payments, setPayments] = useState(adminPayments);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [hoursSaved, setHoursSaved] = useState(false);
  
  const navItems = getNavByRole(role);

  function approvePayment(id) {
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, status: 'approved' } : pay));
  }
  function rejectPayment(id) {
    setPayments(p => p.map(pay => pay.id === id ? { ...pay, status: 'rejected' } : pay));
  }

  const pending = payments.filter(p => p.status === 'pending');

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Sidebar */}
      <aside className="w-56 bg-white border-r border-gray-100 flex flex-col p-4 shrink-0 fixed left-0 top-0 h-full z-10">
        <div className="mb-3 mt-1">
          <span className="text-lg font-bold text-brand">MindBridge</span>
        </div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-white shadow">
            <span className="font-bold text-gray-600 text-sm">AD</span>
          </div>
          <div>
            <p className="text-xs text-gray-400">Welcome back</p>
            <p className="text-sm font-bold text-gray-800">Admin</p>
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
            onClick={() => { setRole('guest'); navigate('/'); }}
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
          {[
            { label: 'ACTIVE PATIENTS', value: '8,342', change: 'Users in last 30 days', icon: '👥', positive: true },
            { label: 'NEW SIGNUPS', value: '342', change: 'Growth this week', icon: '📈', positive: true },
            { label: 'RETENTION RATE', value: '76%', change: 'Month-over-month', icon: '📊', positive: true },
            { label: 'REVENUE', value: '$42.8k', change: '-2% vs last month', icon: '💰', positive: false },
          ].map((s) => (
            <div key={s.label} className="card">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{s.label}</p>
                <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-xl">{s.icon}</div>
              </div>
              <p className="text-3xl font-bold text-gray-900 mt-3">{s.value}</p>
              <p className={`text-xs mt-1 font-medium ${s.positive ? 'text-green-600' : 'text-red-500'}`}>
                {s.positive ? '↑' : '↘'} {s.change}
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

            <div className="mt-4">
              <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pb-2 border-b border-gray-50">
                <span>User</span>
                <span className="text-center">Amount</span>
                <span className="text-right">Proof</span>
              </div>
              <div className="divide-y divide-gray-50 mt-2">
                {payments.map(pay => (
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
                          <button onClick={() => approvePayment(pay.id)} className="text-green-600 hover:text-green-700 text-xl transition-colors">✓</button>
                          <button onClick={() => rejectPayment(pay.id)} className="text-red-400 hover:text-red-600 text-xl transition-colors">✗</button>
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

        {/* Therapist Stats Table in Overview */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">Therapist Performance Snapshot</h2>
            <button className="btn-outline text-xs py-2">+ Add Therapist</button>
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
                {adminTherapists.map(t => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-sm text-gray-800">{t.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.patientsToday}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.patientsWeek}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.totalAllTime}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{t.upcoming}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button className="text-brand text-xs hover:underline font-medium">Edit</button>
                      <button className="text-red-400 text-xs hover:underline font-medium">Suspend</button>
                    </td>
                  </tr>
                ))}
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
                      <th className="text-left px-4 py-3">Rating</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-left px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adminTherapists.map(t => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-sm text-gray-800">{t.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">Mental Health & Wellness</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{t.totalAllTime}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">4.8 ⭐</td>
                        <td className="px-4 py-3">
                          <span className={`badge ${t.status === 'Active' ? 'badge-green' : 'badge-gray'}`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button className="text-brand text-xs hover:underline font-medium">View</button>
                          <button className="text-brand text-xs hover:underline font-medium">Edit</button>
                          <button className="text-red-400 text-xs hover:underline font-medium">Suspend</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <p className="text-gray-600 text-sm mb-4">🔍 Searchable patient database</p>
                <input 
                  type="text" 
                  placeholder="Search patients by name, email, or ID..." 
                  className="input-field w-full max-w-md mb-4"
                />
                <p className="text-xs text-gray-400">Patient management dashboard coming soon</p>
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

              <div className="mt-4">
                <div className="grid grid-cols-3 text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 pb-2 border-b border-gray-50">
                  <span>Therapist</span>
                  <span className="text-center">Amount</span>
                  <span className="text-right">Bank Proof</span>
                </div>
                <div className="divide-y divide-gray-50 mt-2">
                  {payments.map(pay => (
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
                            <button onClick={() => approvePayment(pay.id)} className="text-green-600 hover:text-green-700 text-xl transition-colors" title="Approve">✓</button>
                            <button onClick={() => rejectPayment(pay.id)} className="text-red-400 hover:text-red-600 text-xl transition-colors" title="Reject">✗</button>
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

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="card text-center py-12">
            <p className="text-3xl mb-4">🔒</p>
            <h2 className="font-bold text-gray-800 mb-2">Approval Workflows</h2>
            <p className="text-xs text-gray-400">Therapist vetting, content moderation, and flagged user reviews coming soon.</p>
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
      </main>
    </div>
  );
}
