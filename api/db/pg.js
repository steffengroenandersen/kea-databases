import pg from "pg";

const {
  PGHOST = "postgres",
  PGPORT = 5432,
  PGDATABASE = "markindex",
  PGUSER = "database",
  PGPASSWORD = "database",
} = process.env;

export const pool = new pg.Pool({
  host: PGHOST,
  port: PGPORT,
  database: PGDATABASE,
  user: PGUSER,
  password: PGPASSWORD,
});
