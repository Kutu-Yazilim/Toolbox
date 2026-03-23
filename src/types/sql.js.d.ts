declare module "sql.js" {
  export interface QueryExecResult {
    columns: string[]
    values: (string | number | Uint8Array | null)[][]
  }

  export interface Statement {
    run(params?: unknown[]): void
    free(): void
  }

  export interface Database {
    exec(sql: string): QueryExecResult[]
    run(sql: string, params?: unknown[]): void
    prepare(sql: string): Statement
    close(): void
  }

  export interface SqlJsStatic {
    Database: new () => Database
  }

  export interface InitConfig {
    locateFile?: (file: string) => string
  }

  export default function initSqlJs(config?: InitConfig): Promise<SqlJsStatic>
}
