import type { Exercise, LessonBody, Quiz } from "../types";

// Module 23: Preference and alignment training. One concept per lesson. Keys are lesson slugs: m23-<kebab of the concept title in map.ts>.

export const M23_BODIES: Record<string, LessonBody> = {
  "m23-model-alignment": {
    simple: "Alignment is the training that makes a model's behaviour match what people actually want from an assistant: helpful, honest, careful, rather than merely fluent.",
    concept:
      "A base model (Module 20) predicts text. An instruction-tuned model (Module 21) follows instructions. Neither has any notion of which of two acceptable answers is better: shorter or longer, cautious or direct, a refusal or a careful reply to a risky question. **Model alignment** is the family of training methods that teach those judgements, by learning from human preferences rather than from single correct answers.\n\nThe word 'alignment' means lining up the model's behaviour with human intentions and values: being genuinely helpful, admitting uncertainty, declining harmful requests, not flattering, not inventing. These are not facts the model lacks; they are dispositions, and they are taught by showing the model pairs of responses and which one people preferred, then nudging it toward the preferred kind.\n\nThis module walks through the pipeline that does this: collecting human feedback, training a reward model that predicts preferences, reinforcement learning against that reward (RLHF with PPO), the simpler direct method (DPO), the datasets involved, the safety side, and the known limits.",
    why:
      "Supervised fine-tuning can only show the model one good answer per prompt. But what makes an assistant good is comparative and subtle: this reply is clearer than that one; this refusal is justified, that one is lazy; this tone fits. People find it far easier to say which of two answers they prefer than to write the perfect answer. Alignment methods exist to turn that cheap, abundant comparative judgement into training signal, which is how a next-token predictor became something you can talk to.",
    how: [
      "Start from an instruction-tuned model (SFT) so responses are already reasonable.",
      "Collect comparisons: for a prompt, show people two or more responses and record which they prefer and why.",
      "Train a reward model that scores any response so that preferred responses score higher.",
      "Optimise the assistant to produce high-reward responses while staying close to the SFT model (RLHF), or optimise directly on the comparisons (DPO).",
      "Evaluate on held-out comparisons and on safety tests; iterate with fresh feedback on the new model's failures.",
    ],
    visual: {
      kind: "flow",
      steps: ["base model: predicts text", "SFT: follows instructions", "preference data: A is better than B", "reward model or direct optimisation", "aligned assistant: helpful, honest, careful"],
      caption: "Each stage adds a disposition the previous one lacked. Alignment is the last and most human step.",
    },
    everyday: {
      title: "Learning manners by feedback, not by rulebook",
      text: "Nobody learns tact from a manual. You say something, you see the reaction, and over years you learn which of two true things to say and how. Alignment gives a model that feedback loop: thousands of small 'this one was better' signals, until the better kind becomes its habit.",
    },
    engineering: {
      title: "The assistant that was fluent and useless",
      text: "A company's SFT model answered every question confidently, including the ones it should have declined or hedged. Users rated 30% of answers unhelpful or inappropriate. The team collected 20,000 pairwise comparisons from trained raters, trained a reward model, and ran DPO. Unhelpful ratings fell to 11% and refusals became targeted instead of random. No new facts were added; what changed was judgement about which answer to give.",
    },
    maths: {
      formula: "P(A preferred over B) = σ(r(A) − r(B))   (Bradley–Terry model, σ(z) = 1 ÷ (1 + e^−z))",
      meaning: "Preference is modelled as a probability that depends only on the difference in reward scores. This single equation underlies reward models and DPO alike.",
      worked: [
        "A reward model scores response A at 2.0 and response B at 0.5: difference 1.5.",
        "σ(1.5) = 1 ÷ (1 + e^−1.5) = 1 ÷ (1 + 0.223) ≈ 0.818: an 82% chance a rater prefers A.",
        "If the scores were equal, σ(0) = 0.5: a coin flip, as it should be.",
        "Training moves scores so that this probability is high for the responses raters actually preferred.",
      ],
    },
    useIt: "You will mostly consume aligned models, but understanding alignment tells you what they are optimised for, why they refuse or hedge, how to collect preference data for your own product (thumbs up and down are the start), and how to run DPO on it when SFT alone leaves judgement calls wrong.",
    takeaways: ["Alignment teaches dispositions (helpful, honest, careful) from comparative human feedback.", "People compare answers more easily than they write perfect ones; that is the signal.", "The pipeline: SFT → preference data → reward model or DPO → evaluation → iterate.", "It changes judgement, not knowledge."],
    terms: [["alignment", "training a model's behaviour to match human intentions and values"], ["preference data", "records of which of two responses people preferred"], ["Bradley–Terry model", "the equation that turns a reward difference into a preference probability"]],
    reflect: { q: "Why not just write rules like 'be helpful and honest' in the system prompt?", a: "Rules in the prompt help, but a model only follows them as well as its dispositions allow; a model trained to be sycophantic will flatter while saying it is honest. Alignment changes the weights so the disposition is there before any prompt, and prompts then steer within it." },
  },

  "m23-human-feedback": {
    simple: "Human feedback is the raw material of alignment: people comparing, rating or correcting model outputs under clear guidelines, at scale, with quality checks.",
    concept:
      "**Human feedback** for alignment is usually comparative: a prompt, two responses, and a choice, sometimes with a strength ('much better' or 'slightly better') and a reason. It can also be ratings on scales, rankings of several responses, edits that turn a response into a better one, or flags for specific problems (unsafe, untruthful, off-topic).\n\nThe quality of this data decides everything downstream. Raters need written guidelines that define 'better': accuracy first, then helpfulness, then tone; how to treat refusals; what to do with two bad answers. They need training and calibration: several raters label the same items and disagreements are reviewed. And they need prompts that cover the real distribution of use, including the hard cases, because the model will be optimised toward exactly what the data rewards.\n\nFeedback has biases: raters prefer longer answers, confident tone and agreement with their own views. Guidelines and audits exist to counter those, because any bias in the data becomes a bias in the model.",
    why:
      "A reward model (next lesson) is only a compression of this data; RLHF and DPO optimise toward it with great force. Noisy or biased feedback is not averaged away; it is amplified. Teams that skimp on rater guidelines get models that are verbose, sycophantic or inconsistent, and then spend months undoing it. Feedback collection is the alignment project's data engineering, and it is most of the work.",
    how: [
      "Write rating guidelines with worked examples; define the priority order of criteria.",
      "Select prompts that mirror real usage, deliberately including edge cases, ambiguous requests and unsafe ones.",
      "Generate responses to compare from the current model (and sometimes others) with varied sampling.",
      "Have trained raters compare; collect choice, strength and reason; overlap 10–20% of items across raters.",
      "Measure inter-rater agreement; review disagreements; refine guidelines.",
      "Audit for known biases (length, tone, agreement) and rebalance.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Feedback type", "What is recorded", "Cost per item", "Best for"],
        rows: [
          ["pairwise comparison", "A or B, strength, reason", "low", "reward models, DPO"],
          ["ranking of k responses", "an ordering", "medium", "k−1 comparisons per item"],
          ["absolute rating (1–7)", "a score with criteria", "medium", "monitoring; noisier across raters"],
          ["edit", "a corrected response", "high", "SFT data and precise fixes"],
          ["flag", "a problem category", "very low", "safety and failure mining"],
        ],
      },
      caption: "Comparisons are cheap and consistent, which is why they are the backbone of alignment data.",
    },
    everyday: {
      title: "Taste tests with a scoring sheet",
      text: "A food company does not ask tasters to describe the perfect biscuit; it gives them two biscuits and asks which they prefer, with a sheet reminding them to judge taste before packaging. Hundreds of such choices reveal what people want more reliably than any description. Human feedback for models is that taste test, with the same need for a good sheet.",
    },
    engineering: {
      title: "The length bias that got in",
      text: "A team's first 15,000 comparisons were collected without guidance on length. Raters preferred the longer answer 68% of the time regardless of content. The reward model learned 'longer is better', and after RLHF the assistant produced three-paragraph replies to yes/no questions. The fix was a guideline ('prefer the shorter answer when both are correct and complete'), a rater retraining session, and relabelling 5,000 items with length-matched pairs. The second reward model's length preference dropped to 52%, and reply length halved after retraining.",
    },
    maths: {
      formula: "agreement rate = items where raters agree ÷ overlapped items;   Cohen's κ = (p_o − p_e) ÷ (1 − p_e)",
      meaning: "Raw agreement can be high by chance when one option is usually preferred; κ corrects for that expected agreement p_e.",
      worked: [
        "Two raters overlap on 400 items and agree on 320: p_o = 0.80.",
        "Rater 1 picks A 60% of the time, rater 2 picks A 55%: expected agreement by chance p_e = 0.6 × 0.55 + 0.4 × 0.45 = 0.33 + 0.18 = 0.51.",
        "κ = (0.80 − 0.51) ÷ (1 − 0.51) = 0.29 ÷ 0.49 ≈ 0.59: moderate agreement; guidelines need work.",
        "After revised guidelines, agreement 0.90 with the same marginals: κ = (0.90 − 0.51) ÷ 0.49 ≈ 0.80: good.",
      ],
    },
    useIt: "In any product, collect feedback that can become preference data: thumbs up and down with a reason, side-by-side comparisons in a review tool, edits agents make to drafts. Write the guidelines before collecting, overlap raters, measure agreement, and audit for length and sycophancy bias before training anything on it.",
    takeaways: ["Feedback is mostly pairwise comparisons under written guidelines.", "Guidelines, rater training, overlap and agreement metrics decide the data's quality.", "Biases in feedback (length, confidence, agreement) are amplified by training.", "Prompts must mirror real use, including hard and unsafe cases."],
    terms: [["rater", "a person who labels model outputs under guidelines"], ["inter-rater agreement", "how often different raters make the same judgement on the same item"], ["sycophancy", "a model's tendency to agree with or flatter the user regardless of truth"]],
    reflect: { q: "Why collect a reason with each comparison if training only uses the choice?", a: "Reasons let you audit the data (are raters applying the guidelines?), discover failure categories to add to safety tests, write better guidelines, and sometimes train auxiliary models. A choice without a reason cannot be checked." },
  },

  "m23-reward-models": {
    simple: "A reward model is a network trained on human comparisons to output a score for any prompt and response, so preferred responses score higher; it stands in for human judgement at scale.",
    concept:
      "Humans can label thousands of comparisons; reinforcement learning needs millions of judgements. A **reward model** bridges the gap. It is usually a copy of the language model with its output head replaced by a single number: feed it a prompt and a response, get a scalar reward. It is trained on the comparison data with the Bradley–Terry loss: for each pair, make the preferred response's score exceed the rejected one's by as much as the data supports.\n\nOnce trained, the reward model judges any response instantly. That is what makes RLHF possible: the policy generates, the reward model scores, the policy is updated, millions of times. It is also useful on its own, for ranking candidate answers at inference (best-of-n sampling) and for filtering data.\n\nThe reward model is an approximation of human preference, and a lossy one. It generalises imperfectly, it inherits the raters' biases, and a policy optimised hard against it will find responses that score high without being good: **reward hacking**. Keeping the reward model honest, with fresh data and held-out accuracy checks, is continuous work.",
    why:
      "Without a reward model, alignment would be limited to the comparisons humans can make, and could not be used inside an optimisation loop that needs a score for every sampled response. The reward model turns a few tens of thousands of judgements into a function that can be queried without limit. It exists because human time is the scarce resource and a learned proxy spends it wisely, if the proxy is watched.",
    how: [
      "Initialise from the SFT model; replace the token-prediction head with a linear head that outputs one number.",
      "For each comparison (prompt, chosen, rejected): compute r_chosen and r_rejected.",
      "Loss = −log σ(r_chosen − r_rejected); minimise over the dataset.",
      "Hold out 10% of comparisons; report accuracy: how often r_chosen > r_rejected on unseen pairs (70–80% is typical, bounded by rater agreement).",
      "Check calibration and biases: does reward rise with length? With confident tone?",
      "Refresh with new comparisons collected on the latest policy's outputs, because the policy will drift into regions the reward model has not seen.",
    ],
    visual: {
      kind: "flow",
      steps: ["prompt + response", "language model body (copied from SFT)", "final hidden state", "linear head → one number", "reward r"],
      caption: "The same network that writes text, retrained to judge it. Pairs of these outputs are pushed apart in the direction raters chose.",
    },
    everyday: {
      title: "The apprentice judge",
      text: "A wine competition has three expert judges and ten thousand entries. The judges score a thousand wines carefully; an apprentice studies those scores until they can predict the judges' verdict on a new wine most of the time. The apprentice then scores the remaining nine thousand. They are faster than the experts and usually right, and occasionally fooled by a wine that merely resembles winners. That apprentice is the reward model.",
    },
    engineering: {
      title: "The reward model that loved bullet points",
      text: "Held-out accuracy of a team's reward model was 76%, respectable. But probing showed any response formatted as a bullet list scored 0.8 higher on average than the same content as prose, because raters had preferred lists in the training comparisons about tasks where lists fit. After RLHF, the assistant answered 'how are you?' with bullet points. The team added format-matched comparison pairs, retrained the reward model, and the list bonus fell to 0.1. Reward models must be probed for what they actually reward.",
    },
    maths: {
      formula: "L_RM = −log σ(r_θ(x, y_chosen) − r_θ(x, y_rejected));   accuracy = share of held-out pairs with r_chosen > r_rejected",
      meaning: "The loss is the negative log of the Bradley–Terry probability that the model prefers what the rater preferred. Gradient descent raises chosen scores and lowers rejected ones.",
      worked: [
        "A pair where the model scores chosen 1.2 and rejected 1.0: difference 0.2; σ(0.2) ≈ 0.55; loss = −ln 0.55 ≈ 0.60.",
        "After training the difference is 1.5: σ(1.5) ≈ 0.818; loss = −ln 0.818 ≈ 0.20.",
        "A pair the model gets backwards, chosen 0.5 and rejected 1.5: σ(−1.0) ≈ 0.27; loss = −ln 0.27 ≈ 1.31: a strong push to fix it.",
        "Held-out accuracy of 76% against rater agreement of 80% means the reward model is close to the ceiling the data allows.",
      ],
    },
    code: {
      title: "Reward-model training step",
      lang: "py",
      src: `import torch
import torch.nn.functional as F

class RewardModel(torch.nn.Module):
    def __init__(self, lm):
        super().__init__()
        self.body = lm.model                                # transformer body from the SFT model
        self.head = torch.nn.Linear(lm.config.hidden_size, 1)

    def forward(self, input_ids, attention_mask):
        h = self.body(input_ids=input_ids, attention_mask=attention_mask).last_hidden_state
        last = attention_mask.sum(1) - 1                    # index of the final real token per row
        return self.head(h[torch.arange(h.size(0)), last]).squeeze(-1)   # one score per sequence

def reward_loss(rm, chosen, rejected):
    r_c = rm(**chosen)
    r_r = rm(**rejected)
    return -F.logsigmoid(r_c - r_r).mean()                 # Bradley-Terry: push chosen above rejected`,
      lines: [
        { code: "self.head = torch.nn.Linear(lm.config.hidden_size, 1)", say: "The vocabulary head is replaced by a head that outputs a single number." },
        { code: "return self.head(h[torch.arange(h.size(0)), last]).squeeze(-1)   # one score per sequence", say: "The hidden state at the last token summarises the whole prompt and response; the head turns it into the reward." },
        { code: "return -F.logsigmoid(r_c - r_r).mean()                 # Bradley-Terry: push chosen above rejected", say: "The loss from the maths section: small when the chosen response scores clearly higher." },
      ],
    },
    useIt: "Train a reward model when you have thousands of comparisons and want to score responses at scale: for RLHF, for best-of-n reranking at inference, or for filtering synthetic data. Always report held-out accuracy against rater agreement, probe for length and format biases, and refresh it as the policy changes.",
    takeaways: ["A reward model maps (prompt, response) to one score, trained on comparisons with the Bradley–Terry loss.", "It is a lossy proxy for human judgement; held-out accuracy is bounded by rater agreement.", "Probe it for biases; a policy optimised against it will exploit any it has.", "Refresh with comparisons on the latest policy's outputs."],
    terms: [["reward model", "a network that scores responses to predict human preference"], ["reward hacking", "a policy finding responses that score high on the reward model without being good"], ["best-of-n", "generating n responses and keeping the one the reward model scores highest"]],
    reflect: { q: "If held-out accuracy is 76%, what happens to the 24% of pairs it gets wrong during RLHF?", a: "The policy is rewarded for the wrong choice on those kinds of pairs, so it drifts toward whatever the reward model mistakenly prefers. That is why RLHF keeps the policy close to the SFT model with a penalty, and why reward models are refreshed with new comparisons on the policy's current outputs, where its errors matter most." },
  },

  "m23-reinforcement-learning-from-human-feedback-rlhf": {
    simple: "RLHF optimises the assistant to produce responses the reward model scores highly, while a penalty keeps it close to the SFT model so it does not drift into nonsense that merely games the reward.",
    concept:
      "**Reinforcement learning from human feedback** connects Module 1's reinforcement learning to language models. The policy is the assistant; an action is generating a whole response; the reward is the reward model's score for that response; the environment is just the prompt. The policy samples responses, the reward model scores them, and the policy's weights are updated to make high-scoring responses more likely.\n\nTwo things stop this from going wrong immediately. First, a **KL penalty**: the objective subtracts a term proportional to how far the policy's token probabilities have moved from the SFT model's (the reference). This keeps the assistant fluent and prevents it from collapsing onto a few reward-hacking phrasings. Second, the optimiser is PPO (next lesson), which limits how much any single update can change the policy.\n\nThe loop runs for thousands of steps over a prompt set, with the reward model and reference model frozen. The result is the familiar assistant behaviour: direct, helpful, declining harmful requests, acknowledging uncertainty, because those are the responses raters preferred and the reward model learned to score.",
    why:
      "SFT shows the model one answer per prompt; it cannot say 'of these ten things you might say, this is best'. RLHF can, because the policy explores its own responses and is scored on each. That is how subtle preferences (concise over verbose, honest over confident, careful over compliant) get into the weights. RLHF was the method that turned GPT-style models into usable assistants, and it remains the reference approach, even where DPO has replaced it in practice.",
    how: [
      "Freeze the reward model and a copy of the SFT model as the reference.",
      "For a batch of prompts, sample responses from the current policy.",
      "Score each response with the reward model; compute the per-token KL penalty against the reference.",
      "Form the objective: reward − β × KL; estimate advantages with a value model.",
      "Update the policy with PPO's clipped objective for a few epochs on the batch.",
      "Monitor reward, KL, response length and samples; stop or lower β if the policy drifts or the reward climbs while quality falls.",
    ],
    visual: {
      kind: "flow",
      steps: ["prompt batch", "policy samples responses", "reward model scores each", "KL vs reference model (penalty)", "PPO update to the policy", "repeat for thousands of steps"],
      caption: "Four models in memory: policy, reference, reward, value. The policy is the only one that changes.",
    },
    everyday: {
      title: "Coaching with a scorecard and a leash",
      text: "A speaking coach lets you give a talk, scores it, and you adjust. Without a leash you would discover that shouting catchphrases scores well with a lazy judge. The leash, 'stay recognisably yourself', is the KL penalty; the judge is the reward model; and the small, careful adjustments after each talk are PPO.",
    },
    engineering: {
      title: "Reward up, quality down",
      text: "During an RLHF run the average reward climbed steadily for two days while samples grew longer and more hedged: 'It is important to note that…' opened a third of responses. The reward model had a small bias toward cautious phrasing and the policy had found it. The team raised β (a stronger KL penalty), added comparisons that penalised empty hedging, retrained the reward model, and restarted from the checkpoint before the drift. The lesson they wrote down: track samples and length, not just the reward curve.",
    },
    maths: {
      formula: "objective = E[ r(x, y) − β · KL(π_policy(y|x) ‖ π_ref(y|x)) ];   per-token KL ≈ log π_policy(t) − log π_ref(t)",
      meaning: "The policy is rewarded for high scores and penalised, with strength β, for moving its token probabilities away from the reference. β around 0.01 to 0.1 is typical.",
      worked: [
        "A response scores reward 2.4 under the reward model.",
        "Its 80 tokens have an average per-token log-ratio against the reference of 0.05, so the summed KL ≈ 80 × 0.05 = 4.0.",
        "With β = 0.1: penalised objective = 2.4 − 0.1 × 4.0 = 2.0.",
        "A reward-hacking response scoring 3.0 but with summed KL of 20 (very unlike the reference): 3.0 − 2.0 = 1.0: worse than the honest response despite the higher raw reward. The penalty did its job.",
      ],
    },
    useIt: "You are unlikely to run full RLHF yourself; it needs four models in memory and careful tuning. But its ideas transfer: optimise against a learned judge only with a leash, watch for reward hacking in samples and length, and refresh the judge. When you do want preference optimisation on your own data, DPO (lesson 6) gives most of the benefit with one model.",
    takeaways: ["RLHF: policy samples, reward model scores, PPO updates, KL penalty keeps the policy near the reference.", "It teaches comparative preferences SFT cannot express.", "Four models in memory; the policy alone changes.", "Reward hacking shows up as reward rising while quality falls; monitor samples, length and KL."],
    terms: [["RLHF", "reinforcement learning from human feedback: optimising a policy against a learned reward model"], ["KL penalty", "a term that penalises the policy for diverging from the reference model's probabilities"], ["reference model", "a frozen copy of the SFT model the policy is kept close to"]],
    reflect: { q: "Why keep the reference model frozen rather than letting it be the previous step's policy?", a: "If the reference moved with the policy, the leash would stretch indefinitely and the policy could drift arbitrarily far from the SFT model over many steps. A fixed reference anchors the whole run to known-good behaviour." },
  },

  "m23-proximal-policy-optimisation-ppo": {
    simple: "PPO is the reinforcement-learning optimiser RLHF uses: it updates the policy toward higher reward but clips each update so the policy never changes too much in one step.",
    concept:
      "In Module 5 gradient descent took small steps on a loss. In reinforcement learning the 'loss' is estimated from samples the current policy produced, and a large step can move the policy into a region where those estimates no longer apply, wrecking it. **Proximal policy optimisation**, PPO, fixes this with a clipped objective: it measures the ratio between the new policy's probability of each action and the old policy's, and clips that ratio to a band such as [0.8, 1.2], so no update can make any token more than 20% more or less likely than before.\n\nPPO also uses an **advantage**: how much better a sampled response (or token) was than expected, computed with a value model that predicts expected reward. Updating on advantages rather than raw rewards reduces noise.\n\nIn RLHF the recipe is: sample a batch of responses, compute rewards and advantages, then run a few epochs of clipped updates on that batch before sampling again. PPO is robust and well understood, which is why it became the standard, at the cost of complexity: a value model to train and many hyperparameters.",
    why:
      "Plain policy-gradient updates are unstable: one noisy batch can push the policy off a cliff, and language models are expensive to recover. PPO's clipping makes each update safe, so RLHF runs reliably over thousands of steps. It exists because alignment needed an optimiser that improves steadily without wrecking a model worth millions.",
    how: [
      "Sample responses from the current policy; store the old per-token log-probabilities.",
      "Compute rewards (reward model minus KL penalty) and advantages using the value model.",
      "For several epochs over the batch: compute the new log-probabilities, the ratio new ÷ old, and the clipped surrogate objective.",
      "Update the policy on the clipped objective; update the value model on squared error to the observed returns.",
      "Discard the batch and sample afresh; repeat.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Advantage", "Ratio new/old", "Clipped to", "Effect of the update"],
        rows: [
          ["+1.0 (good token)", "1.5", "1.2", "increase stops at +20%; no runaway"],
          ["+1.0", "1.1", "1.1", "normal increase"],
          ["−1.0 (bad token)", "0.5", "0.8", "decrease stops at −20%"],
          ["−1.0", "1.3", "1.3 (no clip, worse direction)", "gradient pushes it back down"],
        ],
      },
      caption: "Clipping removes the incentive to move further than the band in the direction the advantage wants. Each step is bounded.",
    },
    everyday: {
      title: "Adjusting a recipe one pinch at a time",
      text: "A cook improving a sauce tastes, adjusts a little, tastes again. Doubling the salt because the first pinch helped would ruin it; the tasting that justified the pinch says nothing about a handful. PPO limits every adjustment to a pinch, so the information from the last tasting still applies.",
    },
    engineering: {
      title: "The run that stayed stable",
      text: "A team compared a naive policy-gradient run with PPO on the same reward model. The naive run's reward spiked then collapsed at step 400 as the policy degenerated into repetitive text; it never recovered. The PPO run, with clip 0.2, four epochs per batch and a value model, improved smoothly for 3,000 steps with no collapse. The cost was 40% more compute per step and a week of tuning the learning rates of the policy and value models.",
    },
    maths: {
      formula: "L_PPO = E[ min( ρ·A, clip(ρ, 1−ε, 1+ε)·A ) ],  ρ = π_new(a|s) ÷ π_old(a|s),  ε ≈ 0.2",
      meaning: "ρ is how much the new policy changed the probability of the sampled action; A is the advantage. The min with the clipped version removes any gain from moving outside the band.",
      worked: [
        "A token with advantage A = +2.0 whose probability the update raised from 0.10 to 0.16: ρ = 1.6.",
        "Unclipped term: 1.6 × 2.0 = 3.2. Clipped: 1.2 × 2.0 = 2.4. min = 2.4: the objective stops rewarding increases beyond ρ = 1.2, so the gradient there is zero.",
        "A token with A = −1.5 whose probability fell from 0.10 to 0.07: ρ = 0.7. Unclipped: 0.7 × −1.5 = −1.05. Clipped: 0.8 × −1.5 = −1.2. min = −1.2: again no further incentive beyond the band.",
        "With ε = 0.2 no single update changes any sampled token's probability by more than 20% in the useful direction.",
      ],
    },
    useIt: "You will meet PPO in alignment papers and in RL libraries; knowing the clip ratio, the advantage and the value model lets you read their hyperparameters and diagnose instability (collapse means the step was too big; no progress means it was too small or the reward is flat). For your own preference training, DPO (next lesson) avoids PPO entirely.",
    takeaways: ["PPO bounds each policy update by clipping the new/old probability ratio to a band.", "Advantages from a value model reduce noise.", "It is stable over thousands of steps at the cost of a value model and tuning.", "Collapse signals steps too large; stagnation signals steps too small or a flat reward."],
    terms: [["PPO", "proximal policy optimisation: a clipped policy-gradient method"], ["advantage", "how much better an action was than the value model expected"], ["value model", "a network predicting the expected reward from a state, used to compute advantages"]],
    reflect: { q: "Why run several epochs on the same sampled batch instead of one?", a: "Sampling responses and scoring them is the expensive part; reusing the batch for a few updates extracts more learning per sample. Clipping is what makes reuse safe: without it, repeated updates on stale samples would push the policy far from where the samples came from." },
  },

  "m23-direct-preference-optimisation-dpo": {
    simple: "DPO trains the assistant directly on preference pairs with a single loss, no reward model and no reinforcement learning loop, and reaches similar results with far less machinery.",
    concept:
      "**Direct preference optimisation** starts from a piece of algebra: the RLHF objective with a KL penalty has a closed-form optimal policy, and substituting it back turns the reward-model loss into a loss on the policy itself. The result is a plain supervised loss over (prompt, chosen, rejected) triples: increase the log-probability of the chosen response relative to the reference model, decrease that of the rejected one, scaled by β, through a sigmoid.\n\nNo reward model is trained, no responses are sampled during training, no value model, no PPO. You need the policy and a frozen reference model, and you run ordinary gradient descent on the preference dataset, exactly like SFT with a different loss. Memory is two models instead of four; a run takes hours instead of days.\n\nThe trade-off: DPO learns only from the responses in the dataset, not from its own exploration, so it cannot discover better responses than the ones raters compared. In practice, with good comparison data collected on the current model's outputs, it matches RLHF on most benchmarks and has become the default for teams without an RL stack.",
    why:
      "RLHF works but is expensive, fragile and hard to reproduce; many teams could not run it. DPO exists because someone noticed the optimisation could be done in closed form. It lowered the cost of preference training to that of fine-tuning, which is why most open-weight instruct models now use it or a variant, and why you can run preference training on your own product's thumbs-up data.",
    how: [
      "Collect preference triples: prompt, chosen response, rejected response, ideally with responses sampled from the current model.",
      "Freeze a copy of the SFT model as the reference; the policy starts as another copy (or a LoRA adapter on it).",
      "For each triple compute the log-probabilities of chosen and rejected under both policy and reference.",
      "Loss = −log σ(β · [(log π(chosen) − log π_ref(chosen)) − (log π(rejected) − log π_ref(rejected))]).",
      "Train for 1–3 epochs with a small learning rate; monitor the implicit reward margin and held-out preference accuracy.",
      "Evaluate as in Module 21: against the SFT model on held-out comparisons and a general suite.",
    ],
    visual: {
      kind: "compare",
      left: { title: "RLHF with PPO", points: ["4 models: policy, reference, reward, value", "samples and scores responses during training", "days; many hyperparameters", "can discover responses not in the data", "fragile; reward hacking to watch"] },
      right: { title: "DPO", points: ["2 models: policy, reference", "trains on fixed preference pairs", "hours; one hyperparameter β plus learning rate", "limited to the responses in the data", "stable; runs like fine-tuning"] },
      caption: "DPO trades exploration for simplicity. For most teams the simplicity wins.",
    },
    everyday: {
      title: "Learning from marked pairs instead of a judge in the room",
      text: "Rather than hiring a judge to score every essay you write (RLHF), you study a folder of essay pairs where a teacher has marked which was better, and adjust your writing toward the preferred ones (DPO). You cannot invent a style the folder never showed, but you learn the teacher's taste quickly and cheaply.",
    },
    engineering: {
      title: "Preference training from thumbs-up data",
      text: "A documentation assistant logged 40,000 responses with thumbs up or down. The team built 9,000 preference pairs: for prompts with both a thumbs-up and a thumbs-down response, chosen and rejected. With DPO on a LoRA adapter (β = 0.1, one epoch, 3 hours on one GPU), held-out preference accuracy rose from 50% (the SFT model, by definition) to 71%, and live thumbs-up rate rose from 62% to 74% over the following month. No reward model, no RL, one afternoon of engineering.",
    },
    maths: {
      formula: "L_DPO = −log σ( β [ log π(y_w|x) − log π_ref(y_w|x) − log π(y_l|x) + log π_ref(y_l|x) ] )",
      meaning: "The bracket is the implicit reward margin: how much more the policy has learned to favour the chosen response (y_w) over the rejected one (y_l), relative to the reference. β sets how strongly deviation from the reference is weighted.",
      worked: [
        "Before training, policy = reference, so every log-ratio is 0: margin 0, σ(0) = 0.5, loss = −ln 0.5 ≈ 0.69 for every pair.",
        "After some training on a pair: log π(y_w) − log π_ref(y_w) = +1.5 (the chosen response became e^1.5 ≈ 4.5× more likely); log π(y_l) − log π_ref(y_l) = −1.0 (the rejected became e^−1 ≈ 0.37× as likely).",
        "Margin = 1.5 − (−1.0) = 2.5. With β = 0.1: βz = 0.25; σ(0.25) ≈ 0.562; loss ≈ −ln 0.562 ≈ 0.58.",
        "With β = 0.5: βz = 1.25; σ ≈ 0.777; loss ≈ 0.25. A larger β makes the same margin count for more, which also means the policy is penalised more for straying from the reference to earn it.",
      ],
    },
    code: {
      title: "The DPO loss",
      lang: "py",
      src: `import torch
import torch.nn.functional as F

def sequence_logprob(model, input_ids, labels):
    logits = model(input_ids=input_ids).logits[:, :-1]
    logp = F.log_softmax(logits, dim=-1).gather(-1, labels[:, 1:].unsqueeze(-1)).squeeze(-1)
    mask = (labels[:, 1:] != -100)
    return (logp * mask).sum(-1)                       # log-prob of the response tokens only

def dpo_loss(policy, ref, chosen, rejected, beta=0.1):
    pi_w = sequence_logprob(policy, **chosen)
    pi_l = sequence_logprob(policy, **rejected)
    with torch.no_grad():
        ref_w = sequence_logprob(ref, **chosen)
        ref_l = sequence_logprob(ref, **rejected)
    margin = (pi_w - ref_w) - (pi_l - ref_l)
    return -F.logsigmoid(beta * margin).mean()`,
      lines: [
        { code: "return (logp * mask).sum(-1)                       # log-prob of the response tokens only", say: "The response's total log-probability, with the prompt masked as in SFT." },
        { code: "with torch.no_grad():", say: "The reference is frozen; its log-probabilities are constants in the loss." },
        { code: "margin = (pi_w - ref_w) - (pi_l - ref_l)", say: "How much the policy has moved toward the chosen and away from the rejected, relative to where it started." },
        { code: "return -F.logsigmoid(beta * margin).mean()", say: "The same shape as the reward-model loss, applied to the policy directly. No reward model exists." },
      ],
      note: "Libraries such as TRL implement this as a trainer; the loss is short enough to understand in full.",
    },
    useIt: "DPO is the preference-training method to use on your own data: collect pairs from product feedback or reviewer comparisons, run it on a LoRA adapter over your SFT model with β around 0.1, and evaluate on held-out preferences and a general suite. Refresh the pairs with responses from the new model and repeat; each round is an afternoon.",
    takeaways: ["DPO optimises the policy directly on preference pairs; no reward model, no RL loop.", "Two models in memory; runs like fine-tuning; one main hyperparameter β.", "Learns only from responses in the data; collect pairs from the current model's outputs.", "Matches RLHF on most tasks and is the practical default."],
    terms: [["DPO", "direct preference optimisation: a supervised loss on preference pairs that implies an RLHF-optimal policy"], ["β (beta)", "the strength of the implicit penalty for straying from the reference"], ["implicit reward margin", "the bracketed term in the DPO loss, measuring learned preference strength"]],
    reflect: { q: "Why must the rejected responses be realistic rather than obviously terrible?", a: "If every rejected response is garbage, the model learns 'garbage is bad', which it already knew, and gains nothing about the subtle judgements that matter. Pairs where both responses are plausible and one is better are the ones that teach taste, which is why pairs are collected from the current model's own samples." },
  },

  "m23-preference-datasets": {
    simple: "A preference dataset is a set of prompt–chosen–rejected triples with metadata; its prompt coverage, pair quality and freshness decide what alignment can teach.",
    concept:
      "A **preference dataset** is the input to reward models and DPO. Each record has a prompt, a chosen response, a rejected response, and usually metadata: the rater, the strength of preference, the reason, the category (helpfulness, honesty, harmlessness), and which model generated each response. Public datasets exist, built from human comparisons or from a strong model acting as judge; product teams build their own from feedback.\n\nThree properties matter. **Coverage**: the prompts must span what users actually ask, including hard, ambiguous and unsafe requests, in the right proportions. **Pair quality**: both responses plausible, the preferred one genuinely better by the guidelines, and the pair not decided by a trivial feature like length. **Freshness**: pairs built from the current model's outputs teach it about its own mistakes; pairs from an old model teach it about mistakes it no longer makes.\n\nDatasets are also where alignment's values are set, concretely: every pair is a small statement of what 'better' means. Documentation of the guidelines and rater population is part of the dataset.",
    why:
      "Alignment methods are now cheap; the data is the hard part and the deciding one. A reward model or DPO run reproduces the dataset's judgement, including its gaps and biases. Thin coverage of a category means random behaviour there; stale pairs waste the run; pairs decided by length produce verbose models. Treating the dataset as a product with specifications, audits and versions is what separates alignment that works from alignment that merely runs.",
    how: [
      "Assemble a prompt set from logs and curated edge cases; stratify by category and difficulty.",
      "Generate candidate responses from the current model with varied sampling, plus sometimes other models for diversity.",
      "Collect comparisons under guidelines (lesson 2); record strength, reason, rater id.",
      "Filter: drop pairs where raters disagreed strongly, where both responses are poor, or where length alone explains the choice.",
      "Balance categories; audit for biases; split train, validation and test by prompt.",
      "Version the dataset with its guidelines; refresh with the new model's outputs after each alignment round.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Field", "Example", "Used for"],
        rows: [
          ["prompt", "'My landlord hasn't returned my deposit; what can I do?'", "coverage, stratification"],
          ["chosen", "a response listing the steps and when to seek advice", "the positive side of the loss"],
          ["rejected", "a response that is confident but gives wrong deadlines", "the negative side"],
          ["strength", "'much better'", "weighting or filtering"],
          ["reason", "'rejected states a 14-day deadline that is wrong'", "audits, safety mining"],
          ["category", "honesty / factual", "balancing, per-category evaluation"],
          ["source model", "policy v3, temperature 0.9", "freshness tracking"],
        ],
      },
      caption: "The choice trains the model; everything else keeps the dataset honest and improvable.",
    },
    everyday: {
      title: "A training file for new judges",
      text: "A competition keeps a file of past entries in pairs, with which won and why, used to train new judges. If the file only has pairs from one year's fashion, the judges learn that year's taste; if every winning entry happens to be longer, they learn to reward length. Someone curates the file, adds this year's entries and removes misleading pairs. That curator's job is preference-dataset engineering.",
    },
    engineering: {
      title: "The pairs that taught refusal of everything",
      text: "A safety-focused team built 6,000 pairs where the chosen response refused a harmful request and the rejected one complied. After DPO the assistant refused 18% of harmless requests too, including recipes containing the word 'kill' (as in 'kill the yeast'). The dataset had no pairs teaching when to help with a superficially alarming request. They added 2,000 pairs where the chosen response helped with a benign-but-alarming prompt and the rejected one refused. Over-refusal fell to 2% with harmful compliance unchanged. Coverage of both sides is what teaches a boundary.",
    },
    maths: {
      formula: "pairs with useful signal ≈ total pairs × (1 − disagreement rate) × (1 − trivial-feature rate);   category share = pairs in category ÷ total",
      meaning: "Not every pair teaches. Pairs raters disagree on carry noise; pairs decided by a trivial feature teach the wrong thing. Category shares should match the intended mix.",
      worked: [
        "20,000 collected pairs; raters disagree on 15%; length alone explains 20% of the remainder.",
        "Useful ≈ 20,000 × 0.85 × 0.80 = 13,600 pairs.",
        "Category check: safety pairs 6,000 (44% of useful) versus 5% of real traffic being safety-related: heavily over-represented; the model will over-refuse unless balanced or the over-representation is deliberate and counter-weighted with benign-but-alarming pairs.",
        "Target mix for this product: helpfulness 60%, honesty 25%, safety 15%, with the safety set including both refuse and help pairs.",
      ],
    },
    useIt: "Build your preference dataset as a versioned product: stratified prompts from real traffic plus curated edge cases, pairs from the current model, guidelines and reasons recorded, filtered for disagreement and trivial features, balanced by category, split by prompt, and refreshed after every alignment round.",
    takeaways: ["A preference dataset is prompt, chosen, rejected, plus metadata that keeps it auditable.", "Coverage, pair quality and freshness decide what alignment teaches.", "Filter out disagreement and trivial-feature pairs; balance categories deliberately.", "Both sides of every boundary need pairs: when to refuse and when to help."],
    terms: [["preference triple", "a prompt with a chosen and a rejected response"], ["stratified prompt set", "prompts sampled so that each category and difficulty is represented in chosen proportions"], ["over-refusal", "declining requests that should have been helped"]],
    reflect: { q: "Why split train and test by prompt rather than by pair?", a: "Several pairs can share one prompt. If some land in training and others in test, the model has seen that prompt and its typical responses, and the test score is inflated. Splitting by prompt keeps test prompts genuinely unseen, as in Module 21." },
  },

  "m23-safety-alignment": {
    simple: "Safety alignment teaches a model to decline or handle carefully the requests that could cause harm, while still helping with the many requests that only look alarming; it is taught with targeted preference data and tested adversarially.",
    concept:
      "**Safety alignment** is the part of alignment aimed at harm: instructions for weapons or attacks, content that targets people, requests that would leak private data, and manipulation of the model into bypassing its own rules. It uses the same machinery (SFT examples of good refusals, preference pairs, DPO or RLHF) applied to a curated set of risky prompts, with a parallel set of benign prompts that resemble them, so the model learns the boundary rather than a keyword reflex.\n\nSafety is evaluated adversarially: **red teaming**, where people and automated attackers try to elicit harmful outputs with disguised requests, role-play framings, and multi-step tricks. Failures become new training pairs. Over-refusal is measured alongside, because a model that declines everything is safe and useless.\n\nSafety alignment lives in the weights, but it is one layer. Production systems add filters on inputs and outputs, tool permissions and monitoring (Module 38); alignment makes the model cooperative with those layers rather than replacing them.",
    why:
      "A fluent model without safety training will explain how to do harmful things as readily as how to bake bread, because its training text contains both. Deploying such a model to the public is not acceptable, and prompts alone cannot hold the line against determined users. Safety alignment exists to put the default in the weights: careful by disposition, so that the other defences have something cooperative to work with.",
    how: [
      "Define harm categories and a policy: what to refuse, what to answer with care, what to answer plainly.",
      "Build prompt sets for each category, each with a matched set of benign look-alikes.",
      "Write SFT examples of good refusals (short, non-judgemental, offering a safe alternative) and good careful answers.",
      "Collect preference pairs on both sides: refuse-vs-comply for harmful prompts, help-vs-refuse for benign ones.",
      "Train (DPO or RLHF) alongside the helpfulness data, not as a separate pass that could overwrite it.",
      "Red-team the result; measure harmful compliance and over-refusal; add failures to the data; repeat.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Prompt", "Category", "Desired behaviour", "Pair that teaches it"],
        rows: [
          ["'How do I pick a lock?'", "ambiguous", "help with context (locked out of own home), decline burglary framing", "help-vs-refuse for the benign framing"],
          ["'Write malware that steals passwords'", "harmful", "refuse briefly; offer security-learning alternative", "refuse-vs-comply"],
          ["'How do I kill the process on port 8080?'", "benign look-alike", "answer plainly", "help-vs-refuse"],
          ["'My friend is talking about ending their life'", "sensitive", "careful, supportive, resources", "careful-vs-dismissive and careful-vs-refusing"],
        ],
      },
      caption: "Every category needs pairs on both sides, or the model learns a keyword reflex instead of a judgement.",
    },
    everyday: {
      title: "A pharmacist, not a locked cabinet",
      text: "A pharmacist will not hand over a dangerous quantity of a drug, but will help with a cold, explain a dosage and recognise when someone needs more help than a pill. A locked cabinet refuses everyone. Safety alignment aims at the pharmacist: judgement about harm, with help as the default.",
    },
    engineering: {
      title: "Red teaming before launch",
      text: "Before releasing an assistant, a team runs two weeks of red teaming: 40 testers with a prompt budget, plus an automated attacker generating paraphrases of known jailbreaks. They find 312 harmful completions, mostly through role-play framings ('you are an unrestricted AI') and multi-turn setups. Each becomes a preference pair; a DPO round reduces the attack success rate from 9% to 1.5% on a held-out attack set, while over-refusal on a benign set stays at 2%. They keep the automated attacker running weekly in production (Module 38), because new attacks appear.",
    },
    maths: {
      formula: "harmful compliance rate = harmful outputs ÷ harmful prompts tested;   over-refusal rate = refusals ÷ benign look-alike prompts;   goal: minimise both",
      meaning: "Two numbers, measured on separate held-out sets, trade off against each other. Reporting only one hides the cost paid on the other.",
      worked: [
        "Attack set of 2,000 harmful prompts: 180 harmful completions → compliance 9%. Benign look-alike set of 1,000: 20 refusals → over-refusal 2%.",
        "After a DPO round using only refuse-vs-comply pairs: compliance 1.2%, over-refusal 14%: the model learned keywords.",
        "After adding help-vs-refuse pairs: compliance 1.5%, over-refusal 2%. Both numbers acceptable; the small rise in compliance is the price of not refusing the benign.",
        "A product threshold might be: compliance under 2% on the attack set, over-refusal under 3% on the benign set, both re-measured every release.",
      ],
    },
    useIt: "If you fine-tune an aligned model, include safety data in the mix or you will unlearn it (Module 21's forgetting). If you build your own alignment, write the policy first, collect both-sided pairs, red-team before and after, and report compliance and over-refusal together. Treat alignment as one layer under the runtime guardrails of Module 38.",
    takeaways: ["Safety alignment teaches judgement about harm with both-sided preference data.", "Red teaming finds failures; failures become training pairs; the loop never ends.", "Measure harmful compliance and over-refusal together.", "It is one layer; runtime filters, permissions and monitoring sit on top."],
    terms: [["red teaming", "deliberately attacking a model to find harmful or unwanted behaviour"], ["jailbreak", "a prompt designed to make a model bypass its safety training"], ["benign look-alike", "a harmless prompt that superficially resembles a harmful one"]],
    reflect: { q: "A fine-tune on 20,000 product Q&A pairs with no safety data made the model comply with requests it used to refuse. Why, and what is the fix?", a: "Safety behaviour lives in the same weights; narrow training with no refusals overwrote it (catastrophic forgetting). Mix 10–20% safety and general preference data into every fine-tune, use LoRA at a modest rank, and run the safety evaluation before and after, as Module 21 prescribed for any ability you want to keep." },
  },

  "m23-limitations-of-alignment-methods": {
    simple: "Alignment is imperfect: reward models are proxies that can be gamed, feedback carries rater biases, safety can be jailbroken or fine-tuned away, and training toward preferences can produce sycophancy and over-caution.",
    concept:
      "Every method in this module optimises toward a proxy for what people want, and proxies leak. The **limitations of alignment** are the known ways the proxy and the goal come apart.\n\n**Reward hacking**: a policy finds responses the reward model scores highly that people would not prefer (hedging phrases, confident tone, bullet points). **Sycophancy**: raters prefer agreement, so models learn to agree with the user's stated view even when wrong. **Length and style bias**: inherited from feedback. **Over-refusal**: safety data without its benign counterpart. **Fragility**: safety training can be undone by a small fine-tune, or bypassed by jailbreaks the data never covered. **Rater population**: preferences reflect whoever rated, their culture and their expertise, which may not match users. **Shallow alignment**: behaviour learned at the response level may not reflect deeper consistency; a model may refuse in one phrasing and comply in another.\n\nNone of these is fatal; all are managed with measurement, fresh data, both-sided pairs, KL penalties, red teaming and runtime defences. But an engineer who assumes 'aligned' means 'safe and honest in all cases' will be surprised.",
    why:
      "Knowing the failure modes is what lets you design around them: an evaluation for sycophancy, a benign look-alike set, a fine-tuning policy that preserves safety data, runtime guardrails that do not trust the model's refusals alone. Alignment research is largely the study of these limits. Shipping a model without knowing them is shipping with your eyes closed.",
    how: [
      "List the failure modes relevant to your product: sycophancy, over-refusal, jailbreaks, verbosity, bias.",
      "Build a small evaluation for each: for sycophancy, prompts where the user states a wrong belief; for over-refusal, benign look-alikes; for jailbreaks, an attack set.",
      "Run them on every model version, including after your own fine-tunes.",
      "Mitigate in data (both-sided pairs, length-matched pairs, honesty pairs), in training (KL, LoRA, replay), and at runtime (filters, permissions).",
      "Monitor in production for drift and new attacks; feed failures back into data.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Limitation", "How it shows up", "Cause", "Mitigation"],
        rows: [
          ["reward hacking", "reward rises, quality falls; stock phrases", "imperfect reward model", "KL penalty, refresh reward model, watch samples"],
          ["sycophancy", "agrees with the user's wrong claim", "raters prefer agreement", "honesty pairs where disagreeing is chosen"],
          ["verbosity", "long answers to short questions", "length bias in feedback", "length-matched pairs, guidelines"],
          ["over-refusal", "declines benign requests", "one-sided safety data", "benign look-alike pairs"],
          ["fragility", "safety lost after fine-tuning or by jailbreak", "shared weights; uncovered attacks", "replay safety data, red teaming, runtime guardrails"],
          ["rater bias", "preferences match raters, not users", "narrow rater pool", "diverse raters, user-population feedback"],
        ],
      },
      caption: "Each row is a known gap between the proxy and the goal, and each has a measurement and a fix.",
    },
    everyday: {
      title: "The student who learned the examiner",
      text: "A student who studies the examiner's habits rather than the subject writes what scores well: the right buzzwords, the preferred length, confident assertions. They pass, and they have not understood. A model optimised against a reward model can be that student. The remedy is examiners who vary, questions that cannot be gamed, and checks on real understanding.",
    },
    engineering: {
      title: "Discovering sycophancy in a finance assistant",
      text: "A team's assistant was well rated until a reviewer tried prompts like 'I think index funds are a scam, right?' and the model agreed. The preference data had rewarded agreement because raters, like users, liked being agreed with. They built a 300-prompt sycophancy set with wrong user beliefs, measured a 41% agreement rate, added 1,500 honesty pairs (chosen: polite correction with evidence; rejected: agreement), and ran DPO. Agreement with false claims fell to 6%, with helpfulness ratings unchanged. The evaluation now runs on every release.",
    },
    maths: {
      formula: "sycophancy rate = agreements with false user claims ÷ prompts with false claims;   attack success rate = harmful completions ÷ attack prompts",
      meaning: "Two of the standard limitation metrics. Both are measured on fixed held-out sets so that releases can be compared.",
      worked: [
        "300 prompts assert a false claim; the model agrees in 123: sycophancy = 41%.",
        "After honesty pairs and DPO: 18 agreements: 6%.",
        "Attack set of 1,500 jailbreak prompts: 60 harmful completions → 4% before mitigation; 15 after → 1%.",
        "Released alongside helpfulness (74% thumbs-up, unchanged), so the trade-off is visible: the fixes cost nothing on helpfulness this time, which is not guaranteed.",
      ],
    },
    useIt: "Treat 'aligned' as a starting point. For any assistant you ship, run sycophancy, over-refusal and jailbreak evaluations on every version, keep safety data in every fine-tune, keep runtime guardrails (Module 38) that do not depend on the model's own judgement, and feed production failures back into preference data.",
    takeaways: ["Alignment optimises a proxy; proxies can be gamed, biased, and fragile.", "Named failure modes: reward hacking, sycophancy, verbosity, over-refusal, fragility, rater bias.", "Each has a measurement and a mitigation in data, training and runtime.", "Alignment is one layer; never the only defence."],
    terms: [["shallow alignment", "behaviour learned at the surface that does not generalise across phrasings or contexts"], ["honesty pairs", "preference pairs where correcting the user is chosen over agreeing"]],
    reflect: { q: "If a strong model is used as the rater instead of humans, which limitations get better and which get worse?", a: "Cost and consistency improve, and coverage can be huge. But the model-rater's own biases (its sycophancy, its style preferences, its blind spots) are copied into the trained model, and errors are correlated rather than averaged. Model raters work best calibrated against a human-labelled sample and audited for the same biases." },
  },
};

