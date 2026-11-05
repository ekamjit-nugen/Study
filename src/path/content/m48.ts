import type { Exercise, LessonBody, Quiz } from "../types";

// Module 48: Multimodal AI. One concept per lesson.
// Keys are lesson slugs: m48-<kebab of the concept title in map.ts>.

export const M48_BODIES: Record<string, LessonBody> = {
  "m48-multimodal-ai": {
    simple: "Multimodal AI is a model that works with more than one kind of data at once, such as images and text, or audio and text, so it can see, hear and talk about the same thing.",
    concept:
      "Each kind of data is a **modality**: text, images, audio, video, sensor readings. For most of AI's history each modality had its own models, and they could not talk to each other. A caption model could describe a photo but could not answer a question about it; a speech model could transcribe but not understand.\n\n**Multimodal AI** means one system that takes several modalities in and reasons across them, and often produces several modalities out. You show it a photo of a rash and ask in words whether it looks like an allergy; it reads the pixels and the words together. You play it a recording of an engine and it writes a diagnosis.\n\nThe technical move that made this possible is the one from the previous module: turn every modality into vectors of the same shape, put them in one sequence, and let a transformer attend across all of them. Multimodal AI is less a new kind of model than a new kind of input.",
    why:
      "People do not communicate in one modality. A customer sends a photo with a sentence. A doctor looks at a scan and reads a history. A driver watches the road and hears a siren. Text-only systems forced everything through words, and much was lost in the translation: 'the thing on the left is broken' means nothing without the picture.\n\nMultimodal systems exist to work the way the world arrives: mixed. They also unlock data that was unusable before, such as the billions of images with captions and videos with subtitles, which serve as paired examples to learn from.",
    how: [
      "Choose an encoder per modality that turns raw data into vectors: patches for images, spectrogram frames for audio, token embeddings for text.",
      "Project each encoder's output into a shared vector size.",
      "Interleave the vectors into one sequence in the order the prompt gives, with markers between modalities.",
      "Run a transformer that attends across the whole sequence, so words can reference image regions and sounds.",
      "Decode the answer as text, or as tokens for an image or audio decoder when the output is not text.",
      "Train on paired and interleaved data so the model learns which image patches a word refers to.",
    ],
    visual: {
      kind: "tree",
      root: "One model, several senses",
      children: [
        { label: "inputs", children: ["text", "images and documents", "audio and speech", "video", "sensor streams"] },
        { label: "shared core", children: ["encoders → vectors of one size", "one sequence", "transformer attention across all"] },
        { label: "outputs", children: ["text answers", "images via a decoder", "speech via a decoder", "actions for a robot"] },
      ],
      caption: "Different senses in, one reasoning process, several kinds of output.",
    },
    everyday: {
      title: "Asking a friend about a plant",
      text: "You send a friend a photo and say 'the leaves have gone yellow, what did I do wrong?' Your friend looks and reads, and replies 'too much water, and move it out of the direct sun'. The question only makes sense with the photo; the photo only makes sense with the question. That is multimodal reasoning, and it is what the model does when it attends across the picture and the words together.",
    },
    engineering: {
      title: "A field-service assistant for engineers repairing turbines",
      text: "A wind-farm operator equips engineers with an assistant on a rugged tablet. The engineer photographs a gearbox, records the sound it makes, and asks what to check. The model reads the image for visible wear, the audio for bearing noise patterns, and the maintenance manual text retrieved for that turbine model, and answers with a checklist. The engineering work was in the data: the team collected 4,000 photo-plus-audio-plus-outcome records from past repairs and fine-tuned on them. The model's first version described images well but ignored audio; weighting the audio tokens in training fixed it.",
    },
    maths: {
      formula: "sequence length = Σ over modalities (tokens from that modality);   cost per layer ∝ (sequence length)²",
      meaning: "Modalities add to one sequence, so the expensive one dominates.",
      worked: [
        "A support request: 40 text tokens + one 336 × 336 photo at 576 tokens + a 5-second voice note at 125 tokens = 741 tokens.",
        "The photo is 78% of the sequence; the words that carry the question are 5%.",
        "Attention cost ∝ 741² ≈ 549,000 units; without the photo ∝ 165² ≈ 27,000. The picture costs twenty times the words.",
      ],
    },
    useIt: "Use multimodal models whenever the user's input naturally includes a picture, a document, a sound or a video: support with photos, document understanding, accessibility, inspection, meetings, robotics. Budget by tokens per modality, test each modality's contribution separately, and remember that the model describes what it sees; measurement and verification still need tools.",
    takeaways: ["A modality is a kind of data; multimodal AI handles several in one model.", "Encoders make every modality into same-shaped vectors in one sequence.", "Paired data (captions, transcripts) teaches the cross-modal connections.", "Images and audio dominate token counts and cost."],
    terms: [["modality", "one kind of data: text, image, audio, video, sensors"], ["encoder (modality)", "the network that turns one modality into vectors"], ["interleaved data", "documents where text and images alternate, used for training"]],
    reflect: { q: "A model answers questions about photos well but, when given a photo and an audio clip together, answers as if the audio were not there. What is the likely cause?", a: "Training imbalance: far more image–text pairs than audio–text pairs, so the model learned to attend to image tokens and treat audio tokens as noise. Fixes are more audio-paired data, upweighting audio examples, or an audio-specific pretraining stage before joint training." },
  },

  "m48-text-and-image-models": {
    simple: "Text-and-image models connect pictures and words in both directions: they can describe or answer questions about an image, and they can generate an image from a description.",
    concept:
      "There are two families of **text-and-image models**, and they do opposite jobs. The first reads: a vision-language model takes an image and text in and produces text out: captions, answers, extracted data. The second writes: a text-to-image model takes a description in and produces pixels out.\n\nBoth depend on the same foundation: a way to put images and words in a shared space. Contrastive training does this by showing the model millions of image–caption pairs and teaching an image encoder and a text encoder to produce vectors that are close for matching pairs and far for mismatched ones. Once that space exists, a reading model can attach the image encoder to a language model, and a generating model can use the text encoder to steer a diffusion model.\n\nThe two directions are increasingly joined in one model that can both read and draw, by letting the transformer output image tokens that a decoder renders.",
    why:
      "Language models could not see; image models could not explain. The products people wanted needed both: search a photo library by sentence, describe a scene for a blind user, extract a table from a scanned invoice, draw a storyboard from a script.\n\nText-and-image models exist because the web supplied the training data (images with captions and alt text) and contrastive learning supplied a way to align them cheaply, without anyone labelling what is where in an image.",
    how: [
      "Collect image–text pairs: captions, alt text, product photos with titles.",
      "Train an image encoder and a text encoder contrastively: pull matching pairs together, push non-matching apart.",
      "For reading: connect the image encoder to a language model with a projection; train on captioning and visual question answering so the language model learns to use image tokens.",
      "For writing: use the text encoder to condition a diffusion model; train it to denoise images given their captions.",
      "Evaluate reading with answer accuracy on held-out images, and writing with human preference and prompt-faithfulness checks.",
    ],
    visual: {
      kind: "compare",
      left: { title: "Reading: image → text", points: ["image encoder + language model", "captioning, question answering, extraction", "output is words", "failure: describing things that are not there"] },
      right: { title: "Writing: text → image", points: ["text encoder + diffusion model", "illustration, product shots, design drafts", "output is pixels", "failure: wrong counts, garbled text, ignored details"] },
      caption: "Same shared space, opposite directions. A model that does both emits image tokens from the same transformer.",
    },
    everyday: {
      title: "Alt text that actually describes the picture",
      text: "A screen reader used to say 'image' and nothing else. Now a reading model can say 'a golden retriever on a beach carrying a red frisbee, sea behind'. The blind user asks 'is anyone else in the photo?' and gets 'no, just the dog'. The same shared space lets a sighted user type 'dog with frisbee' and find that photo among ten thousand.",
    },
    engineering: {
      title: "Invoice extraction for an accounts team",
      text: "An accounts team receives invoices as photos and PDFs in forty layouts. OCR plus rules broke on every new supplier. A vision-language model reads the image directly and returns a structured JSON of supplier, date, line items and totals, with the question 'what is the total including tax?' answered from the pixels. The engineering lessons: higher resolution for small print, a schema-enforced output so the result is data not prose, and a validation step that recomputes the total from the line items and flags mismatches, because the model occasionally reads an 8 as a 3.",
    },
    maths: {
      formula: "contrastive loss for a batch of N pairs: for each image i, −log( exp(sim(iᵢ, tᵢ)/τ) ÷ Σⱼ exp(sim(iᵢ, tⱼ)/τ) )",
      meaning: "sim is cosine similarity between an image vector and a text vector; τ is a temperature. The loss is low when each image is most similar to its own caption among all captions in the batch.",
      worked: [
        "Batch of 3. Image 1's similarities to captions 1, 2, 3 are 0.9, 0.2, 0.1 with τ = 0.1 → scaled 9, 2, 1.",
        "exp: 8103, 7.4, 2.7; sum 8113. Probability of the right caption = 8103 ÷ 8113 = 0.9988; loss = −log(0.9988) ≈ 0.001. Well aligned.",
        "If instead the similarities were 0.3, 0.3, 0.3: scaled 3, 3, 3; probability 1/3; loss = −log(0.333) ≈ 1.10. The encoders are pushed to separate them.",
      ],
      note: "This is the CLIP objective; the same loss is computed from the text side too and the two are averaged.",
    },
    code: {
      title: "Contrastive loss over a batch",
      lang: "py",
      src: `import numpy as np

def contrastive_loss(img_vecs, txt_vecs, tau=0.1):
    # img_vecs, txt_vecs: (N, d), already unit length. Row i of each is a matching pair.
    sims = img_vecs @ txt_vecs.T / tau                # (N, N) similarity of every image to every caption
    sims = sims - sims.max(axis=1, keepdims=True)     # numerical safety
    probs = np.exp(sims) / np.exp(sims).sum(axis=1, keepdims=True)
    correct = np.diag(probs)                          # probability assigned to the true caption
    return -np.log(correct).mean()

img = np.array([[1.0, 0.0], [0.0, 1.0]])
txt = np.array([[0.95, 0.31], [0.2, 0.98]])
print(round(contrastive_loss(img, txt), 3))`,
      lines: [
        { code: "sims = img_vecs @ txt_vecs.T / tau                # (N, N) similarity of every image to every caption", say: "Every image is compared with every caption in the batch; the diagonal holds the true pairs." },
        { code: "probs = np.exp(sims) / np.exp(sims).sum(axis=1, keepdims=True)", say: "Softmax across captions: how likely each caption is for this image." },
        { code: "correct = np.diag(probs)                          # probability assigned to the true caption", say: "The diagonal is what we want to be high." },
        { code: "return -np.log(correct).mean()", say: "Low loss when true pairs dominate their rows. The other captions in the batch act as free negatives." },
      ],
      output: "0.001",
    },
    useIt: "Reading models: document and invoice extraction, product tagging, accessibility, visual search, moderation. Writing models: marketing imagery, concept art, product mock-ups, data augmentation. In both, validate outputs: schema and arithmetic checks for reading, automated faithfulness checks and human review for writing.",
    takeaways: ["Reading (image → text) and writing (text → image) share one aligned image–text space.", "Contrastive training on captions builds that space without region labels.", "Reading models attach an image encoder to a language model; writing models condition a diffusion model on a text encoder.", "Verify what the model reads or draws; it describes and imagines, it does not measure."],
    terms: [["vision-language model", "a model that takes images and text in and produces text"], ["text-to-image model", "a model that produces an image from a description"], ["contrastive learning", "training encoders so matching pairs are close and non-matching pairs far"]],
    reflect: { q: "Why can a contrastive model search photos by sentence without ever being told where objects are in images?", a: "Because it only had to make whole-image vectors land near whole-caption vectors; the captions mention the objects, so the image encoder learns to represent them to match. Location is never labelled, and indeed such models are weak at precise localisation, which is why detection models still exist." },
  },

  "m48-vision-encoders": {
    simple: "A vision encoder is the network that turns an image into a set of vectors a language model can read; its quality and resolution set the ceiling on everything the model can see.",
    concept:
      "Before a language model can reason about a picture, something has to convert pixels into the kind of vectors the model understands. That something is the **vision encoder**. It is usually a vision transformer, pretrained on hundreds of millions of images, that outputs one vector per patch plus optionally a summary vector for the whole image.\n\nThe encoder is then frozen or lightly fine-tuned, and a small **projector** maps its outputs into the language model's vector size. Training the projector (and sometimes the language model) on image–text tasks teaches the language model to read the encoder's vectors as if they were words.\n\nWhat the encoder cannot represent, the language model will never see. Low resolution loses small text; a patch size too large merges fine details; an encoder pretrained only on photographs is weak on diagrams and screenshots. Choosing and configuring the encoder is where most multimodal quality is won or lost.",
    why:
      "Language models are expensive to train, and pixels are not words. Rather than teach a language model vision from scratch, teams reuse an image encoder that already learned to see, and connect it with a cheap adapter. The encoder exists as a separate part so that vision can be pretrained on its own data with its own objective, and so that improvements in vision can be swapped in without retraining the language model.",
    how: [
      "Pretrain a vision transformer on image–text pairs (contrastive) or on masked image reconstruction, at a fixed resolution.",
      "Take its patch outputs: for a 336 × 336 image with 14-pixel patches, 576 vectors.",
      "Optionally reduce them: pool neighbouring patches or use a small resampler that compresses 576 vectors into 64, to save sequence length.",
      "Project the vectors into the language model's dimension with a one- or two-layer MLP.",
      "Train the projector on captioning and visual question answering; optionally fine-tune the language model and the encoder's last layers.",
      "For high resolution, tile the image into several 336 × 336 crops, encode each, and concatenate, plus a low-resolution global view.",
    ],
    visual: {
      kind: "flow",
      steps: ["image 336 × 336", "ViT encoder: 576 patch vectors (1024-d)", "optional resampler: 576 → 144", "projector MLP: 1024-d → 4096-d", "language model reads 144 'image words'", "text answer"],
      caption: "The encoder sees; the projector translates; the language model reads. Resolution and patch count are set at the first two steps.",
    },
    everyday: {
      title: "A translator at a museum",
      text: "You cannot read the inscriptions on an ancient tablet, but a translator next to you can, and tells you in your language. If the translator's eyesight is poor, the finest carvings never reach you, however good your questions are. The vision encoder is the translator's eyesight; the projector is their choice of words.",
    },
    engineering: {
      title: "Upgrading a document assistant that could not read small print",
      text: "A mortgage company's assistant answered questions about scanned statements but missed account numbers printed at 6-point size. The language model was blamed; the encoder was the cause: at 336 pixels a page's small text was two patches of grey. The fix kept the language model and changed the vision side: tile each page into six 336 × 336 crops plus a global view (7 × 576 = 4,032 tokens), encode each, and feed all tokens. Account-number accuracy rose from 61% to 97%; cost per page rose sevenfold, so they tile only pages flagged as containing small text.",
    },
    maths: {
      formula: "patch tokens = (R ÷ p)² per crop;   tiles = ⌈W ÷ R⌉ × ⌈H ÷ R⌉;   total tokens = (tiles + 1 global) × (R ÷ p)²",
      meaning: "R is the encoder's native resolution, p its patch size. Tiling multiplies tokens by the number of crops plus one for the global view.",
      worked: [
        "Encoder native 336, patch 14: (336 ÷ 14)² = 576 tokens per crop.",
        "A 1008 × 672 page: tiles = 3 × 2 = 6; total tokens = (6 + 1) × 576 = 4,032.",
        "With a resampler compressing each crop to 144: 7 × 144 = 1,008 tokens, a quarter of the cost, at some loss of fine detail. Measure whether the account numbers survive.",
      ],
    },
    code: {
      title: "From encoder outputs to language-model inputs",
      lang: "py",
      src: `import numpy as np

def encode_for_llm(patch_vecs, proj_w1, proj_b1, proj_w2, proj_b2, pool=2):
    # patch_vecs: (576, 1024) from the vision encoder, laid out as a 24 x 24 grid
    g = int(np.sqrt(patch_vecs.shape[0]))
    grid = patch_vecs.reshape(g, g, -1)
    pooled = grid.reshape(g // pool, pool, g // pool, pool, -1).mean(axis=(1, 3))   # average 2x2 neighbours
    tokens = pooled.reshape(-1, patch_vecs.shape[1])                                  # (144, 1024)
    hidden = np.maximum(0, tokens @ proj_w1 + proj_b1)                                # MLP projector
    return hidden @ proj_w2 + proj_b2                                                 # (144, 4096): LLM-sized vectors`,
      lines: [
        { code: "pooled = grid.reshape(g // pool, pool, g // pool, pool, -1).mean(axis=(1, 3))   # average 2x2 neighbours", say: "Pooling four neighbouring patches into one cuts tokens from 576 to 144. Cheaper; coarser." },
        { code: "hidden = np.maximum(0, tokens @ proj_w1 + proj_b1)                                # MLP projector", say: "A small two-layer network is the whole bridge between vision and language." },
        { code: "return hidden @ proj_w2 + proj_b2                                                 # (144, 4096): LLM-sized vectors", say: "The output has the language model's width; from here the image is just 144 more tokens." },
      ],
    },
    useIt: "When a multimodal system misses details, look at the encoder first: resolution, patch size, tiling, pooling. Choose encoders pretrained on data like yours (documents and screenshots need document-heavy pretraining). Keep the encoder swappable, and measure fine-detail tasks (small text, thin lines, counts) separately from general description.",
    takeaways: ["The vision encoder turns pixels into vectors; the projector translates them for the language model.", "What the encoder cannot represent, the language model never sees.", "Resolution, patch size, tiling and pooling trade detail against token cost.", "Pretraining data for the encoder should match your images."],
    terms: [["projector", "the small network mapping encoder vectors into the language model's dimension"], ["resampler", "a module that compresses many patch vectors into fewer tokens"], ["tiling", "encoding several crops of a large image and concatenating their tokens"]],
    reflect: { q: "A team fine-tunes the language model for a week to improve reading of engineering diagrams; accuracy barely moves. What would you check?", a: "The encoder: if it was pretrained on photographs and runs at low resolution, thin lines and small labels are not in its output vectors at all, and no amount of language-model training can recover them. Swap to a document-pretrained encoder, raise resolution or tile, and measure a diagram-specific test set." },
  },

  "m48-image-embeddings": {
    simple: "An image embedding is a single vector that captures what an image shows, so images can be compared, searched and grouped by content rather than by pixels.",
    concept:
      "Two photographs of the same dog from different angles share almost no pixels. Comparing them pixel by pixel says they are unrelated. An **image embedding** fixes this: an encoder turns the whole image into one vector of a few hundred to a few thousand numbers, built so that images with similar content have similar vectors.\n\nThe vector is not a description anyone can read. Its usefulness is in distances: the dog photos sit close together, both sit far from a photo of a bridge. Search by example, duplicate detection, clustering a photo library, and matching a product photo to a catalogue all become vector comparisons.\n\nWhen the encoder was trained contrastively with text, the same space contains text vectors too, so a sentence can be the query. That shared space is what makes 'find photos of a red bicycle' work without any tags on the photos.",
    why:
      "Pixel comparison fails on anything but exact duplicates, and hand-written image features (colour histograms, edge statistics) captured appearance, not meaning. Searching or organising images needed a representation of content, and labelling every image with tags does not scale.\n\nImage embeddings exist because deep encoders learn content representations as a by-product of their training, and a single vector per image is cheap to store and compare at the scale of millions.",
    how: [
      "Choose a pretrained vision encoder; for text-searchable embeddings, one trained contrastively with captions.",
      "Pass each image through it; take the summary vector (the class token or pooled patches).",
      "Normalise to unit length so cosine similarity is a dot product.",
      "Store the vectors in a vector index alongside the image ids.",
      "To search: embed the query (an image, or text in a shared space), find the nearest vectors, return their images.",
      "Re-embed everything when the encoder changes; vectors from different encoders are not comparable.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Query", "Nearest images (illustrative cosine)", "Why"],
        rows: [
          ["photo of a golden retriever", "other retrievers 0.91, a labrador 0.84, a cat 0.52, a bridge 0.08", "content, not pixels: angle and lighting do not matter"],
          ["text: 'red bicycle leaning on a wall'", "red bike photos 0.33, blue bike 0.28, red car 0.21", "shared image–text space; text scores are lower in absolute terms but rank correctly"],
          ["a product photo", "the same product from the catalogue 0.95, a similar model 0.88", "duplicate and near-duplicate detection"],
        ],
      },
      caption: "The numbers are distances in a learned space. Everything useful about embeddings is in the ordering.",
    },
    everyday: {
      title: "Finding that one photo on your phone",
      text: "You type 'beach sunset' into your phone's photos and the right picture appears, though you never tagged it. The phone embedded every photo when it was taken and embedded your words now; it shows the photos whose vectors sit nearest your sentence. The same mechanism groups your photos into 'dogs', 'food' and 'screenshots' without being told.",
    },
    engineering: {
      title: "Catching duplicate listings on a marketplace",
      text: "A second-hand marketplace had sellers reposting the same item under new titles to climb the search results. Title matching missed them; the photos were identical or slightly cropped. The team embeds every listing photo and, on upload, searches for vectors with cosine above 0.93 from the same seller in the last 30 days. Reposts are flagged for review. Tuning the threshold mattered: at 0.90 it flagged different units of the same sofa model from honest sellers; at 0.95 it missed re-crops. They settled at 0.93 with a human in the loop.",
    },
    maths: {
      formula: "cosine(a, b) = (a · b) ÷ (‖a‖ ‖b‖);   for unit-length vectors, cosine = a · b",
      meaning: "Normalising once at indexing time turns every later comparison into a dot product.",
      worked: [
        "Two 3-dimensional embeddings (real ones have 512 to 1,536): a = [0.6, 0.8, 0], b = [0.8, 0.6, 0]. Both have length 1.",
        "a · b = 0.48 + 0.48 + 0 = 0.96. Very similar images.",
        "c = [0, 0, 1]: a · c = 0. Unrelated.",
        "Storage: 1 million images × 768 numbers × 4 bytes = 3.07 GB; at 1 byte per number (quantised) 0.77 GB.",
      ],
    },
    code: {
      title: "Index and search a photo library by content",
      lang: "py",
      src: `import numpy as np

def embed_images(images, encoder):
    vecs = np.stack([encoder(img) for img in images])      # (N, d) summary vectors
    return vecs / np.linalg.norm(vecs, axis=1, keepdims=True)   # unit length

def search(query_vec, index_vecs, k=5):
    q = query_vec / np.linalg.norm(query_vec)
    scores = index_vecs @ q                                 # cosine with every image at once
    top = np.argsort(scores)[::-1][:k]
    return list(zip(top, np.round(scores[top], 3)))

library = embed_images(photos, image_encoder)
print(search(text_encoder("beach sunset"), library))        # works if both encoders share a space`,
      lines: [
        { code: "return vecs / np.linalg.norm(vecs, axis=1, keepdims=True)   # unit length", say: "Normalise once, at indexing time." },
        { code: "scores = index_vecs @ q                                 # cosine with every image at once", say: "One matrix–vector product scores the whole library. At millions of images a vector index replaces this scan." },
        { code: "top = np.argsort(scores)[::-1][:k]", say: "Highest cosine first: the most similar images." },
        { code: "print(search(text_encoder(\"beach sunset\"), library))        # works if both encoders share a space", say: "A sentence as the query, because the text encoder was trained into the same space as the image encoder." },
      ],
    },
    useIt: "Image embeddings power visual search, duplicate detection, content moderation (nearest known bad images), recommendation by appearance, clustering unlabelled image sets, and retrieval for multimodal RAG. Pin the encoder, normalise, store in a vector index, and tune thresholds on real examples with a human checking the borderline cases.",
    takeaways: ["One vector per image, built so similar content is close.", "Cosine similarity on normalised vectors is the comparison; the ordering is what matters.", "Contrastive encoders put text in the same space, enabling search by sentence.", "Vectors depend on the encoder; change it and re-embed everything."],
    terms: [["image embedding", "a vector summarising an image's content"], ["near-duplicate", "an image almost identical to another, such as a re-crop or re-encode"], ["vector index", "a store that finds nearest vectors quickly"]],
    reflect: { q: "Text-to-image search scores are much lower in absolute value (0.3) than image-to-image scores (0.9), yet the ranking is right. Should the threshold be the same?", a: "No. Cross-modal similarities live on a different scale because text and image vectors occupy different regions of the shared space. Set thresholds per query type from labelled examples, or use ranks rather than absolute scores for text queries." },
  },

  "m48-image-question-answering": {
    simple: "Image question answering is asking a model a question in words about a picture and getting an answer that depends on both.",
    concept:
      "A caption describes an image in general. **Image question answering** (visual question answering, VQA) is specific: 'how many people are wearing helmets?', 'what does the sign say?', 'is the valve open or closed?'. The model must read the question, locate the relevant part of the image, and reason to an answer that may not appear anywhere as text.\n\nIn a modern multimodal model this happens through attention: the question's tokens attend to the image's patch tokens, the answer is generated word by word. The hard cases are the ones that need precision rather than gist: counting, reading small text, spatial relations ('left of'), and anything requiring measurement. The model's natural skill is description; precision has to be engineered around it.\n\nGood systems treat the model's answer as a draft to be checked: ask it to show its evidence, to read labels before estimating, or to call a tool for counting and measuring.",
    why:
      "Captions answer the question nobody asked. People have specific questions about images: inspectors, doctors, customers, blind users. Before VQA, each such question needed a dedicated classifier. A model that answers arbitrary questions about arbitrary images replaces thousands of special-purpose models with one, and makes images interactive.",
    how: [
      "Encode the image into patch tokens and the question into text tokens; build one sequence.",
      "The transformer attends from question words to image regions ('helmets' → the heads in the image).",
      "Generate the answer autoregressively, conditioned on both.",
      "For precision questions, add structure: ask for the evidence region first, or decompose ('list the people, then count the helmets').",
      "For counts, text and measurements, prefer tools: a detector counts, OCR reads, a ruler tool measures; the model orchestrates.",
      "Evaluate on question types separately: yes/no, counting, reading, spatial, reasoning.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "question", detail: "'How many workers are not wearing a helmet?'" },
        { label: "attend", detail: "question tokens attend to patches showing heads" },
        { label: "decompose", detail: "model lists: 5 workers; helmets on 3" },
        { label: "answer", detail: "'2 workers are without helmets'" },
        { label: "verify", detail: "a detector tool confirms 5 people, 3 helmets" },
      ],
      caption: "Attention finds the relevant pixels; decomposition and tools make the answer precise.",
    },
    everyday: {
      title: "Asking a shop assistant about a photo of a part",
      text: "You show a hardware-store assistant a photo of a broken hinge and ask 'what size screw does this take?'. They look at the hinge, maybe zoom in on the hole, and answer. If you ask 'how many holes are there?' they count, pointing at each. The model does the same: finds the relevant region, reasons, and should point as it counts.",
    },
    engineering: {
      title: "Safety compliance from site photos",
      text: "A construction firm photographs sites hourly and asks a multimodal model 'is anyone within 2 metres of the excavator without a hard hat?'. The model's free-form answers were right 80% of the time; wrong answers were mostly miscounts and distance guesses. They rebuilt the flow: a detector finds people, hats and the excavator with boxes; the model receives the image plus the detections as text and answers about relations; distance comes from a calibrated camera tool. Accuracy rose to 96%, and each answer now cites the detections it used.",
    },
    maths: {
      formula: "accuracy by question type = correct ÷ asked, reported per type;   VQA score for free-form answers = min(1, matches with human answers ÷ 3)",
      meaning: "Reporting a single overall accuracy hides that counting and reading are usually far weaker than yes/no questions.",
      worked: [
        "A test set: 400 yes/no (92% correct), 200 counting (71%), 150 reading (64%), 250 reasoning (80%).",
        "Overall = (368 + 142 + 96 + 200) ÷ 1,000 = 80.6%. The headline looks fine.",
        "Reading at 64% means a third of 'what does the label say?' answers are wrong. That is the number a deployment decision should rest on.",
      ],
    },
    code: {
      title: "Decompose a counting question before answering",
      lang: "py",
      src: `def answer_count(model, image, target):
    listing = model.ask(image, "List every " + target + " you can see, one per line, with its location.")
    items = [line for line in listing.splitlines() if line.strip()]
    check = model.ask(image, "Here is a list of " + target + " items:\\n" + listing + "\\nIs anything missing or duplicated? Reply with the corrected list.")
    final = [line for line in check.splitlines() if line.strip()]
    return len(final), final

n, evidence = answer_count(vqa_model, site_photo, "worker without a helmet")
print(n)
print(evidence)`,
      lines: [
        { code: "listing = model.ask(image, \"List every \" + target + \" you can see, one per line, with its location.\")", say: "Instead of asking for a number, ask for the items. Counting a list is reliable; guessing a count is not." },
        { code: "check = model.ask(image, \"Here is a list of \" + target + \" items:\\n\" + listing + \"\\nIs anything missing or duplicated? Reply with the corrected list.\")", say: "A second look at its own list catches double counts and misses." },
        { code: "return len(final), final", say: "The count is computed by code from the evidence, and the evidence is returned for a person to check." },
      ],
      note: "For production counting, a detection tool is more accurate still; this pattern improves the model's own answers when no tool exists.",
    },
    useIt: "Use image question answering for inspection, document and form understanding, accessibility, retail ('does this fit my shelf?'), medical triage support, and agent perception. Separate the question types in evaluation, route precision questions to tools, and ask for evidence with every answer.",
    takeaways: ["VQA answers specific questions by attending from words to image regions.", "Description is the model's strength; counting, reading and spatial precision are its weaknesses.", "Decompose questions and use tools for counts, text and measurement.", "Evaluate per question type; the overall number hides the failures that matter."],
    terms: [["visual question answering (VQA)", "answering a text question about an image"], ["grounding (visual)", "tying an answer to specific regions of the image"], ["decomposition", "breaking one question into simpler steps the model answers in turn"]],
    reflect: { q: "A model says there are 'about 12' boxes on a pallet when there are 15. Is this a vision failure or a language failure?", a: "Mostly a language-model failure of method: it estimated instead of enumerating. Vision provided enough to see the boxes. Asking it to list rows and columns, or calling a detector, turns the same vision into a correct count." },
  },

  "m48-speech-recognition": {
    simple: "Speech recognition turns spoken audio into written text by encoding the sound into frames and decoding those frames into words.",
    concept:
      "Sound arrives as a waveform: tens of thousands of numbers per second describing air pressure. **Speech recognition** (automatic speech recognition, ASR) turns that into text. Modern systems do it with an encoder-decoder transformer: the waveform is converted into a **spectrogram**, a picture of which frequencies are present over time; an audio encoder turns the spectrogram's frames into vectors; a text decoder writes words while attending to those vectors.\n\nThe decoder is a language model, so it uses context: 'recognise speech' and 'wreck a nice beach' sound alike, and the decoder picks the one that makes sense. That is also why recognition fails on rare names and jargon the decoder has never seen.\n\nTraining needs paired audio and transcripts, hundreds of thousands of hours for the strongest models, covering accents, noise, microphones and languages. Weakly labelled data (subtitles, captions) made that scale possible.",
    why:
      "Typing is slow and often impossible: driving, surgery, a factory floor, a phone call. Meetings, lectures, calls and voice notes contain information that is useless until it is text. Speech recognition exists to make audio searchable, summarisable and actionable, and to let people control machines by talking.",
    how: [
      "Record audio at 16,000 samples per second; split into 25-millisecond windows every 10 ms.",
      "Compute a spectrogram: for each window, the energy at each of ~80 frequency bands (a mel spectrogram).",
      "Run the audio encoder (convolutions then transformer layers) over the frames: about 50 vectors per second after downsampling.",
      "Decode text tokens one at a time with cross-attention to the encoder output.",
      "Add timestamps and speaker turns by predicting special tokens or by a separate diarisation step.",
      "For live use, stream audio in chunks and decode incrementally with a small delay.",
    ],
    visual: {
      kind: "flow",
      steps: ["waveform 16 kHz", "25 ms windows", "mel spectrogram (80 bands × 100 frames/s)", "audio encoder → 50 vectors/s", "text decoder with cross-attention", "'turn the pump off now'"],
      caption: "Sound becomes a picture of frequencies, the picture becomes vectors, the vectors become words.",
    },
    everyday: {
      title: "Dictating a message while cooking",
      text: "Hands covered in flour, you say 'tell Sam I'll be twenty minutes late'. The phone hears the words through the hum of the extractor fan and writes them. If you say your friend's unusual name, it may write a common one that sounds similar, because the decoder prefers words it has seen before. Adding the name to your contacts gives it a hint.",
    },
    engineering: {
      title: "Transcribing a call centre at scale",
      text: "A bank transcribes 40,000 calls a day for compliance and quality. Their first model, trained on clean read speech, scored 18% word error rate on calls: phone-quality audio, overlapping speakers, product names. They fine-tuned on 2,000 hours of their own transcribed calls and added a vocabulary biasing list of product names. Word error rate fell to 7%. They also learned to report error rate separately for the agent and the customer channels; customers on mobile phones in noisy places were twice as hard, and that is where the remaining errors live.",
    },
    maths: {
      formula: "word error rate (WER) = (substitutions + deletions + insertions) ÷ words in the reference",
      meaning: "The standard score: how many word edits turn the transcript into the truth, per hundred reference words.",
      worked: [
        "Reference: 'please transfer two hundred pounds to savings' (7 words). Output: 'please transfer to hundred pounds savings'.",
        "Edits: 'two' → 'to' (substitution), 'to' before 'savings' missing (deletion). 2 edits.",
        "WER = 2 ÷ 7 = 0.286, or 28.6%. One substitution here changes the meaning of a payment instruction; WER counts it the same as a harmless slip, so banks also check critical-entity accuracy separately.",
        "Frames: 10 seconds of audio = 1,000 spectrogram frames = about 500 encoder vectors after 2× downsampling.",
      ],
    },
    code: {
      title: "From waveform to a mel spectrogram",
      lang: "py",
      src: `import numpy as np

def mel_spectrogram(wave, sr=16000, win=400, hop=160, n_fft=512, mel_filters=None):
    # wave: 1-D array of samples; 400 samples = 25 ms at 16 kHz; hop 160 = 10 ms
    frames = []
    window = np.hanning(win)
    for start in range(0, len(wave) - win, hop):
        seg = wave[start:start + win] * window
        spec = np.abs(np.fft.rfft(seg, n=n_fft)) ** 2      # power at each frequency
        frames.append(spec)
    power = np.array(frames)                               # (frames, 257)
    mel = power @ mel_filters.T                            # (frames, 80): group into 80 perceptual bands
    return np.log(mel + 1e-6)                              # log compresses the huge dynamic range

print(mel_spectrogram(np.random.randn(16000), mel_filters=np.random.rand(80, 257)).shape)`,
      lines: [
        { code: "for start in range(0, len(wave) - win, hop):", say: "Slide a 25 ms window along the audio every 10 ms: 100 frames per second." },
        { code: "spec = np.abs(np.fft.rfft(seg, n=n_fft)) ** 2      # power at each frequency", say: "A Fourier transform turns each window into 'how much of each pitch is present'." },
        { code: "mel = power @ mel_filters.T                            # (frames, 80): group into 80 perceptual bands", say: "Merge 257 frequencies into 80 bands spaced the way human hearing is." },
        { code: "return np.log(mel + 1e-6)                              # log compresses the huge dynamic range", say: "Logarithm, because a whisper and a shout differ by a factor of thousands." },
      ],
      output: "(97, 80)",
    },
    useIt: "Speech recognition feeds meeting assistants, call analytics, voice control, captions, voice notes and multimodal assistants. Fine-tune on your domain's audio, bias toward your vocabulary, measure word error rate per channel and condition, and check critical entities (amounts, names, commands) separately from overall WER.",
    takeaways: ["Waveform → spectrogram → encoder vectors → decoded text, with the decoder acting as a language model.", "Context helps common words and hurts rare names; vocabulary biasing fixes the latter.", "Word error rate is the standard score; report it per condition and check critical entities.", "Domain fine-tuning on your own audio is the biggest single improvement."],
    terms: [["spectrogram", "a time-by-frequency picture of a sound"], ["mel scale", "frequency bands spaced to match human hearing"], ["word error rate", "word edits needed to fix a transcript, per reference word"], ["diarisation", "working out who spoke when"]],
    reflect: { q: "Why does a model with 5% word error rate still fail badly on a voice-ordering system for a pharmacy?", a: "Because the 5% is not spread evenly: drug names are exactly the rare words the decoder's language model has not seen, so errors concentrate on the words that matter most. The fix is domain fine-tuning and vocabulary biasing, and measuring accuracy on the drug names themselves." },
  },

  "m48-text-to-speech": {
    simple: "Text-to-speech turns written words into natural-sounding audio by predicting the sound's structure from the text and then generating the waveform.",
    concept:
      "**Text-to-speech** (TTS) is speech recognition run the other way: words in, sound out. Modern systems work in two stages. First, a model reads the text (often converted to phonemes, the units of pronunciation) and predicts an intermediate representation: a mel spectrogram, or a sequence of discrete audio tokens from a learned codec. Second, a **vocoder** or codec decoder turns that into the waveform of air pressure values.\n\nThe interesting part is everything that is not in the text: pitch, rhythm, pauses, emphasis, emotion, accent, the voice itself. These are predicted from context or steered by conditioning: a speaker embedding from a few seconds of a reference voice, a style tag, or an instruction. Good systems sound like a particular person reading with understanding, not a machine listing words.\n\nThe same technology that clones a voice from a short sample is what makes voice cloning a security problem; watermarking and consent checks are part of any responsible deployment.",
    why:
      "Screens cannot be looked at while driving, cooking or walking; many people cannot see them at all. Text-to-speech exists so that information and conversation can reach people by ear, and so that assistants can speak rather than only write. Natural-sounding synthesis matters because listeners stop paying attention to robotic voices within minutes.",
    how: [
      "Normalise text: expand numbers, abbreviations and symbols ('£5' → 'five pounds').",
      "Convert words to phonemes using a dictionary and a learned fallback for unknown words.",
      "Predict prosody and the acoustic representation (spectrogram frames or codec tokens) from phonemes, conditioned on speaker and style.",
      "Generate the waveform with a neural vocoder or a codec decoder.",
      "For streaming, generate in short chunks so the first sound arrives within a few hundred milliseconds.",
      "Watermark the audio and log consent for cloned voices.",
    ],
    visual: {
      kind: "flow",
      steps: ["'Your order of £5.20 ships Monday.'", "normalise: 'five pounds twenty'", "phonemes: /faɪv paʊndz twɛnti/", "acoustic model: spectrogram or codec tokens + prosody", "vocoder → waveform", "audio out"],
      caption: "Text to sounds to acoustics to waveform. Voice and style enter at the acoustic step.",
    },
    everyday: {
      title: "A satnav that sounds like a person",
      text: "An older satnav said 'TURN. LEFT. IN. TWO. HUNDRED. METRES' in the same flat voice whatever the road. A modern one says it with the rise and fall a person would use, pauses before a tricky junction name, and pronounces 'Leicester' correctly because it was taught the exceptions. The words were always there; the naturalness is the acoustic model doing prosody.",
    },
    engineering: {
      title: "Audiobook narration for a publisher's back catalogue",
      text: "A publisher has 12,000 titles that will never justify a human narrator. They license a TTS system and build a pipeline: text normalisation tuned for fiction (dialogue, chapter headings), a style model that varies pace and emphasis by sentence type, and a consistent synthetic narrator voice per genre. Quality control samples 2% of chapters for a human listen, and a pronunciation dictionary of character names is attached to each book. Cost per title fell from thousands of pounds to tens; listeners' completion rates on the synthetic titles came within 10% of human-narrated ones.",
    },
    maths: {
      formula: "mel frames = duration × 100 per second;   waveform samples = duration × sample rate;   codec tokens = duration × frame rate × codebooks",
      meaning: "Each stage expands the data: a few words become hundreds of frames become tens of thousands of samples.",
      worked: [
        "A 4-second sentence: spectrogram = 400 frames of 80 bands = 32,000 numbers.",
        "Waveform at 24 kHz = 96,000 samples. The vocoder generates 240 samples per frame.",
        "With a neural codec at 75 frames per second and 8 codebooks: 4 × 75 × 8 = 2,400 discrete tokens; a language model can generate those directly.",
        "Latency target for conversation: first audio within 300 ms means the first chunk (say 0.5 s of speech = 50 frames) must be produced faster than real time by a wide margin.",
      ],
    },
    code: {
      title: "Text normalisation: the unglamorous first stage",
      lang: "py",
      src: `import re

NUM_WORDS = {0: "zero", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five", 6: "six", 7: "seven", 8: "eight", 9: "nine", 20: "twenty"}

def say_money(match):
    pounds, pence = match.group(1), match.group(2)
    out = NUM_WORDS.get(int(pounds), pounds) + " pounds"
    if pence and int(pence):
        out += " " + NUM_WORDS.get(int(pence), pence)
    return out

def normalise(text):
    text = re.sub(r"£(\\d+)(?:\\.(\\d{2}))?", say_money, text)
    text = text.replace("Mon.", "Monday").replace("&", "and")
    return text

print(normalise("Your order of £5.20 ships Mon. & arrives Tue."))`,
      lines: [
        { code: "text = re.sub(r\"£(\\d+)(?:\\.(\\d{2}))?\", say_money, text)", say: "Currency must become words the phoneme stage can pronounce; '£5.20' read as characters would be nonsense." },
        { code: "out = NUM_WORDS.get(int(pounds), pounds) + \" pounds\"", say: "Numbers to words. Real systems handle thousands, decimals, dates, times and ordinals." },
        { code: "text = text.replace(\"Mon.\", \"Monday\").replace(\"&\", \"and\")", say: "Abbreviations and symbols expanded. Most 'robotic' mistakes in TTS are normalisation mistakes." },
      ],
      output: "Your order of five pounds twenty ships Monday and arrives Tue.",
      note: "'Tue.' was not handled: a reminder that normalisation is a long list of cases, and every missed one is audible.",
    },
    useIt: "Text-to-speech serves assistants, accessibility, navigation, audiobooks, call automation, language learning and dubbing. Invest in normalisation and pronunciation dictionaries for your domain, stream for conversation, choose voices deliberately, watermark output, and never clone a voice without documented consent.",
    takeaways: ["Text → phonemes → acoustic representation with prosody → waveform via a vocoder.", "Naturalness lives in prosody and voice, which are conditioned, not in the words.", "Normalisation and pronunciation dictionaries cause and cure most audible errors.", "Voice cloning needs consent and watermarking."],
    terms: [["phoneme", "a unit of pronunciation; 'cat' has three"], ["prosody", "the rhythm, stress and pitch of speech"], ["vocoder", "the network that turns an acoustic representation into a waveform"], ["neural codec", "a learned compression of audio into discrete tokens"]],
    reflect: { q: "A TTS system reads 'Dr. Smith lives on Mill Dr.' as 'Doctor Smith lives on Mill Doctor'. Which stage failed and how would you fix it?", a: "Text normalisation: 'Dr.' is ambiguous between 'Doctor' and 'Drive', and the expander used one rule for both. Fix with context rules (before a capitalised name → Doctor; after a street name → Drive) or a small classifier, and add the case to the normalisation test set." },
  },

  "m48-audio-understanding": {
    simple: "Audio understanding is making sense of sound beyond the words: what is making the noise, where, in what state, and what it means.",
    concept:
      "Speech recognition answers 'what was said'. **Audio understanding** answers everything else: is that a dog or a doorbell, is this engine healthy, which bird is singing, what is the mood of this music, did a glass break in the next room, is the speaker angry. The input is the same spectrogram; the task is classification, detection, description or question answering about sound.\n\nModern audio models are trained like image and text models: an audio encoder learns from large sets of sounds with labels or captions, often contrastively against text, producing audio embeddings in a space shared with words. A language model can then be attached, so you can ask questions about a recording the way you ask about a photo.\n\nThe hard parts are specific to sound: events overlap, background noise is everywhere, and the same source sounds different through different microphones. Good systems are trained on realistic, noisy, overlapping audio, not clean clips.",
    why:
      "Sound carries information that nothing else does: a bearing's wear is audible before it is visible; a cough's character matters to a doctor; a smart speaker must know a smoke alarm from a kettle. Transcription ignores all of this. Audio understanding exists to use the non-speech half of what microphones hear, and to let assistants respond to the acoustic world, not just to words.",
    how: [
      "Convert audio to a mel spectrogram, as for speech.",
      "Run an audio encoder (a transformer over spectrogram patches, like a ViT over a sound-picture) to get frame-level and clip-level embeddings.",
      "For classification: a head over the clip embedding gives sound classes; for detection: per-frame heads give events with start and end times.",
      "For description or questions: project the embeddings into a language model and generate text.",
      "Train on labelled sound events and on audio–caption pairs, with heavy augmentation: added noise, mixing clips, varied microphones.",
      "Deploy with a confidence threshold per class and a human review for safety-critical events.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Task", "Input", "Output", "Example"],
        rows: [
          ["sound classification", "a clip", "one or more labels", "'dog bark', 'siren'"],
          ["sound event detection", "a stream", "labels with times", "glass break at 00:12.4–00:12.9"],
          ["audio captioning", "a clip", "a sentence", "'rain on a tin roof with distant thunder'"],
          ["audio question answering", "clip + question", "an answer", "'is the engine misfiring?' → 'yes, an irregular knock every ~0.4 s'"],
          ["speaker and emotion", "speech clip", "who / how", "speaker 2, frustrated"],
        ],
      },
      caption: "Same spectrogram in; different heads or a language model out.",
    },
    everyday: {
      title: "A baby monitor that knows crying from coughing",
      text: "An old monitor sent every sound. A modern one classifies: it stays quiet for the washing machine, alerts for crying, and alerts differently for a cough that sounds like croup. It was trained on thousands of labelled recordings of babies, with household noise mixed in so that a dishwasher does not fool it.",
    },
    engineering: {
      title: "Predictive maintenance from machine sound",
      text: "A bottling plant mounts microphones near forty motors. An audio model trained on months of recordings labelled with later maintenance outcomes learns the sound of a bearing beginning to fail. It flags motors three to ten days before a breakdown. The engineering work: aligning recordings with maintenance logs to get labels, augmenting with plant noise from other lines, calibrating a threshold so that false alarms are rare enough that technicians keep trusting it, and retraining when a motor is replaced with a different model that sounds different when healthy.",
    },
    maths: {
      formula: "precision = true alerts ÷ all alerts;   recall = true alerts ÷ all real events;   alerts per day = events per day × recall + non-events per day × false-alarm rate",
      meaning: "For rare events the false-alarm rate on the huge number of non-events dominates how many alerts people see.",
      worked: [
        "A plant has 2 real bearing-failure onsets per month and 40 motors × 24 hours = 960 motor-hours per day of normal sound.",
        "A model with recall 0.9 and a false-alarm rate of 0.5% per motor-hour: false alerts per day = 960 × 0.005 = 4.8; true alerts per month ≈ 1.8.",
        "Precision = 1.8 ÷ (1.8 + 4.8 × 30) ≈ 1.2%. Technicians would ignore it. At 0.01% false alarms: 0.096 per day, precision ≈ 38%; usable with review.",
      ],
      note: "Rare-event detection lives or dies on the false-alarm rate, not on accuracy.",
    },
    code: {
      title: "Sound event detection with per-frame scores",
      lang: "py",
      src: `import numpy as np

def detect_events(frame_scores, threshold=0.6, frame_s=0.02, min_len=3):
    # frame_scores: (frames,) probability of the target sound per 20 ms frame
    on = frame_scores > threshold
    events, start = [], None
    for i, flag in enumerate(on):
        if flag and start is None:
            start = i
        if (not flag or i == len(on) - 1) and start is not None:
            end = i if not flag else i + 1
            if end - start >= min_len:                 # ignore blips shorter than 60 ms
                events.append((round(start * frame_s, 2), round(end * frame_s, 2)))
            start = None
    return events

scores = np.array([0.1, 0.2, 0.7, 0.9, 0.8, 0.3, 0.9, 0.1, 0.1, 0.95, 0.9, 0.9, 0.85, 0.2])
print(detect_events(scores))`,
      lines: [
        { code: "on = frame_scores > threshold", say: "A per-frame yes/no from the model's probabilities. The threshold trades precision against recall." },
        { code: "if end - start >= min_len:                 # ignore blips shorter than 60 ms", say: "Real events last; single-frame spikes are usually noise." },
        { code: "events.append((round(start * frame_s, 2), round(end * frame_s, 2)))", say: "Frames become timestamps: the answer a technician can act on." },
      ],
      output: "[(0.04, 0.1), (0.18, 0.26)]",
      note: "The lone 0.9 at frame 6 was dropped as a blip; the two sustained runs became events.",
    },
    useIt: "Audio understanding powers predictive maintenance, security and safety monitoring, wildlife and environmental sensing, health (cough and breathing analysis), media tagging, and the acoustic awareness of assistants and robots. Train on realistic noisy audio, set thresholds from the cost of false alarms, and keep a human review for safety-critical events.",
    takeaways: ["Audio understanding is everything about sound except the words.", "Same spectrogram input; classification, detection, captioning or question answering out.", "Overlap, noise and microphones are the hard parts; augment for them.", "For rare events, the false-alarm rate decides whether anyone trusts the system."],
    terms: [["sound event detection", "finding what sounds occur and when"], ["audio embedding", "a vector summarising a clip's acoustic content"], ["false-alarm rate", "how often the system alerts when nothing happened"]],
    reflect: { q: "Why do audio models trained on studio-clean clips fail on a factory floor even when the target sound is loud?", a: "Because they never learned to separate the target from overlapping machinery, reverberation and microphone colouration; they learned a clean template. Mixing training clips with real background noise and recording through the deployment microphones teaches invariance to those conditions." },
  },

  "m48-video-understanding": {
    simple: "Video understanding is reasoning about moving images over time: what happens, in what order, who does what, and what changes.",
    concept:
      "A video is a stack of images plus sound. **Video understanding** means answering questions that need time: 'did the worker put the guard back before restarting the machine?', 'summarise this two-hour lecture', 'when does the goal happen?'. A single frame cannot answer these; the model must relate frames to each other.\n\nThe practical approach is sampling: pick frames at intervals, encode each with a vision encoder, add time information, and feed the resulting tokens (with the audio track's tokens) to a transformer. Attention across frames gives the model a sense of order and change. Sampling density is the central trade: one frame a second catches most events in a lecture and misses a fast hand movement; thirty frames a second catches everything and costs thirty times as much.\n\nLong videos push token counts to the limits of context windows, so systems compress: pool similar consecutive frames, encode at low resolution, or process the video in segments and summarise each.",
    why:
      "More of the world's recorded data is video than anything else, and almost none of it is searchable or summarisable. Security footage, lectures, sports, surgical recordings, dashcams, product demos: all hold events that nobody has time to watch for. Video understanding exists so that time-based questions can be asked of recordings, and so that robots and assistants can perceive events, not just scenes.",
    how: [
      "Decode the video; sample frames at a chosen rate (for example 1 per second), plus the audio track.",
      "Encode each frame with a vision encoder into patch tokens; optionally pool to reduce tokens per frame.",
      "Add temporal position information so the model knows frame order and spacing.",
      "Encode audio (speech via recognition or an audio encoder) and interleave with the frame tokens by time.",
      "Run the transformer; attention across frames supports questions about sequence and change.",
      "For long videos, split into segments, answer or summarise per segment, then combine; or retrieve the relevant segment first.",
    ],
    visual: {
      kind: "steps",
      items: [
        { label: "sample", detail: "a 10-minute video at 1 frame/s → 600 frames" },
        { label: "encode", detail: "each frame → 64 pooled tokens → 38,400 tokens" },
        { label: "time", detail: "add a timestamp embedding per frame" },
        { label: "audio", detail: "transcript tokens interleaved by time" },
        { label: "attend", detail: "'when was the guard removed?' attends to the right frames" },
        { label: "answer", detail: "'at 03:12, and it was not replaced before the restart at 03:40'" },
      ],
      caption: "Frames become tokens with time stamps; the rest is attention. Token counts are the constraint.",
    },
    everyday: {
      title: "Finding the moment in a long home video",
      text: "You filmed a whole birthday party and want the ten seconds where the cake came out. Scrubbing through an hour is tedious. Ask a video model 'when does the cake arrive?' and it answers '41:05'. It did not watch every frame at full detail; it sampled, found frames with candles and a cake, and used the audio of singing to confirm.",
    },
    engineering: {
      title: "Reviewing machine-safety footage automatically",
      text: "A manufacturer records every machine bay. Safety officers used to spot-check 1% of footage. A video model now scans everything for a specific sequence: guard removed, machine restarted without guard replaced. The engineering decisions: sample at 2 frames per second (fast enough for the guard action), run a cheap detector first to find frames with a person near the machine, send only those segments (3% of footage) to the expensive video model, and have the model output timestamps so an officer verifies each flagged clip in seconds. Flagged incidents went from 0 found per month to 7, all confirmed.",
    },
    maths: {
      formula: "tokens = frames per second × duration × tokens per frame;   frames per second needed ≈ 1 ÷ (shortest event duration)",
      meaning: "Sampling rate follows from how brief the events of interest are; tokens follow from sampling rate and per-frame compression.",
      worked: [
        "A 2-hour lecture at 1 frame/s with 64 tokens per frame: 7,200 × 64 = 460,800 tokens. Too many for most context windows; split into 12 ten-minute segments of 38,400 tokens.",
        "A 30-second clip of a tennis serve, shortest event (ball contact) ≈ 0.1 s: need ≈ 10 frames/s → 300 frames × 64 = 19,200 tokens.",
        "The safety case: a guard removal takes about 1 s, so 2 frames/s suffices; 8 hours of footage = 57,600 frames, but prefiltering to 3% leaves 1,728 frames ≈ 110,000 tokens per day per bay.",
      ],
    },
    code: {
      title: "Sample frames and build a timed token sequence",
      lang: "py",
      src: `import numpy as np

def video_tokens(frames, fps, sample_fps, encode_frame, time_embed):
    # frames: list of images at the source frame rate; encode_frame returns (64, d) tokens
    step = max(1, int(round(fps / sample_fps)))
    out = []
    for i in range(0, len(frames), step):
        t = i / fps                                   # seconds into the video
        toks = encode_frame(frames[i]) + time_embed(t)   # add the same time vector to every token of this frame
        out.append(toks)
    return np.concatenate(out, axis=0)                # (sampled_frames * 64, d)

seq = video_tokens(frames, fps=30, sample_fps=2, encode_frame=enc, time_embed=temb)
print(seq.shape)`,
      lines: [
        { code: "step = max(1, int(round(fps / sample_fps)))", say: "Keep every 15th frame to go from 30 to 2 frames per second." },
        { code: "t = i / fps                                   # seconds into the video", say: "The timestamp is what lets the model answer 'when'." },
        { code: "toks = encode_frame(frames[i]) + time_embed(t)   # add the same time vector to every token of this frame", say: "Time enters as an embedding added to the frame's tokens, the way position enters a text sequence." },
        { code: "return np.concatenate(out, axis=0)                # (sampled_frames * 64, d)", say: "One long sequence, ordered by time, ready for attention across frames." },
      ],
    },
    useIt: "Video understanding serves safety and compliance review, lecture and meeting summarisation, sports and media indexing, surgical and industrial process analysis, robot perception and dashcam incident analysis. Choose the sampling rate from the shortest event you care about, prefilter with cheap detectors, segment long videos, and output timestamps so people can verify.",
    takeaways: ["Video = frames + audio over time; questions need relations between frames.", "Sample frames, encode, add time embeddings, interleave audio, attend.", "Sampling rate follows from event duration; tokens follow from sampling.", "Prefilter and segment to make long video affordable; always return timestamps."],
    terms: [["frame sampling", "keeping a subset of frames at a chosen rate"], ["temporal embedding", "a vector added to tokens to mark their time"], ["segment", "a short slice of a long video processed on its own"]],
    reflect: { q: "A model summarises a cooking video well but cannot say whether the chef added salt before or after the oil. What is the likely limitation?", a: "Sampling or pooling: at one frame per second with heavy token pooling, two quick actions a second apart may fall in one frame or lose the fine detail that distinguishes them. Denser sampling around detected hand actions, or less pooling, restores the order." },
  },

  "m48-multimodal-embeddings": {
    simple: "A multimodal embedding space is one vector space where text, images, audio and video all live, so any one can be used to search for any other.",
    concept:
      "Image embeddings let images find images. **Multimodal embeddings** go further: one encoder per modality, all trained so that related items land near each other regardless of modality. A photo of a thunderstorm, the sentence 'lightning over a city at night', the sound of thunder and a three-second video clip of the storm all sit in the same neighbourhood.\n\nThe training signal is pairs across modalities: image–caption, audio–description, video–subtitle. Contrastive losses pull each pair together. With enough pairs of several kinds, the space becomes shared even between modalities that were never paired directly: audio and images align through text, because both were paired with words.\n\nThe result is a universal index. Anything can be a query; anything can be a result. The practical limits are that cross-modal similarities are on different scales, that fine detail is lost in a single vector, and that the space encodes the biases of the captions it learned from.",
    why:
      "Organisations hold mixed media: a product has photos, a manual, a demo video and support calls. Searching each with its own tool is slow and misses connections. A shared embedding space exists so that one search covers all of it, and so that multimodal retrieval can feed a multimodal model the right picture, clip or recording for a question.",
    how: [
      "Choose or train an encoder per modality with the same output dimension.",
      "Collect paired data across modalities: captions, transcripts, subtitles, product photo–title pairs.",
      "Train contrastively: for every pair, maximise the similarity of the pair relative to other items in the batch, in both directions.",
      "Normalise outputs; store every item's vector with its modality tag in one index.",
      "Query by embedding whatever you have (a sentence, an image, a clip) and retrieving nearest neighbours across all modalities.",
      "Calibrate per modality-pair thresholds, since text–image and image–image scores sit on different scales.",
    ],
    visual: {
      kind: "tree",
      root: "one shared vector space",
      children: [
        { label: "text encoder", children: ["'thunderstorm over a city'"] },
        { label: "image encoder", children: ["photo of lightning"] },
        { label: "audio encoder", children: ["sound of thunder"] },
        { label: "video encoder", children: ["storm clip"] },
      ],
      caption: "Four encoders, one space. Each arrow ends near the others because training pulled the pairs together.",
    },
    everyday: {
      title: "Humming to find a song",
      text: "You hum a tune into your phone and it names the song. Your humming becomes an audio vector; the catalogue's songs are vectors in the same space; the nearest one is the answer. Type a lyric instead and the text encoder lands you in the same place. The space does not care whether you hummed, typed or played a clip.",
    },
    engineering: {
      title: "One search box for a car manufacturer's service knowledge",
      text: "A car maker's technicians need answers from repair manuals (text), wiring diagrams (images), training videos and recorded fault sounds. Four separate search tools meant most of it went unused. The team embeds every page, diagram, video segment and audio clip into one space and builds one search: a technician can type a symptom, upload a photo of a part or play a recording of a noise, and get results from all four sources ranked together. Cross-modal thresholds were tuned per pair; the biggest win was audio queries finding video segments where an instructor demonstrates the same fault.",
    },
    maths: {
      formula: "similarity(a, b) = cos(E_modality(a)(a), E_modality(b)(b));   a joint index holds vectors from all encoders tagged by modality",
      meaning: "Each item is embedded by its own modality's encoder; because the encoders were trained into one space, the cosine is meaningful across modalities.",
      worked: [
        "Index: 50,000 manual pages, 8,000 diagrams, 2,000 video segments, 600 audio clips: 60,600 vectors of 1,024 dimensions ≈ 248 MB in 32-bit.",
        "A text query scores against all 60,600 at once. Suppose the best text–text match is 0.71, the best text–image 0.34, the best text–audio 0.29.",
        "Raw sorting would bury the diagram. Calibrated per pair (dividing by each pair's typical top score from a validation set: 0.75, 0.36, 0.31), the normalised scores are 0.95, 0.94, 0.94: all three belong near the top.",
      ],
    },
    code: {
      title: "Cross-modal search with per-pair calibration",
      lang: "py",
      src: `import numpy as np

CAL = {("text", "text"): 0.75, ("text", "image"): 0.36, ("text", "audio"): 0.31, ("text", "video"): 0.33}

def cross_modal_search(query_vec, query_mod, index_vecs, index_mods, k=10):
    raw = index_vecs @ query_vec                                  # cosine, all vectors unit length
    scale = np.array([CAL[(query_mod, m)] for m in index_mods])  # typical top score for each modality pair
    scores = raw / scale                                          # comparable across modalities
    top = np.argsort(scores)[::-1][:k]
    return [(int(i), index_mods[i], round(float(scores[i]), 3)) for i in top]

print(cross_modal_search(text_enc("knocking noise at idle"), "text", index_vecs, index_mods))`,
      lines: [
        { code: "raw = index_vecs @ query_vec                                  # cosine, all vectors unit length", say: "One dot product scores manuals, diagrams, videos and audio together." },
        { code: "scale = np.array([CAL[(query_mod, m)] for m in index_mods])  # typical top score for each modality pair", say: "Text–audio similarities are naturally lower than text–text; the calibration table corrects for that." },
        { code: "scores = raw / scale                                          # comparable across modalities", say: "After scaling, a strong audio match and a strong text match look equally strong." },
      ],
      note: "The calibration values come from a validation set of known-good pairs per modality combination; re-measure them whenever an encoder changes.",
    },
    useIt: "Multimodal embeddings power unified search over mixed media, retrieval for multimodal RAG, recommendation across content types, deduplication across formats, and zero-shot classification (compare an image with the text of each class name). Calibrate cross-modal scores, keep modality tags in the index, and re-embed everything when any encoder changes.",
    takeaways: ["One space, many encoders, trained with cross-modal pairs.", "Anything can query anything; modalities never paired directly align through text.", "Cross-modal scores sit on different scales; calibrate per pair.", "A single vector loses fine detail; pair with reranking for precision."],
    terms: [["shared embedding space", "a vector space where several modalities' encoders place related items near each other"], ["cross-modal retrieval", "searching one modality with a query from another"], ["zero-shot classification", "classifying by comparing an item's embedding with embeddings of class descriptions"]],
    reflect: { q: "How can audio and images end up aligned in one space if no audio–image pairs were ever used in training?", a: "Through text as a bridge: audio was paired with descriptions and images with captions, both into the same text encoder's space, so audio and images that share descriptions end up near the same text, and therefore near each other. The alignment is weaker than for directly paired modalities, which is why calibration matters." },
  },

  "m48-cross-modal-attention": {
    simple: "Cross-modal attention lets tokens of one modality look at tokens of another, so a question's words can attend to image regions or audio frames directly.",
    concept:
      "Attention computes, for each query token, a weighted mix of value tokens based on how well queries match keys. In self-attention all three come from the same sequence. **Cross-modal attention** takes the queries from one modality and the keys and values from another: text tokens query image patches, or audio frames query text.\n\nThis is the mechanism by which 'the red car' finds the red car. The word tokens produce queries; each image patch produces a key and a value; the attention weights land on the patches showing the car, and their values flow into the word's representation. The attention map itself is a form of explanation: it shows which pixels the answer drew on.\n\nIt is used in two ways. Early-fusion models run self-attention over a mixed sequence, where cross-modal attention happens implicitly whenever a text query matches an image key. Late-fusion models add explicit cross-attention layers, keeping the text model's own layers intact and inserting a few layers where text queries attend to encoder outputs, which is cheaper to train and lets a strong text model be extended.",
    why:
      "Concatenating a vector summary of an image to a text input loses where things are and lets the model ignore the image. Attention gives fine-grained, content-dependent access: each word can look at the parts of the image it needs. It also scales: an image's 576 patches do not have to be squeezed into one vector.\n\nExplicit cross-attention layers exist so that a pretrained text model can be given sight or hearing without retraining it from scratch, by training only the new layers at first.",
    how: [
      "Compute queries Q from the text tokens with a learned matrix.",
      "Compute keys K and values V from the other modality's tokens (image patches, audio frames) with their own matrices.",
      "Scores = Q Kᵀ ÷ √d; softmax over the other modality's tokens gives attention weights per text token.",
      "Output = weights × V: each text token receives a mix of the image or audio content it attended to.",
      "Add the output to the text token (residual) and continue through the text model's layers.",
      "In late fusion, insert these layers every few text layers; train them on paired data with the text model frozen, then optionally unfreeze.",
    ],
    visual: {
      kind: "table",
      table: {
        head: ["Text token (query)", "Top image patches (keys)", "Weight", "What flows in (values)"],
        rows: [
          ["'red'", "patches 203, 204, 227", "0.31, 0.28, 0.19", "colour and object features of the car"],
          ["'car'", "patches 204, 228, 229", "0.35, 0.22, 0.20", "shape features of the car"],
          ["'behind'", "patches 180–190 (background)", "spread", "scene layout"],
          ["'the'", "nearly uniform", "0.002 each", "little; a function word has no visual referent"],
        ],
      },
      caption: "An illustrative attention map for 'the red car behind'. Content words land on their referents; function words spread thin.",
    },
    everyday: {
      title: "Reading a diagram while listening to the explanation",
      text: "A lecturer says 'this valve closes when the pressure here exceeds the spring force'. As you listen, your eyes jump to the valve, then to the 'here', then to the spring. Each word pulls your gaze to a part of the diagram. That gaze is cross-modal attention: words as queries, parts of the picture as keys and values.",
    },
    engineering: {
      title: "Giving an existing text assistant sight without retraining it",
      text: "A company has a 70-billion-parameter text model tuned over a year for their customer-support style. Retraining it as a multimodal model from scratch is out of the question. They adopt late fusion: a pretrained vision encoder, a projector, and cross-attention layers inserted after every fourth text layer, initialised so they contribute nothing at first. They train only the new layers on 500,000 image–text pairs for a week, with the text model frozen; the support-style behaviour is untouched. Then a short joint fine-tune. The assistant can now read screenshots customers send. The attention maps double as a debugging tool when it misreads one.",
    },
    maths: {
      formula: "attention(Q, K, V) = softmax(Q Kᵀ ÷ √d) V,   Q from text (n × d), K and V from image (m × d)",
      meaning: "n text tokens each attend over m image tokens; the result is n vectors of image content, one per word.",
      worked: [
        "One text query q = [1, 0], three image keys k₁ = [1, 0], k₂ = [0, 1], k₃ = [0.7, 0.7], d = 2.",
        "Scores q·k ÷ √2: 0.707, 0, 0.495.",
        "Softmax: exp → 2.03, 1.00, 1.64; sum 4.67; weights 0.43, 0.21, 0.35.",
        "If the values are v₁ = [2, 0], v₂ = [0, 2], v₃ = [1, 1]: output = 0.43·[2, 0] + 0.21·[0, 2] + 0.35·[1, 1] = [1.21, 0.77]. The word's representation now carries mostly patch 1's content.",
        "Cost: n × m score computations. For 60 words and 576 patches: 34,560 per head per layer, far cheaper than 636² self-attention over the concatenated sequence.",
      ],
    },
    code: {
      title: "Cross-attention from text to image tokens",
      lang: "py",
      src: `import numpy as np

def softmax(x):
    x = x - x.max(axis=-1, keepdims=True)
    e = np.exp(x)
    return e / e.sum(axis=-1, keepdims=True)

def cross_attention(text, image, Wq, Wk, Wv):
    Q = text @ Wq                    # (n, d) queries from words
    K = image @ Wk                   # (m, d) keys from patches
    V = image @ Wv                   # (m, d) values from patches
    weights = softmax(Q @ K.T / np.sqrt(Q.shape[1]))   # (n, m): each word's attention over patches
    return weights @ V, weights      # (n, d) image content per word, plus the map

out, attn = cross_attention(text_tokens, image_tokens, Wq, Wk, Wv)
print(attn[word_index("car")].argsort()[::-1][:3])   # the three patches 'car' looked at most`,
      lines: [
        { code: "Q = text @ Wq                    # (n, d) queries from words", say: "Queries come from the text side: what each word is looking for." },
        { code: "K = image @ Wk                   # (m, d) keys from patches", say: "Keys come from the image side: what each patch offers. Different matrices for different modalities." },
        { code: "weights = softmax(Q @ K.T / np.sqrt(Q.shape[1]))   # (n, m): each word's attention over patches", say: "A row per word, a column per patch: the map of where each word looked." },
        { code: "print(attn[word_index(\"car\")].argsort()[::-1][:3])   # the three patches 'car' looked at most", say: "The map is an explanation: these patch indices can be drawn on the image to show the evidence." },
      ],
    },
    useIt: "Cross-modal attention is inside every vision-language and audio-language model; use explicit cross-attention layers when extending an existing text model with a new modality, and use attention maps to debug misreadings and to show users the evidence behind an answer. Expect function words to attend diffusely and content words to localise.",
    takeaways: ["Queries from one modality, keys and values from another: words look at patches or frames.", "It gives fine-grained, content-dependent access instead of a single summary vector.", "Late fusion inserts cross-attention layers into a frozen text model; cheap to train, preserves behaviour.", "Attention maps show the evidence and help debug."],
    terms: [["cross-attention", "attention whose queries and keys come from different sequences"], ["attention map", "the matrix of weights showing what each query attended to"], ["late fusion", "adding modality encoders to a text model through inserted cross-attention layers"]],
    reflect: { q: "In an early-fusion model with one mixed sequence, is there any cross-modal attention?", a: "Yes, implicitly: self-attention over the mixed sequence lets a text query match image keys whenever their vectors align. The difference from late fusion is that image tokens also attend to text and to each other in every layer, which is more expressive and more expensive." },
  },
};

