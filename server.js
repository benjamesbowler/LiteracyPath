import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post("/generate-question", async (req, res) => {
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

app.listen(3001, () => {
  console.log(
    "Server running on http://localhost:3001"
  );
});
