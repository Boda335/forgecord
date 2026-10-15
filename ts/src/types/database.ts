export type DatabaseDriverName = 'MONGODB' | 'Sqlite' | 'JSON' | 'MySQL';

export interface DatabaseOptions {
  table?: string;
  nested?: string;
  nestedIsEnabled?: boolean;
  cache?: {
    capacity?: number;
    isEnabled?: boolean;
  };
}

export interface ForgecordDatabaseConfig {
  database_type: DatabaseDriverName;
  options?: DatabaseOptions;
  MongoDB?: {
    uri?: string;
    database?: string;
    [key: string]: unknown;
  };
  MySQL?: {
    database?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    [key: string]: unknown;
  };
}
