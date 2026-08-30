import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Check,
  ExternalLink,
  Info,
  Lightbulb,
  AlertTriangle,
  Flame,
  ShieldAlert,
  Code2,
} from "lucide-react";

/**
 * Enhanced Code Block with macOS top bar and 1-click copy button
 */
function CodeBlock({ language, value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cleanLang = (language || "text").toLowerCase().replace("language-", "");

  return (
    <div className="my-3.5 rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0d1117] shadow-lg">
      {/* Code Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-slate-700/60 select-none">
        <div className="flex items-center gap-2">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
          </div>
          <span className="ml-2 font-mono text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {cleanLang}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 transition cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Syntax Highlighted Area */}
      <div className="text-[12px] sm:text-[13px] font-mono leading-relaxed overflow-x-auto">
        <SyntaxHighlighter
          language={cleanLang}
          style={vscDarkPlus}
          customStyle={{
            margin: 0,
            padding: "1rem 1.25rem",
            background: "transparent",
            fontSize: "inherit",
            lineHeight: "1.6",
          }}
          wrapLongLines={false}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/**
 * Intelligent Blockquote / Callout parser
 */
function SmartBlockquote({ children }) {
  // Inspect children to see if it starts with [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
  const textContent = React.Children.toArray(children)
    .map((c) => (typeof c === "string" ? c : c?.props?.children || ""))
    .flat()
    .join(" ");

  let type = "default";
  let alertIcon = null;
  let borderColor = "border-[#8B1D2C]";
  let bgColor = "bg-slate-50 dark:bg-slate-900/60";
  let textColor = "text-slate-800 dark:text-slate-200";

  if (textContent.includes("[!NOTE]")) {
    type = "NOTE";
    alertIcon = <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />;
    borderColor = "border-blue-500";
    bgColor = "bg-blue-500/10 border-blue-500/30";
  } else if (textContent.includes("[!TIP]")) {
    type = "TIP";
    alertIcon = <Lightbulb size={16} className="text-emerald-500 shrink-0 mt-0.5" />;
    borderColor = "border-emerald-500";
    bgColor = "bg-emerald-500/10 border-emerald-500/30";
  } else if (textContent.includes("[!IMPORTANT]")) {
    type = "IMPORTANT";
    alertIcon = <Flame size={16} className="text-purple-500 shrink-0 mt-0.5" />;
    borderColor = "border-purple-500";
    bgColor = "bg-purple-500/10 border-purple-500/30";
  } else if (textContent.includes("[!WARNING]")) {
    type = "WARNING";
    alertIcon = <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />;
    borderColor = "border-amber-500";
    bgColor = "bg-amber-500/10 border-amber-500/30";
  } else if (textContent.includes("[!CAUTION]")) {
    type = "CAUTION";
    alertIcon = <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />;
    borderColor = "border-rose-500";
    bgColor = "bg-rose-500/10 border-rose-500/30";
  }

  if (type !== "default") {
    return (
      <div className={`my-3.5 p-4 rounded-2xl border-l-4 ${borderColor} ${bgColor} flex items-start gap-3 shadow-xs`}>
        {alertIcon}
        <div className={`flex-1 text-xs sm:text-sm leading-relaxed ${textColor}`}>
          <div className="font-extrabold uppercase tracking-wider text-[11px] mb-1 opacity-90">
            {type}
          </div>
          {children}
        </div>
      </div>
    );
  }

  return (
    <blockquote className="my-3.5 border-l-4 border-[#8B1D2C] pl-4 py-2 bg-gradient-to-r from-[#8B1D2C]/5 to-transparent rounded-r-2xl italic text-xs sm:text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
      {children}
    </blockquote>
  );
}

export default function MarkdownRenderer({ content }) {
  if (!content) return null;

  return (
    <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm leading-relaxed space-y-2.5 font-sans">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ node, ...props }) => (
            <div className="mt-4 mb-2 pb-1 border-b border-gray-200 dark:border-slate-800">
              <h1 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-slate-100 tracking-tight flex items-center gap-2" {...props} />
            </div>
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-slate-100 mt-3.5 mb-1.5 flex items-center gap-2" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs sm:text-sm font-bold text-[#8B1D2C] dark:text-rose-400 mt-3 mb-1" {...props} />
          ),

          // Paragraph
          p: ({ node, ...props }) => (
            <p className="text-xs sm:text-sm leading-relaxed my-1.5 text-gray-800 dark:text-slate-200" {...props} />
          ),

          // Bold & Emphasis
          strong: ({ node, ...props }) => (
            <strong className="font-extrabold text-gray-900 dark:text-slate-100" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic text-gray-700 dark:text-slate-300" {...props} />
          ),

          // Lists
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 my-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-200 marker:text-[#8B1D2C] dark:marker:text-rose-400" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 my-2.5 text-xs sm:text-sm text-gray-800 dark:text-slate-200 marker:font-bold marker:text-[#8B1D2C] dark:marker:text-rose-400" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed pl-1" {...props} />
          ),

          // Code blocks & inline code
          code: ({ node, inline, className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");

            if (!inline && (match || codeString.includes("\n"))) {
              return (
                <CodeBlock
                  language={match ? match[1] : "text"}
                  value={codeString}
                />
              );
            }

            return (
              <code
                className="bg-rose-50 dark:bg-slate-800 text-[#8B1D2C] dark:text-rose-300 font-mono text-[11.5px] px-1.5 py-0.5 rounded-md border border-rose-200/60 dark:border-slate-700 font-semibold"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquote
          blockquote: ({ node, ...props }) => (
            <SmartBlockquote {...props} />
          ),

          // Tables
          table: ({ node, ...props }) => (
            <div className="my-4 overflow-hidden rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-[#151D2E] shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800 text-left text-xs" {...props} />
              </div>
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50/80 dark:bg-slate-900/80 text-gray-900 dark:text-slate-100 font-bold uppercase tracking-wider text-[11px]" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800/70" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="transition-colors hover:bg-gray-50/60 dark:hover:bg-slate-800/40 even:bg-gray-50/30 dark:even:bg-slate-900/30" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-4 py-3 font-extrabold text-gray-700 dark:text-slate-200" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-3 text-gray-800 dark:text-slate-200 align-top leading-relaxed" {...props} />
          ),

          // Links
          a: ({ node, href, children, ...props }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-bold text-[#8B1D2C] dark:text-rose-400 underline decoration-[#8B1D2C]/40 hover:decoration-[#8B1D2C] transition"
              {...props}
            >
              <span>{children}</span>
              <ExternalLink size={11} className="shrink-0 opacity-70" />
            </a>
          ),

          // Horizontal divider
          hr: ({ node, ...props }) => (
            <hr className="my-4 border-gray-200 dark:border-slate-800" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
