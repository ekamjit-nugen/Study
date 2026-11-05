import type { StoryPage, Topic } from "../types";

// AI 2.5: streaming the answer to the screen.

const SETTING = "The same online furniture shop. The Help page chat box works: correct answers (module 1), steady settings (2.4), a server endpoint (2.1). Analytics show a problem: a third of customers close the chat before the answer appears.";
const CAST = "**Priya** (product manager) has the drop-off numbers. **Dev** (developer) has to make the box feel fast. **Nisha** (support lead) notices customers repeat their question while waiting.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "An answer takes two to five seconds to be fully written, and the box shows nothing until it is finished. Customers stare at a spinner, think it is broken, and leave or retype.",
    title: "The spinner that lost a third of the customers",
    text: "Priya's analytics: the average answer appears after 3.4 seconds, and 32% of customers leave the chat before that. Nisha sees the other symptom in transcripts: customers type the same question twice, because nothing happened after the first one.\n\nDev's endpoint waits for the provider to finish the whole answer and then sends it. The model writes a token every few milliseconds, so a 150-token answer takes a couple of seconds to produce, plus the time to read the prompt (lesson 1.2). The box shows a spinner for all of it, then the full paragraph at once.\n\n**This is the problem.** The answer exists word by word from the first moment, but the customer sees none of it until the last word. Showing the words as they arrive is what every chat product does, and it is why they feel fast.",
  },
  {
    stage: "why",
    point: "The model produces tokens one after another. Waiting for the last one before showing the first throws away the time the customer could have been reading.",
    title: "Why waiting for the whole answer is the slow part",
    text: "From lesson 1.1, the answer is a loop: one token at a time, each one a few milliseconds after the last. The first token can be ready within a few hundred milliseconds of the request; the last one arrives seconds later.\n\nA request that returns a single response has to wait for the last token. A request that streams returns each token (or small group) as it is produced. The total time to the last word is identical. What changes is when the first word appears: almost immediately. People read at roughly the speed the model writes, so a streamed answer feels instant even when it takes the same three seconds in total.\n\nStreaming is therefore not an optimisation of the model; it is an optimisation of waiting. It also gives the customer a way to stop a long answer early, which saves tokens.",
    jargon: [["time to first token", "how long from sending the request to the first piece of the answer arriving; the number that decides whether a chat feels fast"]],
  },
  {
    stage: "concept",
    point: "Streaming arrives as a sequence of events from the provider. Your server forwards them to the browser as server-sent events, and the page appends text as it comes.",
    title: "Events, from the provider to the page",
    text: "Three hops.\n\n**Provider to server.** With streaming on, the SDK gives you an event stream: a start event, many small text deltas, and an end event with the stop reason and usage. You handle each delta as it arrives instead of one final object.\n\n**Server to browser.** The server keeps the HTTP response open and writes each delta as a server-sent event (SSE): a line of text, flushed immediately. The browser receives them one by one on the same connection. (WebSockets work too; SSE is simpler for one-way text.)\n\n**Browser.** The page reads the response body as a stream and appends each delta to the message bubble. It also keeps an abort control so the customer can stop, and it waits for the end event before marking the answer complete.\n\nUsage and stop reason arrive at the end; log them then. Errors can happen mid-stream, after text has already been shown, so the page needs an error state that keeps the partial text.",
    jargon: [["server-sent events (SSE)", "a plain HTTP response that stays open while the server writes small 'data:' lines one at a time; the browser reads them as they arrive"], ["delta", "one small piece of the answer, often a few characters, sent as soon as the model produced it"]],
    visual: {
      kind: "flow",
      steps: [
        { label: "Browser", sub: "POST /api/ask, reads the body as a stream", tone: "accent" },
        { label: "Server", sub: "calls the provider with stream: true" },
        { label: "Provider", sub: "events: start, text deltas…, end (usage)" },
        { label: "Server", sub: "writes each delta as an SSE line, flushes" },
        { label: "Browser", sub: "appends text as it arrives; abort button", tone: "ok" },
      ],
      caption: "The first word reaches the page a few hundred milliseconds after the click.",
    },
  },
  {
    stage: "visual",
    point: "The server side: the same call as lesson 2.1 with streaming on, each delta forwarded as an SSE line, and the usage logged at the end.",
    title: "The streaming endpoint",
    text: "Dev changes the endpoint from lesson 2.1. The request is the same; the response is now a stream. The important lines are the headers that keep the connection open, the loop over events, the flush after each write, and the end event that carries the token counts.",
    codes: [
      {
        title: "POST /api/ask, streaming",
        lang: "ts",
        src: `app.post("/api/ask", async (req, res) => {\n  const question = String(req.body.question ?? "").slice(0, 2000);\n\n  res.setHeader("Content-Type", "text/event-stream");\n  res.setHeader("Cache-Control", "no-cache");\n  res.flushHeaders();\n\n  const stream = client.messages.stream({\n    model: process.env.MODEL_SUPPORT!,\n    max_tokens: 300,\n    temperature: 0,\n    system: SUPPORT_RULES,\n    messages: [{ role: "user", content: \`<policy>\${await relevantPolicy(question)}</policy>\\n<customer>\${question}</customer>\` }],\n  });\n\n  req.on("close", () => stream.abort());   // customer left or pressed Stop\n\n  try {\n    for await (const event of stream) {\n      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {\n        res.write(\`data: \${JSON.stringify({ text: event.delta.text })}\\n\\n\`);\n      }\n    }\n    const final = await stream.finalMessage();\n    console.log({ usage: final.usage, stop: final.stop_reason });\n    res.write(\`data: \${JSON.stringify({ done: true, stop: final.stop_reason })}\\n\\n\`);\n  } catch (err) {\n    console.error(err);\n    res.write(\`data: \${JSON.stringify({ error: "Sorry, something went wrong. A person will reply by email." })}\\n\\n\`);\n  } finally {\n    res.end();\n  }\n});`,
        lines: [
          { sql: "res.setHeader(\"Content-Type\", \"text/event-stream\");", say: "Tells the browser this response is a stream of events, not one document." },
          { sql: "res.flushHeaders();", say: "Send the headers now, so the browser starts listening before any text exists." },
          { sql: "const stream = client.messages.stream({", say: "The same request as before; the SDK now hands back events as they arrive." },
          { sql: "req.on(\"close\", () => stream.abort());", say: "If the customer closes the tab or presses Stop, stop the model too. Unread tokens are wasted money." },
          { sql: "for await (const event of stream) {", say: "One event at a time: start, deltas, end." },
          { sql: "res.write(`data: ${JSON.stringify({ text: event.delta.text })}\\n\\n`);", say: "Each text delta becomes one SSE line, ending with a blank line, written immediately." },
          { sql: "const final = await stream.finalMessage();", say: "After the last delta: the assembled message with usage and stop reason. Log them here." },
          { sql: "res.write(`data: ${JSON.stringify({ error: \"Sorry, something went wrong. A person will reply by email.\" })}\\n\\n`);", say: "Errors can arrive mid-answer. Send one as an event so the page can show it under the partial text." },
        ],
        note: "Behind a proxy or a serverless platform, check that response buffering is off, or the stream arrives all at once at the end.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The browser reads the body as a stream, appends each delta to the bubble, and offers a Stop button that aborts the request.",
    title: "The page: append as it arrives",
    text: "The page uses fetch with a readable stream rather than the browser's EventSource, because the request is a POST with a body. It decodes chunks, splits them into SSE lines, and appends text. An AbortController wires the Stop button to the request, which closes the connection, which triggers the server's abort of the model.",
    codes: [
      {
        title: "chat.ts (browser)",
        lang: "ts",
        src: `const controller = new AbortController();\nstopButton.onclick = () => controller.abort();\n\nconst res = await fetch("/api/ask", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify({ question }),\n  signal: controller.signal,\n});\n\nconst reader = res.body!.getReader();\nconst decoder = new TextDecoder();\nlet buffer = "";\nbubble.textContent = "";\n\nwhile (true) {\n  const { value, done } = await reader.read();\n  if (done) break;\n  buffer += decoder.decode(value, { stream: true });\n  const lines = buffer.split("\\n\\n");\n  buffer = lines.pop() ?? "";\n  for (const line of lines) {\n    if (!line.startsWith("data: ")) continue;\n    const event = JSON.parse(line.slice(6));\n    if (event.text) bubble.textContent += event.text;\n    if (event.error) showError(event.error);\n    if (event.done) markComplete(event.stop);\n  }\n}`,
        lines: [
          { sql: "const controller = new AbortController();", say: "The handle that lets the Stop button cancel the request." },
          { sql: "signal: controller.signal,", say: "Aborting closes the connection; the server notices and aborts the model call." },
          { sql: "const reader = res.body!.getReader();", say: "Read the response as it arrives instead of waiting for the end." },
          { sql: "buffer += decoder.decode(value, { stream: true });", say: "Chunks can split an event in half; keep a buffer and only process complete ones." },
          { sql: "if (event.text) bubble.textContent += event.text;", say: "Append. The customer reads while the model writes." },
          { sql: "if (event.done) markComplete(event.stop);", say: "Only now is the answer complete; before this, show it as 'writing'." },
        ],
        note: "Render Markdown only on complete lines or at the end; re-rendering the whole bubble on every delta flickers.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Streaming changes three things you must handle: partial answers on error, tokens you never see if the user stops, and logging that happens at the end.",
    title: "What streaming changes in your code",
    text: "**Errors after text.** A failure two seconds in means the customer has already read half an answer. Keep the partial text, show the error beneath it, and never retry automatically in a way that appends a second answer.\n\n**Stop means stop.** When the customer aborts, the server must abort the provider call, or the model keeps writing tokens nobody reads and you pay for them.\n\n**Logging at the end.** Usage and stop reason arrive with the final event. If the stream is aborted, log what you know (an abort, the tokens so far if the provider reports them).\n\n**Structured output does not stream usefully.** JSON is not readable until it is complete; stream prose for people, and use ordinary calls for data (lesson 2.3). Tool calls (lesson 3.1) also arrive as events, which the SDK assembles for you.",
    table: {
      head: ["Situation", "Non-streaming", "Streaming"],
      rows: [
        ["First word appears", "after the whole answer (2–5 s)", "after a few hundred ms"],
        ["Error mid-answer", "nothing shown, one error", "partial text shown; error event under it"],
        ["Customer leaves", "answer completes, is billed, nobody reads it", "abort; stop paying"],
        ["Usage logging", "with the response", "at the end event"],
        ["JSON / tool output", "fine", "assemble first, use when complete"],
      ],
    },
    ask: "A long answer streams for ten seconds; the customer scrolls up to reread the start while new text keeps arriving at the bottom. What should the page do about scroll position?",
  },
  {
    stage: "compare",
    point: "Returning the finished answer is simpler and feels slow. Streaming with abort and partial-error handling is a little more code and is what makes a chat feel instant.",
    title: "Wait for the whole answer, or stream it",
    text: "Two endpoints that return the same words. The first waits for the provider to finish and sends one response. The second forwards each piece as it arrives, lets the customer stop, and keeps what was already shown if something fails.",
    versus: {
      beginner: {
        title: "One response at the end",
        code: "const reply = await client.messages.create({ ... });\nres.json({ answer: textOf(reply) });",
        points: ["Simplest possible code.", "The customer sees nothing for 2–5 seconds; a third leave.", "A customer who leaves still pays for the full answer.", "Errors are clean: no text or all of it."],
      },
      engineer: {
        title: "Stream with abort and partial-error handling",
        code: "const stream = client.messages.stream({ ... });\nreq.on(\"close\", () => stream.abort());\nfor await (const e of stream) res.write(sseLine(e));\nres.write(sseLine({ done: true, usage }));",
        points: ["First word within a few hundred milliseconds.", "Stop button cancels the model and the bill.", "Partial text survives an error, with a message under it.", "Usage logged at the end event, same as before."],
      },
      tradeoffs: ["Proxies and serverless platforms sometimes buffer; check that deltas really arrive early.", "Rendering Markdown on every delta flickers; render on complete lines.", "Not for JSON or tool outputs, which are only usable when complete."],
      when: "Anything a person reads as it is written: stream. Anything code consumes: a single response.",
    },
  },
  {
    stage: "recap",
    point: "Stream prose to people: first word in milliseconds, a Stop button that aborts the model, partial text kept on error, usage logged at the end. Do not stream data.",
    title: "Connect it back: the spinner, gone",
    text: "The third of customers who left were waiting for the last token before seeing the first. Streaming sends each token as it is produced: the server forwards provider events as SSE lines, the page appends them, and the first word appears almost at once. The Stop button aborts the request, which aborts the model, which stops the bill. Errors keep the partial text. Total time did not change; waiting did.",
    recap: {
      remember: ["Streaming changes when the first word appears, not when the last one does.", "Provider events → SSE lines → append in the page; usage arrives at the end.", "Abort on the server when the customer stops, or you pay for unread tokens.", "Keep partial text on error; stream prose, not JSON."],
      mistakes: ["Rendering the whole bubble on every delta.", "Forgetting to flush, or a proxy buffering the response until the end.", "Not aborting the model when the customer leaves.", "Streaming structured output and parsing it before it is complete."],
      production: ["Every chat product streams; it is the single biggest perceived-speed win.", "Time to first token is a standard metric next to total latency.", "Abort rates tell you how often answers are too long."],
      next: ["2.6 Long inputs: when the prompt will not fit.", "3.1 Tool calling: events that are not text.", "3.10 Reliability: timeouts and retries with streams."],
    },
    ask: "Nisha now wants a summary of a customer's whole history, three hundred messages, before answering. That will not fit, or will it? Next lesson.",
  },
];

export const A10: Topic = {
  slug: "streaming",
  title: "Streaming answers to the screen",
  minutes: 14,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain why streaming makes an answer feel fast without making it faster.", "Forward provider events to the browser as server-sent events and append them in the page.", "Abort the model when the customer stops, keep partial text on errors, log usage at the end.", "Know when not to stream."],
  prerequisites: ["first-api-call", "tokens-context-cost"],
  story: "A letter read aloud as it is written, instead of handed over when the ink is dry. The writing takes the same time; the listener starts hearing it at once, and can say 'that's enough' halfway.",
  tldr: [
    "Tokens are produced one by one; **streaming** shows each as it arrives. Total time is the same; **time to first token** drops to milliseconds.",
    "Provider **events** → server writes **SSE** lines → page appends; **usage** comes with the end event.",
    "**Abort** the model when the customer stops; keep **partial text** when an error arrives mid-answer.",
    "Stream prose for people; **do not stream JSON** or tool output that is only usable when complete.",
  ],
  words: [
    ["streaming", "receiving the answer as it is produced, piece by piece"],
    ["time to first token", "the delay before the first piece of the answer appears"],
    ["delta", "one small piece of text from the stream"],
    ["server-sent events (SSE)", "an open HTTP response that writes 'data:' lines one at a time"],
    ["AbortController", "the browser object that cancels a fetch request"],
    ["flush", "sending buffered bytes now instead of waiting for more"],
  ],
  sections: [],
  quiz: [
    { q: "Streaming reduces…", options: ["the total time to produce the answer", "the time until the first word appears", "the number of tokens", "the price per token"], answer: 1, reason: true, whyOptions: ["The model writes at the same speed either way.", "Correct. The customer starts reading almost immediately instead of after the last token.", "Same tokens; you may save some if the customer aborts.", "Pricing is unchanged."], why: "Streaming optimises waiting, not generation." },
    { q: "The customer presses Stop halfway. What must the server do?", options: ["Nothing; the connection is closed", "Abort the provider call so the model stops and billing stops", "Send the rest of the answer anyway", "Retry the request"], answer: 1, whyOptions: ["The provider keeps generating and charging unless told to stop.", "Correct. Closing the browser connection should trigger an abort of the model call.", "Nobody is listening; it is wasted tokens.", "A retry would start a second answer."], why: "Stop means stop the model, not just the page." },
    { q: "Which output should NOT be streamed to the user?", options: ["A support reply", "A product description", "A JSON classification the dashboard parses", "A long summary"], answer: 2, whyOptions: ["Prose: stream it.", "Prose: stream it.", "Correct. JSON is unusable until complete; make a normal call or assemble before parsing.", "Prose, and long: streaming helps most here."], why: "Stream what people read; not what code parses." },
  ],
  practice: [
    { q: "Describe the three hops of a streamed answer and what each one does.", answer: "Provider → server: the SDK yields events (start, text deltas, end with usage). Server → browser: each delta is written as an SSE 'data:' line and flushed on an open response. Browser: reads the body as a stream, splits complete events, appends text, handles done and error events, and can abort.", explain: "Same words, delivered as they exist." },
    { q: "A failure happens after half the answer has streamed. What does the page show and what does the server log?", answer: "The page keeps the partial text and shows an error message beneath it (no automatic retry that appends a second answer). The server logs the error, the tokens produced so far if known, and marks the answer incomplete.", explain: "Partial answers are a normal state in streaming; design for them." },
    { q: "Deltas arrive all at once at the end in production but not locally. What is wrong?", answer: "Something between the server and the browser buffers the response: a reverse proxy, a CDN, or a serverless platform that does not support streaming responses. Disable buffering for that route or use a platform/runtime that supports streaming.", explain: "Streaming needs every hop to pass bytes through immediately." },
  ],
  interview: [
    { level: "junior", q: "What is streaming in an LLM API and why use it?", a: "Receiving the answer as a sequence of small text pieces as the model produces them instead of one response at the end. Total time is the same; the first words appear within a few hundred milliseconds, so chat feels fast, and the user can stop early, which saves tokens." },
    { level: "mid", q: "How do you get streamed tokens from your server to a browser?", a: "Keep the HTTP response open with Content-Type text/event-stream, write each delta as a 'data:' line followed by a blank line and flush, and send an end event with usage and stop reason. The browser reads the response body as a stream, splits on blank lines, parses each event and appends the text. WebSockets work too; SSE is simpler for one-way text." },
    { level: "mid", tricky: true, q: "Streaming made our answers appear faster, so can we skip reducing prompt size?", a: "Streaming cannot shorten the time before the first token, which is dominated by reading the input (lesson 1.2). A 25,000-token prompt still means seconds before the first word, streamed or not. Streaming and smaller prompts fix different parts of the wait; do both." },
    { level: "mid", q: "What has to happen when the user aborts a streamed answer?", a: "The browser aborts the fetch, the server detects the closed connection and aborts the provider call so generation and billing stop, and the server logs the partial usage. Without the server-side abort, the model finishes an answer nobody reads." },
    { level: "senior", q: "What are the failure modes specific to streaming, and how do you handle them?", a: "Errors after partial output (keep the text, show the error, no appending retry), proxies or platforms buffering the stream (disable buffering, choose a runtime that streams), split events across chunks (buffer and parse complete events), lost end events (treat connection close without 'done' as incomplete), and flicker from re-rendering (render on complete lines). Log usage from the end event and handle the aborted case." },
    { level: "junior", q: "When should you not stream?", a: "When code consumes the output: JSON for a dashboard, a classification, a tool call's arguments. Those are only valid when complete, so make a normal call or assemble the stream before parsing. Stream prose that a person reads." },
    { level: "mid", tricky: true, q: "Our SSE stream works in development but arrives all at once in production. Is the SDK broken?", a: "Almost certainly a buffering hop: an Nginx or CDN layer, or a serverless platform that collects the response before returning it. Confirm by curling the production endpoint and watching timing; then disable buffering on the route (for Nginx, X-Accel-Buffering: no) or deploy the streaming route on a runtime that supports it." },
    { level: "mid", q: "How do tool calls interact with streaming?", a: "Tool-use blocks arrive as events too: a block start, partial JSON deltas, a block stop. The SDK assembles the arguments; you act on the tool call only when its block is complete, then continue the conversation. Text before and after still streams to the user." },
    { level: "senior", q: "Which metrics do you track for a streaming chat feature?", a: "Time to first token, total time, tokens per second, abort rate and where in the answer users stop, error-after-partial rate, and usage from end events reconciled against the provider's billing. Abort position tells you whether answers are too long; TTFT tells you whether prompts are too big." },
    { level: "junior", q: "What is time to first token?", a: "The delay between sending the request and the first piece of the answer arriving. It is mostly the time to read the prompt plus network overhead, and it is the number that decides whether a chat feels responsive. Streaming makes it visible; smaller prompts make it shorter." },
  ],
  remember: [
    "Stream prose; the first word in milliseconds, same total time.",
    "Events → SSE lines → append. Usage at the end event.",
    "Abort the model when the customer stops. Keep partial text on error.",
    "Never stream JSON or tool output into a parser before it is complete.",
  ],
};