export const M48_QUIZ: Quiz[] = [
  {
    q: "A support request has 40 text tokens, a 336 × 336 photo (576 tokens) and a 5-second voice note (125 tokens). What dominates the cost?",
    options: ["The text, because it carries the question", "The photo, at 78% of the sequence", "The voice note", "They are equal"],
    answer: 1,
    why: ["The question is 5% of the tokens.", "Correct. Image tokens scale with resolution and dwarf the words.", "125 of 741 tokens.", "Modalities add; they are not equal."],
    reason: true,
  },
  {
    q: "How does contrastive training align images and captions without any labels of where objects are?",
    options: ["It uses bounding boxes", "It pulls each image's vector toward its own caption and away from other captions in the batch", "It generates captions and compares them", "It trains on video"],
    answer: 1,
    why: ["No region labels are needed.", "Correct. Whole-image and whole-caption vectors are matched; localisation is never supervised.", "That is captioning, a different objective.", "Video is not required."],
  },
  {
    q: "A multimodal assistant misses small print in scanned documents despite a week of fine-tuning the language model. Most likely cause?",
    options: ["The language model is too small", "The vision encoder's resolution or patch size cannot represent the small text, so it never reaches the language model", "The prompt is wrong", "The documents are too long"],
    answer: 1,
    why: ["Language size cannot restore detail the encoder dropped.", "Correct. Fix resolution, tiling or the encoder; the language model never sees what the encoder cannot encode.", "Prompts cannot add pixels.", "Length is unrelated to small print."],
    reason: true,
  },
  {
    q: "A model estimates 'about 12' boxes when there are 15. What is the best fix?",
    options: ["A larger vision encoder", "Ask it to enumerate the boxes (or call a detector) and count the list in code", "Lower the temperature", "Ask the question twice"],
    answer: 1,
    why: ["Vision already sees the boxes; the method of answering is the problem.", "Correct. Enumeration and tools turn description into counting.", "Temperature does not teach counting.", "Repeating a guess gives another guess."],
  },
  {
    q: "A transcript has 2 word edits against a 7-word reference. What is the word error rate?",
    options: ["2%", "28.6%", "7%", "71%"],
    answer: 1,
    why: ["WER is edits per reference word, not a percentage of edits.", "Correct. 2 ÷ 7 = 0.286.", "Not a count of words.", "That would be 5 edits."],
  },
  {
    q: "In text-to-speech, where does the 'naturalness' of a voice mainly come from?",
    options: ["The text normalisation stage", "The acoustic model's prosody and speaker conditioning", "The number of phonemes", "The sample rate alone"],
    answer: 1,
    why: ["Normalisation fixes pronunciation errors, not expressiveness.", "Correct. Pitch, rhythm, emphasis and voice are predicted or conditioned at the acoustic stage.", "Phoneme count is fixed by the words.", "Sample rate affects fidelity, not expression."],
  },
  {
    q: "A rare-event sound detector has recall 0.9 and a 0.5% false-alarm rate per motor-hour across 960 motor-hours a day. Why do technicians ignore it?",
    options: ["Recall is too low", "Nearly five false alerts a day swamp the roughly two real events a month, so precision is about 1%", "The microphones are wrong", "It has no timestamps"],
    answer: 1,
    why: ["Recall of 0.9 is fine.", "Correct. For rare events the false-alarm rate on the vast number of non-events decides trust.", "Possibly, but the arithmetic alone explains it.", "Timestamps would not reduce the alert count."],
  },
  {
    q: "A cooking video model cannot tell whether salt was added before or after oil. Likely cause?",
    options: ["The model cannot understand cooking", "Frame sampling and pooling are too coarse to separate two quick consecutive actions", "The audio track was missing", "The video was too short"],
    answer: 1,
    why: ["It understood the rest of the video.", "Correct. Order of brief events needs denser sampling or less pooling around those moments.", "Audio would not show the order of hand actions.", "Short videos are easier, not harder."],
  },
  {
    q: "Why are text-to-image similarity scores lower (around 0.3) than image-to-image scores (around 0.9) in a shared space, and what should you do?",
    options: ["The text encoder is broken; retrain it", "Cross-modal vectors occupy different regions, so scores are on different scales; calibrate thresholds per modality pair", "Use only image queries", "Multiply text scores by 3 always"],
    answer: 1,
    why: ["The ranking is correct; the scale differs.", "Correct. Calibrate per pair from validation examples, or use ranks.", "Text queries work; they need calibration.", "The factor must be measured, not guessed."],
  },
  {
    q: "What distinguishes cross-modal attention from self-attention?",
    options: ["It has no softmax", "Queries come from one modality and keys and values from another", "It is only used in audio", "It is cheaper because it skips the keys"],
    answer: 1,
    why: ["The formula is the same.", "Correct. Words query; patches or frames supply keys and values.", "It is used for any modality pair.", "Keys are still computed; the cost is n × m instead of (n + m)²."],
  },
];

