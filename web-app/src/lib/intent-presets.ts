/**
 * PayShield AI — Client-Safe Intent Presets, Metadata, & Word Validators.
 * Self-contained inside web-app to avoid Next.js external module resolution issues.
 */

export type IntentCategory = "memory_anchors" | "secret_habits" | "pattern_sequences";

export interface CategoryMeta {
  id: IntentCategory;
  title: string;
  shortTitle: string;
  subtitle: string;
  badge: string;
  iconName: string;
  description: string;
}

export interface PresetPrompt {
  id: string;
  category: IntentCategory;
  prompt: string;
  placeholder: string;
  hint: string;
  demoAnswer: string;
}

export interface AnchorEntry {
  id: string;
  category: IntentCategory;
  prompt: string;
  answer: string;
  hint: string;
  isCustom?: boolean;
}

export const MIN_QUESTIONS_PER_CATEGORY = 4;
export const MAX_WORDS_PER_ANSWER = 5;

export const INTENT_CATEGORIES: CategoryMeta[] = [
  {
    id: "memory_anchors",
    title: "1. Memory Anchors",
    shortTitle: "Memory Anchors",
    subtitle: "Personal milestones, memorable trips, and childhood experiences",
    badge: "Personal History",
    iconName: "HeartHandshake",
    description: "Deep personal memories that do not exist in digital records, password managers, or social profiles.",
  },
  {
    id: "secret_habits",
    title: "2. Secret Habits",
    shortTitle: "Secret Habits",
    subtitle: "Quirky comfort rituals, favorite spots, and personal traditions",
    badge: "Daily Habits",
    iconName: "Sparkles",
    description: "Intimate daily quirks, comfort foods, and private traditions that only you experience.",
  },
  {
    id: "pattern_sequences",
    title: "3. Pattern Sequences",
    shortTitle: "Pattern Sequences",
    subtitle: "Lucky numbers, nostalgic landmarks, and school nicknames",
    badge: "Private Codes",
    iconName: "KeyRound",
    description: "Personal associations, favorite landmarks, and private identifiers.",
  },
];

export const DEFAULT_PRESET_PROMPTS: PresetPrompt[] = [
  // Category 1: Memory Anchors (5 Presets)
  {
    id: "anc_mem_01",
    category: "memory_anchors",
    prompt: "Name of your first childhood dog and their favorite morning snack",
    placeholder: "e.g. Bruno who loved biscuits",
    hint: "Childhood family pet and specific snack",
    demoAnswer: "Bruno who loved biscuits",
  },
  {
    id: "anc_mem_02",
    category: "memory_anchors",
    prompt: "What secret pet name did your grandmother call you when sick?",
    placeholder: "e.g. Sunshine",
    hint: "Private grandmother nickname or endearment",
    demoAnswer: "Sunshine",
  },
  {
    id: "anc_mem_03",
    category: "memory_anchors",
    prompt: "Where did you take a cold tumble during a memorable winter trip?",
    placeholder: "e.g. Zurich ski slope",
    hint: "Winter vacation funny accident or location",
    demoAnswer: "Zurich ski slope",
  },
  {
    id: "anc_mem_04",
    category: "memory_anchors",
    prompt: "Make and color of your family's oldest unforgettable road-trip car",
    placeholder: "e.g. Rusty maroon Volvo",
    hint: "Vintage family car make and color",
    demoAnswer: "Rusty maroon Volvo",
  },
  {
    id: "anc_mem_05",
    category: "memory_anchors",
    prompt: "Name of your earliest neighborhood playmate and favorite game",
    placeholder: "e.g. Leo playing marbles",
    hint: "First childhood friend and sidewalk game",
    demoAnswer: "Leo playing marbles",
  },

  // Category 2: Secret Habits (5 Presets)
  {
    id: "anc_hab_01",
    category: "secret_habits",
    prompt: "What odd food combination do you secretly eat when home alone?",
    placeholder: "e.g. Fries dipped in chocolate milkshake",
    hint: "Late-night odd comfort snack",
    demoAnswer: "Fries dipped in chocolate milkshake",
  },
  {
    id: "anc_hab_02",
    category: "secret_habits",
    prompt: "What iconic song do you always sing out loud in the shower when stressed?",
    placeholder: "e.g. Bohemian Rhapsody",
    hint: "Personal shower rock classic",
    demoAnswer: "Bohemian Rhapsody",
  },
  {
    id: "anc_hab_03",
    category: "secret_habits",
    prompt: "What was the very first memorable item you bought with your own earned paycheck?",
    placeholder: "e.g. Blue Fender guitar strap",
    hint: "First salary milestone souvenir",
    demoAnswer: "Blue Fender guitar strap",
  },
  {
    id: "anc_hab_04",
    category: "secret_habits",
    prompt: "Your secret custom tea or coffee order that nobody else knows",
    placeholder: "e.g. Extra hot cinnamon oat chai",
    hint: "Private everyday beverage formula",
    demoAnswer: "Extra hot cinnamon oat chai",
  },
  {
    id: "anc_hab_05",
    category: "secret_habits",
    prompt: "A sentimental lucky charm or pocket souvenir you keep in your desk",
    placeholder: "e.g. Grandpa lucky brass coin",
    hint: "Personal keepsake in your drawer",
    demoAnswer: "Grandpa lucky brass coin",
  },

  // Category 3: Pattern Sequences (5 Presets)
  {
    id: "anc_pat_01",
    category: "pattern_sequences",
    prompt: "Your secret lucky 3-digit number and what it originally stood for",
    placeholder: "e.g. 742 first apartment number",
    hint: "Old home address digits or milestone code",
    demoAnswer: "742 first apartment number",
  },
  {
    id: "anc_pat_02",
    category: "pattern_sequences",
    prompt: "Street where you fell and scraped your knee learning to ride a bicycle",
    placeholder: "e.g. Maple avenue sidewalk",
    hint: "Childhood neighborhood street landmark",
    demoAnswer: "Maple avenue sidewalk",
  },
  {
    id: "anc_pat_03",
    category: "pattern_sequences",
    prompt: "Beloved nickname of your favorite 4th grade elementary school teacher",
    placeholder: "e.g. Captain Green",
    hint: "Elementary school teacher nickname",
    demoAnswer: "Captain Green",
  },
  {
    id: "anc_pat_04",
    category: "pattern_sequences",
    prompt: "Name of the vintage theater hall where you saw your first movie",
    placeholder: "e.g. Regal cinema downtown",
    hint: "First memorable cinema location",
    demoAnswer: "Regal cinema downtown",
  },
  {
    id: "anc_pat_05",
    category: "pattern_sequences",
    prompt: "Secret hideout tree or landmark behind your childhood home",
    placeholder: "e.g. Big willow behind library",
    hint: "Secret hometown retreat location",
    demoAnswer: "Big willow behind library",
  },
];

/**
 * Counts words in a string, stripping excess spaces.
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Builds initial blank anchors state (empty answers, rich placeholders).
 */
export function createInitialBlankAnchors(): AnchorEntry[] {
  return DEFAULT_PRESET_PROMPTS.map((p) => ({
    id: p.id,
    category: p.category,
    prompt: p.prompt,
    answer: "",
    hint: p.hint,
    isCustom: false,
  }));
}
