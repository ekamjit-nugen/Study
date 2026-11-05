import type { Exercise, LessonBody, Quiz } from "../types";

// Module 21: Fine-tuning. One concept per lesson. Keys are lesson slugs: m21-<kebab of the concept title in map.ts>.

export const M21_BODIES: Record<string, LessonBody> = {
  "m21-fine-tuning": {
    simple: "Fine-tuning continues training an already-trained model on your own examples, so it picks up your task, format or style without starting from scratch.",
    concept:
      "A base model (Module 20) has read trillions of tokens and can complete any text. It does not know your product, your tone, or that it should answer rather than continue. **Fine-tuning** takes that trained model and runs more gradient-descent steps (Module 5) on a small set of your own examples, typically hundreds to tens of thousands, so its weights shift toward producing what those examples show.\n\nIt is the same loop as pretraining: predict the next token, measure the loss, update the weights. What changes is the data (yours), the scale (thousands of examples instead of trillions of tokens), the learning rate (much smaller, so the existing knowledge is not destroyed), and the starting point (trained weights, not random ones). A fine-tune that would take a pretraining lab weeks takes you an afternoon.\n\nFine-tuning steers; it does not teach much new knowledge. A few thousand examples cannot add what two trillion tokens left out, but they can reliably change how the model behaves: its format, its register, its habits, its refusal of off-topic requests.",
    why:
      "Pretraining produces a generalist that is expensive to make and shared by everyone. Every team has a different job for it. Prompting (Module 26) can steer a model within a call, but a long prompt costs tokens on every request, cannot teach a subtle style, and sometimes is simply ignored. Fine-tuning bakes the steering into the weights once, so every call is shorter, more consistent, and often works with a smaller, cheaper model.\n\nIt exists because a generalist plus a few thousand examples of your work beats a generalist plus instructions, for tasks that are repeated at scale.",
    how: [
      "Start from a pretrained model, usually an instruction-tuned open-weight one in your size range (Module 24).",
      "Prepare examples of the behaviour you want: input and the ideal output, cleaned and split (lessons 5 to 7).",
      "Train with a small learning rate for a few epochs, measuring loss on held-out examples after each.",
      "Evaluate against the base model and against prompting alone, on a test set the training never saw (lesson 8).",
      "Check that general abilities survived (lesson 9); ship the weights or the adapter (Module 22).",
    ],
    visual: {
      kind: "compare",
      left: { title: "Pretraining", points: ["random weights → base model", "trillions of tokens", "weeks on thousands of GPUs", "learning rate ~3e-4", "teaches language and knowledge"] },
      right: { title: "Fine-tuning", points: ["trained weights → your model", "thousands of examples", "hours on one to eight GPUs", "learning rate ~1e-5 to 2e-4", "teaches task, format and style"] },
      caption: "Same loop, different scale and purpose. Fine-tuning is the last 0.01% of training, aimed at your job.",
    },
    everyday: {
      title: "A trained chef joining your kitchen",
      text: "You hire a chef who trained for twenty years. You do not teach them to cook; you spend a week showing them your menu, your plating, your portion sizes and how your regulars like their steak. After the week they cook your food in your style, drawing on everything they already knew. The week is fine-tuning; the twenty years was pretraining.",
    },
    engineering: {
      title: "A support team fine-tunes for tone and format",
      text: "An insurance company's support replies must follow a strict shape: acknowledge, state the policy clause, give the next step, never promise outcomes. Prompting a general model got the shape right about 80% of the time and needed a 900-token system prompt on every call. They fine-tuned a 7B open-weight model on 4,000 past replies edited by senior agents. The fine-tuned model hits the shape 98% of the time with a 60-token prompt, runs on one GPU, and costs a tenth per reply. The facts about policies still come from retrieval (Module 28); the fine-tune taught the manner, not the matter.",
    },
    maths: {
      formula: "fine-tuning compute ≈ 6 × N × (examples × tokens per example × epochs)",
      meaning: "The same compute formula as pretraining, with the token count replaced by your dataset's tokens times the number of passes.",
      worked: [
        "7B model, 4,000 examples averaging 600 tokens, 3 epochs: tokens = 4,000 × 600 × 3 = 7.2 million.",
        "FLOPs = 6 × 7 × 10⁹ × 7.2 × 10⁶ ≈ 3 × 10¹⁷.",
        "At 1.25 × 10¹⁴ useful FLOPs/s on one A100: 3 × 10¹⁷ ÷ 1.25 × 10¹⁴ ≈ 2,400 seconds, about 40 minutes.",
        "Compare pretraining the same model: 8.4 × 10²² FLOPs, about 280 million times more. Fine-tuning is cheap because the hard part was done.",
      ],
      note: "Full fine-tuning still needs the 112 GB of training state from Module 20; Module 22 removes that obstacle.",
    },
    code: {
      title: "A minimal fine-tuning run",
      lang: "py",
      src: `from transformers import AutoModelForCausalLM, AutoTokenizer, Trainer, TrainingArguments

name = "open-weights/instruct-7b"
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForCausalLM.from_pretrained(name)          # trained weights, not random

train_ds = load_examples("support_train.jsonl", tok)        # input + ideal output, tokenised
val_ds = load_examples("support_val.jsonl", tok)

args = TrainingArguments(
    output_dir="ckpt-support",
    learning_rate=2e-5,                                      # small: steer, do not overwrite
    num_train_epochs=3,
    per_device_train_batch_size=4,
    gradient_accumulation_steps=8,
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    bf16=True,
)
Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=val_ds).train()`,
      lines: [
        { code: "model = AutoModelForCausalLM.from_pretrained(name)          # trained weights, not random", say: "The starting point is a model that already knows language. Fine-tuning begins where pretraining ended." },
        { code: "learning_rate=2e-5,                                      # small: steer, do not overwrite", say: "Ten to a hundred times smaller than pretraining's rate. Big steps would erase what the model knows." },
        { code: "num_train_epochs=3,", say: "A few passes over a small dataset, with evaluation after each to catch overfitting." },
        { code: "load_best_model_at_end=True,", say: "Keep the checkpoint with the best validation loss, not the last one." },
      ],
      note: "load_examples formats each pair as a chat and masks the loss so only the output tokens are learned (lesson 6).",
    },
    useIt: "Fine-tune when a task is repeated at scale and prompting is inconsistent, too long or too expensive: fixed output formats, a house style, a narrow classification, a domain's vocabulary. Keep facts in retrieval, not weights. Always compare with prompting first (lesson 11).",
    takeaways: ["Fine-tuning = more gradient steps on your examples, from trained weights, with a small learning rate.", "It teaches behaviour (format, style, task) far better than it teaches new facts.", "It costs minutes to hours, not weeks; the hard part was pretraining.", "Compare against prompting and the base model, and check that general abilities survived."],
    terms: [["fine-tuning", "continuing to train a pretrained model on your own examples"], ["instruction-tuned model", "a base model already fine-tuned to follow instructions; the usual starting point"]],
    reflect: { q: "If fine-tuning cannot add much knowledge, why does a fine-tuned model seem to 'know' the company's products?", a: "Usually it learned the names, phrasing and typical answers from the examples, which is enough to sound informed on common cases. On a product it never saw in examples it will guess fluently. Facts that change or are long-tail belong in retrieval, where they can be updated and cited." },
  },

  "m21-pretraining-vs-fine-tuning": {
    simple: "Pretraining builds general ability from a huge corpus; fine-tuning adapts it with a small, specific dataset. They differ in data, scale, learning rate, cost and what they can change.",
    concept:
      "Both phases run the same next-token loop, so the differences are easy to miss and easy to get wrong. **Pretraining** uses an enormous, broad corpus, random initial weights, a high learning rate with a long schedule, and weeks of cluster time; it creates knowledge and language ability. **Fine-tuning** uses a small, targeted dataset, trained initial weights, a low learning rate for a few epochs, and hours on a few GPUs; it shapes behaviour.\n\nThe practical consequences: fine-tuning cannot fix a base model that lacks a language or domain, because that requires the pretraining-scale data it never had. Fine-tuning can erase ability if the learning rate is too high or the data too narrow (lesson 9). And fine-tuning's results are only as good as the starting model: a stronger base fine-tunes to a stronger result from the same examples.\n\nThere is a middle ground, **continued pretraining**: taking a base model and training it further on billions of tokens from a new domain (medical literature, a new language) at a moderate learning rate. It is pretraining's data regime with fine-tuning's starting point, and it is what you do when the base model is missing a whole field.",
    why:
      "Teams waste months by expecting the wrong phase to do a job. Fine-tuning on 5,000 examples will not make a model fluent in Punjabi if the base saw little Punjabi; that needs continued pretraining on billions of tokens. Pretraining from scratch to get a particular tone is absurdly expensive when fine-tuning would do. Knowing which phase changes what is the difference between a plan and a hope.",
    how: [
      "Ask what is missing: language and knowledge, or behaviour and format?",
      "Language or domain missing at scale: continued pretraining on billions of domain tokens, then fine-tune.",
      "Behaviour missing: fine-tune on hundreds to thousands of examples.",
      "Neither missing, just inconsistent: try prompting first (lesson 11).",
      "In every case, start from the strongest base you can run; fine-tuning multiplies what is already there.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["", "Pretraining", "Continued pretraining", "Fine-tuning"],
        rows: [
          ["starting weights", "random", "base model", "base or instruct model"],
          ["data", "trillions of mixed tokens", "billions of domain tokens", "hundreds to thousands of examples"],
          ["learning rate", "~3e-4 with warm-up and decay", "~5e-5", "1e-5 to 2e-4"],
          ["duration", "weeks, thousands of GPUs", "days, tens of GPUs", "hours, 1 to 8 GPUs"],
          ["changes", "everything: language, knowledge", "domain knowledge and vocabulary", "format, style, task behaviour"],
          ["who", "a few labs", "well-funded teams", "anyone"],
        ],
      },
      caption: "Three regimes of the same loop. Match the regime to what the model is missing.",
    },
    everyday: {
      title: "School, a degree, and the first week at work",
      text: "School gives general literacy and knowledge (pretraining). A medical degree adds a whole field over years (continued pretraining). The first week at a particular hospital teaches its forms, its rota and its habits (fine-tuning). Nobody expects a week's induction to replace the degree, and nobody sends a doctor back to school to learn where the ward's supplies are kept.",
    },
    engineering: {
      title: "The legal team that fine-tuned the wrong thing",
      text: "A legal-tech team fine-tunes a general 7B model on 3,000 contract summaries and finds it still misreads clause types it never saw and invents statute names. The base model had seen little legal text. They switch to continued pretraining: 4 billion tokens of case law and contracts over three days on 16 GPUs, then the same 3,000-example fine-tune. Clause accuracy rises from 71% to 89% and invented citations fall by two thirds. The examples were never the problem; the base's missing knowledge was.",
    },
    maths: {
      formula: "tokens needed to add a domain ≈ billions;   tokens needed to shape behaviour ≈ millions",
      meaning: "The gap of about a thousand times is why the two jobs need different phases. The compute formula scales accordingly.",
      worked: [
        "Continued pretraining of a 7B model on 4 × 10⁹ legal tokens: 6 × 7 × 10⁹ × 4 × 10⁹ = 1.7 × 10²⁰ FLOPs ≈ 380 A100-hours at 40% utilisation, about a day on 16 GPUs.",
        "Fine-tuning the result on 3,000 examples × 800 tokens × 3 epochs = 7.2 × 10⁶ tokens: 3 × 10¹⁷ FLOPs ≈ 40 minutes on one GPU.",
        "The domain step cost about 500 times the behaviour step, and was the one that fixed the problem.",
      ],
    },
    useIt: "When a model fails at your task, diagnose before training: does it lack the knowledge (wrong facts, unknown terms) or the behaviour (right facts, wrong format)? The first needs retrieval or continued pretraining; the second needs fine-tuning or prompting. The diagnosis decides the budget by a factor of hundreds.",
    takeaways: ["Same loop; different data, scale, learning rate and effect.", "Pretraining creates knowledge; fine-tuning shapes behaviour; continued pretraining adds a domain.", "Fine-tuning cannot supply what the base never saw at scale.", "Start from the strongest base you can run."],
    terms: [["continued pretraining", "training a base model further on billions of tokens from a new domain before fine-tuning"]],
    reflect: { q: "A base model is weak in Punjabi. Which of the three regimes, and roughly how much data?", a: "Continued pretraining on as much clean Punjabi text as can be collected, ideally billions of tokens, then fine-tuning on Punjabi instruction examples. A few thousand Punjabi examples alone would teach the format but leave the model's Punjabi vocabulary and grammar thin. Stage 9 works through this." },
  },

  "m21-supervised-fine-tuning-sft": {
    simple: "Supervised fine-tuning trains the model on pairs of input and ideal output, with the loss counted only on the output, so it learns to produce the answer rather than to repeat the question.",
    concept:
      "**Supervised fine-tuning**, SFT, is fine-tuning with labelled pairs, exactly supervised learning from Module 1 applied to a language model. Each example is a prompt (the input the user or system would give) and a completion (the output you want). The two are formatted into one token sequence, usually with the model's chat template marking who said what.\n\nThe important detail is the **loss mask**. If the loss were counted on every token, the model would spend its learning on predicting the prompt, which it never has to generate. SFT masks the prompt tokens out of the loss and counts only the completion tokens. The model learns 'given this input, produce this output', which is the behaviour you want at inference.\n\nSFT is the workhorse of customisation: it is how base models become instruction followers (next lesson), how assistants learn a house style, and the first step before preference training (Module 23).",
    why:
      "A base model continues text; it has no notion of a turn ending or of answering. SFT exists to teach the mapping from input to output with the labels a team can actually write: examples of good answers. It is cheap, needs no reward model, and a few thousand well-chosen pairs change behaviour decisively. Preference methods (Module 23) refine what SFT started; they do not replace it.",
    how: [
      "Write or collect pairs: prompt and ideal completion. Quality beats quantity; a thousand excellent pairs beat ten thousand sloppy ones.",
      "Format each pair with the chat template: system, user, assistant turns with their special tokens.",
      "Tokenise and build the loss mask: −100 (ignore) on prompt tokens, real ids on completion tokens.",
      "Train for 1 to 5 epochs at a small learning rate, evaluating held-out loss and task metrics after each epoch.",
      "Sample outputs on unseen prompts and read them; the loss number does not show tone or truthfulness.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Token", "<s>[INST] Summarise: … [/INST]", "The customer wants a refund for …", "</s>"],
        rows: [
          ["part", "prompt", "completion", "end of turn"],
          ["loss counted?", "no (masked)", "yes", "yes"],
          ["what the model learns", "nothing from these", "to produce this given the prompt", "to stop"],
        ],
      },
      caption: "One SFT example as the model sees it. Learning happens only where the model would be generating.",
    },
    everyday: {
      title: "Worked examples in a textbook",
      text: "A maths textbook does not ask you to memorise the questions; it shows a question and a worked answer so you learn how to go from one to the other. You practise producing answers, not reproducing problems. SFT shows the model the question and marks only the answer, for the same reason.",
    },
    engineering: {
      title: "The mask that was missing",
      text: "A team fine-tunes a model on 8,000 support examples and sees the validation loss fall nicely, but the model's replies are oddly short and often echo the customer's wording. They had formatted the pairs but forgotten the loss mask, so most of the training signal went into predicting customer messages. With the mask on completions only, loss values rise (fewer, harder tokens) but replies become full, well-formed answers. The loss number had been measuring the wrong thing.",
    },
    maths: {
      formula: "L_SFT = −(1 ÷ |completion|) Σ_{i ∈ completion} ln p(tᵢ | t₁…tᵢ₋₁)",
      meaning: "The next-token loss from Module 20, averaged only over completion positions. Prompt positions contribute nothing.",
      worked: [
        "An example with 120 prompt tokens and 40 completion tokens: only 40 positions count.",
        "Suppose the completion tokens have an average probability of 0.45 under the model: loss ≈ −ln 0.45 ≈ 0.80.",
        "Without the mask, 120 prompt tokens at an average probability of 0.70 would be mixed in: loss ≈ (120 × 0.36 + 40 × 0.80) ÷ 160 ≈ 0.47, a lower number that hides weak completions.",
        "Training on the masked loss pushes the 0.45 up; training on the unmasked loss mostly polishes prompt prediction the model will never use.",
      ],
    },
    code: {
      title: "Building an SFT example with a loss mask",
      lang: "py",
      src: `IGNORE = -100   # the loss function skips positions labelled -100

def build_example(tok, system, user, assistant):
    prompt = tok.apply_chat_template(
        [{"role": "system", "content": system}, {"role": "user", "content": user}],
        tokenize=False, add_generation_prompt=True)
    full = prompt + assistant + tok.eos_token

    prompt_ids = tok(prompt, add_special_tokens=False)["input_ids"]
    full_ids = tok(full, add_special_tokens=False)["input_ids"]

    labels = [IGNORE] * len(prompt_ids) + full_ids[len(prompt_ids):]
    return {"input_ids": full_ids, "labels": labels}`,
      lines: [
        { code: "IGNORE = -100   # the loss function skips positions labelled -100", say: "The conventional marker: cross-entropy ignores any position whose label is −100." },
        { code: "tokenize=False, add_generation_prompt=True)", say: "The chat template adds the special tokens that mark turns and the point where the assistant starts." },
        { code: "full = prompt + assistant + tok.eos_token", say: "The sequence the model sees: prompt, the ideal answer, and the end-of-sequence token so it learns to stop." },
        { code: "labels = [IGNORE] * len(prompt_ids) + full_ids[len(prompt_ids):]", say: "Prompt positions are masked; completion positions keep their real ids and are learned." },
      ],
      note: "Check that prompt_ids is an exact prefix of full_ids; tokenisers sometimes merge across the boundary and shift the mask by one.",
    },
    useIt: "SFT is how you teach a model any input-to-output behaviour from examples: reply style, extraction formats, classification labels, code conventions. Mask the prompt, keep the end-of-turn token, and read sampled outputs as well as the loss.",
    takeaways: ["SFT = fine-tuning on prompt–completion pairs with the loss on the completion only.", "The loss mask is what makes the model learn to answer rather than to repeat.", "Format with the model's chat template and keep the end-of-turn token.", "Loss alone hides tone and truth; sample and read."],
    terms: [["SFT", "supervised fine-tuning on prompt–completion pairs"], ["loss mask", "the rule that excludes prompt tokens from the training loss"], ["chat template", "the model's fixed format for system, user and assistant turns"]],
    reflect: { q: "When might you want the loss on the prompt tokens too?", a: "When the 'prompt' contains text you want the model to get better at modelling, such as continued pretraining on documents, or multi-turn data where earlier assistant turns should also be learned. For plain SFT, masking the user and system turns is the norm." },
  },

  "m21-instruction-tuning": {
    simple: "Instruction tuning is SFT on a broad mix of tasks phrased as instructions, which turns a text-completing base model into one that does what it is asked.",
    concept:
      "A base model given 'Translate to French: good morning' is as likely to continue with more examples of the exercise as to translate. **Instruction tuning** is supervised fine-tuning (previous lesson) on tens of thousands of examples spanning many tasks, each written as an instruction and a good response: translate this, summarise that, write a function, answer the question, follow this format. The variety is the point: the model learns the general skill of reading an instruction and producing the response, not any single task.\n\nAfter instruction tuning, the model generalises to instructions it never saw. This is the step that creates the 'instruct' or 'chat' versions of open-weight models, and it is why those are the usual starting point for your own fine-tuning: they already know how to follow instructions, so your examples only need to teach your specifics.\n\nInstruction-tuned models are then usually refined with preference training (Module 23) to improve helpfulness and safety beyond what examples alone achieve.",
    why:
      "Users give instructions; base models complete documents. Something has to bridge them, and the bridge turned out to be cheap: a few tens of thousands of diverse instruction examples transform a base model's usability. Before instruction tuning, using a language model meant crafting prompts that looked like the start of a document containing the answer. After it, you can just ask.",
    how: [
      "Collect instruction–response pairs across many task types: hundreds of tasks, thousands of examples each, written by people or generated and filtered.",
      "Include varied phrasings of the same task, so the model learns the intent, not a template.",
      "Include refusals and clarifying questions for instructions that are impossible or unsafe.",
      "Run SFT with the loss on responses.",
      "Evaluate on held-out task types the training never included: that is the test of generalisation.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Base model given an instruction", points: ["'Summarise: The meeting covered…'", "continues: '2. Summarise: The report covered…'", "or writes another document", "has never been shown that instructions are to be followed"] },
      right: { title: "Instruction-tuned model", points: ["'Summarise: The meeting covered…'", "'The meeting agreed three actions: …'", "stops at the end of the answer", "generalises to instructions it never saw"] },
      caption: "Same weights plus thirty thousand varied examples. The model learns the move 'instruction → response'.",
    },
    everyday: {
      title: "Learning to take requests",
      text: "A brilliant but literal new colleague keeps responding to 'can you check the figures?' with 'yes'. After a month of watching how requests are meant, they check the figures without being asked twice. They did not learn accounting in that month; they learned that requests are to be acted on, in general. Instruction tuning teaches that one general habit.",
    },
    engineering: {
      title: "Why open-weight releases come in pairs",
      text: "Model families are released as a base model and an instruct model. The base is for teams doing continued pretraining or unusual fine-tunes; the instruct version has had instruction tuning and preference training and is what most teams should start from. A team that fine-tuned 2,000 support examples onto the base model got replies that trailed off into unrelated text; the same examples on the instruct model worked immediately, because the instruct model already knew to answer and stop. Picking the right starting point saved a month.",
    },
    maths: {
      formula: "generalisation is measured on held-out task types: score on unseen tasks ÷ score on seen tasks",
      meaning: "Instruction tuning is judged by how well the model handles kinds of instruction it never trained on. A ratio near 1 means it learned the general skill.",
      worked: [
        "Train on 600 task types; hold out 60 types entirely.",
        "After tuning on 50,000 examples: accuracy 78% on seen types, 71% on held-out types; ratio ≈ 0.91.",
        "After tuning on only 5,000 examples from 20 task types: 80% seen, 44% held-out; ratio ≈ 0.55: it learned templates, not the skill.",
        "Breadth of tasks mattered more than count of examples for the held-out score.",
      ],
    },
    useIt: "Start your own fine-tunes from an instruction-tuned model unless you have a specific reason not to. If you build instruction data yourself (Stage 9's Punjabi assistant, for example), make it broad: many task types, many phrasings, refusals included, and test on task types you held out.",
    takeaways: ["Instruction tuning = SFT on a broad, varied set of instruction–response pairs.", "It teaches the general skill of following instructions, which transfers to unseen tasks.", "It is why 'instruct' models exist and why they are the right starting point for most fine-tunes.", "Breadth of tasks matters more than sheer example count."],
    terms: [["instruction tuning", "SFT on diverse instruction–response examples"], ["instruct model", "a model released after instruction tuning, often with preference training too"]],
    reflect: { q: "Why include refusals in instruction data?", a: "Otherwise the model learns that every instruction has a compliant response, and it will produce one for impossible, harmful or nonsensical requests. Examples of declining or asking a clarifying question teach that 'the right response' sometimes is not to comply." },
  },

  "m21-dataset-preparation": {
    simple: "Dataset preparation turns raw material into clean, consistent, representative training examples; it is where most fine-tuning projects succeed or fail.",
    concept:
      "The model will imitate the dataset exactly, flaws included. **Dataset preparation** is the work of making sure what it imitates is what you want: the right examples, in the right format, with the mistakes removed and the distribution matched to real use.\n\nIt has four parts. **Sourcing**: real logs edited by experts, expert-written examples, or synthetic examples generated by a strong model and reviewed. **Cleaning**: remove duplicates (Module 20's methods at small scale), broken formatting, personal data, and examples whose outputs are wrong or off-policy. **Balancing**: make the mix of cases match production, or deliberately over-represent rare but important ones. **Formatting**: one consistent schema, the model's chat template, and a system prompt that matches what will be used at inference.\n\nThe quality bar is high because the dataset is small: one bad example in a thousand is 0.1% of the training signal, and systematic sloppiness becomes the model's style.",
    why:
      "In pretraining, scale averages out noise. In fine-tuning, with a few thousand examples, every example is a lesson the model takes seriously. Teams routinely find that improving 500 examples beats adding 5,000 more. Preparation exists as a discipline because the model has no judgement about which examples to trust; it trusts all of them.",
    how: [
      "Define the task precisely and write ten ideal examples by hand; they become the standard everything else is checked against.",
      "Source candidates: real cases, expert writing, or filtered synthetic data.",
      "Clean: deduplicate, fix formatting, redact personal data, and have experts correct or discard wrong outputs.",
      "Balance: compare the distribution of cases with production logs; add rare-but-critical cases on purpose.",
      "Format: one schema, the chat template, the production system prompt; validate every record programmatically.",
      "Split into train, validation and test before any training (lesson 7).",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Problem in the data", "What the model learns", "Fix"],
        rows: [
          ["20% of replies contain a typo", "to make typos", "spell-check and expert review"],
          ["all examples are about refunds", "every question is about refunds", "balance to the production mix"],
          ["outputs vary in format", "to vary the format", "one schema, validated"],
          ["training prompt differs from production prompt", "behaviour that does not transfer", "use the production system prompt in training"],
          ["50 duplicated examples", "to over-weight those cases", "deduplicate"],
        ],
      },
      caption: "The model has no filter. Every flaw in the data becomes a habit.",
    },
    everyday: {
      title: "Teaching from a corrected exercise book",
      text: "If you learn a language from a tutor's exercise book full of uncorrected mistakes, you learn the mistakes, confidently. A good tutor corrects every page before handing it over and makes sure the exercises cover the situations you will actually meet. Dataset preparation is correcting the book.",
    },
    engineering: {
      title: "The 600 examples that beat 6,000",
      text: "A team fine-tunes a model for invoice extraction on 6,000 examples auto-labelled by an older system; accuracy is 83%. Audit shows 11% of labels are wrong, mostly on multi-currency invoices. They have two accountants correct 600 examples covering every layout type in production, including the rare ones, and fine-tune on those. Accuracy rises to 94%. The original set was teaching the old system's errors with great consistency.",
    },
    maths: {
      formula: "effective signal = examples × (1 − error rate);   damage ≈ error rate × consistency of the error",
      meaning: "Wrong examples do not merely waste a slot; if their errors are systematic, the model learns them as rules. Random noise hurts less than consistent mistakes.",
      worked: [
        "6,000 examples with 11% wrong labels: 5,340 useful, 660 harmful.",
        "If the 660 errors all follow the same pattern (currency misread), the model sees a consistent 11% minority rule and adopts it on exactly those cases.",
        "600 examples with 1% errors (6 wrong, random): 594 useful, with no consistent wrong pattern to learn.",
        "The smaller set has fewer useful examples but no systematic error, and in practice trained the better model.",
      ],
    },
    code: {
      title: "Validating every record before training",
      lang: "py",
      src: `import json, re
from collections import Counter

EMAIL = re.compile(r"[\\w.+-]+@[\\w-]+\\.[\\w.]+")

def check(rec):
    assert set(rec) == {"system", "user", "assistant", "category"}, "schema"
    assert 20 <= len(rec["assistant"]) <= 2000, "length"
    assert not EMAIL.search(rec["assistant"]), "personal data in output"
    assert rec["system"] == PRODUCTION_SYSTEM_PROMPT, "prompt must match production"

records = [json.loads(l) for l in open("support.jsonl")]
seen, clean = set(), []
for r in records:
    check(r)
    key = (r["user"].strip().lower(), r["assistant"].strip().lower())
    if key in seen:
        continue                                   # exact duplicate
    seen.add(key)
    clean.append(r)

print(len(records), "->", len(clean), Counter(r["category"] for r in clean))`,
      lines: [
        { code: "assert set(rec) == {\"system\", \"user\", \"assistant\", \"category\"}, \"schema\"", say: "One schema, enforced. A stray field or a missing one fails loudly before training." },
        { code: "assert not EMAIL.search(rec[\"assistant\"]), \"personal data in output\"", say: "Outputs the model will learn to produce must not contain real personal data." },
        { code: "assert rec[\"system\"] == PRODUCTION_SYSTEM_PROMPT, \"prompt must match production\"", say: "The system prompt in training must be the one used at inference, or the behaviour will not transfer." },
        { code: "print(len(records), \"->\", len(clean), Counter(r[\"category\"] for r in clean))", say: "The category counts show the balance; compare them with production logs." },
      ],
    },
    useIt: "Spend most of a fine-tuning project here: ten hand-written gold examples first, expert-corrected real cases, deduplication, redaction, balance against production, one validated schema with the production prompt. The training run is the easy part.",
    takeaways: ["The model imitates the dataset exactly; flaws become habits.", "Fewer, correct, representative examples beat many noisy ones.", "Systematic errors are worse than random ones.", "One schema, the production system prompt, validated programmatically, deduplicated, redacted."],
    terms: [["gold examples", "a small set of hand-written ideal examples that define the standard"], ["synthetic data", "examples generated by a model, then filtered and reviewed"]],
    reflect: { q: "A strong model can generate 50,000 synthetic examples overnight. What goes wrong if you train on them unreviewed?", a: "You distil the generating model's errors and style, including its hedging, its favourite phrasings and its mistakes on your domain, and you may violate the generator's terms of use. Synthetic data works when it is filtered against gold examples, reviewed by experts on a sample, and mixed with real cases." },
  },

  "m21-input-output-training-examples": {
    simple: "Each training example is an input and its ideal output; writing the output exactly as you want it, and the input exactly as production will send it, is the whole craft.",
    concept:
      "An **input-output example** is one unit of supervised fine-tuning: what goes in and what should come out. The input should look exactly like a production request: the same system prompt, the same fields, the same messiness users produce (typos, missing details, mixed languages). The output should be the response you would be proud to ship: correct, in the exact format, in the house tone, no longer than needed.\n\nThe output is not 'an acceptable answer'; it is the target the model will move toward. If outputs sometimes explain and sometimes do not, the model will do both at random. If outputs occasionally start with 'Sure!', the model will sometimes start with 'Sure!'. Consistency across examples is what produces a consistent model.\n\nMulti-turn examples carry a conversation history in the input and the next assistant turn as output; tool-use examples include the tool call as the output and the tool result in the next input. The principle is the same: show exactly the move you want, in the context it will happen in.",
    why:
      "The model learns the mapping from the examples and nothing else. If the inputs in training are cleaner than real inputs, the model has never seen real inputs. If the outputs vary, the model varies. Teams that write outputs carelessly spend weeks afterwards prompting around habits the examples taught. Crafting examples well is cheaper than any fix later.",
    how: [
      "Capture inputs from production as they really arrive, including noise; do not tidy them.",
      "Write outputs to a style guide: format, length, tone, what to include and what never to say.",
      "Make rare but important cases explicit: an ambiguous request with a clarifying question as the output; an out-of-scope request with a polite refusal.",
      "For multi-turn and tool use, include the full history in the input and only the next move as the output.",
      "Have a second person review outputs against the style guide; disagreements become guide updates.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Input (as production sends it)", "Output (as you want it)", "What it teaches"],
        rows: [
          ["'hi my order 4417 still not here??'", "'I'm sorry it hasn't arrived. Order 4417 shipped on 2 May and is due by 6 May. If it isn't there by then, reply here and we'll send a replacement.'", "tone, structure, concrete next step"],
          ["'can i return a matress i opened'", "'Opened mattresses can't be returned for hygiene reasons. If it's faulty, we can arrange a replacement: could you send a photo?'", "the policy, kindly, with an alternative"],
          ["'what's your CEO's home address'", "'I can't help with that.'", "refusal, short"],
          ["'je veux annuler ma commande'", "'Je peux vous aider à annuler. Pouvez-vous me donner le numéro de commande ?'", "answer in the user's language"],
        ],
      },
      caption: "Inputs are messy on purpose; outputs are exactly the standard. The model learns the gap between them.",
    },
    everyday: {
      title: "Showing the apprentice the finished dish",
      text: "A chef teaching plating does not describe a good plate; they put one down and say 'like this, every time'. If one day the plate has a garnish and the next it does not, the apprentice garnishes at random. Examples are the finished plates, and their consistency is the lesson.",
    },
    engineering: {
      title: "The model that said 'Sure!' to refunds",
      text: "A fine-tuned support model opened one reply in eight with 'Sure!', including replies that went on to refuse. The training outputs, drawn from agents with different habits, contained 'Sure!' in 12% of cases. The fix was a style guide and a pass over the 4,000 outputs with a script that flagged opening words; the agents rewrote 480 outputs. After retraining, the opener appeared only where the guide allowed it. The model had been perfectly faithful to inconsistent examples.",
    },
    maths: {
      formula: "P(model shows habit) ≈ share of training outputs with the habit",
      meaning: "For surface habits such as openers, sign-offs and format choices, the fine-tuned model reproduces roughly the frequency it saw. Consistency in, consistency out.",
      worked: [
        "480 of 4,000 outputs start with 'Sure!': 12%.",
        "After fine-tuning, sampled replies start with 'Sure!' about 11% of the time: the model matched the frequency.",
        "After rewriting to 0 of 4,000: sampled replies show it under 0.5%, the base model's residual habit.",
        "To make a behaviour reliable, it must be near 100% or near 0% in the examples, not 'usually'.",
      ],
    },
    useIt: "When building examples, copy real inputs verbatim and write outputs to a written style guide, reviewed by a second person. Make every rule you care about visible in the examples at nearly 100% consistency, including refusals and clarifying questions, and show multi-turn and tool-use moves in their real context.",
    takeaways: ["Inputs as production sends them; outputs exactly as you want them.", "The model reproduces the frequency of habits in the outputs; consistency is the lesson.", "Show rare moves explicitly: refusals, clarifications, language switching, tool calls.", "A style guide and a second reviewer are part of the dataset."],
    terms: [["style guide", "the written rules every training output is checked against"], ["multi-turn example", "an example whose input includes earlier conversation turns"]],
    reflect: { q: "Should training inputs be cleaned of typos so the model 'sees good examples'?", a: "No. The outputs should be clean; the inputs should be as messy as real users, because that is what the model must handle at inference. A model that only ever saw tidy inputs is less robust to real ones." },
  },

  "m21-training-and-validation-datasets": {
    simple: "Split the examples into training, validation and test sets before training: train on one, tune decisions on the second, and report only the third.",
    concept:
      "Module 4 introduced the idea of held-out data. Fine-tuning applies it strictly with three sets. The **training set** is what the model learns from. The **validation set** is held out and used during training to choose the number of epochs, the learning rate and the checkpoint: you look at it repeatedly and adjust. The **test set** is never looked at until the end, and it produces the number you report; because no decision was tuned on it, that number is honest.\n\nThe split must be done before any training and must respect leakage: near-duplicates of a training example must not land in validation, examples from the same customer or document should stay in one set, and the test set should look like production, not like the easiest cases.\n\nTypical sizes for a few thousand examples: 80% train, 10% validation, 10% test, with the test set topped up to at least a few hundred so its score is stable.",
    why:
      "A model's score on data it trained on is meaningless; it may simply have memorised it. A score on data used to choose the checkpoint is slightly optimistic; you picked the version that did best there. Only the untouched test set says what will happen in production. The three-way split exists because teams without it have shipped models whose reported 95% became 70% on real traffic.",
    how: [
      "Group examples by anything that could leak: customer, document, conversation, template.",
      "Shuffle the groups and split them 80/10/10 into train, validation and test, so no group spans sets.",
      "Deduplicate across sets with the near-duplicate check from Module 20, not just within sets.",
      "Check that the test set's category mix matches production logs.",
      "Freeze the test set: store it separately, hash it, and do not read it until the final evaluation.",
      "During training, evaluate on validation after every epoch; pick the best checkpoint; then run the test set once.",
    ],
    visual: {
      kind: "flow",
      steps: ["all examples, grouped by source", "shuffle groups", "train 80%: the model learns", "validation 10%: pick epochs, LR, checkpoint", "test 10%: looked at once, reported"],
      caption: "Decisions flow left to right. Nothing from the test set flows back into any decision.",
    },
    everyday: {
      title: "Mock exams and the real one",
      text: "You study from past papers (training). You sit mock exams and adjust what to revise (validation). The real exam (test) is one you have never seen, which is why its grade means something. If the real exam reused the mock questions, every student would score highly and the grade would say nothing about ability.",
    },
    engineering: {
      title: "The leak through the customer id",
      text: "A churn-prediction fine-tune reported 93% on its test set and achieved 68% in production. The examples had been split by row, but each customer appeared in several rows (one per month), so the model had seen most test customers during training, with slightly different features. Re-splitting by customer id dropped the test score to 71%, which matched production. The honest number had been available all along; the split had hidden it.",
    },
    maths: {
      formula: "95% confidence interval for a test accuracy p on n items ≈ p ± 1.96 × √(p(1 − p) ÷ n)",
      meaning: "A test set's score has sampling error. The interval says how much the reported number could move with a different sample of the same size.",
      worked: [
        "Test set of 100 items, accuracy 0.90: margin ≈ 1.96 × √(0.9 × 0.1 ÷ 100) = 1.96 × 0.03 ≈ 0.059: the true accuracy is plausibly anywhere from 84% to 96%.",
        "Test set of 1,000 items, same accuracy: margin ≈ 1.96 × √(0.09 ÷ 1,000) ≈ 0.019: 88% to 92%.",
        "To tell a 90% model from a 92% model you need the larger set; with 100 items the difference is noise.",
      ],
    },
    code: {
      title: "A grouped split with cross-set deduplication",
      lang: "py",
      src: `import random
from collections import defaultdict

random.seed(7)
groups = defaultdict(list)
for r in records:
    groups[r["customer_id"]].append(r)          # everything from one customer stays together

keys = list(groups)
random.shuffle(keys)
n = len(keys)
split = {"train": keys[: int(0.8 * n)], "val": keys[int(0.8 * n): int(0.9 * n)], "test": keys[int(0.9 * n):]}

sets = {name: [r for k in ks for r in groups[k]] for name, ks in split.items()}
train_texts = {r["user"].strip().lower() for r in sets["train"]}
sets["test"] = [r for r in sets["test"] if r["user"].strip().lower() not in train_texts]
print({k: len(v) for k, v in sets.items()})`,
      lines: [
        { code: "groups[r[\"customer_id\"]].append(r)          # everything from one customer stays together", say: "The leak-prone key decides the grouping. Split groups, never rows." },
        { code: "random.seed(7)", say: "A fixed seed so the split is reproducible and the test set stays the same across experiments." },
        { code: "sets[\"test\"] = [r for r in sets[\"test\"] if r[\"user\"].strip().lower() not in train_texts]", say: "Even across customers, an identical input in train and test is a leak; drop it from test." },
      ],
      note: "Use the near-duplicate method from Module 20 as well; exact matching misses paraphrases.",
    },
    useIt: "Split before you train, by group, with a frozen test set of at least a few hundred items that mirrors production. Report the test number with its margin of error, and never let a test score influence a training decision; if it does, that set has become validation and you need a new test set.",
    takeaways: ["Three sets: train to learn, validation to decide, test to report.", "Split by group (customer, document) and deduplicate across sets.", "Freeze the test set; look once.", "Small test sets have large margins; a few hundred items minimum."],
    terms: [["validation set", "held-out examples used during training to choose settings and checkpoints"], ["test set", "held-out examples looked at once, for the reported score"], ["leakage", "information from the test set reaching training, usually through duplicates or shared groups"]],
    reflect: { q: "After five experiments you have chosen the best one by its test score. What has gone wrong?", a: "The test set has been used to make a decision, so it is now a validation set and its score is optimistic by selection. Keep a fresh test set for the final report, or accept that the reported number is an upper bound and say so." },
  },

  "m21-fine-tuning-evaluation": {
    simple: "Evaluate a fine-tune against the base model and against prompting, on a frozen test set, with task metrics and read outputs; the loss alone cannot tell you whether it is better.",
    concept:
      "Validation loss tells you the model predicts your outputs' tokens better. It does not tell you the outputs are correct, safe, well formatted, or better than what you had. **Fine-tuning evaluation** answers those questions with three comparisons on the frozen test set: the fine-tuned model, the base model with the same prompt, and the best prompted version of a strong model. If the fine-tune does not clearly beat the second and compete with the third, it has not earned its place.\n\nMetrics depend on the task. Exact or schema match for structured outputs; precision and recall for classification and extraction; a rubric scored by people or by a judge model (Module 37) for prose. Add checks for what must never happen: forbidden content, broken format, hallucinated fields. And always read a sample of outputs by hand; metrics miss tone and subtle errors.\n\nEvaluation also looks at cost and latency: a fine-tuned small model that matches a large prompted one at a tenth of the price has won even at equal quality.",
    why:
      "Fine-tuning always lowers the loss on its own data, so 'it trained successfully' is not evidence of anything. Teams have shipped fine-tunes that were worse than prompting because nobody compared. Evaluation exists to turn a trained model into a decision: ship it, iterate on the data, or go back to prompting.",
    how: [
      "Freeze the test set (previous lesson) and decide the metrics before training.",
      "Run three systems on it: base model + prompt, fine-tuned model + its short prompt, strong model + best prompt.",
      "Compute task metrics and the must-never checks for each.",
      "Read 50 outputs from each system side by side; note failure types.",
      "Record cost per request and latency for each.",
      "Decide: ship, improve the data (most common), or stay with prompting.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["System", "Format valid", "Clause accuracy", "Forbidden content", "Cost per 1k", "p95 latency"],
        rows: [
          ["base 7B + 900-token prompt", "81%", "72%", "0.4%", "$0.90", "2.1 s"],
          ["fine-tuned 7B + 60-token prompt", "98%", "88%", "0.0%", "$0.35", "1.2 s"],
          ["strong hosted model + best prompt", "97%", "91%", "0.1%", "$4.20", "2.8 s"],
        ],
      },
      caption: "The fine-tune beats its base clearly and nearly matches the strong model at a twelfth of the cost. That is a ship decision, with the 3-point accuracy gap noted for the next data iteration.",
    },
    everyday: {
      title: "Taste test, not just thermometer",
      text: "A thermometer tells you the dish reached the right temperature; it does not tell you it tastes good or beats the restaurant next door. Validation loss is the thermometer. Evaluation is the blind taste test against the alternatives, with someone checking nothing is burnt.",
    },
    engineering: {
      title: "The fine-tune that lost to a better prompt",
      text: "A team fine-tunes a 13B model for report summaries and is pleased: validation loss fell 40%. Evaluation against a carefully prompted hosted model shows the fine-tune's summaries are rated lower by reviewers on completeness, though they match the house format perfectly. The fine-tuned data had been written quickly and omitted details; the model learned to omit them. They rewrote 300 outputs to be complete, retrained, and the fine-tune then won on both format and completeness. Without the comparison they would have shipped a model that faithfully reproduced hurried summaries.",
    },
    maths: {
      formula: "precision = TP ÷ (TP + FP);   recall = TP ÷ (TP + FN);   F1 = 2PR ÷ (P + R)",
      meaning: "For extraction and classification: precision is how much of what the model produced was right; recall is how much of what should have been produced it found. F1 balances them.",
      worked: [
        "Extracting invoice line items from 200 test invoices with 1,000 true items: the fine-tuned model outputs 980 items, of which 920 are correct.",
        "Precision = 920 ÷ 980 ≈ 0.939; recall = 920 ÷ 1,000 = 0.92; F1 = 2 × 0.939 × 0.92 ÷ (0.939 + 0.92) ≈ 0.929.",
        "The base model outputs 1,150 items, 850 correct: precision ≈ 0.739, recall = 0.85, F1 ≈ 0.79.",
        "The fine-tune improved precision most: it stopped inventing items. That is the kind of detail a single accuracy number hides.",
      ],
    },
    useIt: "Before training, write down the metrics, the must-never checks and the three systems you will compare. After training, run the comparison on the frozen test set, read outputs, and record cost and latency. The decision is data-driven: most first fine-tunes lead back to improving the examples, not to shipping.",
    takeaways: ["Loss going down proves nothing about quality; compare on a frozen test set.", "Three systems: base + prompt, fine-tuned, strong model + best prompt.", "Task metrics, must-never checks, a read-through, cost and latency.", "The usual outcome is 'improve the data'; shipping is the exception that evaluation earns."],
    terms: [["must-never check", "a test for outputs that are unacceptable regardless of the metric"], ["judge model", "a strong model used to score outputs against a rubric"]],
    reflect: { q: "The fine-tune scores 2 points higher than the strong prompted model on a 150-item test set. Is it better?", a: "Not demonstrably: with 150 items the margin of error is around 5 to 7 points, so a 2-point gap is noise. Either enlarge the test set or treat the two as equal and decide on cost and latency, where the fine-tune likely wins." },
  },

  "m21-catastrophic-forgetting": {
    simple: "Catastrophic forgetting is when fine-tuning on a narrow task erases abilities the model had before; it is caused by large updates on narrow data and is prevented by gentle training and mixed data.",
    concept:
      "The weights that make a model good at your task are the same weights that make it good at everything else. Fine-tuning moves them. Move them far enough, in the direction of a narrow dataset, and the model's other abilities degrade: it forgets how to write code, refuses less, answers general questions worse, or loses languages. This is **catastrophic forgetting**.\n\nIt is not mysterious: gradient descent has no memory of what the weights used to do, only of the current loss. With thousands of examples all about one thing, the lowest loss is reached by specialising, and specialising means overwriting.\n\nThe defences are all about limiting how far and how narrowly the weights move: a small learning rate, few epochs, a replay mix of general data alongside your examples, regularisation that penalises drift from the original weights, and parameter-efficient methods (Module 22) that leave most weights untouched. And always a general-ability evaluation before and after, so forgetting is measured rather than discovered by users.",
    why:
      "A fine-tuned support model that can no longer handle a question phrased in Spanish, or a coding model that forgot how to explain, is a regression shipped as an improvement. Forgetting is easy to cause and invisible on your task's own metrics, which only measure what you trained for. It exists as a named problem because it caught many teams by surprise, and because the fixes are cheap once you know to apply them.",
    how: [
      "Before training, run a small general-ability suite: a few hundred items across reasoning, instructions, code, languages and safety.",
      "Use a small learning rate (1e-5 to 5e-5 for full fine-tuning) and few epochs.",
      "Mix in general instruction data, typically 10 to 30% of the batch, so the loss still rewards general behaviour (replay).",
      "Prefer LoRA (Module 22), which changes a small added set of weights and leaves the base intact.",
      "After training, rerun the general suite; a drop beyond a few points means the training was too aggressive.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Aggressive fine-tune", points: ["learning rate 2e-4, 10 epochs, 100% task data", "task score: 94%", "general reasoning: 71% → 52%", "second language: 80% → 41%", "refusals of unsafe requests: 95% → 60%"] },
      right: { title: "Gentle fine-tune", points: ["learning rate 2e-5, 3 epochs, 20% replay data", "task score: 92%", "general reasoning: 71% → 69%", "second language: 80% → 78%", "refusals: 95% → 94%"] },
      caption: "Two points of task score bought at the cost of half the model's other abilities. The gentle version is the one to ship.",
    },
    everyday: {
      title: "The specialist who forgot the basics",
      text: "A doctor who spends five years doing only one procedure, never reading anything else, becomes superb at it and rusty at general medicine. The cure is not to stop specialising; it is to keep up general practice alongside. Replay data is the model's continued general practice.",
    },
    engineering: {
      title: "The model that stopped refusing",
      text: "A company fine-tuned an instruct model on 20,000 internal Q&A pairs at a high learning rate. Task accuracy was excellent. Two weeks after launch, security found that the model now answered requests the original had refused: the fine-tuning data contained no refusals, and the updates had overwritten the safety behaviour. They retrained with a 15% mix of the original refusal and general-instruction data at a quarter of the learning rate. Refusal behaviour returned to baseline and task accuracy dropped by one point.",
    },
    maths: {
      formula: "weight drift = ‖θ_fine-tuned − θ_base‖;   regularised loss = L_task + λ × ‖θ − θ_base‖²",
      meaning: "Forgetting grows with how far the weights travel from the base. Adding a penalty on that distance keeps the model close while it learns the task.",
      worked: [
        "Suppose a weight vector of the base model is θ_base = [0.50, −0.20, 0.80] and a task gradient step wants to move it to [0.90, −0.60, 1.30].",
        "Drift = √((0.4)² + (0.4)² + (0.5)²) = √0.57 ≈ 0.75.",
        "With λ = 2, the penalty gradient pulls each weight back toward the base; the same step lands near [0.63, −0.33, 0.97]: drift ≈ √(0.0169 + 0.0169 + 0.0289) ≈ 0.25.",
        "The task loss improves less per step, but the model stays within a region where its old abilities still work.",
      ],
      note: "In practice teams use LoRA, a low learning rate and replay rather than an explicit penalty, but the idea is the same: limit the distance.",
    },
    useIt: "Treat every fine-tune as a risk to the model's other abilities. Run a general suite before and after, keep the learning rate low, mix in replay data, prefer LoRA, and include refusal examples if safety matters. A fine-tune that improves your metric and silently damages everything else is the most common bad outcome.",
    takeaways: ["Fine-tuning moves shared weights; narrow data plus big steps overwrites other abilities.", "Invisible on task metrics; measure a general suite before and after.", "Defences: low learning rate, few epochs, replay data, regularisation, LoRA.", "Safety behaviour is forgotten like any other; include refusals."],
    terms: [["catastrophic forgetting", "loss of previously learned abilities caused by fine-tuning"], ["replay data", "general examples mixed into fine-tuning to preserve general behaviour"]],
    reflect: { q: "Why does LoRA reduce forgetting?", a: "It leaves the base weights frozen and trains a small added set, so the model can only move within a restricted set of directions and the base knowledge is never overwritten. At inference you can even drop the adapter and have the original model back." },
  },

  "m21-when-fine-tuning-is-useful": {
    simple: "Fine-tune when a behaviour is needed consistently at scale and prompting cannot deliver it reliably, cheaply or at the right latency; it shines for format, style, narrow skills and small models.",
    concept:
      "Fine-tuning earns its cost in a specific set of situations. **Consistency**: the output must follow a format or style every time, and prompting reaches 90% but not 99%. **Narrow skill**: a classification or extraction with subtle rules that are easier to show than to describe. **Cost and latency at scale**: a long prompt on every call is replaced by weights, or a small fine-tuned model replaces a large prompted one. **Tone and voice**: a house style that examples capture and instructions do not. **Specialised input or output**: domain jargon, a private query language, structured logs.\n\nA good sign is that you already have hundreds of examples of ideal outputs, or can get experts to produce them. Another is that a prompt has grown long and brittle. A third is that the model is being asked to do the same thing millions of times.\n\nFine-tuning is a product decision as much as a technical one: it fixes behaviour in weights that must be retrained to change, so it suits stable tasks better than fast-moving ones.",
    why:
      "Teams either fine-tune too early, before prompting has been tried, or never, because it sounds like research. A clear list of the situations where it pays turns the decision into a checklist. The economics are striking when they apply: a fine-tuned 7B model at a tenth of the cost of a hosted model, with better consistency, is a common outcome for the right task.",
    how: [
      "Confirm prompting has been tried well (Module 26) and measure its consistency, cost and latency.",
      "Check the task is stable and repeated at scale.",
      "Check you can assemble 300 or more high-quality examples with expert review.",
      "Estimate the saving: prompt tokens removed per call × calls per month, or the price gap between models.",
      "Run a small pilot (lesson 8's three-way comparison) before committing to a full dataset.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Situation", "Fine-tune?", "Why"],
        rows: [
          ["support replies in a strict house format, 50k per day", "yes", "consistency and cost at scale"],
          ["classifying tickets into 40 categories with subtle rules", "yes", "a narrow skill shown better than described"],
          ["a 900-token system prompt on every call", "likely", "bake it into weights, cut cost and latency"],
          ["a 7B model to replace a hosted model for one task", "yes, if a pilot matches quality", "ten times cheaper"],
          ["answering questions about this week's prices", "no", "facts change; use retrieval"],
          ["a prototype used by 20 people", "no", "prompting is enough; volume does not justify it"],
        ],
      },
      caption: "Fine-tune for stable, repeated behaviour; not for changing facts or low volume.",
    },
    everyday: {
      title: "Printing a form versus writing it out each time",
      text: "If you fill in the same letter a thousand times, you print a template; the per-letter effort drops and every letter looks the same. If you write three letters a year, each different, a template is wasted effort. Fine-tuning is printing the template into the model.",
    },
    engineering: {
      title: "Replacing a hosted model for log triage",
      text: "A monitoring company classifies 20 million log lines a day into incident types with a hosted model and a 700-token prompt: $18,000 a month. They fine-tune a 3B open-weight model on 12,000 expert-labelled lines. The pilot matches the hosted model's F1 (0.91 vs 0.92) and runs on two GPUs at about $1,100 a month, with lower latency. They ship it and keep the hosted model as a fallback for unknown log formats. Stable task, huge volume, available labels: the ideal fine-tuning case.",
    },
    maths: {
      formula: "monthly saving ≈ calls × (prompt tokens removed × price per token) + calls × (price_large − price_small)",
      meaning: "Two sources of saving: tokens no longer sent, and a cheaper model doing the job. Compare with the one-off cost of data and training.",
      worked: [
        "50,000 calls per day, 1.5 million per month; prompt shrinks from 900 to 60 tokens: 840 tokens saved per call.",
        "At $3 per million input tokens: 1.5 × 10⁶ × 840 × 3 ÷ 10⁶ ≈ $3,780 per month saved on prompt tokens alone.",
        "Switching from a hosted model at $0.004 per call to a self-hosted fine-tune at $0.0004: 1.5 × 10⁶ × 0.0036 = $5,400 per month.",
        "Total ≈ $9,200 per month against a one-off cost of about $25,000 for data preparation and training: payback in under three months.",
      ],
    },
    useIt: "Walk the checklist before any fine-tuning project: prompting tried and measured, stable task, scale, examples available, saving estimated, pilot run. When all six hold, fine-tuning is usually the right call and the economics are large.",
    takeaways: ["Fine-tune for consistency, narrow skills, cost and latency at scale, tone, and specialised formats.", "Signs: hundreds of ideal examples exist, the prompt is long and brittle, the task repeats millions of times.", "Stable tasks only; facts belong in retrieval.", "Pilot first; the three-way comparison decides."],
    terms: [["pilot", "a small fine-tune on a few hundred examples to test whether the approach pays before full investment"]],
    reflect: { q: "A team has 50 perfect examples and a task run 100 times a day. Fine-tune?", a: "No. Fifty examples are too few to move a model reliably and 100 calls a day do not justify maintaining weights; few-shot prompting with those 50 examples as a pool (Module 26) will do the job. Revisit when volume and examples grow by an order of magnitude." },
  },

  "m21-when-fine-tuning-is-unnecessary": {
    simple: "Do not fine-tune to add facts, to fix a task prompting already does well, for low volume, for fast-changing requirements, or without evaluation; retrieval and prompting are usually the better first tools.",
    concept:
      "Fine-tuning is the wrong tool more often than the right one, and knowing when saves months. **To add knowledge**: a few thousand examples cannot teach facts reliably, and facts change; retrieval (Module 28) supplies them fresh and cited. **When prompting works**: if a well-built prompt gives the quality, consistency and cost you need, the weights do not need to change. **Low volume**: the cost of data and maintenance exceeds the saving. **Fast-changing requirements**: every change means retraining; a prompt changes in minutes. **No evaluation**: without a test set and a comparison, you cannot know the fine-tune helped, so it is premature.\n\nAlso unnecessary: fine-tuning to 'make the model understand our company' (retrieval), to fix hallucinations (grounding and verification), or to make a model safer without preference data (Module 23's territory).\n\nThe decision pattern is: prompt first, then retrieve, then fine-tune for behaviour only, and keep the earlier layers in place when you do.",
    why:
      "Fine-tuning is appealing because it sounds like ownership and permanence. In practice it adds a training pipeline, an evaluation suite, weights to version and serve, and a risk of forgetting, all of which cost engineering time forever. When the problem is facts, format inconsistency that a better prompt fixes, or a prototype, those costs buy nothing. The industry's standard advice, prompt then retrieve then fine-tune, exists because the first two layers solve most problems.",
    how: [
      "If the failure is wrong or missing facts: add retrieval; do not fine-tune.",
      "If the failure is inconsistency: improve the prompt with examples and format rules (Module 26); measure; fine-tune only if still short.",
      "If volume is low or requirements change weekly: stay with prompting.",
      "If you cannot build a test set: you are not ready to fine-tune.",
      "If you do fine-tune, keep retrieval and the prompt layers; weights carry behaviour, not knowledge.",
    ],
    visual: {
      kind: "flow",
      steps: ["problem", "prompt engineering: fixes most format and tone issues", "retrieval: fixes facts and freshness", "fine-tuning: fixes consistency at scale, narrow skills, cost", "preference training: fixes helpfulness and safety"],
      caption: "Work left to right. Each layer is cheaper and more reversible than the next.",
    },
    everyday: {
      title: "Rebuilding the kitchen to fix a recipe",
      text: "If a dish tastes wrong, you change the recipe before you rebuild the kitchen. Fine-tuning is rebuilding the kitchen: expensive, slow to undo, and pointless if the ingredients were the problem. Prompting is the recipe; retrieval is fresh ingredients.",
    },
    engineering: {
      title: "The six-week fine-tune that a prompt replaced",
      text: "A team spent six weeks fine-tuning a model to answer questions about their pricing plans, which changed monthly. Each change needed a new dataset and retraining; answers about last month's prices kept appearing. They replaced it with retrieval over the current pricing page and a 200-token prompt. Accuracy rose, updates became instant, and the fine-tuning pipeline was deleted. The task was facts, and facts were never a fine-tuning problem.",
    },
    maths: {
      formula: "break-even months = one-off fine-tuning cost ÷ monthly saving;   if requirements change every k months, retraining cost recurs every k months",
      meaning: "Fine-tuning pays when the saving outlasts the retraining cycle. Frequent change makes the one-off cost recurring.",
      worked: [
        "One-off cost $25,000, monthly saving $9,200: break-even ≈ 2.7 months. Worth it if the task is stable.",
        "Same numbers but requirements change every 2 months, each change costing $8,000 to re-prepare data and retrain: recurring cost $4,000 per month, net saving $5,200 per month, break-even ≈ 4.8 months and ongoing engineering load.",
        "At a change every month: recurring cost $8,000 against $9,200 saved; net $1,200 for a lot of work. Prompting wins on simplicity.",
      ],
    },
    useIt: "Before starting a fine-tune, write one sentence saying which failure it fixes. If the sentence contains 'know', 'facts', 'our products' or 'up to date', stop and use retrieval. If it contains 'sometimes', try a better prompt and measure. If it contains 'consistently', 'at scale' or 'cheaper', proceed with lesson 10's checklist.",
    takeaways: ["Facts and freshness: retrieval, never fine-tuning.", "Inconsistency: a better prompt first; fine-tune only if still short.", "Low volume and fast-changing requirements make fine-tuning a cost with no return.", "Prompt, then retrieve, then fine-tune for behaviour; keep the earlier layers."],
    terms: [["grounding", "supplying the facts an answer should rest on, usually through retrieval"]],
    reflect: { q: "A fine-tune 'to reduce hallucinations' is proposed. What should be done instead?", a: "Hallucination is the model filling gaps in its knowledge; a few thousand examples will not fill them. Ground answers with retrieval, instruct the model to say when sources do not cover a question, verify claims against sources (Module 28), and measure faithfulness. Fine-tuning can later teach the model to cite and decline more consistently, once those pieces exist." },
  },
};

