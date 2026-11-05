import type { Course, Module } from "../types";
import { A01 } from "./a01-what-a-model-does";
import { A02 } from "./a02-tokens-context-cost";
import { A03 } from "./a03-how-models-are-trained";
import { A04 } from "./a04-what-models-get-wrong";
import { A05 } from "./a05-choosing-a-model";
import { A06 } from "./a06-first-api-call";
import { A07 } from "./a07-prompting-that-works";
import { A08 } from "./a08-structured-output";
import { A09 } from "./a09-sampling-settings";
import { A10 } from "./a10-streaming";
import { A11 } from "./a11-long-inputs";
import { A12 } from "./a12-images-audio-files";
import { A13 } from "./a13-tool-calling";
import { A14 } from "./a14-agents";
import { A15 } from "./a15-mcp";
import { A16 } from "./a16-memory-and-state";
import { A17 } from "./a17-embeddings";
import { A18 } from "./a18-rag";
import { A19 } from "./a19-evals";
import { A20 } from "./a20-observability";
import { A21 } from "./a21-cost-and-latency";
import { A22 } from "./a22-reliability";

// AI for developers: everything a working developer needs to build with models, told as stories.
// Written lessons are listed in `topics`; the rest of the map is in `planned` and is written in order.

const M1: Module = {
  id: "how-models-work",
  title: "How models work, without the maths",
  simple: "What a model actually does, why it is priced in tokens, how it was trained, what it gets wrong, and how to choose one.",
  topics: [A01, A02, A03, A04, A05],
  planned: [],
};

const M2: Module = {
  id: "talking-to-models",
  title: "Talking to a model from code",
  simple: "The API call, prompts that work, answers your code can parse, the sampling dials, streaming, long inputs, images and audio.",
  topics: [A06, A07, A08, A09, A10, A11, A12],
  planned: [],
};

const M3: Module = {
  id: "building-with-models",
  title: "Building features with models",
  simple: "Tools, agents, MCP, memory, embeddings and retrieval, evals, tracing, cost, latency and reliability.",
  topics: [A13, A14, A15, A16, A17, A18, A19, A20, A21, A22],
  planned: [],
};

const M4: Module = {
  id: "safety-and-production",
  title: "Safety and production",
  simple: "Prompt injection, guardrails, privacy, testing, deployment patterns, fine-tune vs RAG vs prompt, local models, and the system-design round.",
  topics: [],
  planned: [
    ["prompt-injection", "Prompt injection and data exfiltration"],
    ["guardrails", "Guardrails: what goes in, what comes out, what tools may do"],
    ["privacy-and-pii", "Privacy and PII: what may leave your servers"],
    ["testing-nondeterministic-systems", "Testing systems that are never exactly the same"],
    ["deployment-patterns", "Deployment: gateways, queues, streaming, serverless limits"],
    ["fine-tune-vs-rag-vs-prompt", "Fine-tune, RAG or prompt: the decision"],
    ["local-and-open-models", "Open-weights and local models: Ollama, quantisation, GPUs"],
    ["ai-system-design-interview", "The AI system-design round"],
  ],
};

const M5: Module = {
  id: "projects",
  title: "Build it",
  simple: "A support assistant with retrieval and tools, end to end, and the interview bank.",
  topics: [],
  planned: [
    ["build-a-support-assistant", "Project: a support assistant with RAG and tools"],
    ["ai-interview-bank", "AI interview bank: the questions and the answers that land"],
  ],
};

export const AI_MODULES = [M1, M2, M3, M4, M5];

export const AI_COURSE: Course = {
  id: "ai",
  title: "AI for developers",
  short: "AI",
  emoji: "🤖",
  tagline: "What a model really does, how to talk to it from code, how to build features with it, and how to ship them safely. No maths, every idea as a story.",
  status: "ready",
  modules: AI_MODULES,
};

/** Every lesson slug in the map, written or planned, in order. */
export const AI_SLUGS = AI_MODULES.flatMap((m) => [...m.topics.map((t) => t.slug), ...(m.planned ?? []).map(([s]) => s)]);
