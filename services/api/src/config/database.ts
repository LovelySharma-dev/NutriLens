import "dotenv/config"
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL ?? "postgresql://127.0.0.1:5432/nutrilens"

if (!process.env.DATABASE_URL) {
    console.warn("DATABASE_URL is not defined. Scan storage will fail until it is set. Email login still works.")
}

const adapter = new PrismaPg({
    connectionString,
})

const prisma = new PrismaClient({
    adapter
});

export default prisma