import AiConfigModel from "../models/aiConfig.js";
import AiSessionModel from "../models/aiSession.js";
import AiMessageModel from "../models/aiMessage.js";
import { runMrDoomChat } from "../AI/mrDoomAgent.js";
import { createChatModel } from "../AI/llmFactory.js";
import { HumanMessage } from "@langchain/core/messages";

/**
 * Public Bot Info for User Chat Header
 */
export async function getPublicAiInfo(req, res) {
  try {
    let config = await AiConfigModel.findOne({ is_active: true }).lean();
    if (!config) {
      config = {
        provider: "groq",
        modelName: "gpt-oss 120b",
        botName: "Mr. Doom",
        systemInstruction: "You are Mr. Doom, Strategic AI Advisor for RealBell Business Foundation.",
      };
    }

    return res.json({
      status: 1,
      bot: {
        botName: config.botName || "Mr. Doom",
        provider: config.provider || "groq",
        modelName: config.modelName || "gpt-oss 120b",
        temperature: config.temperature || 0.7,
      },
    });
  } catch (err) {
    console.error("getPublicAiInfo error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Get complete AI Configuration (API Key masked)
 */
export async function getAdminAiConfig(req, res) {
  try {
    let config = await AiConfigModel.findOne().lean();
    if (!config) {
      config = await AiConfigModel.create({
        provider: "groq",
        modelName: "gpt-oss 120b",
        apiKey: "",
        botName: "Mr. Doom",
        systemInstruction:
          "You are Mr. Doom, the elite AI Startup Strategist & Ecosystem Intelligence Bot for RealBell Business Foundation (RBF). You possess extensive expertise in startup valuation, incubation programs, venture capital fundraising, partner cloud booster perks, legal compliance, and strategic mentorship. Deliver sharp, actionable, and encouraging business advice tailored to founders and ecosystem leaders.",
        temperature: 0.7,
        maxTokens: 2048,
        is_active: true,
      });
      config = config.toObject();
    }

    // Mask API Key for security if present
    const rawKey = config.apiKey || "";
    const maskedKey =
      rawKey.length > 8
        ? `${rawKey.slice(0, 4)}••••••••${rawKey.slice(-4)}`
        : rawKey ? "••••••••" : "";

    return res.json({
      status: 1,
      config: {
        ...config,
        hasApiKey: Boolean(rawKey),
        maskedApiKey: maskedKey,
      },
    });
  } catch (err) {
    console.error("getAdminAiConfig error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Update AI Configuration (Provider, Model, API Key, Persona, Temperature)
 */
export async function updateAdminAiConfig(req, res) {
  try {
    const {
      provider,
      modelName,
      apiKey,
      systemInstruction,
      botName,
      temperature,
      maxTokens,
      is_active,
    } = req.body;

    if (!provider || !modelName) {
      return res.status(400).json({ status: 0, msg: "Provider and Model Name are required" });
    }

    let configDoc = await AiConfigModel.findOne();
    if (!configDoc) {
      configDoc = new AiConfigModel();
    }

    configDoc.provider = provider.toLowerCase().trim();
    configDoc.modelName = modelName.trim();
    if (typeof apiKey === "string" && apiKey.trim() && !apiKey.includes("••••")) {
      configDoc.apiKey = apiKey.trim();
    }
    if (systemInstruction) configDoc.systemInstruction = systemInstruction.trim();
    if (botName) configDoc.botName = botName.trim();
    if (typeof temperature === "number") configDoc.temperature = temperature;
    if (typeof maxTokens === "number") configDoc.maxTokens = maxTokens;
    if (typeof is_active === "boolean") configDoc.is_active = is_active;
    configDoc.updatedBy = req.user._id;

    await configDoc.save();

    return res.json({
      status: 1,
      msg: `AI Configuration updated successfully for provider: ${configDoc.provider.toUpperCase()} (${configDoc.modelName})`,
      config: configDoc,
    });
  } catch (err) {
    console.error("updateAdminAiConfig error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * Admin: Test Connection / Verification
 */
export async function testAiConnection(req, res) {
  try {
    const { provider, modelName, apiKey, temperature } = req.body;
    let effectiveKey = apiKey;

    if (!effectiveKey || effectiveKey.includes("••••")) {
      const existing = await AiConfigModel.findOne().lean();
      effectiveKey = existing?.apiKey || "";
    }

    const testConfig = {
      provider: provider || "groq",
      modelName: modelName || "gpt-oss 120b",
      apiKey: effectiveKey,
      temperature: temperature || 0.7,
      maxTokens: 512,
    };

    const model = createChatModel(testConfig);
    const result = await model.invoke([
      new HumanMessage("Hello Mr. Doom! Please confirm your connection with a short 1-sentence greeting."),
    ]);

    const reply = typeof result.content === "string" ? result.content : JSON.stringify(result.content);

    return res.json({
      status: 1,
      msg: "Connection test succeeded!",
      reply,
      provider: testConfig.provider,
      modelName: testConfig.modelName,
    });
  } catch (err) {
    console.error("testAiConnection error:", err.message);
    return res.status(400).json({
      status: 0,
      msg: `Connection test failed: ${err.message}`,
    });
  }
}

/**
 * User: Get all chat sessions
 */
export async function getUserSessions(req, res) {
  try {
    const sessions = await AiSessionModel.find({
      user: req.user._id,
      is_deleted: { $ne: true },
    }).sort({ lastMessageAt: -1 });

    return res.json({ status: 1, sessions });
  } catch (err) {
    console.error("getUserSessions error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Create new chat session
 */
export async function createSession(req, res) {
  try {
    const { title } = req.body;
    const session = await AiSessionModel.create({
      user: req.user._id,
      title: title?.trim() || "New Strategy Session",
      lastMessageAt: new Date(),
    });

    return res.json({ status: 1, session });
  } catch (err) {
    console.error("createSession error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Delete chat session
 */
export async function deleteSession(req, res) {
  try {
    const { id } = req.params;
    await AiSessionModel.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { is_deleted: true }
    );
    await AiMessageModel.deleteMany({ session: id, user: req.user._id });

    return res.json({ status: 1, msg: "Conversation deleted successfully" });
  } catch (err) {
    console.error("deleteSession error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Get message history for a session
 */
export async function getSessionMessages(req, res) {
  try {
    const { id } = req.params;
    const session = await AiSessionModel.findOne({
      _id: id,
      user: req.user._id,
      is_deleted: { $ne: true },
    });

    if (!session) {
      return res.status(404).json({ status: 0, msg: "Chat session not found" });
    }

    const messages = await AiMessageModel.find({
      session: id,
      user: req.user._id,
    }).sort({ createdAt: 1 });

    return res.json({ status: 1, session, messages });
  } catch (err) {
    console.error("getSessionMessages error:", err);
    return res.status(500).json({ status: 0, msg: "Internal server error" });
  }
}

/**
 * User: Send a message to Mr. Doom & receive response
 */
export async function sendMessage(req, res) {
  try {
    const { sessionId, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ status: 0, msg: "Message content cannot be empty" });
    }

    let session = null;
    if (sessionId) {
      session = await AiSessionModel.findOne({
        _id: sessionId,
        user: req.user._id,
        is_deleted: { $ne: true },
      });
    }

    // Auto-create session if not provided
    if (!session) {
      const generatedTitle =
        message.trim().length > 35
          ? `${message.trim().slice(0, 32)}...`
          : message.trim();

      session = await AiSessionModel.create({
        user: req.user._id,
        title: generatedTitle,
        lastMessageAt: new Date(),
      });
    }

    // 1. Save user message to database
    const userMessage = await AiMessageModel.create({
      session: session._id,
      user: req.user._id,
      role: "user",
      content: message.trim(),
    });

    // 2. Fetch recent conversation history
    const pastMessages = await AiMessageModel.find({
      session: session._id,
      _id: { $ne: userMessage._id },
    })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // 3. Execute LangChain Mr. Doom agent
    const aiResponse = await runMrDoomChat({
      user: req.user,
      prompt: message.trim(),
      history: pastMessages,
      sessionTitle: session.title,
    });

    // 4. Save assistant response
    const assistantMessage = await AiMessageModel.create({
      session: session._id,
      user: req.user._id,
      role: "assistant",
      content: aiResponse.content,
      providerUsed: aiResponse.providerUsed,
      modelUsed: aiResponse.modelUsed,
    });

    // 5. Update session metadata
    const messageCount = await AiMessageModel.countDocuments({ session: session._id });
    if (messageCount <= 2 && session.title === "New Strategy Session") {
      const newTitle =
        message.trim().length > 35
          ? `${message.trim().slice(0, 32)}...`
          : message.trim();
      session.title = newTitle;
    }
    session.lastMessageAt = new Date();
    await session.save();

    return res.json({
      status: 1,
      session,
      userMessage,
      assistantMessage,
      botName: aiResponse.botName,
      providerUsed: aiResponse.providerUsed,
      modelUsed: aiResponse.modelUsed,
    });
  } catch (err) {
    console.error("sendMessage error:", err);
    return res.status(500).json({ status: 0, msg: "Failed to process chat message" });
  }
}
