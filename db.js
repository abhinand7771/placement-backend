const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const hasConnectionString = Boolean(process.env.DATABASE_URL);

const pool = hasConnectionString
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  : null;

const query = async (text, params = []) => {
  if (!pool) {
    throw new Error("DATABASE_URL is not configured");
  }
  return pool.query(text, params);
};

module.exports = {
  query,
  hasConnectionString,
};
