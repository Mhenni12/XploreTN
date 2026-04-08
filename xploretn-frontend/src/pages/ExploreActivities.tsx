import { Link } from 'react-router-dom';

export default function ExploreActivities() {
  return (
    <div className="pt-28 pb-32 min-h-screen px-4 md:px-8 max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
      {/* Filter Sidebar */}
      <aside className="w-full md:w-80 shrink-0">
        <div className="sticky top-28 bg-surface-container-low p-8 rounded-[2rem] relative overflow-hidden">
          <div className="absolute inset-0 arabesque-pattern pointer-events-none"></div>
          <h2 className="font-headline text-2xl font-bold mb-8 text-primary">Refine Your Search</h2>
          <div className="space-y-8">
            {/* Categories */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Experience Category</p>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-full bg-primary text-white text-sm font-medium">All Activities</button>
                <button className="px-4 py-2 rounded-full bg-white text-on-surface text-sm font-medium hover:bg-secondary-container transition-colors">Culinary</button>
                <button className="px-4 py-2 rounded-full bg-white text-on-surface text-sm font-medium hover:bg-secondary-container transition-colors">Archaeology</button>
                <button className="px-4 py-2 rounded-full bg-white text-on-surface text-sm font-medium hover:bg-secondary-container transition-colors">Crafts</button>
                <button className="px-4 py-2 rounded-full bg-white text-on-surface text-sm font-medium hover:bg-secondary-container transition-colors">Coastal</button>
              </div>
            </div>
            {/* Price Range */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Investment</p>
              <div className="relative pt-1">
                <input className="w-full h-2 bg-secondary-fixed-dim rounded-lg appearance-none cursor-pointer accent-primary" type="range" />
                <div className="flex justify-between text-xs mt-2 font-medium">
                  <span>20 TND</span>
                  <span>500+ TND</span>
                </div>
              </div>
            </div>
            {/* Duration */}
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">Duration</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border-2 border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors">
                    <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-has-[:checked]:opacity-100"></div>
                  </div>
                  <input className="hidden" type="checkbox" />
                  <span className="text-sm font-medium">Short (1-3 hours)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border-2 border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors">
                    <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-has-[:checked]:opacity-100"></div>
                  </div>
                  <input className="hidden" type="checkbox" />
                  <span className="text-sm font-medium">Half Day (4-6 hours)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="w-5 h-5 rounded border-2 border-outline-variant flex items-center justify-center group-hover:border-primary transition-colors">
                    <div className="w-2.5 h-2.5 bg-primary rounded-sm opacity-0 group-has-[:checked]:opacity-100"></div>
                  </div>
                  <input className="hidden" type="checkbox" />
                  <span className="text-sm font-medium">Full Day (8+ hours)</span>
                </label>
              </div>
            </div>
            <button className="w-full py-4 rounded-full bg-gradient-to-br from-[#003873] to-[#1D4F91] text-white font-bold text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
              Apply Filters
            </button>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <section className="flex-1">
        <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 gap-4">
          <div>
            <h1 className="font-headline text-5xl font-black text-primary leading-tight">Curated Experiences</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Hand-picked by our local editorial team across Tunisia.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-surface-container-high px-4 py-2 rounded-full">
            <span className="text-on-surface-variant">Sort by:</span>
            <select className="bg-transparent border-none focus:ring-0 font-bold text-primary cursor-pointer">
              <option>Editor's Choice</option>
              <option>Newest First</option>
              <option>Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Bento Grid of Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Activity Card 1 */}
          <article className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
            <Link to="/experience/1">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img alt="Sidi Bou Said view" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://www.bigworldsmallpockets.com/wp-content/uploads/2023/07/Tunisia-Sidi-Bou-Said-Me-in-Doorway.jpg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">From</span>
                  <span className="text-lg font-black text-primary">85 TND</span>
                </div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-tertiary-fixed text-on-tertiary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">star</span>
                  4.9 (124 reviews)
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
                  <span className="material-symbols-outlined text-sm">palette</span> Art &amp; Heritage
                </div>
                <h3 className="font-headline text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">The Blue Alchemy: Sidi Bou Said Photography Walk</h3>
                <p className="text-on-surface-variant line-clamp-2 leading-relaxed mb-6">Capture the ethereal light of the 'Blue City' with a professional editorial photographer. Discover hidden courtyards and private jasmine gardens.</p>
                <div className="flex items-center gap-6 border-t border-surface-container-high pt-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                    <span className="text-sm font-medium">3 Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">group</span>
                    <span className="text-sm font-medium">Max 6 people</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
          
          {/* Activity Card 2 */}
          <article className="group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10">
            <Link to="/experience/2">
              <div className="aspect-[4/5] relative overflow-hidden">
                <img alt="Tunisian Cuisine" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtvdYzjk1Q-4egoSFds74k9wxwp1M8TGCSWEK3bdr38NjC-HMya5PjacHG6drLr1dzk0tjQ3f45PFOuGFpvpUaEAWylGuKoj-bnF7DBnVwlpN3OVtd0In1Qnw1Wf_73P1fXzse_vzp8OpOixU6lkBq3F8XJg3edtd7OCOzaY27g8TQXJbtpfQsKgSNjkMIQipifT355LHvTffQ0SZEGLPkkXdc46COpggzbg8ubapIs8du3YtjdUp0oHPvKZbc8ShFAlpYeAeN7u0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute top-6 right-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">From</span>
                  <span className="text-lg font-black text-primary">60 TND</span>
                </div>
                <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-secondary-fixed text-on-secondary-fixed-variant px-3 py-1.5 rounded-full text-xs font-bold">
                  <span className="material-symbols-outlined text-sm">restaurant</span>
                  5.0 (89 reviews)
                </div>
              </div>
              <div className="p-8">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
                  <span className="material-symbols-outlined text-sm">local_dining</span> Gastronomy
                </div>
                <h3 className="font-headline text-3xl font-bold text-on-surface mb-3 group-hover:text-primary transition-colors">The Medina Kitchen: A Private Masterclass</h3>
                <p className="text-on-surface-variant line-clamp-2 leading-relaxed mb-6">Join Mouna in her family’s 17th-century home to learn the secrets of perfect Couscous and Harissa from scratch.</p>
                <div className="flex items-center gap-6 border-t border-surface-container-high pt-6">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">schedule</span>
                    <span className="text-sm font-medium">5 Hours</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant">translate</span>
                    <span className="text-sm font-medium">French, Arabic, English</span>
                  </div>
                </div>
              </div>
            </Link>
          </article>
          
          {/* Activity Card 3 (Large Spanning) */}
          <article className="lg:col-span-2 group relative bg-surface-container-lowest rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10 flex flex-col md:flex-row">
            <Link to="/experience/3" className="w-full flex flex-col md:flex-row">
              <div className="w-full md:w-2/5 relative overflow-hidden">
                <img alt="El Jem Amphitheatre" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB_DZh-CYxCz4kboYVziI8H47U5SN1NGEQRla0itisPO7Hsu8kTdgTS06tIV1hQNnFJgVrDMMTJhjukyq_cVpcnmcWbZrD2-MhI2d6miIpW9GKV555Fnxyr45G2FieT3KNNPNK3NmQGRyaTKlHs-8wK8-R3i6jitCbuSkPysSFDVVGsD6FX6Mu88DBoF-B8du42I3GG9Ok0vGdFoSIM5h_UkoOCDh0EVkcGI5bsHIDcbNFJ6-1gXhublr0Ejyx85BCzJ6FEtFoadkI" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent md:block hidden"></div>
                <div className="absolute top-6 left-6 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-1 shadow-sm">
                  <span className="text-xs font-bold text-on-surface-variant uppercase tracking-tighter">Full Day</span>
                  <span className="text-lg font-black text-primary">120 TND</span>
                </div>
              </div>
              <div className="w-full md:w-3/5 p-10 flex flex-col justify-center">
                <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">
                  <span className="material-symbols-outlined text-sm">temple_buddhist</span> Roman History
                </div>
                <h3 className="font-headline text-4xl font-bold text-on-surface mb-4 group-hover:text-primary transition-colors leading-tight">Gladiators and Grain: The El Jem Expedition</h3>
                <p className="text-on-surface-variant leading-relaxed mb-8 text-lg">A deep dive into Roman Africa. Explore the third-largest amphitheatre in the world with an archaeology expert, followed by an olive oil tasting in a nearby organic grove.</p>
                <div className="flex flex-wrap items-center gap-8 mb-8">
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">Pick up</span>
                    <span className="text-sm font-medium">Tunis or Hammamet</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-on-surface-variant font-bold uppercase tracking-widest mb-1">Inclusions</span>
                    <span className="text-sm font-medium">Transport, Lunch, Guide</span>
                  </div>
                </div>
                <button className="self-start px-8 py-3 rounded-full bg-primary text-white font-bold hover:bg-primary-container transition-colors">Explore Experience</button>
              </div>
            </Link>
          </article>
        </div>
      </section>
    </div>
  );
}