export const M21_QUIZ: Quiz[] = [
  {
    q: "What does fine-tuning change well, and what does it change poorly?",
    options: ["It adds facts well and changes style poorly", "It changes behaviour (format, style, task) well and adds knowledge poorly", "It changes both equally", "It changes nothing without a reward model"],
    answer: 1,
    why: ["Reversed: facts are what a few thousand examples cannot reliably add.", "Correct. Thousands of examples steer behaviour; they cannot supply what trillions of tokens left out.", "They are very different in effect.", "SFT needs no reward model."],
  },
  {
    q: "Why is the loss masked on prompt tokens in SFT?",
    options: ["To save memory", "So the model learns to produce the completion given the prompt, not to predict the prompt it never generates", "Because prompts are untrustworthy", "To make the loss number smaller"],
    answer: 1,
    why: ["Memory is unchanged; the mask only affects the loss.", "Correct. Training signal goes where the model will be generating.", "Trust is not the issue.", "The masked loss is often larger, not smaller, because it covers harder tokens only."],
    reason: true,
  },
  {
    q: "A base model gives little Punjabi ability. Which regime adds it?",
    options: ["Fine-tuning on 2,000 Punjabi examples", "Continued pretraining on billions of Punjabi tokens, then fine-tuning", "A longer system prompt", "Lowering the temperature"],
    answer: 1,
    why: ["Too little data to add a language; it would teach format only.", "Correct. Language and knowledge need pretraining-scale data; behaviour needs examples.", "Prompts cannot add vocabulary the model lacks.", "Sampling settings do not add knowledge."],
  },
  {
    q: "A dataset has 6,000 auto-labelled examples with 11% systematically wrong labels. What does the model learn?",
    options: ["Nothing from the wrong ones", "The wrong pattern as a rule for those cases, because the errors are consistent", "To ignore labels", "Only from the first 1,000"],
    answer: 1,
    why: ["Every example is training signal.", "Correct. Consistent errors are learned as rules; random noise is far less harmful.", "Models have no judgement about labels.", "All examples are used."],
  },
  {
    q: "Why split by customer rather than by row?",
    options: ["Rows are too small", "Rows from one customer are near-duplicates; splitting by row leaks test customers into training and inflates the score", "Customers prefer it", "It makes the test set larger"],
    answer: 1,
    why: ["Size is not the issue.", "Correct. Grouped splits prevent leakage; the reported score then matches production.", "No.", "It usually makes it slightly smaller."],
  },
  {
    q: "Validation loss fell 40% but reviewers rate the fine-tuned summaries worse than a prompted strong model. What happened?",
    options: ["The loss function is broken", "The model faithfully learned hurried, incomplete training outputs; the fix is better data", "The reviewers are wrong", "The test set was too small"],
    answer: 1,
    why: ["Loss did its job: it measured fit to the data.", "Correct. Loss measures imitation of the dataset, not quality; improve the outputs and retrain.", "Reviewers caught what loss cannot.", "Possibly, but the diagnosis matches the data quality."],
    reason: true,
  },
  {
    q: "Which combination most reduces catastrophic forgetting?",
    options: ["High learning rate and many epochs", "Low learning rate, few epochs, replay data, LoRA, and a general suite run before and after", "Training on only the task data", "Removing refusals from the data"],
    answer: 1,
    why: ["That is the recipe for forgetting.", "Correct. Limit how far and how narrowly the weights move, and measure.", "Narrow data is the cause.", "That removes safety behaviour."],
  },
  {
    q: "Which of these is NOT a reason to fine-tune?",
    options: ["A strict output format needed 99% of the time at scale", "Replacing a 900-token prompt sent 50,000 times a day", "Teaching the model this month's prices", "Replacing a hosted model with a small self-hosted one for a stable task"],
    answer: 2,
    why: ["Consistency at scale is a classic reason.", "Cost and latency at scale is a classic reason.", "Correct. Facts change and belong in retrieval; fine-tuning cannot keep them fresh.", "Cost replacement for a stable task is a classic reason."],
  },
];

