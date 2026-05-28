import express from "express";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
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

app.post("/new-chat", (req, res) => {
    const chatId = uuidv4();

    const chat = {
        id: chatId,
        messages: [],
    };

    fs.writeFileSync(
        `./chats/${chatId}.json`,
        JSON.stringify(chat, null, 2)
    );

    res.json({ chatId });
});

app.get("/chat/:id", (req, res) => {
    const chatId = req.params.id;

    try {
        const data = fs.readFileSync(
            `./chats/${chatId}.json`,
            "utf-8"
        );

        res.json(JSON.parse(data));

    } catch {
        res.status(404).json({
            error: "Chat not found",
        });
    }
});

app.post("/chat", async (req, res) => {
    try {
        const { chatId, message } = req.body;

        const filePath = `./chats/${chatId}.json`;

        const chat = JSON.parse(
            fs.readFileSync(filePath, "utf-8")
        );

        chat.messages.push({
            role: "user",
            content: message,
        });

        const completion =
            await client.chat.completions.create({
                model: "openai/gpt-4o-mini",
                messages: chat.messages,
            });

        const reply =
            completion.choices[0].message.content;

        // Usage metadata
        const usage = completion.usage;

        // Model context window
        // gpt-4o-mini supports large context
        const MAX_CONTEXT_TOKENS = 128000;

        const totalTokens =
            usage?.total_tokens || 0;

        const remainingTokens =
            MAX_CONTEXT_TOKENS - totalTokens;

        chat.messages.push({
            role: "assistant",
            content: reply,
        });

        // Store latest token stats
        chat.lastUsage = {
            promptTokens:
                usage?.prompt_tokens || 0,

            completionTokens:
                usage?.completion_tokens || 0,

            totalTokens,

            remainingTokens,
        };

        fs.writeFileSync(
            filePath,
            JSON.stringify(chat, null, 2)
        );

        res.json({
            reply,

            usage: {
                promptTokens:
                    usage?.prompt_tokens || 0,

                completionTokens:
                    usage?.completion_tokens || 0,

                totalTokens,

                remainingTokens,
            },
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            error: "Failed to process chat",
        });
    }
});


app.post("/streamChat", async (req, res) => {
    try {
        const { messages } = req.body;

        const completion = await client.chat.completions.create({
            model: "openai/gpt-4o-mini",
            messages,
            stream: true, // change response delivery architecture
        });

        /*
            Instead of:
            single final response
    
            you now receive:
            incremental token chunks
        */

        res.setHeader("Content-Type", "text/plain");
        res.setHeader("Transfer-Encoding", "chunked");

        // consume streamed async data progressively
        for await (const chunk of completion) {
            const content =
                chunk.choices?.[0]?.delta?.content || "";

            res.write(content);
        }

        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).end();
    }
});

app.listen(3001, () => {
    console.log("Server running on port 3001");
});