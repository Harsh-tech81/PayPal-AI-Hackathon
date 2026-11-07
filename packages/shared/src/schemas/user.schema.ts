import { z } from "zod";

export const RegisterUserSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(8, "Phone number must be at least 8 digits").max(20),
  password: z.string().min(8, "Password must be at least 8 characters"),
  agreeToSecurityProtocol: z.boolean().refine((val) => val === true, {
    message: "You must agree to the Cognitive Security Protocol",
  }),
});

export type RegisterUserInput = z.infer<typeof RegisterUserSchema>;

export const LoginUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginUserInput = z.infer<typeof LoginUserSchema>;

export const DeviceSchema = z.object({
  deviceName: z.string().min(1),
  deviceFingerprint: z.string().min(8),
  osType: z.string().default("Unknown"),
  userAgent: z.string().optional(),
  ipAddress: z.string().optional(),
  isTrusted: z.boolean().default(false),
});

export type DeviceInput = z.infer<typeof DeviceSchema>;
