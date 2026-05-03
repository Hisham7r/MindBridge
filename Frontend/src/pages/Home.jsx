import { Link } from 'react-router-dom';
import { useState } from 'react';
import { therapists } from '../data/mockData';
import TherapistCard from '../components/TherapistCard';
import Footer from '../components/Footer';

export default function Home() {
  const [specialty, setSpecialty] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [language, setLanguage] = useState('');

  const filtered = therapists.filter((t) => {
    if (specialty && specialty !== 'all' && !t.specializations.includes(specialty)) return false;
    if (language && language !== 'all' && !t.languages.includes(language)) return false;
    if (priceRange === 'under4000' && t.fee >= 4000) return false;
    if (priceRange === '4000-5000' && (t.fee < 4000 || t.fee > 5000)) return false;
    if (priceRange === 'above5000' && t.fee <= 5000) return false;
    return true;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 via-white to-blue-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-4">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Mind Healing — ذہنی شفاء
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Book Your <br />
                <span className="text-brand italic">Therapy</span> Session<br />
                Online
              </h1>
              <p className="text-gray-500 mt-4 text-lg max-w-md">
                Find solace with our professional network of certified therapists. A safe space for your mental sanctuary.
              </p>
              <p className="text-gray-400 mt-1 text-sm leading-relaxed" style={{fontFamily: 'serif'}}>
                اپنی صحت، اپنا علاج، ہمارے ماہران سے ابھی سیشن بُک کریں
              </p>
              <div className="flex items-center gap-4 mt-8">
                <Link to="/therapists" className="btn-primary text-base px-8 py-3.5">
                  Find a Therapist →
                </Link>
                <a href="#how-it-works" className="btn-outline text-base px-6 py-3.5">
                  How it works
                </a>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2">
                  {['#22C55E','#3B82F6','#8B5CF6'].map((c,i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{backgroundColor: c}}>
                      {['A','B','C'][i]}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-800">1,800+</span> Happy Patients
                </p>
              </div>
            </div>
            <div className="relative hidden lg:block">
              <div className="w-full h-80 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="text-center">
                  <div className="text-6xl mb-4">🧘</div>
                  <p className="text-primary-700 font-semibold">Your mental sanctuary</p>
                  <p className="text-primary-500 text-sm">آپ کا ذہنی سکون</p>
                </div>
              </div>
              {/* Floating card */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-lg p-4 border border-gray-100">
                <p className="text-xs text-gray-500">Next available</p>
                <p className="font-bold text-gray-800">Today, 3:00 PM</p>
                <p className="text-xs text-brand">Dr. Sarah Ahmed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search / Filter Bar */}
      <section className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-48">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Expertise <span className="text-gray-400">تخصص</span></label>
              <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className="input-field text-sm">
                <option value="">All Specializations</option>
                <option value="Anxiety">Anxiety</option>
                <option value="Depression">Depression</option>
                <option value="Trauma">Trauma</option>
                <option value="Career Guidance">Career Guidance</option>
                <option value="CBT">CBT</option>
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Price Range <span className="text-gray-400">قیمت</span></label>
              <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className="input-field text-sm">
                <option value="">Any Price</option>
                <option value="under4000">Under PKR 4,000</option>
                <option value="4000-5000">PKR 4,000 – 5,000</option>
                <option value="above5000">Above PKR 5,000</option>
              </select>
            </div>
            <div className="flex-1 min-w-40">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Language <span className="text-gray-400">زبان</span></label>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="input-field text-sm">
                <option value="">All Languages</option>
                <option value="English">English</option>
                <option value="Urdu">Urdu</option>
                <option value="Punjabi">Punjabi</option>
              </select>
            </div>
            <button
              onClick={() => { setSpecialty(''); setPriceRange(''); setLanguage(''); }}
              className="btn-primary px-8 py-3"
            >
              🔍 Search
            </button>
          </div>
        </div>
      </section>

      {/* Therapists Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="section-title">Recommended Therapists</h2>
            <p className="section-subtitle">Carefully vetted professionals ready to listen.</p>
          </div>
          <Link to="/therapists" className="text-brand text-sm font-semibold hover:underline">View All →</Link>
        </div>
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🔍</p>
            <p>No therapists match your current filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t) => <TherapistCard key={t.id} therapist={t} />)}
          </div>
        )}
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-gradient-to-br from-gray-50 to-blue-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Book in Under 3 Minutes</h2>
            <p className="text-gray-500 mt-2">Simple, private, secure.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🔍', title: 'Find a Therapist', desc: 'Browse by specialty, language, and availability.' },
              { step: '02', icon: '📅', title: 'Book a Slot', desc: 'Pick a date and time that works for you.' },
              { step: '03', icon: '💳', title: 'Pay via EasyPaisa', desc: 'Simple manual payment — no bank account needed.' },
              { step: '04', icon: '🎥', title: 'Join on Zoom', desc: 'Receive your Zoom link and attend your session.' },
            ].map((s) => (
              <div key={s.step} className="card text-center hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{s.icon}</div>
                <p className="text-xs font-bold text-brand mb-1">STEP {s.step}</p>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Career Therapy CTA */}
      <section className="bg-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 opacity-80"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-primary-300 text-sm font-semibold uppercase tracking-widest mb-3">Elevate Your Growth</p>
              <h2 className="text-4xl font-bold leading-tight">Career Therapy for<br />Modern Professionals</h2>
              <p className="text-gray-400 mt-4 leading-relaxed">
                Don't let burnout define your potential. Our specialized program combines mental well-being with strategic career coaching to help you thrive in the workplace.
              </p>
              <p className="text-gray-500 text-sm mt-2" style={{fontFamily: 'serif'}}>
                کیا آپ اپنے کیریئر میں کھوئے ہوئے ہیں؟ ہم مدد کریں گے۔
              </p>
              <div className="flex flex-col gap-2 mt-6">
                <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span> Burnout Recovery & Prevention</div>
                <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span> Executive Coaching & Leadership</div>
                <div className="flex items-center gap-2 text-sm text-gray-300"><span className="text-green-400">✓</span> Navigating Career Transitions</div>
              </div>
              <Link to="/career-therapy" className="inline-block btn-primary mt-8 px-8 py-3.5">
                Explore the Program
              </Link>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="w-80 h-60 bg-gradient-to-br from-primary-800 to-primary-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="text-center text-white">
                  <div className="text-5xl mb-3">🚀</div>
                  <p className="font-bold text-lg">Your career, redefined.</p>
                  <p className="text-primary-200 text-sm mt-1">آپ کا مستقبل، نئی راہ</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
