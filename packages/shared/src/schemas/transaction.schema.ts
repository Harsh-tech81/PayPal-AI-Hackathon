import { z } from "zod";

export const CreateTransactionSchema = z.object({
  recipientEmail: z.string().min(3, "Valid recipient email or phone number is required"),
  amount: z.number().positive("Amount must be greater than 0"),
  currency: z.string().default("USD"),
  description: z.string().max(255).optional(),
  deviceFingerprint: z.string().optional(),
  ipAddress: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  timeOfTransfer: z.string().optional(),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

export const ApproveTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  challengeToken: z.string().optional(),
  verificationState: z.enum(["APPROVED", "AUTO_APPROVED", "REJECTED_FRAUD"]).default("APPROVED"),
});

export type ApproveTransactionInput = z.infer<typeof ApproveTransactionSchema>;

export const TransactionHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().optional(),
});
