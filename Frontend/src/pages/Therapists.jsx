import { useState, useEffect } from 'react';
import { api } from '../services/api';
import TherapistCard from '../components/TherapistCard';
import Footer from '../components/Footer';

export default function Therapists() {
  const [therapists, setTherapists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [specialty, setSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [language, setLanguage] = useState('');
  const [track, setTrack] = useState('');

  useEffect(() => {
    let active = true;
    api
      .getTherapists()
      .then((data) => { if (active) setTherapists(data); })
      .catch((err) => { if (active) setError(err.message || 'Could not load therapists.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filtered = therapists.filter((t) => {
    if (specialty && !t.specializations.includes(specialty)) return false;
    if (language && !t.languages.includes(language)) return false;
    if (track && t.track !== track) return false;
    if (priceRange === 'under4000' && !(t.fee < 4000)) return false;
    if (priceRange === '4000-5000' && !(t.fee >= 4000 && t.fee <= 5000)) return false;
    if (priceRange === 'above5000' && !(t.fee > 5000)) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <section className="bg-gradient-to-r from-primary-50 to-blue-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900">Our Therapists</h1>
          <p className="text-gray-500 mt-2">Carefully vetted professionals ready to listen.</p>
          <p className="text-gray-400 text-sm mt-1" style={{fontFamily:'serif'}}>ہمارے ماہر معالجین — آپ کی سننے کے لیے تیار</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Track selector */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            { value: '', label: 'All' },
            {
              value: 'mental-health',
              label: (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-4 h-4"
                  >
                    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                    <path d="M15 13a4.5 4.5 0 0 1-3-4" />
                    <path d="M9 13a4.5 4.5 0 0 0 3-4" />
                  </svg>
                  Mental Health Therapy
                </span>
              )
            },
            {
              value: 'career',
              label: (
                <span className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                  >
                    {/* Solid Silhouette Figure */}
                    <g fill="currentColor">
                      <circle cx="12" cy="4.5" r="2.5" />
                      <path d="M15 8H9a2 2 0 0 0-2 2v6a1 1 0 0 0 2 0v-5h.5v10a1 1 0 0 0 2 0v-7h1v7a1 1 0 0 0 2 0v-10h.5v5a1 1 0 0 0 2 0v-6a2 2 0 0 0-2-2z" />
                    </g>
                    {/* Outward Pointing Arrows */}
                    <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
                      <path d="M6 14L1 11 M3.5 9.5L1 11l1.5 2.5" />
                      <path d="M6 18L1 21 M2.5 18.5L1 21l2.5 1.5" />
                      <path d="M18 14l5-3 M20.5 9.5L23 11l-1.5 2.5" />
                      <path d="M18 18l5 3 M21.5 18.5L23 21l-2.5 1.5" />
                    </g>
                  </svg>
                  Career Guidance
                </span>
              )
            },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTrack(t.value)}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${track === t.value ? 'bg-brand text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand hover:text-brand'}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden md:block w-60 shrink-0">
            <div className="card sticky top-24">
              <h3 className="font-bold text-gray-800 mb-4">Filters</h3>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Specialty</label>
                  <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-field text-sm">
                    <option value="">Any</option>
                    {['Anxiety','Depression','Trauma','CBT','Career Guidance','Couples Therapy','PTSD'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Price Range</label>
                  <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="input-field text-sm">
                    <option value="">Any Price</option>
                    <option value="under4000">Under PKR 4,000</option>
                    <option value="4000-5000">PKR 4,000 – 5,000</option>
                    <option value="above5000">Above PKR 5,000</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Language</label>
                  {['English','Urdu','Punjabi'].map(l => (
                    <label key={l} className="flex items-center gap-2 py-1 cursor-pointer">
                      <input type="radio" name="lang" value={l} checked={language === l} onChange={(e) => setLanguage(e.target.value)} className="accent-brand" />
                      <span className="text-sm text-gray-600">{l}</span>
                    </label>
                  ))}
                  <label className="flex items-center gap-2 py-1 cursor-pointer">
                    <input type="radio" name="lang" value="" checked={language === ''} onChange={() => setLanguage('')} className="accent-brand" />
                    <span className="text-sm text-gray-600">Any</span>
                  </label>
                </div>
                <button
                  onClick={() => { setSpecialty(''); setPriceRange(''); setLanguage(''); setTrack(''); }}
                  className="w-full text-sm text-gray-400 hover:text-red-500 transition-colors mt-2"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          </aside>

          {/* Therapist grid */}
          <main className="flex-1">
            {loading ? (
              <div className="text-center py-20 card">
                <p className="text-gray-400">Loading therapists…</p>
              </div>
            ) : error ? (
              <div className="text-center py-20 card">
                <p className="text-4xl mb-3">⚠️</p>
                <p className="text-red-500">{error}</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-500 mb-4">{filtered.length} therapists available</p>
                {filtered.length === 0 ? (
                  <div className="text-center py-20 card">
                    <p className="text-4xl mb-3">🔍</p>
                    <p className="text-gray-500">No therapists match your filters.</p>
                    <button onClick={() => { setSpecialty(''); setPriceRange(''); setLanguage(''); setTrack(''); }} className="btn-outline mt-4 text-sm">
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((t) => <TherapistCard key={t.id} therapist={t} />)}
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
