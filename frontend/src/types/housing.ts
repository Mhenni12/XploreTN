// ─── Types ────────────────────────────────────────────────────────────────────

export type HousingType =
  | "Apartment"
  | "Villa"
  | "Studio"
  | "Traditional House"
  | "Farm Stay"
  | "Guesthouse"
  | "Riad"
  | "Chalet";

export interface Housing {
  id: string;
  title: string;
  description: string;
  location: string;
  type: HousingType;
  floors: number;
  rooms: number;
  familyMembers: number;
  maxTourists: number;
  maxStayDays: number;
  images: string[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface HousingFormData {
  title: string;
  description: string;
  location: string;
  type: HousingType;
  floors: number;
  rooms: number;
  familyMembers: number;
  maxTourists: number;
  maxStayDays: number;
  images: string[];
}

export type HousingFormErrors = Partial<Record<keyof HousingFormData, string>>;

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const HOUSING_TYPES: HousingType[] = [
  "Apartment",
  "Villa",
  "Studio",
  "Traditional House",
  "Farm Stay",
  "Guesthouse",
  "Riad",
  "Chalet",
];

// ─── ID Generator ─────────────────────────────────────────────────────────────

let _idCounter = 100;
function generateId(): string {
  return `housing_${Date.now()}_${++_idCounter}`;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export function validateHousingForm(data: HousingFormData): HousingFormErrors {
  const errors: HousingFormErrors = {};

  if (!data.title.trim()) {
    errors.title = "Title is required.";
  } else if (data.title.trim().length < 5) {
    errors.title = "Title must be at least 5 characters.";
  } else if (data.title.trim().length > 100) {
    errors.title = "Title must be under 100 characters.";
  }

  if (!data.description.trim()) {
    errors.description = "Description is required.";
  } else if (data.description.trim().length < 20) {
    errors.description = "Description must be at least 20 characters.";
  } else if (data.description.trim().length > 1000) {
    errors.description = "Description must be under 1000 characters.";
  }

  if (!data.location.trim()) {
    errors.location = "Location is required.";
  } else if (data.location.trim().length < 3) {
    errors.location = "Please enter a valid city or address.";
  }

  if (!HOUSING_TYPES.includes(data.type)) {
    errors.type = "Please select a valid housing type.";
  }

  if (!Number.isInteger(data.floors) || data.floors < 1 || data.floors > 10) {
    errors.floors = "Floors must be between 1 and 10.";
  }

  if (!Number.isInteger(data.rooms) || data.rooms < 1 || data.rooms > 20) {
    errors.rooms = "Rooms must be between 1 and 20.";
  }

  if (
    !Number.isInteger(data.familyMembers) ||
    data.familyMembers < 1 ||
    data.familyMembers > 15
  ) {
    errors.familyMembers = "Family members must be between 1 and 15.";
  }

  if (
    !Number.isInteger(data.maxTourists) ||
    data.maxTourists < 1 ||
    data.maxTourists > 20
  ) {
    errors.maxTourists = "Max tourists must be between 1 and 20.";
  }

  if (
    !Number.isInteger(data.maxStayDays) ||
    data.maxStayDays < 1 ||
    data.maxStayDays > 365
  ) {
    errors.maxStayDays = "Max stay must be between 1 and 365 days.";
  }

  return errors;
}

// ─── Pure CRUD helpers ────────────────────────────────────────────────────────

export function createHousing(data: HousingFormData): Housing {
  return { ...data, id: generateId(), createdAt: new Date() };
}

export function updateHousing(
  existing: Housing,
  data: HousingFormData,
): Housing {
  return { ...existing, ...data, updatedAt: new Date() };
}

export function deleteHousing(housings: Housing[], id: string): Housing[] {
  return housings.filter((h) => h.id !== id);
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatDuration(days: number): string {
  if (days === 1) return "1 Day";
  if (days < 7) return `${days} Days`;
  if (days === 7) return "1 Week";
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    const rem = days % 7;
    return rem === 0 ? `${weeks} Weeks` : `${weeks}w ${rem}d`;
  }
  if (days === 30) return "1 Month";
  if (days < 365) {
    const months = Math.floor(days / 30);
    const rem = days % 30;
    return rem === 0
      ? `${months} Month${months > 1 ? "s" : ""}`
      : `${months}mo ${rem}d`;
  }
  return "1 Year";
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-TN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

// ─── Mock In-Memory Store ─────────────────────────────────────────────────────

const STORE: Map<string, Housing> = new Map([
  [
    "1",
    {
      id: "1",
      title: "Dar El Jasmin — Medina Hideaway",
      description:
        "A restored 18th-century townhouse nestled in the heart of the Tunis Medina. Vaulted ceilings, hand-painted tiles, and a jasmine-scented courtyard await you.",
      location: "Tunis Medina, Tunis",
      type: "Traditional House",
      floors: 2,
      rooms: 4,
      familyMembers: 3,
      maxTourists: 4,
      maxStayDays: 14,
      images: [
        "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80",
      ],
      createdAt: new Date("2024-09-01"),
    },
  ],
  [
    "2",
    {
      id: "2",
      title: "Sidi Bou Said Cliff Apartment",
      description:
        "Sun-drenched apartment with sweeping views over the Gulf of Tunis. Blue shutters, white walls, and endless sky.",
      location: "Sidi Bou Said, Tunis",
      type: "Apartment",
      floors: 1,
      rooms: 2,
      familyMembers: 2,
      maxTourists: 2,
      maxStayDays: 7,
      images: [
        "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
      ],
      createdAt: new Date("2024-10-15"),
    },
  ],
]);

// ─── Internal helpers ─────────────────────────────────────────────────────────

function delay(ms = 400): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ok<T>(data: T, status = 200): ApiResponse<T> {
  return { data, error: null, status };
}

function fail<T>(message: string, status = 400): ApiResponse<T> {
  return { data: null, error: message, status };
}

// ─── API ──────────────────────────────────────────────────────────────────────
// GET    /api/housings       → housingApi.list()
// GET    /api/housings/:id   → housingApi.get(id)
// POST   /api/housings       → housingApi.create(data)
// PUT    /api/housings/:id   → housingApi.update(id, data)
// DELETE /api/housings/:id   → housingApi.remove(id)
// GET    /api/housings/stats → housingApi.stats()

export const housingApi = {
  async list(): Promise<ApiResponse<Housing[]>> {
    await delay();
    const all = Array.from(STORE.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    return ok(all);
  },

  async get(id: string): Promise<ApiResponse<Housing>> {
    await delay(200);
    const housing = STORE.get(id);
    if (!housing) return fail(`Housing "${id}" not found.`, 404);
    return ok(housing);
  },

  async create(data: HousingFormData): Promise<ApiResponse<Housing>> {
    await delay();
    const errors = validateHousingForm(data);
    if (Object.keys(errors).length > 0)
      return fail(
        "Validation failed: " + Object.values(errors).join(", "),
        422,
      );
    const housing = createHousing(data);
    STORE.set(housing.id, housing);
    return ok(housing, 201);
  },

  async update(
    id: string,
    data: HousingFormData,
  ): Promise<ApiResponse<Housing>> {
    await delay();
    const existing = STORE.get(id);
    if (!existing) return fail(`Housing "${id}" not found.`, 404);
    const errors = validateHousingForm(data);
    if (Object.keys(errors).length > 0)
      return fail(
        "Validation failed: " + Object.values(errors).join(", "),
        422,
      );
    const updated = updateHousing(existing, data);
    STORE.set(id, updated);
    return ok(updated);
  },

  async remove(id: string): Promise<ApiResponse<{ id: string }>> {
    await delay(250);
    if (!STORE.has(id)) return fail(`Housing "${id}" not found.`, 404);
    STORE.delete(id);
    return ok({ id });
  },

  async stats(): Promise<
    ApiResponse<{
      total: number;
      totalCapacity: number;
      avgStayDays: number;
      totalRooms: number;
    }>
  > {
    await delay(150);
    const all = Array.from(STORE.values());
    if (all.length === 0)
      return ok({ total: 0, totalCapacity: 0, avgStayDays: 0, totalRooms: 0 });
    return ok({
      total: all.length,
      totalCapacity: all.reduce((s, h) => s + h.maxTourists, 0),
      avgStayDays: Math.round(
        all.reduce((s, h) => s + h.maxStayDays, 0) / all.length,
      ),
      totalRooms: all.reduce((s, h) => s + h.rooms, 0),
    });
  },
};
