import { z } from "zod";

/**
 * Customer account validation, shared by the server actions and the test
 * suite. Lives outside actions.ts because a "use server" module may only
 * export async functions — exporting these schemas from there breaks the
 * production build.
 */
export const SignUpSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().toLowerCase().email("That email address doesn't look right.").max(200),
  password: z.string().min(8, "Password must be at least 8 characters.").max(128),
});

export const SignInSchema = z.object({
  email: z.string().trim().toLowerCase().email("That email address doesn't look right."),
  password: z.string().min(1, "Enter your password."),
});