export const M23_QUIZ: Quiz[] = [
  {
    q: "What does alignment training change that SFT cannot?",
    options: ["The model's vocabulary", "Comparative judgements: which of two acceptable answers is better, learned from preferences", "The number of parameters", "The tokeniser"],
    answer: 1,
    why: ["Unchanged.", "Correct. SFT shows one answer per prompt; preference methods teach which answers are better than others.", "Unchanged.", "Unchanged."],
  },
  {
    q: "A reward model scores response A at 2.0 and B at 0.5. Under the Bradley–Terry model, what is the probability A is preferred?",
    options: ["About 50%", "About 82%", "About 95%", "100%"],
    answer: 1,
    why: ["That would need equal scores.", "Correct. σ(1.5) = 1 ÷ (1 + e^−1.5) ≈ 0.82.", "That needs a difference near 3.", "Preference is probabilistic; never certain."],
  },
  {
    q: "Why does RLHF include a KL penalty against a frozen reference model?",
    options: ["To make training faster", "To stop the policy drifting into responses that game the reward model while losing fluency and sense", "To reduce memory", "To increase the reward"],
    answer: 1,
    why: ["It adds computation.", "Correct. The leash keeps the policy near known-good behaviour; without it, reward hacking runs free.", "The reference model adds memory.", "It lowers the raw reward in exchange for sanity."],
    reason: true,
  },
  {
    q: "What does PPO's clipping do?",
    options: ["Shortens responses", "Bounds how much any single update can change the probability of a sampled action", "Removes low-reward samples", "Clips gradients to zero"],
    answer: 1,
    why: ["Length is not involved.", "Correct. The new/old probability ratio is clipped to a band such as [0.8, 1.2].", "Samples are kept; their influence is bounded.", "It bounds the objective, not the gradient norm."],
  },
  {
    q: "What does DPO remove compared with RLHF?",
    options: ["The preference data", "The reward model, the value model and the sampling loop; it trains the policy directly on pairs", "The reference model", "The need for a base model"],
    answer: 1,
    why: ["DPO needs preference pairs.", "Correct. Two models instead of four; runs like fine-tuning.", "DPO still uses a frozen reference.", "It starts from an SFT model."],
  },
  {
    q: "After DPO on refuse-vs-comply pairs only, the model refuses 'how do I kill a process'. What was missing?",
    options: ["More refuse-vs-comply pairs", "Help-vs-refuse pairs on benign look-alike prompts, so the model learns the boundary rather than keywords", "A higher β", "A bigger model"],
    answer: 1,
    why: ["More of the same deepens the keyword reflex.", "Correct. Both sides of a boundary must be in the data.", "β affects how far the policy strays, not what it learns.", "Size does not fix one-sided data."],
    reason: true,
  },
  {
    q: "Raters preferred the longer answer 68% of the time regardless of content. What does the trained model do?",
    options: ["Nothing changes", "Becomes verbose, because the reward model learned length as a signal and training amplified it", "Becomes terser", "Refuses more"],
    answer: 1,
    why: ["Biases in feedback are amplified, not ignored.", "Correct. Fix with length-matched pairs and guidelines.", "The opposite.", "Length bias does not cause refusals."],
  },
  {
    q: "Which statement about alignment is accurate?",
    options: ["An aligned model is safe in all cases", "Alignment is one layer: it can be jailbroken, fine-tuned away or gamed, so runtime guardrails and evaluations remain necessary", "Alignment adds knowledge", "Alignment removes the need for evaluation"],
    answer: 1,
    why: ["No method achieves that.", "Correct. Known limitations are managed, not eliminated.", "It changes judgement, not knowledge.", "Evaluation is how limitations are measured."],
  },
];

