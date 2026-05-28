import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import OpenAI from "openai";

dotenv.config();

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

const app = express();

app.use(cors());
app.use(express.json());

app.post("/chat", async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await client.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages,
    });

    res.json({
      reply: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Something went wrong",
    });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});