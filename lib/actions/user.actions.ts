'use server'

import { isRedirectError } from 'next/dist/client/components/redirect'
import { signIn, signOut } from '@/auth'
import { signInFormSchema, signUpFormSchema } from '../validator'
import db from '@/db/drizzle'
import { users } from '@/db/schema'

// USER
export async function signUp(_prevState: unknown, formData: FormData) {
  try {
    // Dynamically import bcryptjs
    const bcrypt = await import('bcryptjs')

    // Parse and validate the form data
    const user = signUpFormSchema.parse({
      name: formData.get('name')?.toString(),
      email: formData.get('email')?.toString(),
      confirmPassword: formData.get('confirmPassword')?.toString(),
      password: formData.get('password')?.toString(),
    })

    // Prepare the values for insertion into the database
    const values = {
      id: crypto.randomUUID(),
      name: user.name,
      email: user.email,
      password: bcrypt.hashSync(user.password, 10),
    }

    // Insert the new user into the database
    await db.insert(users).values(values)

    // Automatically sign the user in after successful signup
    await signIn('credentials', {
      email: user.email,
      password: user.password,
    })

    return { success: true, message: 'User created successfully' }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    // Handle errors related to unique email constraint
    return {
      success: false,
      message: formatError(error).includes(
        'duplicate key value violates unique constraint "user_email_idx"'
      )
        ? 'Email already exists'
        : formatError(error),
    }
  }
}

export async function signInWithCredentials(
  _prevState: unknown,
  formData: FormData
) {
  try {
    // Parse and validate the form data
    const user = signInFormSchema.parse({
      email: formData.get('email')?.toString(),
      password: formData.get('password')?.toString(),
    })

    // Attempt to sign in the user with the provided credentials
    await signIn('credentials', {
      email: user.email,
      password: user.password,
    })

    return { success: true, message: 'Signed in successfully' }
  } catch (error) {
    if (isRedirectError(error)) {
      throw error
    }

    return { success: false, message: 'Invalid email or password' }
  }
}

export async function signOutUser() {
  // Sign the user out
  await signOut()
}

// Helper functions
function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}
