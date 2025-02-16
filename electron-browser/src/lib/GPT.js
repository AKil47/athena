import OpenAI from "openai";
import * as dotenv from 'dotenv';

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

    const maxRetries = 3;
    let retries = 0;
    while (retries < maxRetries) {
        try {
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: system },
                    { role: "user", content: prompt },
                ],
                store: false,
            });

            return completion.choices[0].message;
        } catch (error) {
            if (error.response && error.response.status === 429) {
                retries++;
                console.log(`Rate limit exceeded. Retrying... Attempt ${retries}`);
                // Wait for a few seconds before retrying
                await new Promise(resolve => setTimeout(resolve, 5000)); // 5 seconds
            } else {
                throw error; // Re-throw non-rate limit errors
            }
        }
    }

    throw new Error('Exceeded maximum retries due to rate limiting.');
}
