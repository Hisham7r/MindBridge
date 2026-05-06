import { PrismaClient } from '@prisma/client'

// Singleton PrismaClient — the whole app shares one DB connection pool
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['warn', 'error'],
})

export default prisma
