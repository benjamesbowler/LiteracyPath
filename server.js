import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

// Local dev tool: only accept requests from local dev servers, and never
// expose an open proxy to the OpenAI account.
app.use(cors({
  origin: [/^http:\/\/localhost(:\d+)?$/, /^http:\/\/127\.0\.0\.1(:\d+)?$/]
}));
app.use(express.json({ limit: "100kb" }));

// Minimal in-memory rate limit: each /generate-question call costs real money
// (chat completion + image generation), so cap the burn rate even locally.
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 10;
let rateWindowStart = Date.now();
let rateWindowCount = 0;
function rateLimited() {
  const now = Date.now();
  if (now - rateWindowStart > RATE_LIMIT_WINDOW_MS) {
    rateWindowStart = now;
    rateWindowCount = 0;
  }
  rateWindowCount += 1;
  return rateWindowCount > RATE_LIMIT_MAX;
}
const mediaCacheOptions = {
  immutable: false,
  maxAge: "7d"
};

app.use("/images", express.static("public/images", mediaCacheOptions));
app.use("/audio", express.static("public/audio", mediaCacheOptions));
app.use("/guided-reading", express.static("public/guided-reading", mediaCacheOptions));
app.use("/media", express.static("public/media", mediaCacheOptions));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-question", async (req, res) => {
  if (rateLimited()) {
    res.status(429).json({ error: "Too many requests; try again in a minute." });
    return;
  }
  try {
    const topics = [
      "animals",
      "food",
      "classroom objects",
      "daily actions",
      "weather",
      "colors"
    ];

    const topic =
      topics[Math.floor(Math.random() * topics.length)];

    const questionResponse =
      await openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: `
Create one simple kindergarten English multiple choice question.

Return ONLY valid JSON.

{
  "question": "",
  "correct": "",
  "choices": ["", "", "", ""],
  "imagePrompt": ""
}

Topic: ${topic}

Rules:
- very simple English
- child friendly
- image should clearly match answer
- no text in image
`
          }
        ]
      });

    const data = JSON.parse(
      questionResponse.choices[0].message.content
    );

    const imageResponse =
      await openai.images.generate({
        model: "gpt-image-1",
        prompt: data.imagePrompt,
        size: "1024x1024"
      });

    data.image =
      `data:image/png;base64,${imageResponse.data[0].b64_json}`;

    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Failed to generate question"
    });
  }
});

// Bind to loopback: this dev helper must never be reachable from the network.
app.listen(3001, "127.0.0.1", () => {
  console.log(
    "Server running on http://localhost:3001"
  );
});
