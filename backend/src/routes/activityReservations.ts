import express, { Request, Response } from "express";
import prisma from "../prisma";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = express.Router();

// POST /api/activity-reservations
router.post("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const touristId = (req as AuthRequest).user!.userId;
    const { activityId, guests = 1, notes } = req.body;
    if (!activityId)
      return res.status(400).json({ message: "activityId est requis." });
    const activity = await prisma.activity.findUnique({
      where: { id: Number(activityId) },
      include: { creator: { select: { id: true, fullName: true } } },
    });
    if (!activity)
      return res.status(404).json({ message: "Activité introuvable." });
    if (activity.creatorId === touristId)
      return res
        .status(403)
        .json({
          message: "Vous ne pouvez pas réserver votre propre activité.",
        });
    const existing = await prisma.activityReservation.findFirst({
      where: {
        activityId: Number(activityId),
        touristId,
        status: { in: ["PENDING", "ACCEPTED"] },
      },
    });
    if (existing)
      return res.status(409).json({
        message:
          existing.status === "ACCEPTED"
            ? "Vous avez déjà une réservation confirmée pour cette activité."
            : "Vous avez déjà une demande en attente pour cette activité.",
        reservation: existing,
      });
    const reservation = await prisma.activityReservation.create({
      data: {
        activityId: Number(activityId),
        touristId,
        guests: Number(guests),
        notes: notes?.trim() || null,
        status: "PENDING",
      },
    });
    let conversation = await prisma.conversation.findFirst({
      where: {
        type: "dm",
        AND: [
          { participants: { some: { userId: touristId } } },
          { participants: { some: { userId: activity.creatorId } } },
        ],
      },
    });
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          type: "dm",
          participants: {
            create: [{ userId: touristId }, { userId: activity.creatorId }],
          },
        },
      });
    }
    const autoMessage = `Bonjour ! Je souhaite réserver l'activité « ${activity.title} » prévue le ${new Date(activity.date).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })} à ${activity.location}. Nombre de participants : ${guests}. ${notes ? `\nNote : ${notes}` : ""}Pourriez-vous confirmer ma réservation ? Merci !`;
    await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: touristId,
        text: autoMessage.trim(),
        readBy: [String(touristId)],
      },
    });
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });
    return res.status(201).json({
      message: "Réservation créée et message envoyé.",
      reservation,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Create activity reservation error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// GET /api/activity-reservations/my
router.get("/my", authenticateJWT, async (req: Request, res: Response) => {
  try {
    const touristId = (req as AuthRequest).user!.userId;
    const reservations = await prisma.activityReservation.findMany({
      where: { touristId },
      include: {
        activity: {
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            price: true,
            images: true,
            category: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(reservations);
  } catch (error) {
    console.error("Get activity reservations error:", error);
    return res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// GET /api/activity-reservations/active-for-creator
// Retourne les réservations PENDING + ACCEPTED des activités du créateur, groupées par activité
router.get(
  "/active-for-creator",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const creatorId = (req as AuthRequest).user!.userId;
      const reservations = await prisma.activityReservation.findMany({
        where: {
          status: { in: ["PENDING", "ACCEPTED"] },
          activity: { creatorId },
        },
        include: {
          tourist: {
            select: { id: true, fullName: true, email: true, image: true },
          },
          activity: {
            select: {
              id: true,
              title: true,
              location: true,
              category: true,
              images: true,
              price: true,
              date: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      type G = {
        id: number;
        title: string;
        location: string;
        category: string;
        images: string[];
        price: number;
        date: string;
        pendingReservations: typeof reservations;
        acceptedReservations: typeof reservations;
      };
      const grouped = reservations.reduce<Record<number, G>>((acc, r) => {
        const key = r.activity.id;
        if (!acc[key]) {
          acc[key] = {
            id: r.activity.id,
            title: r.activity.title,
            location: r.activity.location,
            category: r.activity.category,
            images: r.activity.images,
            price: r.activity.price,
            date: r.activity.date as unknown as string,
            pendingReservations: [],
            acceptedReservations: [],
          };
        }
        if (r.status === "PENDING") {
          acc[key].pendingReservations.push(r);
        } else {
          acc[key].acceptedReservations.push(r);
        }
        return acc;
      }, {});
      return res.json(Object.values(grouped));
    } catch (error) {
      console.error(
        "Get active activity reservations for creator error:",
        error,
      );
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// PATCH /api/activity-reservations/:id/cancel
router.patch(
  "/:id/cancel",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const touristId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);
      const reservation = await prisma.activityReservation.findUnique({
        where: { id: reservationId },
      });
      if (!reservation)
        return res.status(404).json({ message: "Réservation introuvable." });
      if (reservation.touristId !== touristId)
        return res.status(403).json({ message: "Accès refusé." });
      if (!["PENDING", "ACCEPTED"].includes(reservation.status))
        return res
          .status(400)
          .json({ message: "Cette réservation ne peut plus être annulée." });
      const updated = await prisma.activityReservation.update({
        where: { id: reservationId },
        data: { status: "CANCELLED" },
      });
      return res.json({
        message: "Réservation annulée.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Cancel activity reservation error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// GET /api/activity-reservations/activity/:activityId
router.get(
  "/activity/:activityId",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const creatorId = (req as AuthRequest).user!.userId;
      const activityId = Number(req.params.activityId);
      const activity = await prisma.activity.findUnique({
        where: { id: activityId },
      });
      if (!activity)
        return res.status(404).json({ message: "Activité introuvable." });
      if (activity.creatorId !== creatorId)
        return res.status(403).json({ message: "Accès refusé." });
      const reservations = await prisma.activityReservation.findMany({
        where: { activityId },
        include: {
          tourist: {
            select: { id: true, fullName: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return res.json(reservations);
    } catch (error) {
      console.error("Get activity reservations error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// PATCH /api/activity-reservations/:id/status
router.patch(
  "/:id/status",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const creatorId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);
      const { status } = req.body;
      if (!["ACCEPTED", "REJECTED"].includes(status))
        return res
          .status(400)
          .json({ message: "Statut invalide. Utilisez ACCEPTED ou REJECTED." });
      const reservation = await prisma.activityReservation.findUnique({
        where: { id: reservationId },
        include: { activity: true },
      });
      if (!reservation)
        return res.status(404).json({ message: "Réservation introuvable." });
      if (reservation.activity.creatorId !== creatorId)
        return res.status(403).json({ message: "Accès refusé." });
      if (reservation.status !== "PENDING")
        return res.status(400).json({
          message: "Seules les réservations en attente peuvent être modifiées.",
        });
      const updated = await prisma.activityReservation.update({
        where: { id: reservationId },
        data: { status },
      });
      return res.json({
        message:
          status === "ACCEPTED"
            ? "Réservation acceptée."
            : "Réservation refusée.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Update activity reservation status error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

// PATCH /api/activity-reservations/:id/complete
router.patch(
  "/:id/complete",
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const creatorId = (req as AuthRequest).user!.userId;
      const reservationId = String(req.params.id);
      const reservation = await prisma.activityReservation.findUnique({
        where: { id: reservationId },
        include: { activity: true },
      });
      if (!reservation)
        return res.status(404).json({ message: "Réservation introuvable." });
      if (reservation.activity.creatorId !== creatorId)
        return res.status(403).json({ message: "Accès refusé." });
      if (reservation.status !== "ACCEPTED")
        return res.status(400).json({
          message: "Seules les réservations acceptées peuvent être complétées.",
        });
      const updated = await prisma.activityReservation.update({
        where: { id: reservationId },
        data: { status: "COMPLETED" },
      });
      return res.json({
        message: "Activité marquée comme complétée.",
        reservation: updated,
      });
    } catch (error) {
      console.error("Complete activity reservation error:", error);
      return res.status(500).json({ message: "Erreur interne du serveur." });
    }
  },
);

export default router;
