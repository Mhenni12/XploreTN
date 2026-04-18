import express from "express";
import { authenticateJWT } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { afterActivityWrite } from "../middleware/ai.middleware.js";
import * as activityController from "../controllers/activity.controller.js";

const router = express.Router();

// ── Middleware: respond helper ────────────────────────────────────────────────
/**
 * Reads from res.locals and sends the final JSON response.
 * Used after middleware that populates res.locals (e.g., AI embedding).
 *
 * Expected res.locals:
 *   - activity: the activity data
 *   - statusCode: HTTP status code (default: 200)
 *   - message: success message
 */
const respond = (req: express.Request, res: express.Response): void => {
  const { activity, statusCode = 200, message } = res.locals;
  res.status(statusCode).json({
    message,
    activity,
  });
};

// ─── Public routes ──────────────────────────────────────────────────────────
// GET /api/activities — list all activities (with optional filters)
router.get("/", activityController.list);

// GET /api/activities/my — get activities created by logged-in user
// NOTE: this MUST be before /:id to avoid "my" being parsed as an id
router.get("/my", authenticateJWT, activityController.myActivities);

// GET /api/activities/:id — get activity details
router.get("/:id", activityController.getById);

// ─── Protected routes (CITOYEN only) ────────────────────────────────────────
// POST /api/activities — create a new activity
router.post(
  "/",
  authenticateJWT,
  authorize("CITOYEN"),
  activityController.create,
  afterActivityWrite,
  respond,
);

// PUT /api/activities/:id — update an activity
router.put(
  "/:id",
  authenticateJWT,
  authorize("CITOYEN"),
  activityController.update,
  afterActivityWrite,
  respond,
);

// DELETE /api/activities/:id — delete an activity
router.delete(
  "/:id",
  authenticateJWT,
  authorize("CITOYEN"),
  activityController.remove,
);

export default router;
