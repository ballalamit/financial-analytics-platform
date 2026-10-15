"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, destroySession } from "@/lib/auth";
import { redirect } from "next/navigation";

const SignInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  portfolioName: z.string().min(2, "Portfolio name must be at least 2 characters"),
});

export type ActionState = {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function signInAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const validated = SignInSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: "Validation failed. Please check your inputs.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validated.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return { error: "Invalid email or password." };
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return { error: "Invalid email or password." };
    }

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: unknown) {
    console.error("Sign-in error:", err);
    return { error: "An unexpected error occurred. Please try again." };
  }

  redirect("/dashboard");
}

export async function registerAction(prevState: ActionState | null, formData: FormData): Promise<ActionState> {
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    portfolioName: formData.get("portfolioName"),
  };

  const validated = RegisterSchema.safeParse(rawData);
  if (!validated.success) {
    return {
      error: "Validation failed. Please check your inputs.",
      fieldErrors: validated.error.flatten().fieldErrors,
    };
  }

  const { name, email, password, portfolioName } = validated.data;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existing) {
      return { error: "An account with this email already exists." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        portfolios: {
          create: {
            name: portfolioName,
            cashBalance: 10000.0, // default $10,000 cash balance
          },
        },
      },
    });

    await createSession({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
  } catch (err: unknown) {
    console.error("Register error:", err);
    return { error: "Failed to create account. Please try again." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
