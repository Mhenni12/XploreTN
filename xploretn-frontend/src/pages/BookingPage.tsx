import { Link, useParams } from 'react-router-dom';

export default function BookingPage() {
  const { id } = useParams();

  return (
    <>
      {/* Hero Experience Image */}
      <section className="relative h-[60vh] min-h-[400px] w-full overflow-hidden hero-mask mt-20">
        <img alt="Sahara Desert at sunset" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB1MLu3PTygJKJHQxwg5ZA_JkjwRkTPeHLpfeUcmZoqJzBNFrSMT7xUzVwb9QHOp4KyjZdfkKeoZFW4Y44ToJ06qZHcaFfa5K9zybDivR6DdMQV7bg-rFCO5v1dgpQzm_eKUemPax2DbscY4v4JduKhmIx1S5Bms-o71mE-k6JzzuRH-1YhWhWBXJU3XhLAverKAr6D7qGeNr38CuhCP7rUj2-w_saOYwYWkHNr91YbsEGAPQMmSAAwQwcJUuR4TrUjv1MPuAwo5cM" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-primary/40"></div>
        <div className="absolute bottom-16 left-0 w-full">
          <div className="max-w-7xl mx-auto px-6">
            <div className="inline-block bg-secondary-container text-on-secondary-container px-4 py-1 font-label text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
              Signature Journey
            </div>
            <h1 className="font-headline text-5xl lg:text-7xl text-white drop-shadow-lg leading-tight">
              Private Sahara <br /><span className="italic font-normal">Expedition</span>
            </h1>
          </div>
        </div>
      </section>

      <main className="min-h-screen relative pb-20 -mt-20 z-10">
        <div className="max-w-7xl mx-auto px-6">
          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* Left Column: Details & Inputs */}
            <div className="lg:col-span-7 space-y-8">
              {/* Back Link */}
              <Link to={`/experience/${id || 1}`}>
                <button className="flex items-center gap-2 text-white/90 hover:text-white font-semibold group mb-4 pt-10">
                  <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                  <span className="font-label uppercase tracking-widest text-[10px]">Back to Experience</span>
                </button>
              </Link>

              {/* Summary Card */}
              <div className="bg-surface-container-lowest p-8 lg:p-10 shadow-xl shadow-primary/5 border border-surface-variant/30 rounded-xl space-y-8 mt-5">
                <div>
                  <h2 className="font-headline text-3xl text-primary mb-4">Experience Details</h2>
                  <p className="text-on-surface-variant leading-relaxed">Prepare for an immersive journey through the golden dunes of Douz, guided by the wisdom of the local Bedouins and the rhythm of the desert wind.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 py-8 border-y border-surface-variant/30">
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold mb-2 block">Date</span>
                    <p className="font-headline text-xl text-primary">Oct 24, 2024</p>
                  </div>
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold mb-2 block">Duration</span>
                    <p className="font-headline text-xl text-primary">3 Days, 2 Nights</p>
                  </div>
                  <div>
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary font-bold mb-2 block">Location</span>
                    <p className="font-headline text-xl text-primary">Douz Gateway</p>
                  </div>
                </div>

                {/* Compact Traveler Selector */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <h3 className="font-headline text-xl text-primary">Number of Explorers</h3>
                    <p className="text-xs text-on-surface-variant font-medium">Limited to small private groups</p>
                  </div>
                  <div className="flex items-center gap-4 bg-surface-container-low p-2 rounded-full border border-surface-variant/50 w-fit">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-white hover:bg-primary hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <div className="px-2 text-center min-w-[3rem]">
                      <span className="block text-2xl font-headline text-primary leading-none">02</span>
                    </div>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-primary bg-white hover:bg-primary hover:text-white transition-all shadow-sm">
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Special Requests Section */}
              <div className="bg-surface-container-lowest p-8 lg:p-10 shadow-xl shadow-primary/5 border border-surface-variant/30 rounded-xl">
                <h3 className="font-headline text-2xl text-primary mb-6">Personalize your Expedition</h3>
                <div className="space-y-2">
                  <label className="font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant font-bold">Special Requests or Dietary Requirements</label>
                  <textarea className="w-full bg-surface-container-low border border-surface-variant/50 focus:border-primary focus:ring-1 focus:ring-primary rounded-lg transition-all py-4 px-4 text-on-surface placeholder:text-outline-variant italic resize-none" placeholder="e.g. Vegetarian, extra blankets, early pickup..." rows={3}></textarea>
                </div>
              </div>
            </div>

            {/* Right Column: Price Breakdown & CTA */}
            <div className="lg:col-span-5 lg:sticky lg:top-28 pt-8">
              <div className="glass-panel p-10 shadow-2xl shadow-primary/10 space-y-8 border border-white/40 rounded-2xl relative overflow-hidden bg-white/80 backdrop-blur-2xl">
                {/* Subtle Background Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-fixed/10 rounded-full blur-3xl -z-10 -mr-10 -mt-10"></div>
                
                <div className="space-y-4">
                  <h3 className="font-headline text-2xl text-primary border-b border-surface-variant pb-4 flex items-center justify-between">
                    <span>Fare Breakdown</span>
                    <span className="material-symbols-outlined text-tertiary">receipt_long</span>
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Adult Participant (×2)</span>
                      <span className="font-bold text-primary">1,240.00 TND</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Private Guide &amp; Caravan</span>
                      <span className="font-bold text-primary">350.00 TND</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-on-surface-variant">Heritage Preservation Fee</span>
                      <span className="font-bold text-primary">45.00 TND</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-6 border-t border-surface-variant">
                    <span className="font-headline text-xl text-primary">Total Amount</span>
                    <div className="text-right">
                      <span className="font-headline text-4xl text-primary block">1,635.00 TND</span>
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">Including all taxes</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <button className="w-full bg-primary text-white py-6 rounded-xl font-bold tracking-[0.2em] uppercase text-xs shadow-xl shadow-primary/30 hover:bg-primary-container hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3">
                    <span>Confirm Booking</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                  
                  <div className="flex items-start gap-3 bg-secondary-container/20 p-4 rounded-xl border border-secondary-container/30">
                    <span className="material-symbols-outlined text-tertiary mt-0.5">verified_user</span>
                    <div>
                      <p className="text-xs font-bold text-on-secondary-container">Curated Excellence</p>
                      <p className="text-[10px] leading-relaxed text-on-secondary-container/80">Every experience is hand-verified by our local historians to ensure cultural authenticity and luxury standards.</p>
                    </div>
                  </div>
                  
                  <p className="text-center text-[10px] text-on-surface-variant leading-relaxed px-4">
                    By confirming, you agree to our <Link to="#" className="underline decoration-tertiary underline-offset-4 font-bold">Terms of Discovery</Link> and <Link to="#" className="underline decoration-tertiary underline-offset-4 font-bold">Cancellation Policy</Link>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
