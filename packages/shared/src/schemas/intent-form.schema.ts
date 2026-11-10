import { z } from "zod";

export const IntentCategoryEnum = z.enum([
  "memory_anchors",
  "secret_habits",
  "pattern_sequences",
]);

export type IntentCategory = z.infer<typeof IntentCategoryEnum>;

export const MemoryAnchorItemSchema = z
  .object({
    id: z.string().optional(),
    category: IntentCategoryEnum,
    prompt: z.string().min(5, "Prompt must be at least 5 characters"),
    answer: z.string().optional(),
    encryptedAnswer: z.string().optional(),
    hint: z.string().optional(),
  })
  .refine(
    (data) => {
      // Must provide either an answer or a pre-encrypted answer
      const hasAnswer = typeof data.answer === "string" && data.answer.trim().length > 0;
      const hasEncrypted = typeof data.encryptedAnswer === "string" && data.encryptedAnswer.trim().length > 0;
      return hasAnswer || hasEncrypted;
    },
    { message: "Either a memory answer or pre-encrypted answer must be provided" }
  )
  .refine(
    (data) => {
      // If a plaintext answer is provided (not an encrypted hex string containing colons)
      if (data.answer && !data.encryptedAnswer && !data.answer.includes(":")) {
        const words = data.answer.trim().split(/\s+/);
        return words.length <= 6;
      }
      return true;
    },
    { message: "Answer should be concise (1-5 words)" }
  );

export type MemoryAnchorItem = z.infer<typeof MemoryAnchorItemSchema>;

export const IntentFormSetupSchema = z.object({
  userId: z.string().optional(),
  secrets: z
    .array(MemoryAnchorItemSchema)
    .min(1, "Please provide at least 1 memory anchor")
    .max(30, "Maximum 30 memory anchors allowed"),
});

export type IntentFormSetupInput = z.infer<typeof IntentFormSetupSchema>;

export const PRESET_INTENT_PROMPTS = [
  {
    category: "memory_anchors" as const,
    prompt: "Name of your first childhood dog and their favorite snack",
    placeholder: "e.g. Bruno who loved biscuits",
    hint: "Childhood memories that cannot be searched on social media",
  },
  {
    category: "memory_anchors" as const,
    prompt: "What secret pet name did your grandmother call you when sick?",
    placeholder: "e.g. Sunshine",
    hint: "Private family pet name or endearment",
  },
  {
    category: "memory_anchors" as const,
    prompt: "Where did you take a cold tumble during a winter vacation?",
    placeholder: "e.g. Zurich ski hill",
    hint: "An unrecorded private travel incident",
  },
  {
    category: "secret_habits" as const,
    prompt: "What odd food combination do you secretly eat when alone?",
    placeholder: "e.g. Fries with chocolate shake",
    hint: "A quirky comfort habit only you know",
  },
  {
    category: "secret_habits" as const,
    prompt: "What song do you always sing in the shower when stressed?",
    placeholder: "e.g. Bohemian Rhapsody",
    hint: "Personal private routine",
  },
  {
    category: "secret_habits" as const,
    prompt: "What was the very first item you bought with your own earned paycheck?",
    placeholder: "e.g. Blue guitar strap",
    hint: "Personal milestone item",
  },
  {
    category: "pattern_sequences" as const,
    prompt: "Your secret lucky 3-digit number and the reason behind it",
    placeholder: "e.g. 742 first apartment",
    hint: "Private cognitive association",
  },
  {
    category: "pattern_sequences" as const,
    prompt: "The street name of the house where you fell and bruised your knee as a child",
    placeholder: "e.g. Elm Street alley",
    hint: "Childhood landmark",
  },
  {
    category: "pattern_sequences" as const,
    prompt: "The nickname of your favorite elementary school teacher",
    placeholder: "e.g. Captain Green",
    hint: "School memory",
  },
  {
    category: "memory_anchors" as const,
    prompt: "The color and make of your family's oldest road-trip car",
    placeholder: "e.g. Rusty red wagon",
    hint: "Sentimental family anchor",
  },
];
