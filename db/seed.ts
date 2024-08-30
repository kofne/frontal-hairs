import { cwd } from 'node:process'
import { loadEnvConfig } from '@next/env'

import { drizzle } from 'drizzle-orm/node-postgres'
import { Client } from 'pg'

import * as schema from './schema'
import sampleData from '@/lib/sample-data'

loadEnvConfig(cwd())

const main = async () => {
  try {
    const client = new Client({
      connectionString: process.env.POSTGRES_URL,
    })
    await client.connect()
    const db = drizzle(client)

    // Clear existing data
    await db.delete(schema.accounts)
    await db.delete(schema.users)
    await db.delete(schema.products)

    // Insert sample data and get results
    const resProducts = await db
      .insert(schema.products) // Assuming you meant to insert products
      .values(sampleData.products) // Ensure sampleData.products is defined
      .returning()

    const resUsers = await db
      .insert(schema.users)
      .values(sampleData.users)
      .returning()

    // Log results
    console.log({ resProducts, resUsers })

    await client.end()
  } catch (error) {
    console.error(error)
    throw new Error('Failed to seed database')
  }
}

main()
