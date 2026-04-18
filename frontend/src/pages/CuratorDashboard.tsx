import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  fetchMyActivities,
  deleteActivity,
  updateActivity,
  CATEGORY_CONFIG,
  type Activity,
  type CreateActivityData,
} from '../services/activityService';
import ImageUploader from '../components/ImageUploader';
import MapPicker from '../components/MapPicker';

// ─── Status badge styles ────────────────────────────────────────────────────
const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'text-green-700 bg-green-50',
  PENDING: 'text-amber-700 bg-amber-50',
  REJECTED: 'text-red-700 bg-red-50',
};

const allCategories = Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>;

// ─── Types ───────────────────────────────────────────────────────────────────
interface Tourist {
  id: number;
  fullName: string;
  email: string;
  image?: string;
}

interface HousingReservation {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  startDate: string;
  endDate: string;
  tourist: Tourist;
  housingId: string;
}

interface HousingWithReservations {
  id: string;
  title: string;
  location: string;
  type: string;
  images: string[];
  pendingReservations: HousingReservation[];
  activeReservations: HousingReservation[]; // ACCEPTED stays
}

// ─── API helpers ──────────────────────────────────────────────────────────────
function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5000/api",
});

async function fetchMyHousings(): Promise<HousingWithReservations[]> {
  const { data } = await axios.get('http://localhost:5000/api/housings/view', {
    headers: getAuthHeaders(),
  });

  const housings: any[] = Array.isArray(data) ? data : data.housings ?? data.data ?? [];

  const withReservations = await Promise.all(
    housings.map(async (h: any) => {
      try {
        const { data: reservations } = await axios.get(
          `http://localhost:5000/api/reservations/housing/${h.id}`,
          { headers: getAuthHeaders() }
        );

        const pending = (reservations as HousingReservation[]).filter(
          (r) => r.status === 'PENDING'
        );
        const active = (reservations as HousingReservation[]).filter(
          (r) => r.status === 'ACCEPTED'
        );

        return {
          ...h,
          pendingReservations: pending,
          activeReservations: active,
        };
      } catch (err: any) {
        console.error(`Reservations error for housing "${h.title}":`, err?.response?.status);
        return { ...h, pendingReservations: [], activeReservations: [] };
      }
    })
  );

  return withReservations;
}

async function updateReservationStatus(
  reservationId: string,
  status: 'ACCEPTED' | 'REJECTED'
): Promise<void> {
  await axios.patch(
    `http://localhost:5000/api/reservations/${reservationId}/status`,
    { status },
    { headers: getAuthHeaders() }
  );
}

async function completeReservation(reservationId: string): Promise<void> {
  await axios.patch(
    `http://localhost:5000/api/reservations/${reservationId}/complete`,
    {},
    { headers: getAuthHeaders() }
  );
}

async function getOrCreateConversation(targetUserId: number): Promise<string> {
  const { data: conv } = await axios.post(
    'http://localhost:5000/api/messages/conversations',
    { targetUserId },
    { headers: getAuthHeaders() }
  );
  return conv.id;
}

