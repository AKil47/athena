import OpenAI from "openai";
const openai = new OpenAI();


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
