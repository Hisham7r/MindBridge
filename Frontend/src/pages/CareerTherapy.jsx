import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

export default function CareerTherapy() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-white pt-16 pb-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-brand text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
                ✦ New · Match in Career Therapy
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Career is a<br />
                <span className="text-brand italic">Journey,</span> Not a<br />
                Graded Test.
              </h1>
              <p className="text-gray-500 mt-5 text-base leading-relaxed max-w-lg">
                Traditional coaching focuses on the resume. We focus on the person. Align your professional path with your mental well-being, family, strengths, and deepest values.
              </p>
              <div className="flex items-center gap-4 mt-8">
                <Link to="/therapists?track=career" className="btn-primary px-8 py-4 text-base">
                  Start Career Session
                </Link>
                <a href="#roadmap" className="btn-outline px-6 py-4 text-base">
                  Explore Roadmap
                </a>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="w-96 h-80 bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl flex items-center justify-center shadow-2xl">
                <div className="text-center text-white">
                  <div className="text-7xl mb-4">💼</div>
                  <p className="font-bold text-xl">Career Clarity</p>
                  <p className="text-gray-400 text-sm mt-1">کیریئر کی راہ روشن کریں</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bridge to Future — 3 stages */}
      <section className="bg-gray-50 py-20" id="roadmap">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The Bridge to Your Future</h2>
            <p className="text-gray-500 mt-2">A psychological approach to career growth that honours your mental peace.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: 'STAGE 1',
                icon: '🧭',
                title: 'Discover Interest',
                desc: 'We conduct clinical assessments to uncover what has been yours already, helping you move past the confusion.',
                color: 'bg-blue-50 border-blue-100',
                iconBg: 'bg-blue-100',
              },
              {
                step: 'STAGE 2',
                icon: '🌱',
                title: 'Core Alignment',
                desc: 'Work with therapists to link chronic career stifling problems and anxiety holding you back.',
                color: 'bg-green-50 border-green-100',
                iconBg: 'bg-green-100',
              },
              {
                step: 'STAGE 3',
                icon: '🗓',
                title: 'Get Expert Roadmap',
                desc: 'A domain expert sets up a concrete plan on actionable high-confidence steps with full authentic mental health.',
                color: 'bg-purple-50 border-purple-100',
                iconBg: 'bg-purple-100',
              },
            ].map((s) => (
              <div key={s.step} className={`card border-2 ${s.color} hover:shadow-lg transition-shadow`}>
                <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center text-2xl mb-4`}>
                  {s.icon}
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{s.step}</p>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <p className="text-2xl font-medium text-gray-700 leading-relaxed italic">
            "Success is not final, failure is not fatal: it is the{' '}
            <span className="text-brand font-bold">courage</span> to continue that counts."
          </p>
          <p className="text-gray-400 text-sm mt-4">— Career Sanctuary Philosophy</p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {['#22C55E','#3B82F6','#8B5CF6'].map((c,i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-white text-xs" style={{backgroundColor:c}}>
                {['A','B','C'][i]}
              </div>
            ))}
            <p className="text-sm text-gray-500 ml-2">Joined by 3,000+ professionals building new chapters.</p>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Large card */}
            <div className="bg-gray-900 rounded-3xl p-8 text-white flex flex-col justify-end min-h-64 relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">🏢</div>
              <h3 className="text-2xl font-bold relative z-10">Confidence starts within</h3>
              <p className="text-gray-400 text-sm mt-1 relative z-10">Master the self-belief and emotional vocabulary that drives your success.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-2xl p-5 flex flex-col justify-between border border-green-100">
                <div>
                  <span className="text-2xl">🚀</span>
                  <h4 className="font-bold text-gray-800 mt-2">Growth Without Burnout</h4>
                  <p className="text-xs text-gray-500 mt-1">Sustainable long-term career achievements.</p>
                </div>
              </div>
              <div className="bg-blue-600 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <span className="text-2xl">🔒</span>
                  <h4 className="font-bold text-white mt-2">Private & Secure</h4>
                  <p className="text-xs text-blue-200 mt-1">Your sessions are fully confidential.</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-2xl">🧠</span>
                <h4 className="font-bold text-gray-800 mt-2">Mental Clarity</h4>
                <p className="text-xs text-gray-500 mt-1">Clear the mental fog blocking your vision.</p>
              </div>
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <span className="text-2xl">🗺</span>
                <h4 className="font-bold text-gray-800 mt-2">Avoiding the Pitfalls</h4>
                <p className="text-xs text-gray-500 mt-1">Navigate career mistakes before they happen.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="bg-gray-900 py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white">Ready to rewrite your career narrative?</h2>
          <p className="text-gray-400 mt-4">Book a consultation with a Career Therapist today and start the most important project you'll ever work on: yourself.</p>
          <Link to="/therapists" className="btn-primary mt-8 inline-block px-10 py-4 text-base">
            Start Career Session
          </Link>
          <p className="text-gray-600 text-xs mt-4">Confidential sessions, available in Urdu and English.</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
