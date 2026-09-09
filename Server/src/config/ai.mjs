import dotenv from "dotenv";

dotenv.config();

console.log(
    "Groq API key loaded:",
    Boolean(process.env.GROQ_API_KEY)
);

const aiConfig = {
    provider: "groq",

    apiKey:
        process.env.GROQ_API_KEY,

    model:
        "openai/gpt-oss-120b",

    temperature:
        0.7,

    maxTokens:
        1024,
};

export default aiConfig;