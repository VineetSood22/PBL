import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// Import chatbot router
import chatbotRouter from "./src/api/chatbot.js";

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });
const app = express();
const PORT = process.env.PORT || 3000;

// Debug log for GEMINI_API_KEY at startup
console.log("GEMINI_API_KEY loaded at startup:", !!process.env.GEMINI_API_KEY);
if (process.env.GEMINI_API_KEY) {
  console.log("Key length at startup:", process.env.GEMINI_API_KEY.length);
} else {
  console.log("GEMINI_API_KEY is undefined or empty. Check .env file format.");
}

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Use chatbot router
app.use("/api", chatbotRouter);

// --- Mock route generator (your existing code) ---
const getMockRoute = (origin, destination) => {
  const distance = Math.floor(Math.random() * 10000) + 1000; // 1–11 km
  const duration = Math.floor(Math.random() * 3600) + 300;   // 5–65 mins

  return {
    origin,
    destination,
    distanceMeters: distance,
    duration: `${duration}s`,
    polyline: {
      encodedPolyline: "o}gnA~h}jFz@|@z@|@z@|@z@|@z@|@" // shortened example
    }
  };
};

// ✅ Route API
app.post("/api/get-route", (req, res) => {
  try {
    const { origin, destination } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({
        error: "Origin and destination are required.",
        success: false,
      });
    }

    if (
      !origin.latitude ||
      !origin.longitude ||
      !destination.latitude ||
      !destination.longitude
    ) {
      return res.status(400).json({
        error: "Origin and destination must include latitude and longitude.",
        success: false,
      });
    }

    const route = getMockRoute(origin, destination);
    res.json({ success: true, ...route });
  } catch (error) {
    console.error("Error in /api/get-route:", error);
    res.status(500).json({
      error: "Internal server error",
      success: false,
    });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
