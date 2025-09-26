import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Setup Gemini client only if API key is available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    console.log("Gemini AI client created successfully.");
  } catch (initError) {
    console.error("Error creating Gemini AI client:", initError.message || initError);
    genAI = null;
  }
} else {
  console.log("No GEMINI_API_KEY found, using mock responses.");
}

// Mock responses for when API key is missing or API fails
const mockResponses = [
  "I'm sorry, but my AI brain is currently offline. Please set up a valid Gemini API key to enable full chatbot functionality!",
  "As a temporary assistant, I can tell you that travel is amazing! What else can I help with?",
  "Without a working API key, I'm limited, but I recommend checking out popular destinations like Paris or Tokyo.",
  "Let's plan a trip! Where would you like to go? (Note: Full AI responses require a valid Gemini API key.)",
];

// ✅ Chatbot route
router.post("/chatbot", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ reply: "⚠️ Please provide a message." });
    }

    // Debug log for API key
    console.log("GEMINI_API_KEY loaded:", !!process.env.GEMINI_API_KEY);
    if (process.env.GEMINI_API_KEY) {
      console.log("Key length:", process.env.GEMINI_API_KEY.length); // Don't log full key for security
    }

    // Try to use Gemini if API key is available
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(message);
        const reply = await result.response.text();
        return res.json({ reply: reply });
      } catch (apiError) {
        console.error("Gemini API error:", apiError.message || apiError);
        // Fall back to mock if API fails
      }
    }

    // Mock response when API key is missing or API fails
    const randomMock = mockResponses[Math.floor(Math.random() * mockResponses.length)];
    res.json({ reply: randomMock });
  } catch (error) {
    console.error("Chatbot error:", error.message || error);
    res.status(500).json({ reply: "⚠️ Server error, please try again." });
  }
});

export default router;
