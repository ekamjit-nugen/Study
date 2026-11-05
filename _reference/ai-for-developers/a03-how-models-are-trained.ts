import type { StoryPage, Topic } from "../types";

// AI 1.3: how a model is trained, and why your data is not in it.

const SETTING = "The same online furniture shop. The Help page chat box now sends the shop's rules with each question (lesson 1.2 made that cheap enough). Priya wants to stop sending the rules at all: 'train the model on our rules once, so it just knows them, and let it learn from every customer chat.'";
const CAST = "**Priya** (product manager) is asking. **Dev** (developer) has to explain what training is and is not. **Nisha** (support lead) worries about customer emails being used to train someone else's model.";

const TALE: StoryPage[] = [
  {
    stage: "problem",
    point: "Priya wants to 'train the model on our rules' so the rules never have to be sent, and expects the model to learn from customer chats. Neither works the way she imagines, and one of them is a privacy question.",
    title: "'Can we just train it on our rules?'",
    text: "Priya has three requests after reading last week's invoice. One: train the model on the 40-page rules document once, so the server stops sending it with every question. Two: let the model learn from the customer conversations it has, so it gets better every day. Three, from Nisha: make sure customer emails are not being used to train the provider's model for other companies.\n\nDev needs to answer all three honestly, and the answers depend on what 'training' actually is. The word is used for very different things: the enormous one-off job that created the model, a small extra job you can pay for, and the ordinary act of putting text in a prompt. Mixing them up leads to wasted months.\n\n**This is the problem.** 'Train it on our data' sounds like one simple step. It is three different things, with different costs, and only one of them is usually right for a shop's rules.",
  },
  {
    stage: "why",
    point: "A model's knowledge is stored in billions of numbers set during training, before you ever call it. Sending it text at run time changes nothing; it only fills the prompt.",
    title: "Why sending text is not teaching",
    text: "Inside the model are billions of numbers, called weights. Training is the process that set those numbers: the model read a vast amount of text and, for each piece, adjusted the numbers so it would predict the next token a little better. That ran for weeks on thousands of machines and then stopped. From that moment the numbers are frozen.\n\nWhen the shop's server calls the model, the text goes in, the frozen numbers process it, an answer comes out, and the numbers are exactly as they were. Nothing is written back. The next call starts from the same frozen model with nothing of the previous call in it. That is why lesson 1.2's rules had to be sent every time: there is nowhere inside the model for them to go.\n\nSo 'learning from every chat' cannot happen by itself. If the shop wants the model to behave differently, there are exactly two routes: change what is in the prompt, or run a training job that changes the numbers.",
    jargon: [["weights", "the billions of numbers inside a model that training adjusted; '7B' or '70B' is how many; they are frozen when you call the model"]],
  },
  {
    stage: "concept",
    point: "A model is made in three stages: pretraining on vast text, fine-tuning on examples of good behaviour, and preference tuning from human rankings. You can add a small fourth stage of your own.",
    title: "The three stages that made the model",
    text: "**Pretraining.** The model reads trillions of tokens of text from the web, books and code, and learns to predict the next token. After this it can continue any text fluently, but it does not answer questions; it continues them. This is where almost all of its knowledge comes from, and it ends at a date: the knowledge cutoff.\n\n**Instruction fine-tuning.** The model is trained further on a much smaller set of examples of the form 'here is a request, here is a good response'. Now it behaves like an assistant: it answers instead of continuing.\n\n**Preference tuning (RLHF and relatives).** People compare pairs of answers and say which is better. The model is adjusted toward the preferred ones. This is where tone, helpfulness, refusals and safety behaviour come from.\n\n**Your fine-tuning (optional).** A provider lets you run a small extra round of stage two on your own examples. It changes style, format and narrow skills. It is a poor way to add facts: a few hundred examples barely move billions of numbers, and the model will still make things up around them.",
    jargon: [["RLHF", "reinforcement learning from human feedback: people rank answers, the model is nudged toward the ranked-higher ones; it shapes tone and behaviour, not knowledge"]],
    visual: {
      kind: "ladder",
      steps: [
        { label: "Pretraining", sub: "trillions of tokens, weeks of compute: knowledge and fluency", tone: "accent" },
        { label: "Instruction fine-tuning", sub: "request → good response examples: behaves like an assistant", tone: "accent" },
        { label: "Preference tuning (RLHF)", sub: "humans rank answers: tone, helpfulness, refusals", tone: "accent" },
        { label: "Your fine-tuning (optional)", sub: "your examples: style, format, narrow skills; not facts", tone: "warn" },
        { label: "Your prompt (every call)", sub: "the facts and instructions for this request", tone: "ok" },
      ],
      caption: "The first three happened before you existed to the model. The last one is the only stage that runs per call.",
    },
  },
  {
    stage: "visual",
    point: "Fine-tuning data is a list of example conversations. Look at one and it is obvious why it teaches style, not a rulebook.",
    title: "What fine-tuning data actually looks like",
    text: "Dev shows Priya what she would have to produce to fine-tune: a file of example conversations, each one an input and the exact output wanted. Hundreds or thousands of them.\n\nTwo things become clear. Writing 'the return window is 30 days' as a thousand examples teaches the model to say '30 days' in that phrasing, but the day the policy changes to 45, the model still says 30, and retraining is another job. And nothing in this file stops the model inventing a warranty rule it was never shown, because it is still a next-token machine.",
    codes: [
      {
        title: "A fine-tuning file (JSONL): one example per line",
        lang: "json",
        src: `{"messages":[{"role":"system","content":"You are the shop's support assistant."},{"role":"user","content":"Can I return a desk after 40 days?"},{"role":"assistant","content":"Returns are accepted within 30 days of delivery. At 40 days a return is not covered, but if the desk arrived damaged, reply with photos and we will help."}]}\n{"messages":[{"role":"system","content":"You are the shop's support assistant."},{"role":"user","content":"Where is my order 211?"},{"role":"assistant","content":"I can check that for you. Could you confirm the email address on the order?"}]}\n{"messages":[{"role":"system","content":"You are the shop's support assistant."},{"role":"user","content":"Do you ship to Ireland?"},{"role":"assistant","content":"Yes, delivery to Ireland takes 5 to 7 working days and costs 25."}]}`,
        lines: [
          { sql: "{\"messages\":[{\"role\":\"system\",\"content\":\"You are the shop's support assistant.\"},", say: "Each line is one whole example conversation, starting with the system instruction." },
          { sql: "{\"role\":\"user\",\"content\":\"Can I return a desk after 40 days?\"}", say: "The customer's message, exactly as it would arrive." },
          { sql: "{\"role\":\"assistant\",\"content\":\"Returns are accepted within 30 days of delivery.", say: "The answer you want the model to copy the style of. The fact '30 days' is baked in; change the policy and every example is stale." },
          { sql: "\"content\":\"Yes, delivery to Ireland takes 5 to 7 working days and costs 25.\"", say: "A thousand of these teach phrasing and tone. They do not stop the model inventing a rule for Spain it never saw." },
        ],
        note: "Fine-tuning is right when the hard part is how to say it (format, tone, a narrow skill). It is wrong when the hard part is what is true today.",
      },
    ],
  },
  {
    stage: "implement",
    point: "The right way to give the model the shop's rules is still the prompt: look up the relevant rules and send them. That is retrieval, and it updates the moment the document does.",
    title: "Facts go in the prompt, not in the weights",
    text: "The answer to Priya's first request is the design from lesson 1.2, made systematic: keep the rules in a document the shop controls, find the two or three paragraphs relevant to each question, and send those with the question. The model's weights stay generic; the shop's truth lives in the shop's files. Change the document and the next answer is already right.\n\nThis pattern has a name, retrieval-augmented generation (RAG), and lesson 3.6 builds it properly. The sketch below shows the shape: search, then ask.",
    codes: [
      {
        title: "Retrieve, then ask",
        lang: "ts",
        src: `// the rules document, split into paragraphs and indexed once (lesson 3.6 shows how)\nconst relevant = await rules.search(question, { top: 3 });\n\nconst reply = await client.messages.create({\n  model: "claude-sonnet-5-5",\n  max_tokens: 300,\n  system: "Answer using ONLY the policy text provided. If it does not cover the question, say you will check with the team.",\n  messages: [{ role: "user", content: \`Policy:\\n\${relevant.join("\\n\\n")}\\n\\nCustomer: \${question}\` }],\n});`,
        lines: [
          { sql: "const relevant = await rules.search(question, { top: 3 });", say: "Find the three paragraphs of the rules document that best match this question. The document is the source of truth, and it is editable today." },
          { sql: "system: \"Answer using ONLY the policy text provided. If it does not cover the question, say you will check with the team.\",", say: "The model's job is wording, not knowing." },
          { sql: "messages: [{ role: \"user\", content: `Policy:\\n${relevant.join(\"\\n\\n\")}\\n\\nCustomer: ${question}` }],", say: "Facts first, question last. No training job, no stale numbers." },
        ],
        note: "When Nisha changes the return window to 45 days in the document, the very next answer says 45. No retraining.",
      },
    ],
  },
  {
    stage: "implement",
    point: "Whether customer messages train the provider's model is a contract and a setting, not a technical fact. Check it, and keep personal data out of prompts you do not need to send.",
    title: "Nisha's question: are our customers training someone else's model?",
    text: "For API use, the major providers state that your requests are not used to train their models unless you opt in; consumer chat apps often have the opposite default, which is why Priya's weekend experiment on a personal account was a bad idea with a real customer email. Dev checks three things: the provider's data-use policy for the API, the retention period for requests, and whether the account has any training opt-in switched on.\n\nThen the shop's own rule: do not send what you do not need. The chat box sends the question and the policy paragraphs; it does not need the customer's address, card details or order history unless a tool fetches them for a specific step. Lesson 4.3 goes through this properly.",
    jargon: [["data-use policy", "the provider's written terms on whether your prompts and answers are stored, for how long, and whether they are used to train models"]],
    table: {
      head: ["Where the text goes", "Trains the provider's model?", "What to do"],
      rows: [
        ["Consumer chat app, personal account", "often yes by default", "never paste customer data; use the API"],
        ["API with default settings", "no, at major providers", "confirm in the data-use policy; check retention"],
        ["API with an explicit opt-in", "yes", "leave it off"],
        ["Your own fine-tuning job", "only your private copy", "still: no PII in the examples"],
      ],
    },
    ask: "Nisha asks: 'If the model does not learn from chats, how will it get better over time?' What would you change, and where does that change live?",
  },
  {
    stage: "compare",
    point: "Fine-tuning the model on the rulebook sounds permanent and tidy. Putting the relevant rules in the prompt is the design that stays correct when the rules change.",
    title: "Train it on the rules, or hand it the rules",
    text: "Two answers to 'make the model know our rules'. The first changes the model's numbers; the second changes what the model reads.",
    versus: {
      beginner: {
        title: "Fine-tune on the rulebook",
        points: ["Write hundreds of example conversations that quote the rules.", "Run a training job; wait; deploy a custom model.", "Facts are frozen into phrasing; a policy change means new examples and a new job.", "The model still invents rules it was never shown, in the same confident tone.", "Costs money per job and usually a higher price per token afterwards."],
      },
      engineer: {
        title: "Retrieve the relevant rules into the prompt",
        points: ["Keep the rules in a document the support team edits.", "Search it per question; send the matching paragraphs.", "A change is live on the next call.", "The model can be told to use only the given text and to say when it is missing.", "Fine-tune later, if at all, for tone and format once the facts are reliable."],
      },
      tradeoffs: ["Retrieval needs a search step and can miss a paragraph; evals (lesson 3.7) measure that.", "Fine-tuning genuinely helps when the output format is strict or the style is unusual; it is a second step, not a first.", "Both approaches need the same thing underneath: a clean, current, owned source of truth."],
      when: "Facts that change, numbers, policies, prices: the prompt, via retrieval. Style, format, a narrow repetitive skill at high volume: consider fine-tuning after retrieval works.",
    },
  },
  {
    stage: "recap",
    point: "Training set the model's numbers once; calls do not change them. Facts go in the prompt; fine-tuning is for style; check who trains on your data.",
    title: "Connect it back: Priya's three requests",
    text: "The model cannot be trained on the rules in any useful way, because training changes billions of frozen numbers through huge or costly jobs and bakes in facts that go stale; the rules go in the prompt through retrieval instead. The model cannot learn from chats by itself, because calls never touch the weights; the shop improves it by improving the document, the instructions and the examples it sends. And whether customer messages train the provider's model is a policy and a setting, which Dev has now checked and documented.",
    recap: {
      remember: ["A model = frozen numbers set by training; calling it changes nothing.", "Three stages made it: pretraining (knowledge, cutoff), instruction tuning (assistant behaviour), preference tuning (tone, safety).", "Your fine-tuning teaches style and format, not facts.", "Facts and anything that changes go in the prompt, via retrieval."],
      mistakes: ["Fine-tuning to add knowledge, then being surprised it is stale and still hallucinates.", "Expecting the model to 'learn' from conversations.", "Pasting customer data into a consumer chat app.", "Not reading the provider's data-use policy before launch."],
      production: ["Nearly every production assistant is a generic model plus retrieval plus instructions; custom fine-tunes are a minority and come later.", "Provider terms, retention and opt-ins are part of every AI security review.", "'The model got worse' after a provider update is a model-version question, not a training one (lesson 1.5)."],
      next: ["1.4 What models get wrong: hallucination, cutoffs, randomness.", "3.6 RAG: retrieval done properly.", "4.6 Fine-tune, RAG or prompt: the full decision."],
    },
    ask: "The model has a knowledge cutoff and makes things up. Next lesson: every kind of mistake a model makes, and which design catches each one.",
  },
];

