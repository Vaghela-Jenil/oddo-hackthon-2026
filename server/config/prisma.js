const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
require("dotenv").config();

// 1. Setup the Connection Pool
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 2. Setup the Driver Adapter
const adapter = new PrismaPg(pool);

// 3. Initialize the Client ONCE
const prisma = new PrismaClient({ adapter });

module.exports = prisma;