// ─── Housing Type labels ─────────────────────────────────────────────────────
const HOUSING_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  STUDIO: 'Studio',
  TRADITIONAL_HOUSE: 'Traditional House',
  FARM_STAY: 'Farm Stay',
  GUESTHOUSE: 'Guesthouse',
  RIAD: 'Riad',
  CHALET: 'Chalet',
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function CuratorDashboard() {
  const navigate = useNavigate();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Edit Modal State
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [editForm, setEditForm] = useState<Partial<CreateActivityData> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Housing Reservations State
  const [housings, setHousings] = useState<HousingWithReservations[]>([]);
  const [housingsLoading, setHousingsLoading] = useState(true);
  const [processingReservation, setProcessingReservation] = useState<string | null>(null);
  const [completingReservation, setCompletingReservation] = useState<string | null>(null);
  const [redirectingConv, setRedirectingConv] = useState<number | null>(null);

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;

  // ─── Role Guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (user.role && user.role !== 'CITOYEN') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/auth');
    }
  }, []);

  // ─── Fetch my activities ──────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await fetchMyActivities();
        setActivities(data);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/auth');
        } else {
          setError(err?.response?.data?.message || err?.message || 'Failed to load activities');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // ─── Fetch my housings + reservations ─────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setHousingsLoading(true);
      try {
        const data = await fetchMyHousings();
        setHousings(data);
      } catch (err: any) {
        console.error('Housings load error:', err);
      } finally {
        setHousingsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Activity Handlers ────────────────────────────────────────────────────
  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;
    setDeletingId(id);
    try {
      await deleteActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to delete activity');
    } finally {
      setDeletingId(null);
    }
  };

  const openEditModal = (activity: Activity) => {
    setEditingActivity(activity);
    setEditForm({
      title: activity.title,
      description: activity.description,
      price: activity.price,
      date: new Date(activity.date).toISOString().slice(0, 16),
      location: activity.location,
      latitude: activity.latitude,
      longitude: activity.longitude,
      capacity: activity.capacity,
      category: activity.category,
      images: [...activity.images],
    });
  };

  const closeEditModal = () => {
    setEditingActivity(null);
    setEditForm(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    if (!editForm) return;
    const { name, value, type } = e.target;
    setEditForm((prev) => ({
      ...prev!,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity || !editForm) return;
    setIsSaving(true);
    try {
      const payload = {
        ...editForm,
        date: new Date(editForm.date!).toISOString(),
      };
      await updateActivity(editingActivity.id, payload);
      setActivities((prev) =>
        prev.map((act) =>
          act.id === editingActivity.id
            ? ({ ...act, ...payload, date: payload.date } as Activity)
            : act
        )
      );
      closeEditModal();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to update activity');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Reservation Handlers ─────────────────────────────────────────────────
  const handleReservationStatus = async (
    reservationId: string,
    housingId: string,
    status: 'ACCEPTED' | 'REJECTED'
  ) => {
    setProcessingReservation(reservationId);
    try {
      await updateReservationStatus(reservationId, status);
      setHousings((prev) =>
        prev.map((h) => {
          if (h.id !== housingId) return h;
          const reservation = h.pendingReservations.find((r) => r.id === reservationId);
          return {
            ...h,
            pendingReservations: h.pendingReservations.filter((r) => r.id !== reservationId),
            // If accepted, move it to activeReservations
            activeReservations:
              status === 'ACCEPTED' && reservation
                ? [...h.activeReservations, { ...reservation, status: 'ACCEPTED' as const }]
                : h.activeReservations,
          };
        })
      );
    } catch (err: any) {
      alert(err?.message || 'Failed to update reservation');
    } finally {
      setProcessingReservation(null);
    }
  };

  // ─── Mark stay as complete ────────────────────────────────────────────────
  const handleCompleteReservation = async (reservationId: string, housingId: string) => {
    setCompletingReservation(reservationId);
    try {
      await completeReservation(reservationId);
      setHousings((prev) =>
        prev.map((h) =>
          h.id === housingId
            ? {
                ...h,
                activeReservations: h.activeReservations.filter(
                  (r) => r.id !== reservationId
                ),
              }
            : h
        )
      );
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to mark stay as complete');
    } finally {
      setCompletingReservation(null);
    }
  };

  const handleOpenConversation = async (touristId: number) => {
    setRedirectingConv(touristId);
    try {
      const convId = await getOrCreateConversation(touristId);
      navigate("/messaging", { state: { targetConvId: convId } });
    } catch (err: any) {
      alert(err?.message || 'Failed to open conversation');
    } finally {
      setRedirectingConv(null);
    }
  };

  // ─── Stats ────────────────────────────────────────────────────────────────
  const totalActivities = activities.length;
  const approvedCount = activities.filter((a) => a.status === 'APPROVED').length;
  const pendingCount = activities.filter((a) => a.status === 'PENDING').length;

  const totalPendingReservations = housings.reduce(
    (sum, h) => sum + h.pendingReservations.length,
    0
  );
  const totalActiveStays = housings.reduce(
    (sum, h) => sum + h.activeReservations.length,
    0
  );

  const housingsWithPending = housings.filter((h) => h.pendingReservations.length > 0);
  const housingsWithActive = housings.filter((h) => h.activeReservations.length > 0);

  return (
    <main className="max-w-7xl mx-auto px-8 py-12 pt-32 relative">
      {/* Header */}
      <header className="mb-16">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary/60">
                Verified Artisan Dashboard
              </span>
            </div>
            <h1 className="font-headline text-5xl font-light text-on-surface leading-tight">
              Aslema,{' '}
              <span className="font-semibold text-primary">{user?.fullName || 'Curator'}.</span>
            </h1>
            <p className="text-on-surface-variant mt-4 text-base font-light leading-relaxed max-w-md">
              Your curation preserves Tunisia's mosaic. Track your impact and manage your unique
              local experiences.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-outline uppercase tracking-widest">
                Profile Status
              </span>
              <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600" /> Active
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

      {/* ── Stats ── */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/5 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">travel_explore</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Total Experiences
          </p>
          <span className="text-2xl font-semibold text-on-surface tracking-tight">
            {totalActivities}
          </span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">check_circle</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Approved
          </p>
          <span className="text-2xl font-semibold text-on-surface">{approvedCount}</span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hourglass_top</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Pending
          </p>
          <span className="text-2xl font-semibold text-on-surface">{pendingCount}</span>
        </div>

        <div className="stat-card bg-surface p-6 rounded-2xl soft-shadow border border-outline-variant/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
          <div className="flex justify-between items-start mb-4">
            <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">hotel</span>
            </div>
          </div>
          <p className="text-[10px] font-bold text-outline uppercase tracking-widest mb-1">
            Active Stays
          </p>
          <span className="text-2xl font-semibold text-on-surface">{totalActiveStays}</span>
        </div>
      </section>

      {/* ── Active Stays Section ─────────────────────────────────────────────── */}
      {(housingsLoading || housingsWithActive.length > 0) && (
        <section className="mb-20">
          <div className="flex items-baseline justify-between mb-10">
            <div>
              <h2 className="font-headline text-3xl font-light text-on-surface">
                Active{' '}
                <span className="font-semibold text-rose-600 tracking-tight">Stays</span>
              </h2>
              <p className="text-on-surface-variant text-sm font-light mt-1">
                Tourists currently staying at your properties — mark as complete when they leave
              </p>
            </div>
            {totalActiveStays > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold tracking-wide border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {totalActiveStays} active
              </span>
            )}
          </div>

          {housingsLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map((i) => (
                <div key={i} className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20">
                  <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {!housingsLoading && housingsWithActive.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {housingsWithActive.map((housing) => (
                <div
                  key={housing.id}
                  className="bg-surface rounded-2xl border border-rose-100 soft-shadow overflow-hidden ring-1 ring-rose-200/60"
                >
                  {/* Housing header */}
                  <div className="flex items-center gap-4 px-5 py-4 border-b border-rose-100 bg-rose-50/40">
                    <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                      {housing.images?.[0] ? (
                        <img
                          src={housing.images[0]}
                          alt={housing.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/40">home</span>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-on-surface text-sm truncate">
                        {housing.title}
                      </h3>
                      <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                        <span className="material-symbols-outlined text-[12px] text-rose-500">location_on</span>
                        {housing.location}
                        <span className="text-outline mx-1">·</span>
                        <span className="text-outline">{HOUSING_TYPE_LABELS[housing.type] || housing.type}</span>
                      </p>
                    </div>
                    <span className="ml-auto shrink-0 flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-rose-100 text-rose-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      Occupied
                    </span>
                  </div>

                  {/* Active reservations */}
                  <div className="divide-y divide-outline-variant/10">
                    {housing.activeReservations.map((reservation) => {
                      const isCompleting = completingReservation === reservation.id;
                      const isRedirecting = redirectingConv === reservation.tourist.id;

                      return (
                        <div key={reservation.id} className="px-5 py-4">
                          <div className="flex items-center gap-4 mb-3">
                            <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                              {reservation.tourist.image ? (
                                <img
                                  src={reservation.tourist.image}
                                  alt={reservation.tourist.fullName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">person</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-on-surface truncate">
                                {reservation.tourist.fullName}
                              </p>
                              <p className="text-[11px] text-on-surface-variant">
                                {new Date(reservation.startDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                })}{' '}
                                →{' '}
                                {new Date(reservation.endDate).toLocaleDateString('en-GB', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <button
                              onClick={() => handleOpenConversation(reservation.tourist.id)}
                              disabled={isRedirecting || isCompleting}
                              title="Message tourist"
                              className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                            >
                              {isRedirecting ? (
                                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <span className="material-symbols-outlined text-[16px]">chat</span>
                              )}
                            </button>
                          </div>

                          {/* Mark Complete CTA */}
                          <button
                            onClick={() => handleCompleteReservation(reservation.id, housing.id)}
                            disabled={isCompleting}
                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold uppercase tracking-wider transition-all"
                          >
                            {isCompleting ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Marking as complete…
                              </>
                            ) : (
                              <>
                                <span className="material-symbols-outlined text-base">
                                  check_circle
                                </span>
                                Mark Stay as Complete
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Housing Requests Section ─────────────────────────────────────────── */}
      <section className="mb-20">
        <div className="flex items-baseline justify-between mb-10">
          <div>
            <h2 className="font-headline text-3xl font-light text-on-surface">
              Housing{' '}
              <span className="font-semibold text-primary tracking-tight">Requests</span>
            </h2>
            <p className="text-on-surface-variant text-sm font-light mt-1">
              Pending reservation requests from travellers for your properties
            </p>
          </div>
          {totalPendingReservations > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold tracking-wide border border-amber-200">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              {totalPendingReservations} pending
            </span>
          )}
        </div>

        {housingsLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-surface rounded-2xl p-6 border border-outline-variant/20">
                <div className="h-4 bg-surface-container-high rounded w-1/2 mb-4" />
                <div className="space-y-3">
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                  <div className="h-16 bg-surface-container-high rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!housingsLoading && housingsWithPending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-outline-variant/40 bg-surface/50">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">
              home_work
            </span>
            <p className="text-on-surface-variant text-sm font-medium">
              No pending reservation requests right now
            </p>
            <p className="text-on-surface-variant/60 text-xs mt-1">
              New requests will appear here
            </p>
          </div>
        )}

        {!housingsLoading && housingsWithPending.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {housingsWithPending.map((housing) => (
              <div
                key={housing.id}
                className="bg-surface rounded-2xl border border-outline-variant/20 soft-shadow overflow-hidden"
              >
                <div className="flex items-center gap-4 px-5 py-4 border-b border-outline-variant/10 bg-surface-container-low/50">
                  <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-surface-container-high">
                    {housing.images?.[0] ? (
                      <img
                        src={housing.images[0]}
                        alt={housing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant/40">home</span>
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-on-surface text-sm truncate">
                      {housing.title}
                    </h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-primary/50">location_on</span>
                      {housing.location}
                      <span className="text-outline mx-1">·</span>
                      <span className="text-outline">{HOUSING_TYPE_LABELS[housing.type] || housing.type}</span>
                    </p>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">
                    {housing.pendingReservations.length} request{housing.pendingReservations.length > 1 ? 's' : ''}
                  </span>
                </div>

                <div className="divide-y divide-outline-variant/10">
                  {housing.pendingReservations.map((reservation) => {
                    const isProcessing = processingReservation === reservation.id;
                    const isRedirecting = redirectingConv === reservation.tourist.id;

                    return (
                      <div key={reservation.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="w-9 h-9 rounded-full shrink-0 overflow-hidden bg-surface-container-high flex items-center justify-center">
                          {reservation.tourist.image ? (
                            <img
                              src={reservation.tourist.image}
                              alt={reservation.tourist.fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="material-symbols-outlined text-[18px] text-on-surface-variant/50">person</span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-on-surface truncate">
                            {reservation.tourist.fullName}
                          </p>
                          <p className="text-[11px] text-on-surface-variant truncate">
                            {new Date(reservation.startDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                            })}{' '}
                            →{' '}
                            {new Date(reservation.endDate).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleOpenConversation(reservation.tourist.id)}
                            disabled={isRedirecting || isProcessing}
                            title="Message requester"
                            className="w-8 h-8 rounded-full border border-outline-variant/30 flex items-center justify-center text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition-colors disabled:opacity-40"
                          >
                            {isRedirecting ? (
                              <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">chat</span>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleReservationStatus(reservation.id, housing.id, 'REJECTED')
                            }
                            disabled={isProcessing}
                            title="Deny request"
                            className="w-8 h-8 rounded-full border border-red-200 bg-red-50 flex items-center justify-center text-red-500 hover:bg-red-100 transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">close</span>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              handleReservationStatus(reservation.id, housing.id, 'ACCEPTED')
                            }
                            disabled={isProcessing}
                            title="Accept request"
                            className="w-8 h-8 rounded-full border border-green-200 bg-green-50 flex items-center justify-center text-green-600 hover:bg-green-100 transition-colors disabled:opacity-40"
                          >
                            {isProcessing ? (
                              <span className="w-3.5 h-3.5 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <span className="material-symbols-outlined text-[16px]">check</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Activities Grid ──────────────────────────────────────────────────── */}
      <section className="mb-24">
        <div className="flex items-baseline justify-between mb-10">
          <h2 className="font-headline text-3xl font-light text-on-surface">
            Experience{' '}
            <span className="font-semibold text-primary tracking-tight">Portfolio</span>
          </h2>
          <Link
            to="/explore"
            className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] border-b border-primary/20 pb-1 hover:border-primary transition-all"
          >
            View Archive
          </Link>
        </div>

        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="rounded-2xl aspect-[4/5] bg-surface-container-high mb-6" />
                <div className="space-y-3">
                  <div className="h-3 bg-surface-container-high rounded w-1/3" />
                  <div className="h-6 bg-surface-container-high rounded w-2/3" />
                  <div className="h-3 bg-surface-container-high rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-16">
            <span className="material-symbols-outlined text-5xl text-error mb-4">error</span>
            <p className="text-error font-medium">{error}</p>
            {error.includes('log in') && (
              <Link
                to="/auth"
                className="mt-4 inline-block px-6 py-3 rounded-full bg-primary text-white font-bold"
              >
                Go to Login
              </Link>
            )}
          </div>
        )}

        {!loading && !error && activities.length === 0 && (
          <div className="text-center py-16 space-y-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">
              add_circle
            </span>
            <p className="text-on-surface-variant text-lg font-medium">
              No experiences yet. Start curating your first activity!
            </p>
            <Link
              to="/host"
              className="inline-block px-8 py-4 bg-primary text-white rounded-xl font-bold shadow-lg mt-2"
            >
              Create Your First Activity
            </Link>
          </div>
        )}

        {!loading && !error && activities.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {activities.map((activity) => {
              const catConfig = CATEGORY_CONFIG[activity.category];
              const statusStyle = STATUS_STYLES[activity.status] || STATUS_STYLES.PENDING;

              return (
                <div key={activity.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl aspect-[4/5] mb-6">
                    <Link to={`/experience/${activity.id}`}>
                      <img
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                        src={
                          activity.images[0] || 'https://placehold.co/800x1000?text=No+Image'
                        }
                        alt={activity.title}
                      />
                    </Link>
                    <div
                      className={`absolute top-4 right-4 bg-white/95 backdrop-blur px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase shadow-sm ${statusStyle}`}
                    >
                      {activity.status}
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <Link
                        to={`/experience/${activity.id}`}
                        title="View Details"
                        className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-300"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(activity);
                        }}
                        title="Edit Activity"
                        className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-primary shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-400"
                      >
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(activity.id);
                        }}
                        title="Delete Activity"
                        disabled={deletingId === activity.id}
                        className="bg-white/90 backdrop-blur w-12 h-12 rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-white transition-all transform translate-y-4 group-hover:translate-y-0 duration-500 disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined">
                          {deletingId === activity.id ? 'hourglass_top' : 'delete'}
                        </span>
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold tracking-[0.15em] uppercase text-primary/60 mb-1 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[10px]">
                          {catConfig.icon}
                        </span>
                        {catConfig.label} • Max {activity.capacity}
                      </span>
                      <h4 className="font-headline text-2xl font-medium text-on-surface mb-2">
                        {activity.title}
                      </h4>
                      <p className="text-on-surface-variant text-sm font-light flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-primary/40">
                          location_on
                        </span>
                        {activity.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-primary">{activity.price}</p>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-widest">
                        TND
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Edit Modal ───────────────────────────────────────────────────────── */}
      {editingActivity && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low shrink-0">
              <h2 className="font-headline text-2xl text-primary font-bold">Edit Experience</h2>
              <button
                onClick={closeEditModal}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" style={{ scrollbarWidth: 'thin' }}>
              <form id="edit-activity-form" onSubmit={handleSaveEdit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Title
                  </label>
                  <input
                    name="title"
                    value={editForm.title}
                    onChange={handleEditChange}
                    required
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    required
                    rows={4}
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Category
                    </label>
                    <select
                      name="category"
                      value={editForm.category}
                      onChange={handleEditChange}
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    >
                      {allCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {CATEGORY_CONFIG[cat].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Capacity
                    </label>
                    <input
                      type="number"
                      name="capacity"
                      value={editForm.capacity}
                      onChange={handleEditChange}
                      min="1"
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Price (TND)
                    </label>
                    <input
                      type="number"
                      name="price"
                      value={editForm.price}
                      onChange={handleEditChange}
                      min="1"
                      step="0.1"
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Date
                    </label>
                    <input
                      type="datetime-local"
                      name="date"
                      value={editForm.date}
                      onChange={handleEditChange}
                      required
                      className="w-full bg-surface-container-low border-none rounded-xl p-3 focus:ring-2 focus:ring-primary text-on-surface font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                    Images
                  </label>
                  <ImageUploader
                    images={editForm.images || []}
                    onImagesChange={(urls) =>
                      setEditForm((prev) => ({ ...prev!, images: urls }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold uppercase tracking-widest text-primary/70">
                      Location
                    </label>
                    <p className="text-xs font-medium text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">location_on</span>{' '}
                      {editForm.location}
                    </p>
                  </div>
                  <input
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    required
                    placeholder="E.g. Tunis Medina"
                    className="w-full bg-surface-container-low border-none rounded-xl p-3 mb-2 focus:ring-2 focus:ring-primary text-on-surface"
                  />
                  <MapPicker
                    latitude={editForm.latitude || 36.8}
                    longitude={editForm.longitude || 10.18}
                    onLocationChange={(lat, lng) =>
                      setEditForm((prev) => ({ ...prev!, latitude: lat, longitude: lng }))
                    }
                    height="250px"
                  />
                </div>
              </form>
            </div>

            <div className="px-6 py-4 border-t border-outline-variant/30 flex justify-end gap-3 bg-surface-container-lowest shrink-0">
              <button
                type="button"
                onClick={closeEditModal}
                className="px-6 py-2.5 rounded-full font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-activity-form"
                disabled={isSaving}
                className="px-8 py-2.5 rounded-full bg-primary text-white font-bold tracking-wide shadow-md hover:shadow-lg hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{' '}
                    Saving...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">save</span> Save
                    Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative shapes */}
      <div className="fixed -bottom-32 -right-32 w-96 h-96 bg-primary/5 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="fixed top-1/2 -left-24 w-64 h-64 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
    </main>
  );
}