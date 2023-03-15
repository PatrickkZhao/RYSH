import dotenv from 'dotenv';
import { Configuration, OpenAIApi } from "openai";
dotenv.config();

const configuration = new Configuration({
    apiKey: process.env.openai_key,
});
export const openaiClient = new OpenAIApi(configuration);