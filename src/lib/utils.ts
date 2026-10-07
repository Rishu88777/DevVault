import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs))

/** Turns any thrown value into a short, user-safe message (never a stack trace). */
export const errorMessage = (e: unknown, fallback = 'Something went wrong.') =>
  e instanceof Error && e.message ? e.message : fallback

export class UserError extends Error {
  constructor(message: string, public hints: string[] = []) {
    super(message)
    this.name = 'UserError'
  }
}
