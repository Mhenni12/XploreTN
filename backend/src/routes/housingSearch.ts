import express from "express";
import { Request, Response } from "express";
import prisma from "../prisma";

const router = express.Router();

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_HOUSING_TYPES = [
  "APARTMENT",
  "VILLA",
  "STUDIO",
  "TRADITIONAL_HOUSE",
  "FARM_STAY",
  "GUESTHOUSE",
  "RIAD",
  "CHALET",
] as const;

type HousingType = (typeof VALID_HOUSING_TYPES)[number];
type SortBy = "newest" | "oldest" | "maxTourists" | "maxStayDays" | "rooms";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(val: unknown): string {
  if (Array.isArray(val)) return String(val[0] ?? "");
  return String(val ?? "");
}

function intOrUndefined(val: unknown): number | undefined {
  const n = parseInt(str(val), 10);
  return isNaN(n) ? undefined : n;
}

function buildOrderBy(sortBy: SortBy): object {
  switch (sortBy) {
    case "oldest":      return { createdAt: "asc" };
    case "maxTourists": return { maxTourists: "desc" };
    case "maxStayDays": return { maxStayDays: "desc" };
    case "rooms":       return { rooms: "desc" };
    case "newest":
    default:            return { createdAt: "desc" };
  }
}

// Cast once — the createRequire-loaded client has no TS types at compile time.
const db = prisma as any;

// ─── GET /api/housingSearch/search ────────────────────────────────────────────

router.get("/search", async (req: Request, res: Response) => {
  try {
    const search    = str(req.query.search).trim();
    const location  = str(req.query.location).trim();
    const typesRaw  = str(req.query.types).trim();
    const sortByRaw = str(req.query.sortBy).trim() as SortBy;
    const excludeReservedByRaw = intOrUndefined(req.query.excludeReservedBy);

    const minRooms    = intOrUndefined(req.query.minRooms);
    const maxRooms    = intOrUndefined(req.query.maxRooms);
    const minTourists = intOrUndefined(req.query.minTourists);
    const maxTourists = intOrUndefined(req.query.maxTourists);
    const minStayDays = intOrUndefined(req.query.minStayDays);
    const maxStayDays = intOrUndefined(req.query.maxStayDays);

    // Parse and validate housing types
    let types: HousingType[] | undefined;
    if (typesRaw) {
      const parsed = typesRaw
        .split(",")
        .map((t) => t.trim().toUpperCase())
        .filter((t) => VALID_HOUSING_TYPES.includes(t as HousingType)) as HousingType[];
      if (parsed.length > 0) types = parsed;
    }

    const VALID_SORT: SortBy[] = ["newest", "oldest", "maxTourists", "maxStayDays", "rooms"];
    const sortBy: SortBy = VALID_SORT.includes(sortByRaw) ? sortByRaw : "newest";

    // ── Collect reserved housing IDs ──────────────────────────────────────────
    const activeRows: { housingId: string }[] = await db.reservation.findMany({
      where: { status: { in: [ "ACCEPTED"] } },
      select: { housingId: true },
    });

    let reservedHousingIds: string[] = [
      ...new Set(activeRows.map((r) => r.housingId)),
    ];

    if (excludeReservedByRaw != null) {
      const userRows: { housingId: string }[] = await db.reservation.findMany({
        where: {
          touristId: excludeReservedByRaw,
          status: { in: ["PENDING", "ACCEPTED"] },
        },
        select: { housingId: true },
      });
      reservedHousingIds = [
        ...new Set([...reservedHousingIds, ...userRows.map((r) => r.housingId)]),
      ];
    }

    // ── Build where clause ────────────────────────────────────────────────────
    const where: any = {};

    if (reservedHousingIds.length > 0) {
      where.id = { notIn: reservedHousingIds };
    }

    if (search) {
      where.OR = [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { location:    { contains: search, mode: "insensitive" } },
      ];
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }

    if (types && types.length > 0) {
      where.type = { in: types };
    }

    if (minRooms != null || maxRooms != null) {
      where.rooms = {};
      if (minRooms != null) where.rooms.gte = minRooms;
      if (maxRooms != null) where.rooms.lte = maxRooms;
    }

    if (minTourists != null || maxTourists != null) {
      where.maxTourists = {};
      if (minTourists != null) where.maxTourists.gte = minTourists;
      if (maxTourists != null) where.maxTourists.lte = maxTourists;
    }

    if (minStayDays != null || maxStayDays != null) {
      where.maxStayDays = {};
      if (minStayDays != null) where.maxStayDays.gte = minStayDays;
      if (maxStayDays != null) where.maxStayDays.lte = maxStayDays;
    }

    const housings = await db.housing.findMany({
      where,
      orderBy: buildOrderBy(sortBy),
    });

    return res.json(housings);
  } catch (error) {
    console.error("Housing search error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housingSearch/search/locations ──────────────────────────────────

router.get("/search/locations", async (_req: Request, res: Response) => {
  try {
    const activeRows: { housingId: string }[] = await db.reservation.findMany({
      where: { status: { in: [ "ACCEPTED"] } },
      select: { housingId: true },
    });

    const reservedIds = [...new Set(activeRows.map((r) => r.housingId))];

    const allResults: { location: string }[] = await db.housing.findMany({
      where: reservedIds.length > 0 ? { id: { notIn: reservedIds } } : undefined,
      select: { location: true },
      orderBy: { location: "asc" },
    });

    const seen = new Set<string>();
    const locations = allResults
      .map((r) => r.location)
      .filter((loc) => (seen.has(loc) ? false : seen.add(loc)));

    return res.json(locations);
  } catch (error) {
    console.error("Housing locations error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

// ─── GET /api/housingSearch/search/stats ─────────────────────────────────────

router.get("/search/stats", async (_req: Request, res: Response) => {
  try {
    const activeRows: { housingId: string }[] = await db.reservation.findMany({
      where: { status: { in: ["PENDING", "ACCEPTED"] } },
      select: { housingId: true },
    });

    const reservedIds  = [...new Set(activeRows.map((r) => r.housingId))];
    const whereClause  = reservedIds.length > 0 ? { id: { notIn: reservedIds } } : {};

    const [total, aggregate] = await Promise.all([
      db.housing.count({ where: whereClause }),
      db.housing.aggregate({
        where: whereClause,
        _sum: { maxTourists: true, rooms: true },
        _avg: { maxStayDays: true },
      }),
    ]);

    return res.json({
      total,
      totalCapacity: aggregate._sum.maxTourists ?? 0,
      totalRooms:    aggregate._sum.rooms        ?? 0,
      avgStayDays:   Math.round(aggregate._avg.maxStayDays ?? 0),
    });
  } catch (error) {
    console.error("Housing stats error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur" });
  }
});

export default router;