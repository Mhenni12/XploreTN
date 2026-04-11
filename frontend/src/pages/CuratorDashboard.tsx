import { Link } from 'react-router-dom';

export default function CuratorDashboard() {
  return (
    <main className="max-w-7xl mx-auto px-8 py-12 pt-32">
      {/* Modernized Header */}
      <header className="mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60">Verified Artisan Dashboard</span>
            </div>
            <h1 className="font-headline text-5xl font-light text-on-surface leading-tight">
              Aslema, <span className="font-semibold text-primary">Ahmed.</span>
            </h1>
            <p className="text-on-surface-variant mt-4 text-base font-light leading-relaxed max-w-md">
              Your curation preserves Tunisia's mosaic. Track your impact and manage your unique local experiences.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">Profile Status</span>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Highly Rated
              </span>
            </div>
            <Link to="/host">
              <button className="bg-primary text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-3">
                <span className="material-symbols-outlined text-xl">add</span>
                Create Activity
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Compact & Elegant Stats Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {/* Earnings */}
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">+12%</span>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Total Earnings</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-on-surface tracking-tight">12,480</span>
            <span className="text-xs text-outline font-medium">TND</span>
          </div>
          <div className="mt-4 flex items-end gap-1 h-8">
            <div className="flex-1 bg-primary/10 rounded-t-sm h-1/2"></div>
            <div className="flex-1 bg-primary/10 rounded-t-sm h-3/4"></div>
            <div className="flex-1 bg-primary/10 rounded-t-sm h-2/3"></div>
            <div className="flex-1 bg-primary/10 rounded-t-sm h-full"></div>
            <div className="flex-1 bg-primary/40 rounded-t-sm h-5/6"></div>
          </div>
        </div>
        
        {/* Guests */}
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-secondary-container text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>group</span>
            </div>
            <div className="flex -space-x-2">
              <div className="w-5 h-5 rounded-full bg-outline-variant/50 border border-white"></div>
              <div className="w-5 h-5 rounded-full bg-outline-variant/70 border border-white"></div>
              <div className="w-5 h-5 rounded-full bg-outline-variant/90 border border-white"></div>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Active Guests</p>
          <span className="text-2xl font-semibold text-on-surface">156</span>
          <p className="text-[10px] text-on-surface-variant font-medium mt-2">12 sessions today</p>
        </div>

        {/* Growth */}
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-tertiary-container/30 text-tertiary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">trending_up</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Growth</p>
          <span className="text-2xl font-semibold text-on-surface">+24%</span>
          <p className="text-[10px] text-on-surface-variant font-medium mt-2">New bookings this week</p>
        </div>

        {/* Rating */}
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 text-yellow-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">Avg. Rating</p>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-semibold text-on-surface">4.9</span>
            <span className="text-xs text-outline font-medium">/ 5.0</span>
          </div>
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="material-symbols-outlined text-[10px] text-yellow-500" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            ))}
          </div>
        </div>
      </section>

      {/* Activities Grid - Visually Rich & Large Images */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-headline text-3xl font-light text-on-surface">Experience <span className="font-semibold text-primary tracking-tight">Portfolio</span></h2>
          <Link to="/explore" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-1 hover:border-primary transition-all">View Archive</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Activity Card 1 */}
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-6">
              <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzMOpufliR8N0bGxLmULbVuM9_UWJETbP3Zg&s" alt="Carthage Tile Painting" />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary shadow-sm">Active</div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/60 mb-1 block">Workshop • 3h</span>
                <h4 className="font-headline text-2xl font-medium text-on-surface mb-2">Carthage Tile Painting</h4>
                <p className="text-on-surface-variant text-sm font-light flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary/40">location_on</span> Sidi Bou Said, Tunis
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-primary">45</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">TND</p>
              </div>
            </div>
          </div>
          
          {/* Activity Card 2 */}
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-6">
              <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="https://img.freepik.com/premium-photo/historic-zitouna-mosque-tunisian-heritage-medina-tunis_770311-1182.jpg" alt="Medina Secret Flavors" />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-primary shadow-sm">Active</div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                <button className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300">
                  <span className="material-symbols-outlined">edit</span>
                </button>
              </div>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/60 mb-1 block">Culinary • Full day</span>
                <h4 className="font-headline text-2xl font-medium text-on-surface mb-2">Medina Secret Flavors</h4>
                <p className="text-on-surface-variant text-sm font-light flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-primary/40">location_on</span> Medina Old City, Tunis
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-primary">120</p>
                <p className="text-[10px] font-bold text-outline uppercase tracking-widest">TND</p>
              </div>
            </div>
          </div>
          
          {/* Activity Card 3 */}
          <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-6">
              <img className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkMf_x3imcg4v2XUOPNJ3J06yGFrIXd54T2pYM-UINGoYaI2MmhPIACi7-VUzRl4GBwknb9xoB0ozB1V_2gdnB60HNwjokAq4oQ2NgA8H65B1Jzh99Kh2I9Qg5MvStr7Hf7LSDip17RbV-SIPlkx-lNOlbWh7L05_NlzTqIkWd5vneWfWZVqRDdk3iZNbTGKm5iTBs_4oqp_dfyTXpOWbhxeS4QDuK1JzjJ4U-34zNTOe3niGLXJMeSroLZ4xuD8I6C78iq2Jlyw0" alt="Sahara Stargazing" />
              <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-outline shadow-sm">Drafting</div>
              <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] opacity-100 transition-opacity flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-white drop-shadow-md">hourglass_bottom</span>
              </div>
            </div>
            <div className="opacity-60">
              <div>
                <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-outline mb-1 block">Exploration • Overnight</span>
                <h4 className="font-headline text-2xl font-medium text-on-surface mb-2">Sahara Stargazing</h4>
                <p className="text-on-surface-variant text-sm font-light flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-outline/40">location_on</span> Douz, Sahara Desert
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clean Recent Bookings */}
      <section className="mb-32">
        <h3 className="font-headline text-xl font-medium text-on-surface-variant mb-8 flex items-center gap-4">
          Recent Bookings
          <span className="h-px flex-grow bg-outline-variant/30"></span>
        </h3>
        <div className="space-y-3">
          <div className="bg-surface hover:bg-primary/[0.02] p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 transition-all cursor-pointer group">
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-full bg-primary/5 flex items-center justify-center text-primary font-bold text-xs">SM</div>
              <div>
                <p className="font-semibold text-on-surface text-sm">Sarah Miller</p>
                <p className="text-[10px] text-outline font-medium">Medina Secret Flavors • 2 Guests</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-outline mb-0.5">Date</p>
              <p className="font-medium text-xs">Oct 24, 2023</p>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-[10px] text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-bold">CONFIRMED</span>
              <p className="font-headline font-semibold text-on-surface w-20 text-right">240 TND</p>
            </div>
          </div>
          
          <div className="bg-surface hover:bg-primary/[0.02] p-4 rounded-xl flex items-center justify-between border border-outline-variant/10 transition-all cursor-pointer group">
            <div className="flex items-center gap-5">
              <div className="w-11 h-11 rounded-full bg-secondary-container text-secondary flex items-center justify-center font-bold text-xs">JL</div>
              <div>
                <p className="font-semibold text-on-surface text-sm">Jean-Luc Picard</p>
                <p className="text-[10px] text-outline font-medium">Carthage Tile Painting • 1 Guest</p>
              </div>
            </div>
            <div className="hidden md:flex flex-col items-center">
              <p className="text-[10px] uppercase font-bold tracking-widest text-outline mb-0.5">Date</p>
              <p className="font-medium text-xs">Oct 26, 2023</p>
            </div>
            <div className="flex items-center gap-8">
              <span className="text-[10px] text-outline-variant bg-surface-variant/10 px-2 py-0.5 rounded-full font-bold">PENDING</span>
              <p className="font-headline font-semibold text-on-surface w-20 text-right">45 TND</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Subtle Floating Organic Decorative Shape */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="fixed top-1/2 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10"></div>
    </main>
  );
}
