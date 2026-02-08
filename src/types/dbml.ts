export interface Column {
  name: string
  type: string
  isPrimaryKey: boolean
  isUnique: boolean
  isNotNull: boolean
  note?: string
}

export interface Table {
  name: string
  columns: Column[]
}

export interface Ref {
  from: {
    table: string
    column: string
  }
  to: {
    table: string
    column: string
  }
  type: "one-to-one" | "many-to-one" | "one-to-many" | "many-to-many"
}

export interface Database {
  tables: Table[]
  refs: Ref[]
}
