import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { createChatModel } from "./llmFactory.js";
import AiConfigModel from "../models/aiConfig.js";

const DEFAULT_SYSTEM_PROMPT = `You are Mr. Doom, the official and elite AI Startup Strategist & Ecosystem Intelligence Bot for RealBell Business Foundation (RBF).

Key Persona Attributes:
- Tone: Highly knowledgeable, sharp, encouraging, executive, and direct.
- Domain Expertise: Startup fundraising, valuation, pitch deck reviews, incubation programs, partner cloud perks (Business Booster Kit with ₹25L+ in AWS/Google/Stripe credits), legal compliance, investor-mentor matchmaking, and milestone governance.
- Formatting: Format responses beautifully using Markdown with clear bullet points, bold highlights, concise paragraphs, structured recommendations, code blocks, and tables where helpful.
- Platform Context: When relevant, guide users to RealBell features like Business Booster Kit, Scheduled Meetings, Incubation Programs, Legal Compliance services, and Community Wall.`;

/**
 * Execute Mr. Doom Chat with LangChain (Non-streaming HTTP fallback)
 */
export async function runMrDoomChat({ user, prompt, history = [], sessionTitle = "" }) {
  let config = await AiConfigModel.findOne({ is_active: true }).lean();
  if (!config) {
    config = {
      provider: "groq",
      modelName: "gpt-oss 120b",
      apiKey: "",
      systemInstruction: DEFAULT_SYSTEM_PROMPT,
      botName: "Mr. Doom",
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  const systemInstruction = config.systemInstruction || DEFAULT_SYSTEM_PROMPT;
  const botName = config.botName || "Mr. Doom";

  const userContext = user
    ? `Current user: ${user.name || "Founder"} (${user.company_type || "Startup"}: "${user.company_name || "Innovator"}"). Subscription: ${user.subscription?.planName || "Starter Free"}.`
    : "";

  const systemMessageContent = `${systemInstruction}\n\n[Context: ${userContext}]`;
  const messages = [new SystemMessage(systemMessageContent)];

  const recentHistory = history.slice(-12);
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      messages.push(new AIMessage(msg.content));
    }
  }

  messages.push(new HumanMessage(prompt));

  try {
    const model = createChatModel(config);
    const response = await model.invoke(messages);
    const replyText = typeof response.content === "string" ? response.content : JSON.stringify(response.content);

    return {
      content: replyText,
      providerUsed: config.provider,
      modelUsed: config.modelName,
      botName,
    };
  } catch (err) {
    console.error("[Mr. Doom Agent Error]:", err.message);
    const fallbackReply = generateContextualFallback({ prompt, user, botName });
    return {
      content: fallbackReply,
      providerUsed: config.provider,
      modelUsed: config.modelName,
      botName,
      isFallback: true,
      errorDetail: err.message,
    };
  }
}

/**
 * Stream Mr. Doom Chat with LangChain Streaming & Token-by-Token emission
 */
export async function streamMrDoomChat({ user, prompt, history = [], onChunk, signal }) {
  let config = await AiConfigModel.findOne({ is_active: true }).lean();
  if (!config) {
    config = {
      provider: "groq",
      modelName: "gpt-oss 120b",
      apiKey: "",
      systemInstruction: DEFAULT_SYSTEM_PROMPT,
      botName: "Mr. Doom",
      temperature: 0.7,
      maxTokens: 2048,
    };
  }

  const systemInstruction = config.systemInstruction || DEFAULT_SYSTEM_PROMPT;
  const botName = config.botName || "Mr. Doom";

  const userContext = user
    ? `Current user: ${user.name || "Founder"} (${user.company_type || "Startup"}: "${user.company_name || "Innovator"}"). Subscription: ${user.subscription?.planName || "Starter Free"}.`
    : "";

  const systemMessageContent = `${systemInstruction}\n\n[Context: ${userContext}]`;
  const messages = [new SystemMessage(systemMessageContent)];

  const recentHistory = history.slice(-12);
  for (const msg of recentHistory) {
    if (msg.role === "user") {
      messages.push(new HumanMessage(msg.content));
    } else if (msg.role === "assistant") {
      messages.push(new AIMessage(msg.content));
    }
  }

  messages.push(new HumanMessage(prompt));

  let accumulatedContent = "";

  try {
    const model = createChatModel(config);
    const stream = await model.stream(messages);

    for await (const chunk of stream) {
      if (signal?.aborted) break;

      let chunkText = "";
      if (typeof chunk.content === "string") {
        chunkText = chunk.content;
      } else if (Array.isArray(chunk.content)) {
        chunkText = chunk.content.map((c) => c.text || "").join("");
      } else if (chunk.content) {
        chunkText = String(chunk.content);
      }

      if (chunkText) {
        accumulatedContent += chunkText;
        if (onChunk) {
          onChunk(chunkText, accumulatedContent);
        }
      }
    }

    return {
      content: accumulatedContent,
      providerUsed: config.provider,
      modelUsed: config.modelName,
      botName,
    };
  } catch (err) {
    console.error("[Mr. Doom Stream Error]:", err.message);

    // Fallback stream simulation
    const fallbackText = generateContextualFallback({ prompt, user, botName });
    const words = fallbackText.split(" ");
    accumulatedContent = "";

    for (let i = 0; i < words.length; i++) {
      if (signal?.aborted) break;
      const wordChunk = (i === 0 ? "" : " ") + words[i];
      accumulatedContent += wordChunk;
      if (onChunk) {
        onChunk(wordChunk, accumulatedContent);
      }
      await new Promise((resolve) => setTimeout(resolve, 20));
    }

    return {
      content: accumulatedContent,
      providerUsed: config.provider,
      modelUsed: config.modelName,
      botName,
      isFallback: true,
      errorDetail: err.message,
    };
  }
}

/**
 * Intelligent fallback generator if remote LLM API key is absent or unreachable
 */
function generateContextualFallback({ prompt, user, botName }) {
  const p = prompt.toLowerCase();
  const userName = user?.name || "Founder";

  if (p.includes("booster") || p.includes("cloud") || p.includes("credits") || p.includes("perks")) {
    return `Greetings ${userName}! As **${botName}**, I can confirm that RealBell Business Foundation offers ₹25,00,000+ in partner credits including AWS Activate, Google Cloud, Stripe fees waivers, and Notion discounts through the **Business Booster Kit** in your workspace.\n\n*Head to the **Business Booster Kit** section on your sidebar to claim your partner redemption codes directly.*`;
  }

  if (p.includes("investor") || p.includes("pitch") || p.includes("fundrais") || p.includes("funding")) {
    return `Hello ${userName}. For effective fundraising on RBF:\n\n1. **Pitch Clarity**: Articulate your problem, TAM, proprietary traction, and 18-month burn rate.\n2. **Matchmaking**: Utilize the **Connect** tab to filter certified ecosystem investors.\n3. **Scheduled Meetings**: Request 1-on-1 pitch sessions directly through our platform calendar.\n\nHow can I help refine your financial model or deck narrative today?`;
  }

  if (p.includes("incubation") || p.includes("program") || p.includes("cohort")) {
    return `Welcome ${userName}. RealBell partners with premier incubators and accelerators. You can browse active cohorts, grant deadlines, and accelerator applications directly under the **Programs** section in your sidebar.`;
  }

  return `Greetings ${userName}! I am **${botName}**, your Strategic AI Advisor at RealBell Business Foundation (RBF).\n\nI have received your query: *"**${prompt}**"*.\n\nI am equipped to advise on startup growth, venture fundraising, pitch decks, ecosystem partnerships, and legal compliance. How would you like to proceed?`;
}
