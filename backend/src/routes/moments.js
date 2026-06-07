import { createDatabase } from "../db/index.js";
import { catchAsync } from "../utils/catchAsync.js";

export function setupMomentsRoutes(app) {
  app.get("/moments", catchAsync(async (c) => {
    const db = createDatabase(c.env);
    const { page = 1, limit = 100 } = c.req.query();
    try {
      const offset = (page - 1) * limit;
      const query = `
        SELECT id, event_name, photos, created_at
        FROM moments 
        ORDER BY created_at DESC 
        LIMIT $1 OFFSET $2
      `;
      const result = await db.query(query, [limit, offset]);
      const moments = result.success ? result.data : [];
      return c.json({
        success: true,
        message: "Moments fetched successfully",
        data: moments
      });
    } catch (error) {
      return c.json({
        success: false,
        message: "Failed to fetch moments",
        error: error.message
      }, 500);
    }
  }));

}
