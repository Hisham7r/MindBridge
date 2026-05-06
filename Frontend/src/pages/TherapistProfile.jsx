import { useParams, Link } from 'react-router-dom';
import { therapists } from '../data/mockData';
import Footer from '../components/Footer';

export default function TherapistProfile() {
  const { id } = useParams();
  const therapist = therapists.find(t => t.id === parseInt(id));

  if (!therapist) return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center">
        <p className="text-5xl mb-4">😔</p>
        <p className="text-gray-600 mb-2 font-medium">Therapist not found.</p>
        <Link to="/therapists" className="btn-primary mt-4 inline-block">Browse Therapists</Link>
      </div>
    </div>
  );

  const displayLanguages = therapist.languages.filter(l => ['English', 'Urdu'].includes(l));

  const langSubtext = {
    English: 'Native proficiency',
    Urdu: 'میں اردو میں بات کر سکتی ہوں۔',
  };

  const feeUSD = Math.round(therapist.fee / 280);

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top Grid: Photo + Content ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">

          {/* ── LEFT: Photo Card ── */}
          <div className="lg:col-span-1 flex flex-col gap-4">
            {/* Hero image / avatar */}
            <div className="relative rounded-2xl overflow-hidden shadow-lg" style={{ minHeight: 260 }}>
              {/* Coloured avatar background */}
              <div
                className="w-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: therapist.color, height: 280, fontSize: '5rem' }}
              >
                {therapist.initials}
              </div>

              {/* Glassmorphism name overlay */}
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3"
                style={{
                  background: 'rgba(255,255,255,0.18)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  borderTop: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <h1 className="text-white font-bold text-lg leading-tight drop-shadow">{therapist.name}</h1>
                <p className="text-white/80 text-sm">{therapist.title}</p>
              </div>
            </div>

            {/* Fee + Rating pills */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-green-50 border border-green-100 p-3 text-center">
                <p className="text-[10px] font-semibold text-green-600 uppercase tracking-wide mb-1">Session Rate</p>
                <p className="text-xl font-bold text-gray-900">
                  ${feeUSD}<span className="text-sm font-normal text-gray-500">/hr</span>
                </p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-200 p-3 text-center">
                <div className="flex items-center justify-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className={`text-base ${s <= Math.floor(therapist.rating) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">{therapist.rating} ({therapist.reviews}+ reviews)</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Content ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            {/* About */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h2 className="text-xl font-bold text-gray-900 mb-2">About {therapist.name}</h2>
              <p className="text-gray-600 text-sm leading-relaxed">{therapist.about}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {therapist.specializations.map(s => (
                  <span
                    key={s}
                    className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center gap-2 mb-4">
                {/* Professional Language Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#4B5563"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
                <h3 className="font-semibold text-gray-800">Languages</h3>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                {displayLanguages.map(l => (
                  <div key={l}>
                    <p className="font-semibold text-gray-800 text-sm">{l}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{langSubtext[l] || ''}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Book Appointment CTA */}
            <Link
              to={`/book/${therapist.id}`}
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-white font-semibold text-base shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #1A56DB 0%, #2563EB 100%)',
                letterSpacing: '-0.01em'
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 opacity-90"
              >
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
              <span>Book Appointment</span>
            </Link>
          </div>
        </div>

        {/* ── Bottom Section: Healing Journey + Sidebar ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Start Your Healing Journey ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center text-center">
              {/* Decorative cross icon */}
              <div className="mb-4">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <rect x="20" y="4" width="8" height="40" rx="4" fill="#BFDBFE" />
                  <rect x="4" y="20" width="40" height="8" rx="4" fill="#BFDBFE" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Start Your Healing Journey</h3>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
                Take the first step towards mental wellness with{' '}
                <span className="text-brand font-medium">{therapist.name}</span>. Sessions are available in-person or via secure video link.
              </p>
              <Link
                to={`/book/${therapist.id}`}
                className="flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-semibold text-sm shadow transition-all hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #1A56DB 0%, #2563EB 100%)' }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.25"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 opacity-90"
                >
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
                <span>Book Session</span>
              </Link>
            </div>
          </div>

          {/* ── RIGHT: Sidebar ── */}
          <div className="lg:col-span-1 flex flex-col gap-4">

            {/* Methodology */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A56DB" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4l3 3" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Methodology</p>
                  <p className="text-xs text-gray-500 mt-0.5">{therapist.methodology}</p>
                </div>
              </div>
            </div>

            {/* Patient Review */}
            {therapist.patientReview && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Patient Review</p>
                <p className="text-sm text-gray-700 italic leading-relaxed">
                  "{therapist.patientReview.text}"
                </p>
                <p className="text-xs text-gray-500 mt-3 font-medium">— {therapist.patientReview.author}</p>
              </div>
            )}

            {/* If no review, show a credentials card instead */}
            {!therapist.patientReview && (
              <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5 text-center">
                <p className="text-brand font-bold text-2xl">{therapist.sessionsCount}+</p>
                <p className="text-xs text-gray-500 mt-1">Sessions Completed</p>
              </div>
            )}
          </div>
        </div>

      </div>
      <Footer />
    </div>
  );
}
