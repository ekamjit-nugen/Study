import type { StoryPage, Topic } from "../types";

// AI 2.7: images, audio and files in and out.

const SETTING = "The same online furniture shop. The Help page chat box handles text well. Now customers attach things: photos of a scratched desk, a PDF invoice, a voice note recorded on a phone. Today those attachments are ignored and a person has to look at them.";
const CAST = "**Nisha** (support lead) wants attachments handled like text. **Dev** (developer) has only ever sent text to the model. **Priya** (product manager) wants damage claims decided faster.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "A customer sends a photo of a scratched desk and a voice note describing it. The chat box reads neither, so it answers as if nothing was attached, and a person has to open both files later.",
    title: "The photo nobody read",
    text: "A customer writes 'my desk arrived like this', attaches two photos and a ten-second voice note, and the box replies with the generic returns policy, because all it received was the sentence. Nisha's team opens the photos an hour later: a deep scratch across the top. The claim could have been handled on the spot.\n\nDev has sent the model nothing but text so far. He knows models can 'see images' from the pricing page, where an image is priced as a number of tokens, but not how an image or a sound gets into the messages list, or what to do with a PDF.\n\n**This is the problem.** Customers do not only type. Photos, documents and audio arrive every day, and the box has to take them in, understand them, and keep its answers inside the policy.",
  },
  {
    stage: "why",
    point: "Modern models accept images and documents directly as parts of a message, and they are tokenised like text. Audio usually goes through a transcription model first, then arrives as text.",
    title: "Why a photo can be a message, and a voice note cannot (yet)",
    text: "A message's content is a list of parts, not a single string (lesson 2.1's content blocks, in the other direction). A part can be text, an image, or a document. The model turns an image into tokens too, a fixed number depending on its size, so an image costs roughly what a few hundred to a couple of thousand words would, and it counts against the context window like anything else.\n\nMany models handle images and PDFs natively. Audio is different: most chat models do not take sound; a separate speech-to-text model turns the recording into a transcript, and the transcript goes in as text. Some newer models accept audio directly; the pattern below works either way, because the transcript step can be a model call too.\n\nWhat does not change: the model still completes text. It will describe a scratch it sees, and it will also happily guess the cause, the cost of repair and the right refund. The policy and the human stay in charge of those (lesson 1.4).",
    jargon: [["multimodal", "a model that accepts more than text: images, documents, audio or video as parts of a message"], ["speech-to-text", "a model that turns a recording into a transcript; the transcript is then ordinary text for the chat model"]],
  },
  {
    stage: "concept",
    point: "Three inputs, three shapes: images as image parts (base64 or a URL), PDFs as document parts, audio as a transcript from a speech model. Ask for structured output when code acts on what was seen.",
    title: "Images, documents, audio",
    text: "**Images.** Sent as a content part with a media type and either base64 data or a URL. Resize before sending: a 12-megapixel phone photo costs far more tokens than a 1,000-pixel version and sees no better. A few images per message is fine; dozens are not.\n\n**Documents.** PDFs can be sent as a document part; the model reads text and layout and can describe figures. For long PDFs, lesson 2.6 applies: pages are tokens.\n\n**Audio.** Transcribe first with a speech-to-text model; send the transcript as text, labelled as a transcript so the model knows it may contain mishearings. Keep the recording for a person.\n\n**Outputs.** Chat models write text. Images and speech out come from separate image-generation and text-to-speech models, called the same way: a request in, a file out.\n\nWhatever came in, when code acts on the result (open a damage claim, fill a form), ask for structured output (lesson 2.3) with a confidence field, and route doubt to a person.",
    table: {
      head: ["Input", "How it enters the message", "Cost", "Watch out"],
      rows: [
        ["Photo", "image part: base64 or URL, with media type", "fixed tokens by size (hundreds to ~1,500)", "resize first; privacy: faces, addresses in the shot"],
        ["PDF / document", "document part", "pages → tokens", "long documents: chunk or retrieve (2.6)"],
        ["Voice note", "speech-to-text → transcript as text", "transcription + text tokens", "label as a transcript; mishearings"],
        ["Screenshot of an order", "image part", "as photo", "the model reads numbers from pixels; verify against the database"],
      ],
    },
  },
  {
    stage: "visual",
    point: "The damage-claim call: two resized photos and the customer's text, with a structured answer so the claim can be opened automatically.",
    title: "Reading the scratch",
    text: "Dev builds the request as a list of parts: the two photos, then the customer's message, then the question. The answer is structured: what is visible, how severe, whether it matches what the customer said, a confidence, and nothing about refunds, which the policy decides.",
    codes: [
      {
        title: "assessDamage()",
        lang: "ts",
        src: `import sharp from "sharp";\n\nasync function toImagePart(file: Buffer) {\n  const resized = await sharp(file).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();\n  return { type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data: resized.toString("base64") } };\n}\n\nconst assessment = {\n  name: "record_assessment",\n  description: "What the photos show about the delivered item.",\n  input_schema: {\n    type: "object",\n    properties: {\n      damage_seen: { type: "string", enum: ["none", "cosmetic", "structural", "unclear"] },\n      description: { type: "string" },\n      matches_customer_description: { type: "boolean" },\n      confidence: { type: "number", minimum: 0, maximum: 1 },\n    },\n    required: ["damage_seen", "description", "matches_customer_description", "confidence"],\n  },\n} as const;\n\nexport async function assessDamage(photos: Buffer[], customerText: string) {\n  const parts = [\n    ...(await Promise.all(photos.slice(0, 4).map(toImagePart))),\n    { type: "text" as const, text: \`<customer>\${customerText}</customer>\\n\\nDescribe only what is visible in the photos. Do not decide refunds or causes.\` },\n  ];\n  const r = await client.messages.create({\n    model: process.env.MODEL_VISION!, max_tokens: 300, temperature: 0,\n    tools: [assessment], tool_choice: { type: "tool", name: "record_assessment" },\n    messages: [{ role: "user", content: parts }],\n  });\n  return Assessment.parse(r.content.find((b) => b.type === "tool_use")?.input);\n}`,
        lines: [
          { sql: "const resized = await sharp(file).resize({ width: 1024, withoutEnlargement: true }).jpeg({ quality: 80 }).toBuffer();", say: "Shrink the phone photo to about 1,000 pixels wide before sending. The model sees the scratch just as well and the image costs a fraction of the tokens." },
          { sql: "return { type: \"image\" as const, source: { type: \"base64\" as const, media_type: \"image/jpeg\" as const, data: resized.toString(\"base64\") } };", say: "An image part: the bytes, encoded, with the media type. This sits in the content list like a text part." },
          { sql: "damage_seen: { type: \"string\", enum: [\"none\", \"cosmetic\", \"structural\", \"unclear\"] },", say: "Structured output (lesson 2.3): a fixed set of answers, with 'unclear' as the honest option." },
          { sql: "{ type: \"text\" as const, text: `<customer>${customerText}</customer>\\n\\nDescribe only what is visible in the photos. Do not decide refunds or causes.` },", say: "The text part comes after the images, with the instruction last. Scope: describe, do not decide." },
          { sql: "model: process.env.MODEL_VISION!,", say: "A model that accepts images (lesson 1.5): a setting, pinned." },
          { sql: "messages: [{ role: \"user\", content: parts }],", say: "Content is a list of parts, images and text together, in one user turn." },
        ],
        note: "The claim is opened by code from damage_seen and confidence; the refund decision follows the policy and, above a threshold, a person.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Audio goes through a transcription model first. The transcript is labelled as such, so the chat model treats it as possibly imperfect text, and the recording is kept for a person.",
    title: "The voice note",
    text: "Dev sends the recording to a speech-to-text endpoint and gets a transcript back. The transcript joins the message as text inside a tag that says what it is. If the transcript is empty or the service reports low confidence, the box asks the customer to type instead rather than guessing.",
    codes: [
      {
        title: "transcribeThenAsk()",
        lang: "ts",
        src: `export async function transcribe(audio: Buffer, mime: string): Promise<{ text: string; ok: boolean }> {\n  const res = await speech.transcriptions.create({ file: new File([audio], "note", { type: mime }), model: process.env.MODEL_SPEECH! });\n  const text = res.text.trim();\n  return { text, ok: text.length > 0 };\n}\n\nexport async function answerVoiceNote(audio: Buffer, mime: string) {\n  const { text, ok } = await transcribe(audio, mime);\n  if (!ok) return "I couldn't hear that clearly. Could you type your question?";\n\n  const r = await client.messages.create({\n    model: process.env.MODEL_SUPPORT!, max_tokens: 300, temperature: 0,\n    system: SUPPORT_RULES,\n    messages: [{ role: "user", content: \`<policy>\${await relevantPolicy(text)}</policy>\\n<voice_transcript note="automatic transcription, may contain errors">\${text}</voice_transcript>\` }],\n  });\n  return textOf(r);\n}`,
        lines: [
          { sql: "const res = await speech.transcriptions.create({ file: new File([audio], \"note\", { type: mime }), model: process.env.MODEL_SPEECH! });", say: "A different model, for one job: sound in, text out." },
          { sql: "if (!ok) return \"I couldn't hear that clearly. Could you type your question?\";", say: "An empty or failed transcript is a question to the customer, not a guess." },
          { sql: "<voice_transcript note=\"automatic transcription, may contain errors\">${text}</voice_transcript>", say: "The transcript is ordinary text now, labelled so the model allows for mishearings ('desk' vs 'disc')." },
        ],
        note: "Keep the original recording attached to the ticket; a person may need to hear it.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Images carry risks text does not: personal details in the frame, numbers the model reads imperfectly, and tokens spent on pixels. Three habits handle them.",
    title: "What changes when pixels come in",
    text: "**Privacy.** A photo of a delivery can include a house number, a face, a card on the table. Decide what may be sent to a provider (lesson 4.3), tell customers, and do not store more than the ticket needs.\n\n**Reading numbers from images.** A screenshot of an order confirmation lets the model read the order number, usually correctly. Always verify what it read against the database before acting; a 1 and a 7 look alike at low resolution.\n\n**Cost.** An image is a fixed number of tokens by size. Resize to about 1,000 pixels on the long side, send at most a handful, and never send the same image twice in a conversation if you can reference the first assessment instead.",
    table: {
      head: ["Risk", "Habit"],
      rows: [
        ["Personal details in the photo", "data policy for images; minimal storage; customer told"],
        ["Misread digits from a screenshot", "structured output + verify against the database before acting"],
        ["Token cost of large photos", "resize to ~1,000 px; at most a few images per message"],
        ["Model guessing causes and refunds from a picture", "scope the prompt to 'describe what is visible'; decisions follow policy and people"],
      ],
    },
    ask: "A customer sends a 40-page PDF manual and asks one question about assembly step 12. Which lesson's tool do you reach for before sending the PDF?",
  },
  {
    stage: "compare",
    point: "Sending the raw photo and asking 'what should we do?' gets a confident paragraph that decides a claim. Resized images, a describe-only instruction, structured output and a policy step get a claim that is right.",
    title: "Let the model decide the claim, or let it describe the photo",
    text: "Two ways to use the model on damage photos. The first sends the original file and asks the model what the shop should do. The second resizes, asks only what is visible, gets a structured answer, and lets the policy and a person decide.",
    versus: {
      beginner: {
        title: "Full-size photo, open question",
        code: "content: [photoPart(originalFile), { type: \"text\", text: \"The customer says the desk is damaged. What should we do?\" }]",
        points: ["Works in a demo.", "A 12-megapixel photo costs many times the tokens of a resized one.", "The model decides refunds and causes from a picture; sycophancy and hallucination apply (lesson 1.4).", "Prose output: nothing for the claims system to act on."],
      },
      engineer: {
        title: "Resized photos, describe only, structured, then policy",
        code: "content: [...resizedParts, { type: \"text\", text: \"<customer>…</customer>\\nDescribe only what is visible. Do not decide refunds or causes.\" }]\ntool_choice: record_assessment  →  { damage_seen, description, matches_customer_description, confidence }\nthen: policy rules in code; confidence < 0.7 → a person",
        points: ["A quarter of the tokens for the same visible scratch.", "The model's job is perception; the policy decides the outcome.", "A schema the claims system can act on, with 'unclear' and confidence.", "Doubt goes to Nisha's team with the photos attached."],
      },
      tradeoffs: ["Resizing can hide fine detail; keep the originals and send a crop if the model says 'unclear'.", "Describe-only answers are less satisfying in a demo; they are the ones you can defend.", "Transcription adds a hop and a cost for voice notes; typing remains the fallback."],
      when: "Any decision with money or a customer's trust: perceive with the model, decide with policy and people. Pure description tasks (alt text, cataloguing) can let the model write prose directly.",
    },
  },
  {
    stage: "recap",
    point: "Images and documents go in as message parts, resized; audio goes through transcription; outputs that code acts on are structured; the model describes, policy and people decide.",
    title: "Connect it back: the scratch, handled on the spot",
    text: "The photo nobody read is now two resized image parts in the message, with the customer's words and a describe-only instruction; the answer is a structured assessment with a confidence, and code opens the claim under the policy or routes it to a person. The voice note becomes a labelled transcript through a speech model, with typing as the fallback. Images are resized for cost, checked for personal details, and never trusted for digits without verifying against the database.",
    recap: {
      remember: ["Message content is a list of parts: text, image, document. Images are tokens too.", "Resize images to ~1,000 px; a few per message; a vision-capable model, pinned.", "Audio: transcribe first; label the transcript; keep the recording.", "Describe with the model, decide with policy and people; structured output when code acts."],
      mistakes: ["Sending full-resolution photos.", "Letting the model decide refunds from a picture.", "Acting on digits read from a screenshot without checking the database.", "Sending a 40-page PDF for a one-line question instead of retrieving."],
      production: ["Damage claims, receipt and invoice extraction, ID checks, alt text, visual search.", "Voice support flows: transcription, then the same text pipeline.", "Image privacy rules sit in every AI data-handling review."],
      next: ["3.1 Tool calling: the model asks for the order record instead of reading it from a screenshot.", "3.6 RAG: the 40-page manual, one question at a time.", "4.3 Privacy and PII: what may leave your servers, images included."],
    },
    ask: "Module 3 begins with the step every answer in this module wanted: letting the model ask your code to look things up and do things. Tool calling.",
  },
];

export const A12: Topic = {
  slug: "images-audio-files",
  title: "Images, audio and files in and out",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "intermediate",
  objectives: ["Send images and documents as message parts and understand their token cost.", "Handle audio by transcribing first and labelling the transcript.", "Scope vision tasks to perception, with structured output and a confidence, and keep decisions in policy and people.", "Apply privacy, verification and cost habits to non-text inputs."],
  prerequisites: ["first-api-call", "structured-output", "long-inputs"],
  story: "A colleague who can look at a photo and tell you exactly what they see, but who should not be the one deciding whether the customer gets a refund. You show them the picture, ask what is in it, and take it from there.",
  tldr: [
    "Message content is a **list of parts**: text, **image** (base64 or URL), **document** (PDF). Images cost a fixed number of **tokens** by size.",
    "**Resize** to ~1,000 px, send a few, use a **vision-capable** model.",
    "**Audio**: speech-to-text first; send the **labelled transcript**; typing is the fallback.",
    "The model **describes**; policy and people **decide**. **Structured output** when code acts on what was seen.",
  ],
  words: [
    ["multimodal", "accepts images, documents or audio as well as text"],
    ["image part", "a content item with media type and base64 data or a URL"],
    ["document part", "a content item carrying a PDF or similar file"],
    ["speech-to-text", "a model that turns audio into a transcript"],
    ["text-to-speech / image generation", "separate models that produce audio or images from text"],
    ["perception vs decision", "what the model sees vs what policy and people do about it"],
  ],
  sections: [],
  quiz: [
    { q: "A customer sends a 12-megapixel photo of a scratch. What do you do before sending it to the model?", options: ["Send it as is for maximum detail", "Resize to about 1,000 px on the long side", "Convert it to text", "Ask for a smaller photo"], answer: 1, reason: true, whyOptions: ["Full resolution costs many times the tokens and the model sees no better.", "Correct. The scratch is just as visible; the token cost drops to a fraction. Keep the original for people.", "There is no text in it to convert.", "Do it server-side; the customer should not have to."], why: "Images are tokens; resize." },
    { q: "How does a voice note reach the chat model?", options: ["As an audio part, always", "Transcribed by a speech-to-text model, then sent as labelled text", "It cannot be used", "As a base64 image"], answer: 1, whyOptions: ["Most chat models do not accept audio; some newer ones do, and the transcript pattern still works.", "Correct. Transcribe, label the transcript as automatic, keep the recording for a person, fall back to typing.", "It can, via transcription.", "Audio is not an image."], why: "Audio → transcript → text pipeline." },
    { q: "The model reads an order number from a screenshot. Before acting on it you should…", options: ["Trust it; vision is accurate", "Verify it against the database", "Ask the model again", "Lower the temperature"], answer: 1, whyOptions: ["Digits at low resolution are misread; 1 and 7, 0 and 8.", "Correct. Read with the model, check with code, then act.", "A second guess is still a guess.", "Temperature does not improve pixel reading."], why: "Perception by the model, verification by code." },
  ],
  practice: [
    { q: "Write the content list for a message with two photos and the customer's text, and say what instruction you put last.", answer: "[imagePart1, imagePart2, { type: 'text', text: '<customer>…</customer>\\n\\nDescribe only what is visible in the photos. Do not decide refunds or causes.' }]. Images first, text last, with the describe-only scope at the end.", explain: "Parts in a list; instruction after the data." },
    { q: "Design the structured output for a receipt photo so finance can import it safely.", answer: "Fields: merchant, date, total (number), currency (enum), line_items[] with description and amount, missing[] (enum of fields not readable), confidence. Code checks total against the sum of items and routes low confidence or mismatches to a person.", explain: "A schema with a place for 'unreadable', plus verification in code." },
    { q: "A customer attaches a 40-page assembly PDF and asks about step 12. Two approaches, and which is better?", answer: "Send the whole PDF as a document part (fits, but costs every page and risks lost-in-the-middle), or extract the text once, chunk it, and retrieve the pages about step 12 (lesson 3.6). Retrieval is better: cheaper, faster, and the answer comes from the relevant page.", explain: "Long documents follow lesson 2.6: retrieve, do not paste." },
  ],
  interview: [
    { level: "junior", q: "How do you send an image to a model?", a: "As an image part in the message content, with the media type and either base64 data or a URL, alongside text parts. The image is converted to tokens by the provider, so it is priced and counted against the context window like text. Resize before sending; a vision-capable model is required." },
    { level: "mid", q: "How do you handle audio input with a chat model?", a: "Transcribe it first with a speech-to-text model, then send the transcript as text, labelled as an automatic transcript so the model allows for errors, and keep the recording for a person. If transcription is empty or low confidence, ask the user to type. Some models accept audio directly; the pipeline is the same with one hop fewer." },
    { level: "mid", tricky: true, q: "Vision models read text from images, so can we skip OCR and database checks?", a: "They read text well but not perfectly, especially digits at low resolution, and they will confidently produce a plausible number. Read with the model into a structured field, then verify against your database or compute checks (totals match items) before acting. The model perceives; code verifies." },
    { level: "mid", q: "Why resize images before sending them?", a: "Image cost is a fixed number of tokens that grows with pixel size; a phone photo at full resolution can cost several times a 1,000-pixel version and the model does not see meaningfully better. Resize server-side, keep the original for humans, and send a crop if the model reports the detail is unclear." },
    { level: "senior", q: "Design a damage-claim flow using photos.", a: "Resize photos; send them with the customer's text and a describe-only instruction to a vision-capable model with a forced structured output: damage type (enum including unclear), description, whether it matches the customer's claim, confidence. Code applies the policy to open or escalate the claim; confidence below a threshold or 'unclear' goes to a person with the originals. Privacy rules for images, retention limits, and evals on a labelled photo set." },
    { level: "mid", tricky: true, q: "The model wrote a convincing paragraph deciding the customer deserves a refund from the photo. Is that a good feature?", a: "No. Refund decisions follow policy and often a person; the model's role is to describe what is visible. A persuasive paragraph is lesson 1.4's sycophancy and hallucination in picture form. Scope the prompt to perception, make the output structured, and let code and policy decide." },
    { level: "junior", q: "What privacy issues come with images?", a: "Photos capture more than the subject: faces, house numbers, documents on a table. Decide what may be sent to a provider, inform customers, store only what the ticket needs, and apply the same retention rules as for text, or stricter." },
    { level: "senior", q: "How do you evaluate a vision feature?", a: "A labelled set of real images with ground truth (damage type, extracted fields), run through the pipeline on every change; accuracy per field, confidence calibration (are low-confidence items actually wrong more often), and cost per image. Include hard cases: blur, glare, partial views." },
    { level: "mid", q: "How do PDFs enter a model, and what is the catch?", a: "As a document part; the model reads text and layout. The catch is size: pages are tokens, and long documents hit cost and lost-in-the-middle. For one question about a long PDF, extract text and retrieve the relevant pages instead of sending it all." },
    { level: "mid", q: "What about generating images or speech?", a: "Different models: image generation and text-to-speech, called with a request and returning a file. The chat model can write the prompt or the script, and your code calls the generation model. Costs and content rules differ from text; treat outputs as assets to store and review." },
  ],
  remember: [
    "Content is a list of parts. Images are tokens. Resize.",
    "Audio → transcript (labelled) → text pipeline. Typing as fallback.",
    "The model describes; policy and people decide. Structure the output.",
    "Verify digits read from pixels against the database.",
  ],
};
