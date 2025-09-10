import Database from 'better-sqlite3';

/**
 * Interface for database migrations
 */
export interface Migration {
  version: number;
  description: string;
  up: (db: Database.Database) => void;
}