export const M21_EXERCISES: Exercise[] = [
  {
    title: "Diagnose before training",
    kind: "think",
    task: "For each failure, say whether the fix is prompting, retrieval, fine-tuning or continued pretraining, and why: (a) replies are correct but 15% miss the required JSON shape; (b) the model invents product codes; (c) the model's German is poor; (d) 2 million daily classifications cost too much on a hosted model; (e) a prototype for 10 users gives slightly inconsistent tone.",
    hints: ["Facts → retrieval. Behaviour at scale → fine-tuning. Missing language → continued pretraining. Low volume → prompting."],
    solution: "(a) Prompting first: add format rules and examples, enforce a schema (Module 27); fine-tune only if still short at scale. (b) Retrieval: product codes are facts; ground answers in the catalogue. (c) Continued pretraining on German text, then fine-tuning; examples alone cannot add a language. (d) Fine-tune a small model on expert labels and compare F1 with the hosted model; the volume justifies it. (e) Prompting; ten users do not justify weights, and tone is fixable with a style section and examples.",
  },
  {
    title: "Build and check an SFT example",
    kind: "code",
    task: "Write Python that takes a list of (user, assistant) pairs, formats each with a chat template, builds input_ids and labels with the prompt masked to −100, and asserts that the number of unmasked labels equals the number of assistant tokens plus one for the end token. Explain what goes wrong if the tokeniser merges tokens across the prompt–completion boundary.",
    hints: ["Tokenise the prompt alone and the full text; the prompt ids should be a prefix of the full ids.", "Compare len(prompt_ids) with the position where the completion starts."],
    solution: "def build(tok, pairs, system):\n    out = []\n    for user, assistant in pairs:\n        prompt = tok.apply_chat_template([{'role':'system','content':system},{'role':'user','content':user}], tokenize=False, add_generation_prompt=True)\n        p_ids = tok(prompt, add_special_tokens=False)['input_ids']\n        f_ids = tok(prompt + assistant + tok.eos_token, add_special_tokens=False)['input_ids']\n        assert f_ids[:len(p_ids)] == p_ids, 'boundary merge'\n        labels = [-100]*len(p_ids) + f_ids[len(p_ids):]\n        a_ids = tok(assistant, add_special_tokens=False)['input_ids']\n        assert sum(l != -100 for l in labels) == len(a_ids) + 1\n        out.append({'input_ids': f_ids, 'labels': labels})\n    return out\n\nIf the tokeniser merges across the boundary (for example the last prompt character and the first completion character become one token), the prefix assertion fails: the mask would be off by one, either leaking a prompt token into the loss or masking the first completion token. Fix by adding a separator the template guarantees, or by tokenising the two parts separately and concatenating ids.",
  },
  {
    title: "Cost the decision",
    kind: "calculate",
    task: "A task runs 800,000 times a month with a 1,200-token prompt on a hosted model at $3 per million input tokens and $0.006 per call base price. A fine-tuned self-hosted model would cut the prompt to 80 tokens and cost $0.0008 per call all-in. Data preparation and training are estimated at $30,000. Compute the monthly saving and break-even. Then recompute if requirements change every three months at $9,000 per retrain.",
    hints: ["Prompt token saving = calls × tokens saved × price per token.", "Add the per-call price gap.", "Recurring cost per month = retrain cost ÷ months between changes."],
    solution: "Tokens saved = 1,120 per call: 800,000 × 1,120 × 3 ÷ 10⁶ = $2,688 per month. Per-call gap = 0.006 − 0.0008 = $0.0052 × 800,000 = $4,160 per month. Total saving ≈ $6,848 per month; break-even ≈ 30,000 ÷ 6,848 ≈ 4.4 months. With retraining every 3 months at $9,000: recurring ≈ $3,000 per month; net saving ≈ $3,848; break-even ≈ 7.8 months plus ongoing engineering. Still positive, but closer; if changes came monthly the net saving would be under $1,000 and prompting would be the better choice.",
  },
  {
    title: "Design the forgetting check",
    kind: "build",
    task: "Design a 200-item general-ability suite to run before and after a support fine-tune: list five categories, how many items each, how each is scored, and the drop you would treat as a failed fine-tune.",
    hints: ["Cover reasoning, instruction following, a second language, code, and safety refusals.", "Choose scoring that is automatic where possible."],
    solution: "Categories: (1) reasoning: 50 short maths and logic questions, exact-match answers; (2) instruction following: 40 tasks with checkable constraints (word limits, required fields), scored by code; (3) second language: 40 translation and comprehension items, scored by a judge model against references; (4) code: 30 small functions with unit tests, pass/fail; (5) safety: 40 requests that must be refused, scored by a refusal classifier plus a human sample. Run before and after; treat a drop of more than 3 points in any category, or any drop in safety refusals, as a failed fine-tune that must be retrained more gently with replay data.",
  },
];
