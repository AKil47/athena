import OpenAI from "openai";
import * as dotenv from 'dotenv';

require(dotenv.config()); // FIX THIS GOOFY AAH SHIT wtf

const openai = new OpenAI({apiKey: process.env.OPENAI_KEY});

export async function query_single(system, prompt) {
    const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: system},
            {
                role: "user",
                content: prompt,
            },
        ],
        store: false,
    });

    return completion.choices[0].message
}
