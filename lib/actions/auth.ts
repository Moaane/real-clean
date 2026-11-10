"use server"

import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { Role } from "@/generated/prisma/enums"
import { prisma } from "@/lib/prisma"
import { ROLE_HOME } from "@/lib/roles"
import { createSession, deleteSession } from "@/lib/session"

export type AuthState = {
  error?: string
  fieldErrors?: Record<string, string[] | undefined>
  values?: { name?: string; email?: string; phone?: string }
}

const registerSchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(100),
  email: z.email("Email tidak valid").trim().toLowerCase().max(100),
  phone: z
    .string()
    .trim()
    .regex(
      /^(\+62|62|0)8\d{7,12}$/,
      "No. WA tidak valid (contoh: 08123456789)",
    ),
  password: z.string().min(8, "Password minimal 8 karakter").max(72),
})

const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1),
})

// Only same-site paths inside the customer area (/akun, /pesan) are honoured, so `next` can
// never become an open redirect or send a customer into another role's area.
const NEXT_PATTERN =
  /^\/(?:akun|pesan)(\/[A-Za-z0-9_\-./]*)?(\?[A-Za-z0-9_\-=&%.]*)?$/

function destination(formData: FormData, role: Role) {
  const next = String(formData.get("next") ?? "")
  if (role === "customer" && NEXT_PATTERN.test(next) && !next.includes("..")) {
    return next
  }
  return ROLE_HOME[role]
}

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    password: String(formData.get("password") ?? ""),
  }
  const values = { name: raw.name, email: raw.email, phone: raw.phone }

  const parsed = registerSchema.safeParse(raw)
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values }
  }

  const { name, email, phone, password } = parsed.data
  const exists = await prisma.user.findUnique({
    where: { email },
    select: { id_user: true },
  })
  if (exists) {
    return { fieldErrors: { email: ["Email sudah terdaftar"] }, values }
  }

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      role: "customer", // public sign-up can only ever create customers
      password: await bcrypt.hash(password, 10),
    },
    select: { id_user: true, role: true },
  })

  await createSession({ userId: user.id_user, role: user.role })
  redirect(destination(formData, user.role))
}

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  })
  const values = { email: String(formData.get("email") ?? "") }
  const genericError = "Email atau password salah"
  if (!parsed.success) return { error: genericError, values }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  })

  if (!user) return { error: genericError, values }

  const ok = await bcrypt.compare(parsed.data.password, user.password)
  if (!user || !ok) return { error: genericError, values }
  if (!user.is_active) {
    return { error: "Akun dinonaktifkan. Hubungi admin.", values }
  }

  await createSession({ userId: user.id_user, role: user.role })
  redirect(destination(formData, user.role))
}

export async function logout() {
  await deleteSession()
  redirect("/login")
}
