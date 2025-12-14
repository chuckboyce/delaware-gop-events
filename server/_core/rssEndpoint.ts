import { Request, Response } from "express";
import { generateRSSFeed } from "../rss";

/**
 * Express endpoint handler for /api/rss
 * Returns RSS 2.0 XML feed of approved events
 */
export async function handleRSSFeed(req: Request, res: Response): Promise<void> {
  try {
    const protocol = req.protocol || "https";
    const host = req.get("host") || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    const feed = await generateRSSFeed(baseUrl);

    res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(feed);
  } catch (error) {
    console.error("[RSS Feed] Error generating feed:", error);
    res.status(500).json({
      error: "Failed to generate RSS feed",
    });
  }
}
