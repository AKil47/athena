import OpenAI from "openai";
import * as dotenv from 'dotenv';

// In Next.js, we can use process.cwd() to get the project root
dotenv.config({ path: process.cwd() + '/.env' });

// Verify the key is loaded
if (!process.env.NEXT_PUBLIC_OPENAI_KEY) {
    throw new Error('NEXT_PUBLIC_OPENAI_KEY environment variable is not set');
}

console.log(process.env.NEXT_PUBLIC_OPENAI_KEY);

export async function query_single(system, prompt) {
    const openai = new OpenAI({
        apiKey: process.env.NEXT_PUBLIC_OPENAI_KEY,
        dangerouslyAllowBrowser: true
    });
    
    const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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
