import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

interface UserData {
  id: number;
  email: string;
  fullName: string;
  role: "CITOYEN" | "TOURISTE";
  image: string;
  bio: string | null;
  createdAt?: string;
}

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { Authorization: `Bearer ${token}` };
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const BACKEND_URL = "http://localhost:5000";

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Photo upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoUploading, setPhotoUploading] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState<
    "bookings" | "activities" | "reviews"
  >("bookings");

  const toImageUrl = (p?: string) => {
    if (!p) return "/../assets/profile.jpg";
    return p.startsWith("http") ? p : `${BACKEND_URL}${p}`;
  };

  // ── Fetch profile on mount ────────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/auth");
      return;
    }

    axios
      .get<UserData>(`${BACKEND_URL}/api/profile/me`, {
        headers: getAuthHeaders(),
      })
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.clear();
        navigate("/auth");
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // ── Open edit modal ───────────────────────────────────────────────────────
  function openEdit() {
    if (!user) return;
    setEditName(user.fullName);
    setEditBio(user.bio ?? "");
    setSaveError("");
    setEditOpen(true);
  }

  // ── Save name + bio ───────────────────────────────────────────────────────
  async function handleSave() {
    if (!editName.trim()) {
      setSaveError("Le nom ne peut pas être vide.");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await axios.put<{ user: UserData }>(
        `${BACKEND_URL}/api/profile/update`,
        { fullName: editName.trim(), bio: editBio },
        { headers: getAuthHeaders() },
      );
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      setEditOpen(false);
    } catch (err: any) {
      setSaveError(
        err.response?.data?.message || "Erreur lors de la sauvegarde.",
      );
    } finally {
      setSaving(false);
    }
  }

  // ── Upload photo ──────────────────────────────────────────────────────────
  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    const formData = new FormData();
    formData.append("photo", file);
    try {
      const res = await axios.post<{ user: UserData }>(
        `${BACKEND_URL}/api/profile/photo`,
        formData,
        {
          headers: {
            ...getAuthHeaders(),
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setUser(res.data.user);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch {
      alert("Échec du téléchargement de la photo.");
    } finally {
      setPhotoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.clear();
    navigate("/auth");
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="pt-32 pb-24 max-w-7xl mx-auto px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-primary text-5xl animate-spin">
            refresh
          </span>
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Chargement du profil…
          </p>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const roleLabel = user.role === "CITOYEN" ? "Citoyen" : "Touriste";
  const roleIcon = user.role === "CITOYEN" ? "person_pin" : "luggage";

  return (
    <main className="pt-32 pb-24 max-w-7xl mx-auto px-8">
      {/* ── Profile Hero ───────────────────────────────────────────────── */}
      <section className="flex flex-col lg:flex-row gap-20 items-center mb-32">
        {/* Avatar with photo change button */}
        <div className="relative group flex-shrink-0">
          <div className="absolute -inset-4 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          <div className="relative w-72 h-72 md:w-80 md:h-80 rounded-full overflow-hidden border-8 border-white shadow-2xl">
            <img
              alt={user.fullName}
              className="w-full h-full object-cover"
              src={toImageUrl(user.image)}
            />
            {/* Overlay upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={photoUploading}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer"
            >
              {photoUploading ? (
                <span className="material-symbols-outlined text-white text-4xl animate-spin">
                  refresh
                </span>
              ) : (
                <>
                  <span className="material-symbols-outlined text-white text-4xl">
                    add_a_photo
                  </span>
                  <span className="text-white text-xs font-bold uppercase tracking-widest">
                    Changer
                  </span>
                </>
              )}
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoChange}
          />
        </div>

        {/* Info */}
        <div className="flex-1 space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            {/* Role badge */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
              <span className="text-xs font-bold tracking-[0.2em] text-primary uppercase bg-primary/10 px-4 py-1.5 rounded-full flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">
                  {roleIcon}
                </span>
                {roleLabel}
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                  En ligne
                </span>
              </div>
            </div>

            {/* Name */}
            <h1 className="font-headline text-6xl md:text-7xl font-bold text-slate-900 leading-tight">
              {user.fullName}
            </h1>

            {/* Bio or placeholder */}
            <p className="font-headline italic text-2xl text-slate-500">
              {user.bio || "Aucune description pour le moment."}
            </p>
          </div>

          {/* Email */}
          <p className="text-sm text-slate-400 flex items-center justify-center lg:justify-start gap-2">
            <span className="material-symbols-outlined text-base">
              alternate_email
            </span>
            {user.email}
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-4">
            <button
              onClick={openEdit}
              className="bg-primary text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">edit</span>
              Modifier le profil
            </button>
            <button
              onClick={handleLogout}
              className="bg-white border border-slate-200 text-slate-600 px-10 py-4 rounded-full font-bold hover:bg-slate-50 transition-all flex items-center gap-3"
            >
              <span className="material-symbols-outlined text-xl">logout</span>
              Déconnexion
            </button>
          </div>
        </div>
      </section>

      {/* ── Tabs + Content ─────────────────────────────────────────────── */}
      <section className="space-y-20">
        <div className="flex justify-center md:justify-start gap-12 border-b border-slate-100">
          {(["bookings", "activities", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-6 border-b-2 text-sm font-bold uppercase tracking-widest transition-colors ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab === "bookings"
                ? "Réservations"
                : tab === "activities"
                  ? "Activités"
                  : "Avis"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Main */}
          <div className="lg:col-span-8 space-y-12">
            {activeTab === "bookings" && (
              <>
                <div className="group relative bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-slate-100">
                  <div className="flex flex-col md:flex-row h-full">
                    <div className="md:w-2/5 relative h-80 md:h-auto overflow-hidden">
                      <img
                        alt="Carthage Ruins"
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        src="https://wildyness.com/uploads/0000/145/2023/07/31/carthage-guide-complete.png"
                      />
                      <div className="absolute top-6 left-6 bg-primary/90 text-white backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                        À venir
                      </div>
                    </div>
                    <div className="flex-1 p-10 flex flex-col justify-center space-y-6">
                      <div className="space-y-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">
                          Expérience Patrimoniale
                        </span>
                        <h3 className="font-headline text-4xl font-bold text-slate-900 leading-tight">
                          Visite Privée Coucher de Soleil : Ruines de Carthage
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-6 items-center py-2 border-y border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">
                            calendar_today
                          </span>
                          <span className="text-sm font-bold text-slate-600">
                            24 Oct 2024
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-xl">
                            schedule
                          </span>
                          <span className="text-sm font-bold text-slate-600">
                            17h30 – 20h00
                          </span>
                        </div>
                      </div>
                      <p className="text-slate-500 leading-relaxed text-sm">
                        Une promenade guidée à travers les ports puniques et
                        l'amphithéâtre romain au coucher du soleil
                        méditerranéen.
                      </p>
                      <div className="flex gap-6 items-center pt-4">
                        <button className="bg-primary text-white px-8 py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-90 transition-opacity">
                          Gérer
                        </button>
                        <button className="text-slate-900 font-bold text-sm flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                          Itinéraire{" "}
                          <span className="material-symbols-outlined text-lg">
                            arrow_outward
                          </span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      label: "Djerba Heritage",
                      title: "Atelier Poterie de Guellala",
                      src: "https://www.figsandjasmine.com/cdn/shop/articles/Tunisian_Ceramic_Blog-3.jpg?v=1702514603&width=1920",
                      alt: "Pottery",
                    },
                    {
                      label: "Tunis Médina",
                      title: "Masterclass Épices",
                      src: "https://lh3.googleusercontent.com/aida-public/AB6AXuDSOOR-6q3-GvjgLaeckj7WtjulOV05xzUNrY-DzxHz99choaoEBFtuKIzNLGZ5JDbaKUpuDO2zJzInIe-A189sgetr1ZVyW1lBiKkvsqGdsDzMfMHKkazut7u5YxdAJcEmYDe92W1mZeV-4NWlxE55cjvpJJtgmbj6DdB8IfdTfwvVJPvv-QrVb3m43KixzJeHBdkWNqxnIp_m5ruMpqUuH6AtlL6tUFhJQepX4QHI-IVGHrwYMd0A_wI4pbqX49Ia-dOYVdG7-_A",
                      alt: "Cooking",
                    },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="bg-white p-4 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-lg transition-all"
                    >
                      <div className="aspect-video rounded-2xl overflow-hidden mb-6">
                        <img
                          alt={item.alt}
                          className="w-full h-full object-cover"
                          src={item.src}
                        />
                      </div>
                      <div className="px-4 pb-4">
                        <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                          {item.label}
                        </span>
                        <h4 className="font-headline text-xl font-bold text-slate-900 mt-1">
                          {item.title}
                        </h4>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === "activities" && (
              <div className="text-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-4 block">
                  hiking
                </span>
                <p className="font-bold uppercase tracking-widest text-sm">
                  Aucune activité pour le moment
                </p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div className="text-center py-20 text-slate-400">
                <span className="material-symbols-outlined text-5xl mb-4 block">
                  rate_review
                </span>
                <p className="font-bold uppercase tracking-widest text-sm">
                  Aucun avis pour le moment
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-slate-900 rounded-[2rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
                <span
                  className="material-symbols-outlined text-[120px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  workspace_premium
                </span>
              </div>
              <div className="relative z-10 space-y-6">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">
                    auto_awesome
                  </span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-headline text-2xl font-bold">
                    Récompenses
                  </h4>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Vous êtes presque au statut 'Artisan Niveau 3'. Plus que 2
                    voyages.
                  </p>
                </div>
                <button className="w-full bg-white text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all">
                  Voir détails
                </button>
              </div>
            </div>

            <div className="bg-white border border-slate-100 rounded-[2rem] p-10 flex flex-col items-center text-center space-y-4">
              <div className="text-5xl font-headline font-bold text-primary">
                12
              </div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Expériences hébergées
              </div>
              <div className="w-12 h-1 bg-primary/20 rounded-full overflow-hidden">
                <div className="w-2/3 h-full bg-primary" />
              </div>
            </div>

            <Link to="/host" className="block w-full">
              <div className="border-2 border-dashed border-slate-200 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center group cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-primary">
                    add_circle
                  </span>
                </div>
                <h5 className="font-bold text-slate-900">Nouveau Voyage</h5>
                <p className="text-xs text-slate-400 mt-1">
                  Commencer une curation
                </p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditOpen(false);
          }}
        >
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-3xl font-bold text-slate-900">
                Modifier le profil
              </h2>
              <button
                onClick={() => setEditOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                <span className="material-symbols-outlined text-slate-600">
                  close
                </span>
              </button>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <span className="material-symbols-outlined text-base">
                  error
                </span>
                {saveError}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Nom complet
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                Description{" "}
                <span className="normal-case font-normal text-slate-300">
                  ({editBio.length}/500)
                </span>
              </label>
              <textarea
                rows={4}
                maxLength={500}
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                placeholder="Parlez de vous, de vos passions…"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-primary text-white py-4 rounded-xl font-bold text-sm shadow-md shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      refresh
                    </span>{" "}
                    Sauvegarde…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
                      save
                    </span>{" "}
                    Sauvegarder
                  </>
                )}
              </button>
              <button
                onClick={() => setEditOpen(false)}
                className="px-8 py-4 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50 transition-all"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
