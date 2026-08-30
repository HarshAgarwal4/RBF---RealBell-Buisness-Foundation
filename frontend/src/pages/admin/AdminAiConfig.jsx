import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import axios from "../../services/axios";
import { toast } from "react-toastify";
import { useStore } from "../../zustand/store";
import { isSuperAdmin, hasPermission } from "../../utils/rbac";
import {
  Bot,
  Cpu,
  KeyRound,
  Sliders,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  Play,
  Loader2,
  Eye,
  EyeOff,
  Shield,
  Layers,
  HelpCircle,
  Lock,
} from "lucide-react";

const PROVIDERS = [
  {
    id: "groq",
    name: "Groq (Default)",
    desc: "Ultra-fast open-weights inference engine (Llama 3, Mixtral, OSS 120B).",
    icon: "⚡",
    defaultModel: "gpt-oss 120b",
    popularModels: ["gpt-oss 120b", "llama-3.3-70b-versatile", "mixtral-8x7b-32768", "deepseek-r1-distill-llama-70b", "llama-3.1-8b-instant"],
    envVar: "GROQ_API_KEY",
  },
  {
    id: "openai",
    name: "OpenAI",
    desc: "Industry benchmark models (GPT-4o, GPT-4o-mini, o1).",
    icon: "🧠",
    defaultModel: "gpt-4o-mini",
    popularModels: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "o1-mini"],
    envVar: "OPENAI_API_KEY",
  },
  {
    id: "google",
    name: "Google Gemini",
    desc: "Multimodal and high-context intelligence (Gemini 1.5 Pro, Flash).",
    icon: "✨",
    defaultModel: "gemini-1.5-flash",
    popularModels: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash"],
    envVar: "GOOGLE_API_KEY",
  },
  {
    id: "mistral",
    name: "Mistral AI",
    desc: "European frontier models (Mistral Large, Codestral, Small).",
    icon: "🚀",
    defaultModel: "mistral-small-latest",
    popularModels: ["mistral-small-latest", "mistral-large-latest", "codestral-latest"],
    envVar: "MISTRAL_API_KEY",
  },
  {
    id: "huggingface",
    name: "Hugging Face",
    desc: "Open source community inference hub (Llama 3.2, Qwen).",
    icon: "🤗",
    defaultModel: "meta-llama/Llama-3.2-3B-Instruct",
    popularModels: ["meta-llama/Llama-3.2-3B-Instruct", "Qwen/Qwen2.5-72B-Instruct", "mistralai/Mistral-7B-Instruct-v0.3"],
    envVar: "HUGGINGFACE_API_KEY",
  },
];

