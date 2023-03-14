import { Configuration, OpenAIApi } from "openai";

const configuration = new Configuration({
    apiKey: process.env.openai_key,
});
export const openaiClient = new OpenAIApi(configuration);