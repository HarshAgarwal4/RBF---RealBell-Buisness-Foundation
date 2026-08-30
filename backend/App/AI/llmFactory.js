import { ChatGroq } from "@langchain/groq";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatMistralAI } from "@langchain/mistralai";

/**
 * Creates and returns a LangChain Chat Model instance
 * based on the selected provider and database configuration.
 */
export function createChatModel(config) {
  const provider = (config?.provider || "groq").toLowerCase().trim();
  const modelName = config?.modelName?.trim() || "gpt-oss 120b";
  const apiKey = config?.apiKey?.trim() || process.env[`${provider.toUpperCase()}_API_KEY`] || "";
  const temperature = typeof config?.temperature === "number" ? config.temperature : 0.7;
  const maxTokens = config?.maxTokens || 2048;

  switch (provider) {
    case "groq": {
      // For Groq: standard models or custom model name
      const groqApiKey = apiKey || process.env.GROQ_API_KEY || "dummy_groq_key";
      return new ChatGroq({
        apiKey: groqApiKey,
        model: modelName,
        temperature,
        maxTokens,
      });
    }

    case "openai": {
      const openAIApiKey = apiKey || process.env.OPENAI_API_KEY || "dummy_openai_key";
      return new ChatOpenAI({
        apiKey: openAIApiKey,
        modelName: modelName || "gpt-4o-mini",
        temperature,
        maxTokens,
      });
    }

    case "google": {
      const googleApiKey = apiKey || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || "dummy_google_key";
      return new ChatGoogleGenerativeAI({
        apiKey: googleApiKey,
        model: modelName || "gemini-1.5-flash",
        temperature,
        maxOutputTokens: maxTokens,
      });
    }

    case "mistral": {
      const mistralApiKey = apiKey || process.env.MISTRAL_API_KEY || "dummy_mistral_key";
      return new ChatMistralAI({
        apiKey: mistralApiKey,
        model: modelName || "mistral-small-latest",
        temperature,
        maxTokens,
      });
    }

    case "huggingface": {
      const hfKey = apiKey || process.env.HUGGINGFACE_API_KEY || "dummy_hf_key";
      // Using OpenAI-compatible inference client for Hugging Face Router
      return new ChatOpenAI({
        apiKey: hfKey,
        baseURL: "https://api-inference.huggingface.co/v1",
        modelName: modelName || "meta-llama/Llama-3.2-3B-Instruct",
        temperature,
        maxTokens,
      });
    }

    default: {
      const defaultKey = apiKey || process.env.GROQ_API_KEY || "dummy_groq_key";
      return new ChatGroq({
        apiKey: defaultKey,
        model: modelName || "gpt-oss 120b",
        temperature,
        maxTokens,
      });
    }
  }
}