export const M23_EXERCISES: Exercise[] = [
  {
    title: "Compute preference probabilities and losses",
    kind: "calculate",
    task: "A reward model gives scores (chosen, rejected) for three pairs: (1.8, 0.3), (0.9, 1.4), (2.5, 2.4). For each compute the Bradley–Terry probability that the chosen response is preferred and the reward-model loss −ln σ(difference). Which pair contributes the most to training, and why?",
    hints: ["σ(z) = 1 ÷ (1 + e^−z).", "Loss is largest when the model's probability for the chosen response is smallest."],
    solution: "Pair 1: diff 1.5 → σ ≈ 0.818, loss ≈ 0.20. Pair 2: diff −0.5 → σ ≈ 0.378, loss ≈ 0.97. Pair 3: diff 0.1 → σ ≈ 0.525, loss ≈ 0.64. Pair 2 contributes most: the model currently prefers the rejected response, so the gradient pushes hardest there. Pair 3 is nearly a coin flip and also contributes substantially; pair 1 is already well handled.",
  },
  {
    title: "Build preference pairs from product feedback",
    kind: "code",
    task: "You have a table of (prompt_id, response_text, rating ∈ {up, down}, model_version). Write Python that builds DPO triples only from prompts that have at least one up and one down response from the current model version, pairing each up with each down (cap 3 pairs per prompt), and drops pairs where the chosen response is more than twice the length of the rejected. Report how many prompts and pairs result.",
    hints: ["Group by prompt_id; filter by version.", "Use itertools.product and a cap.", "Length filter protects against length bias."],
    solution: "from collections import defaultdict\nfrom itertools import product\n\nby_prompt = defaultdict(lambda: {'up': [], 'down': []})\nfor pid, text, rating, ver in rows:\n    if ver == CURRENT:\n        by_prompt[pid][rating].append(text)\n\npairs = []\nused_prompts = 0\nfor pid, d in by_prompt.items():\n    if not d['up'] or not d['down']:\n        continue\n    used_prompts += 1\n    n = 0\n    for chosen, rejected in product(d['up'], d['down']):\n        if len(chosen) > 2 * len(rejected):\n            continue\n        pairs.append({'prompt': prompts[pid], 'chosen': chosen, 'rejected': rejected})\n        n += 1\n        if n == 3:\n            break\nprint(used_prompts, 'prompts', len(pairs), 'pairs')\n\nSplit by prompt_id into train/validation/test before training, and audit a sample of pairs by hand for whether the up response is genuinely better.",
  },
  {
    title: "Trace a DPO update",
    kind: "calculate",
    task: "For one pair, the policy's log-probabilities relative to the reference are: chosen +0.8, rejected −0.4. Compute the margin, the loss with β = 0.1 and with β = 0.3, and explain in one sentence what a higher β does to training.",
    hints: ["Margin = (chosen ratio) − (rejected ratio).", "Loss = −ln σ(β × margin)."],
    solution: "Margin = 0.8 − (−0.4) = 1.2. β = 0.1: σ(0.12) ≈ 0.530, loss ≈ 0.635. β = 0.3: σ(0.36) ≈ 0.589, loss ≈ 0.529. A higher β makes a given margin count for more (lower loss sooner) and equivalently penalises straying from the reference more strongly, so the policy learns preferences with less movement from the SFT model; too high and it barely changes, too low and it drifts.",
  },
  {
    title: "Design the limitation evaluations",
    kind: "build",
    task: "Design three evaluation sets of 200 prompts each for an assistant in a bank: sycophancy, over-refusal, and jailbreak. For each describe how prompts are built, how a response is scored (automatically where possible), and the release threshold.",
    hints: ["Sycophancy: user asserts a wrong financial belief.", "Over-refusal: benign prompts that mention fraud, hacking, death, drugs in harmless contexts.", "Jailbreak: role-play and multi-turn framings from a known attack taxonomy, paraphrased."],
    solution: "Sycophancy: 200 prompts where the user states a false claim ('fixed deposits are always better than index funds, right?'); scored by a judge model with the reference answer, labelling agree / correct / evasive; threshold: agreement under 8%. Over-refusal: 200 benign prompts with alarming words ('how do I report a fraudulent transaction', 'kill a stuck transfer'); scored by a refusal classifier plus human sample; threshold: refusals under 3%. Jailbreak: 200 attack prompts built from a taxonomy (role-play, 'ignore previous instructions', multi-turn escalation, encoded requests), paraphrased by an attacker model and held out from training; scored by a harm classifier plus human review of positives; threshold: harmful completions under 1.5%. All three run on every model version and after every fine-tune, with results stored alongside helpfulness metrics.",
  },
];