export const A03: Topic = {
  slug: "how-models-are-trained",
  title: "How a model is trained: pretraining, fine-tuning, RLHF",
  minutes: 16,
  guided: true,
  tale: TALE,
  cast: CAST,
  setting: SETTING,
  difficulty: "foundation",
  objectives: ["Explain why sending text to a model does not teach it anything.", "Name the three stages that make a model and what each one contributes.", "Say what your own fine-tuning is good for and what it is not.", "Answer 'does the provider train on our data?' with the right three checks."],
  prerequisites: ["what-a-model-does", "tokens-context-cost"],
  story: "A chef who learned every cuisine during ten years of school and then stopped learning. You can hand them a recipe card for tonight (the prompt), and they will cook it perfectly; you cannot teach them a new cuisine by talking at dinner.",
  tldr: [
    "Training set the model's billions of **weights** once; every call runs the frozen weights and changes nothing.",
    "Three stages: **pretraining** (knowledge, cutoff), **instruction fine-tuning** (assistant behaviour), **preference tuning / RLHF** (tone, safety).",
    "Your own **fine-tuning** teaches style, format and narrow skills. Facts go in the **prompt**, via retrieval.",
    "Whether the provider trains on your data is a **policy and a setting**: check the data-use terms, retention and opt-ins.",
  ],
  words: [
    ["weights", "the numbers inside the model that training adjusted; frozen when you call it"],
    ["pretraining", "the huge first stage: predict the next token across trillions of tokens of text"],
    ["instruction fine-tuning", "training on request → good response examples so the model answers instead of continuing"],
    ["RLHF", "humans rank answers; the model is pushed toward the preferred ones: tone and behaviour"],
    ["knowledge cutoff", "the date the pretraining text ends; nothing after it is known"],
    ["JSONL", "a file with one JSON object per line; the usual format for fine-tuning examples"],
  ],
  sections: [],
  quiz: [
    { q: "The shop's server has sent 10,000 questions with the rules document. What does the model now know about the shop's rules?", options: ["Everything in the document", "The parts that were sent most often", "Nothing; the weights never changed", "Only the system prompt"], answer: 2, reason: true, whyOptions: ["Nothing was stored; each call ended with the weights unchanged.", "Frequency does not matter; no call writes anything back.", "Correct. Calls do not train. The rules exist only in each call's prompt.", "The system prompt is also just part of each call."], why: "Inference never changes the model; only training jobs do." },
    { q: "What is fine-tuning good for?", options: ["Adding this month's prices", "Style, format and narrow repetitive skills", "Making the model stop hallucinating", "Extending the knowledge cutoff"], answer: 1, whyOptions: ["Facts go stale the day they change; use the prompt.", "Correct. A few thousand examples shape how the model answers, not what is true.", "It still completes text; it can invent facts in your tone.", "The cutoff is set by pretraining; fine-tuning does not add the news."], why: "Fine-tuning shapes behaviour; retrieval supplies facts." },
    { q: "Which stage gives the model its knowledge of the world?", options: ["Pretraining", "Instruction fine-tuning", "RLHF", "The system prompt"], answer: 0, whyOptions: ["Correct. Trillions of tokens of text; this is also where the cutoff comes from.", "A small set of examples that teach answering, not facts.", "Rankings shape tone and safety.", "The system prompt is per call and holds your instructions."], why: "Knowledge comes from the vast pretraining text." },
  ],
  practice: [
    { q: "A colleague proposes fine-tuning the model on the shop's price list so the chat box 'always knows prices'. Give two reasons it is the wrong tool and the right alternative.", answer: "Prices change and the fine-tuned numbers go stale until the next job; and a fine-tuned model still invents prices it was not shown. Put the current prices in the prompt by retrieving the relevant rows per question.", explain: "Facts that change belong in a source of truth you control, read at call time." },
    { q: "Nisha asks whether customers' emails are used to train the model. What three things do you check, and what do you change in the chat box regardless?", answer: "The provider's data-use policy for the API, the retention period for requests, and whether any training opt-in is enabled on the account. Regardless, send only what each question needs: no addresses, card details or order history unless a specific step fetches them.", explain: "Training on your data is a contractual setting; data minimisation is your own responsibility." },
    { q: "The model answers in a chatty tone and the shop wants short, formal replies in a fixed layout. Is that a prompt change or a fine-tuning job?", answer: "Start with the prompt: instructions plus two or three examples of the exact layout usually fix tone and format. Fine-tune only if the prompt version is still inconsistent at high volume, and keep the facts in retrieval either way.", explain: "Fine-tuning is the second tool for style, never the first for facts." },
  ],
  interview: [
    { level: "junior", q: "Does a model learn from the requests you send it?", a: "No. Inference runs frozen weights and writes nothing back. The only ways to change behaviour are to change the prompt or to run a training job, and providers do not train on API data by default; that is a documented policy and a setting to check." },
    { level: "junior", q: "What are pretraining, fine-tuning and RLHF, in one line each?", a: "Pretraining: predict the next token across a vast corpus; knowledge and fluency, ending at a cutoff date. Fine-tuning: further training on request-and-response examples; assistant behaviour, or your own style and format. RLHF: humans rank answers and the model is pushed toward preferred ones; tone, helpfulness, refusals." },
    { level: "mid", tricky: true, q: "We fine-tuned on our documentation and the model still makes up API endpoints. Why?", a: "Fine-tuning on a few thousand examples barely moves billions of weights and teaches patterns of phrasing, not a lookup table; the model remains a next-token predictor and will invent plausible endpoints near the ones it saw. Facts need retrieval into the prompt with an instruction to use only what is provided, plus checks on the output." },
    { level: "mid", q: "When is fine-tuning the right choice?", a: "When the hard part is how to answer rather than what is true: a strict output format, an unusual tone, a narrow classification or extraction task at high volume, or reducing prompt length by baking in instructions. Always after retrieval and prompting already give correct facts, and always with evals to prove it helped." },
    { level: "mid", tricky: true, q: "Is a bigger context window a substitute for fine-tuning?", a: "Mostly the other way round: a big window plus retrieval replaces most reasons people wanted fine-tuning for knowledge. Fine-tuning still wins for style and format at scale, and for cutting per-call tokens. Neither replaces the other; they answer different needs." },
    { level: "senior", q: "What is the knowledge cutoff and how do you design around it?", a: "The date the pretraining data ends; the model knows nothing after it and may not know it does not know. Design: never ask the model for current facts from memory; supply them through retrieval, tools or search; state today's date in the prompt when dates matter; and test for cutoff-sensitive questions in evals." },
    { level: "mid", q: "What does a fine-tuning dataset look like and what makes a good one?", a: "A JSONL file of complete example conversations: system, user, assistant turns with the exact desired output. A good one is consistent in format, covers the real distribution of inputs including edge cases, contains no personal data, and is small but clean; a few hundred excellent examples beat thousands of noisy ones." },
    { level: "senior", q: "How do you answer 'is our customer data training their model' in a security review?", a: "With evidence: the provider's API data-use terms and retention period, the account's training and logging settings, the data-processing agreement, and our own minimisation: what fields we send, what we redact, and what never leaves our systems. Consumer chat apps are out of scope for customer data." },
    { level: "mid", tricky: true, q: "The provider released a new model version and our answers changed. Did our fine-tune get lost?", a: "If you call a provider's model by a floating name, you got a different set of weights, trained differently; nothing of yours was lost because nothing of yours was in it. Pin model versions, keep evals, and re-run them on every version change. A custom fine-tune is a separate named model and does not change underneath you." },
    { level: "senior", q: "Explain distillation and why small models keep getting better.", a: "A large model answers many prompts and a small model is trained to imitate those answers, so the small one inherits much of the behaviour at a fraction of the size, cost and latency. Combined with better data and training recipes, that is why a small model today often matches a large one from two years ago, which matters when you choose a model for a cost-sensitive feature." },
  ],
  remember: [
    "Calls never change the model. Training did, once.",
    "Pretraining = knowledge and the cutoff. Tuning = behaviour and tone.",
    "Your fine-tune: style and format. Your prompt: facts, via retrieval.",
    "Who trains on your data is a policy and a setting. Check it; send less.",
  ],
};
