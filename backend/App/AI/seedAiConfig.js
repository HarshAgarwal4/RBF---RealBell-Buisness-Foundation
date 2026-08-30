import AiConfigModel from "../models/aiConfig.js";

export async function seedDefaultAiConfig() {
  try {
    const existing = await AiConfigModel.findOne();
    if (!existing) {
      await AiConfigModel.create({
        provider: "groq",
        modelName: "gpt-oss 120b",
        apiKey: process.env.GROQ_API_KEY || "",
        botName: "Mr. Doom",
        systemInstruction:
          "You are Mr. Doom, the elite AI Startup Strategist & Ecosystem Intelligence Bot for RealBell Business Foundation (RBF). You possess extensive expertise in startup valuation, incubation programs, venture capital fundraising, partner cloud booster perks, legal compliance, and strategic mentorship. Deliver sharp, actionable, and encouraging business advice tailored to founders and ecosystem leaders.",
        temperature: 0.7,
        maxTokens: 2048,
        is_active: true,
      });
      console.log("✅ Seeded default AI Config: Groq / gpt-oss 120b (Mr. Doom)");
    }
  } catch (err) {
    console.error("Error seeding default AI config:", err.message);
  }
}