export default function AdminAiConfig() {
  const currentUser = useStore((s) => s.user);
  const canManage = isSuperAdmin(currentUser) || hasPermission(currentUser, "ai_config.manage");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const [form, setForm] = useState({
    provider: "groq",
    modelName: "gpt-oss 120b",
    apiKey: "",
    botName: "Mr. Doom",
    systemInstruction: "",
    temperature: 0.7,
    maxTokens: 2048,
    is_active: true,
    maskedApiKey: "",
    hasApiKey: false,
  });

  useEffect(() => {
    document.title = "AI Model & Provider Configuration | RBF Admin";
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/ai/admin/config");
      if (res.data?.status === 1) {
        const c = res.data.config;
        setForm({
          provider: c.provider || "groq",
          modelName: c.modelName || "gpt-oss 120b",
          apiKey: c.maskedApiKey || "",
          botName: c.botName || "Mr. Doom",
          systemInstruction: c.systemInstruction || "",
          temperature: typeof c.temperature === "number" ? c.temperature : 0.7,
          maxTokens: c.maxTokens || 2048,
          is_active: typeof c.is_active === "boolean" ? c.is_active : true,
          maskedApiKey: c.maskedApiKey || "",
          hasApiKey: c.hasApiKey || false,
        });
      }
    } catch (err) {
      console.error("Failed to load AI config:", err);
      toast.error("Failed to load AI configuration");
    } finally {
      setLoading(false);
    }
  };

  const selectedProviderObj =
    PROVIDERS.find((p) => p.id === form.provider) || PROVIDERS[0];

  const handleProviderSelect = (providerId) => {
    if (!canManage) return;
    const prov = PROVIDERS.find((p) => p.id === providerId);
    setForm((prev) => ({
      ...prev,
      provider: providerId,
      modelName: prov ? prov.defaultModel : prev.modelName,
      // If switching provider, reset API key placeholder
      apiKey: "",
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!canManage) {
      toast.error("You do not have permission to modify AI configuration");
      return;
    }
    if (!form.provider || !form.modelName) {
      toast.error("Provider and Model Name are required");
      return;
    }

    try {
      setSaving(true);
      const res = await axios.put("/ai/admin/config", form);
      if (res.data?.status === 1) {
        toast.success("AI Configuration saved successfully!");
        fetchConfig();
      } else {
        toast.error(res.data?.msg || "Failed to save AI configuration");
      }
    } catch (err) {
      console.error("Save config error:", err);
      toast.error(err.response?.data?.msg || "Error saving configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!canManage) {
      toast.error("You do not have permission to test AI model connections");
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const res = await axios.post("/ai/admin/test", {
        provider: form.provider,
        modelName: form.modelName,
        apiKey: form.apiKey,
        temperature: form.temperature,
      });

      if (res.data?.status === 1) {
        setTestResult({
          success: true,
          msg: res.data.msg,
          reply: res.data.reply,
        });
        toast.success("Connection test succeeded!");
      } else {
        setTestResult({
          success: false,
          msg: res.data?.msg || "Test failed",
        });
        toast.error("Connection test failed");
      }
    } catch (err) {
      console.error("Test connection error:", err);
      setTestResult({
        success: false,
        msg: err.response?.data?.msg || err.message,
      });
      toast.error("Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto pb-12">

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 mb-2">
              <Bot className="w-3.5 h-3.5 text-purple-400" />
              <span>RBF-AI Engine & Persona Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              AI Model Configuration
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Configure multi-provider LangChain LLMs, model names, API credentials, and Mr. Doom persona instructions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {canManage && (
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing || loading}
                className="flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />}
                <span>Test Connection</span>
              </button>
            )}

            {canManage ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-5 py-2.5 text-xs font-bold transition shadow-md shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save AI Config</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
                <Lock size={14} />
                <span>View-Only Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* View-Only RBAC Notification Banner */}
        {!canManage && (
          <div className="rounded-2xl p-4 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3 animate-fadeIn">
            <Shield className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Team RBAC Notice:</span> You are viewing the AI configuration under team role permissions. Admin or Manager role with <code className="bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-200 font-mono">ai_config.manage</code> permission is required to edit settings or test connections.
            </div>
          </div>
        )}

        {/* Live Test Output Alert (If Tested) */}
        {testResult && (
          <div
            className={`rounded-2xl p-5 border transition-all animate-fadeIn ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-start gap-3">
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="text-sm font-bold">
                  {testResult.success ? "LLM Connection Verified Successfully" : "Connection Error"}
                </h4>
                <p className="text-xs mt-1 text-slate-300 whitespace-pre-wrap leading-relaxed font-mono">
                  {testResult.success ? `Sample Response: "${testResult.reply}"` : testResult.msg}
                </p>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-[#151D2E] border border-slate-800 p-16 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading AI configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION 1: MODEL PROVIDER SELECTION
               ═══════════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-[#151D2E] border border-slate-800 p-6 sm:p-7 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-indigo-400" />
                    <span>Select LLM Provider</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    LangChain dynamically routes queries to the chosen provider engine.
                  </p>
                </div>
                <span className="text-[11px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Active: {form.provider.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3.5 pt-2">
                {PROVIDERS.map((prov) => {
                  const isSelected = form.provider === prov.id;
                  return (
                    <div
                      key={prov.id}
                      onClick={() => handleProviderSelect(prov.id)}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10"
                          : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{prov.icon}</span>
                          {isSelected && (
                            <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">
                          {prov.name}
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                          {prov.desc}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-400">
                        Default: {prov.defaultModel}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION 2: MODEL NAME & API CREDENTIALS
               ═══════════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-[#151D2E] border border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-400" />
                <span>Model Identification & API Credentials</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Model Name */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Model Name / Identifier <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.modelName}
                    onChange={(e) => setForm({ ...form, modelName: e.target.value })}
                    placeholder="e.g. gpt-oss 120b, llama-3.3-70b-versatile, gpt-4o"
                    required
                    disabled={!canManage}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />

                  {/* Popular Model Suggestions Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                    <span className="text-[10px] text-slate-400 font-semibold mr-1">Presets:</span>
                    {selectedProviderObj.popularModels.map((mName) => (
                      <button
                        type="button"
                        key={mName}
                        disabled={!canManage}
                        onClick={() => setForm({ ...form, modelName: mName })}
                        className={`text-[10.5px] font-mono px-2 py-0.5 rounded-lg border transition ${
                          canManage ? "cursor-pointer" : "cursor-not-allowed opacity-50"
                        } ${
                          form.modelName === mName
                            ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40 font-bold"
                            : "bg-slate-800 text-slate-400 border-slate-700 hover:text-white"
                        }`}
                      >
                        {mName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Provider API Key
                    </label>
                    <span className="text-[10.5px] text-slate-400 font-mono">
                      Env Fallback: {selectedProviderObj.envVar}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type={showApiKey ? "text" : "password"}
                      value={form.apiKey}
                      onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                      disabled={!canManage}
                      placeholder={
                        form.hasApiKey
                          ? `Using configured key (${form.maskedApiKey})`
                          : `Enter ${selectedProviderObj.name} API Key`
                      }
                      className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 pr-11 text-xs sm:text-sm text-white font-mono placeholder:text-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    If left empty, the server automatically reads from the corresponding backend <code>.env</code> variable.
                  </p>
                </div>

              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION 3: BOT PERSONA & SYSTEM INSTRUCTION
               ═══════════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-[#151D2E] border border-slate-800 p-6 sm:p-7 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Persona & System Instruction</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Bot Display Name
                  </label>
                  <input
                    type="text"
                    value={form.botName}
                    onChange={(e) => setForm({ ...form, botName: e.target.value })}
                    placeholder="Mr. Doom"
                    disabled={!canManage}
                    className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-2.5 text-xs sm:text-sm text-white font-semibold outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      System Prompt / Persona Context
                    </label>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            systemInstruction:
                              "You are Mr. Doom, the elite AI Startup Strategist & Ecosystem Intelligence Bot for RealBell Business Foundation (RBF). You possess extensive expertise in startup valuation, incubation programs, venture capital fundraising, partner cloud booster perks, legal compliance, and strategic mentorship. Deliver sharp, actionable, and encouraging business advice tailored to founders and ecosystem leaders.",
                          })
                        }
                        className="text-[11px] font-bold text-indigo-400 hover:underline cursor-pointer"
                      >
                        Reset to Default Persona
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={4}
                    value={form.systemInstruction}
                    onChange={(e) => setForm({ ...form, systemInstruction: e.target.value })}
                    placeholder="Define the bot persona, tone, ecosystem context, and guardrails..."
                    disabled={!canManage}
                    className="w-full resize-none rounded-xl bg-slate-900 border border-slate-700 p-3.5 text-xs sm:text-sm text-white leading-relaxed placeholder:text-slate-500 outline-none focus:border-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════════════
                SECTION 4: HYPERPARAMETERS (TEMPERATURE & TOKENS)
               ═══════════════════════════════════════════════════════════════════════ */}
            <div className="rounded-3xl bg-[#151D2E] border border-slate-800 p-6 sm:p-7 shadow-xs space-y-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Hyperparameters & Token Limits</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Temperature */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Temperature ({form.temperature})
                    </label>
                    <span className="text-[11px] text-slate-400 font-semibold">
                      {form.temperature < 0.4 ? "Strict & Fact-focused" : form.temperature < 0.8 ? "Balanced (Recommended)" : "Highly Creative"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={form.temperature}
                    disabled={!canManage}
                    onChange={(e) => setForm({ ...form, temperature: parseFloat(e.target.value) })}
                    className="w-full accent-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Max Tokens */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Max Output Tokens ({form.maxTokens})
                    </label>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ~{Math.round(form.maxTokens * 0.75)} words max
                    </span>
                  </div>
                  <input
                    type="range"
                    min="512"
                    max="8192"
                    step="256"
                    value={form.maxTokens}
                    disabled={!canManage}
                    onChange={(e) => setForm({ ...form, maxTokens: parseInt(e.target.value) })}
                    className="w-full accent-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 text-sm font-bold transition shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Save AI Configuration</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </AdminLayout>
  );
}