export const M48_EXERCISES: Exercise[] = [
  {
    title: "Budget a multimodal request",
    kind: "calculate",
    task: "A request has a 60-word question (about 80 tokens), two 672 × 672 photos with 14-pixel patches, and a 20-second voice note encoded at 25 tokens per second. Compute the total tokens and the share from each modality. Then propose two changes that halve the cost while keeping the photos' large features readable.",
    hints: ["patches per photo = (672 ÷ 14)²", "pooling 2 × 2 patches cuts tokens by 4; lower resolution cuts by the square of the ratio"],
    solution: "Each photo: (672 ÷ 14)² = 48² = 2,304 tokens; two photos 4,608. Voice: 20 × 25 = 500. Text 80. Total 5,188: photos 88.8%, voice 9.6%, text 1.5%. Halving options: (1) pool each photo 2 × 2 → 576 each, total 1,732 (a third of the cost); large features survive, small text does not. (2) Resize photos to 448 × 448 → 32² = 1,024 each, total 2,628 (about half). Keep one photo at full resolution if one contains the detail that matters.",
  },
  {
    title: "Compute WER and decide if it is good enough",
    kind: "calculate",
    task: "Reference: 'transfer three hundred pounds to the savings account today' (9 words). Output: 'transfer three hundred pounds to savings account to day'. Compute WER by counting substitutions, deletions and insertions. Then explain why a bank would also measure something else before deploying.",
    hints: ["Align word by word; 'to day' is two output words for one reference word."],
    solution: "Alignment: 'the' deleted (1 deletion); 'today' → 'to' + 'day' = 1 substitution ('today' → 'to') + 1 insertion ('day'). Total 3 edits ÷ 9 = 0.333, WER 33.3%. But the meaning is intact: the amount and the account are right. A bank would measure critical-entity accuracy (amounts, account names, dates) separately, because a 5% WER model that gets amounts wrong is worse than a 33% WER model that gets them right.",
  },
  {
    title: "Design a safe counting pipeline",
    kind: "think",
    task: "A warehouse wants a multimodal model to answer 'how many pallets are in bay 7?' from a camera image, with answers trusted enough to drive stock decisions. Design the pipeline so the model's weakness at counting does not matter, and say what you would measure.",
    hints: ["Enumerate, don't estimate.", "Tools for precision; the model for language and relations.", "Report per-question-type accuracy."],
    solution: "Pipeline: (1) a detector trained on pallets returns boxes with confidences; (2) the multimodal model receives the image plus the detection list and is asked only for relations and anomalies ('are any pallets stacked unsafely?', 'is bay 7 the region between these markers?'); (3) the count comes from the detection list in code, filtered to bay 7's region; (4) the answer shows the boxes as evidence. Measure: detector precision and recall on a labelled set from these cameras, count accuracy on 200 bay images, and the model's relation-question accuracy separately. Re-measure after any camera change.",
  },
  {
    title: "Work a cross-attention step by hand",
    kind: "calculate",
    task: "A text query q = [0, 1]. Image keys: k₁ = [1, 0], k₂ = [0, 1], k₃ = [0.6, 0.8]; values v₁ = [10, 0], v₂ = [0, 10], v₃ = [5, 5]; d = 2. Compute the scaled scores, the softmax weights (to two decimals) and the output vector. Which patch did the word mostly look at?",
    hints: ["score = q·k ÷ √2", "softmax: exp each, divide by the sum"],
    solution: "Scores: q·k₁ = 0, q·k₂ = 1, q·k₃ = 0.8; divided by √2 ≈ 1.414 → 0, 0.707, 0.566. exp → 1.00, 2.03, 1.76; sum 4.79; weights 0.21, 0.42, 0.37. Output = 0.21·[10, 0] + 0.42·[0, 10] + 0.37·[5, 5] = [2.1 + 0 + 1.85, 0 + 4.2 + 1.85] = [3.95, 6.05]. The word attended mostly to patch 2, with patch 3 close behind; its new representation is dominated by patch 2's value.",
  },
];
