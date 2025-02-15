import OpenAI from "openai";
import * as dotenv from 'dotenv';

dotenv.config()

const openai = new OpenAI({
    apiKey: process.env.OPENAI_KEY
});

export async function test() {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant." },
            {
                role: "user",
                content: "Write a haiku about recursion in programming.",
            },
        ],
        store: true,
    });

    console.log(completion.choices[0].message);
}

