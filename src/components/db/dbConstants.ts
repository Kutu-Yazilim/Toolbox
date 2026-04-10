export const STORAGE_KEY = "kutu-db-model"
export const TOOL_ID = "db-model"

export const DEFAULT_DBML = `// Use DBML to define your database structure
// Docs: https://dbml.dbdiagram.io/docs

Table users {
  id integer [primary key]
  username varchar
  email varchar [unique]
  role varchar
  created_at timestamp
}

Table posts {
  id integer [primary key]
  title varchar
  body text [note: 'Content of the post']
  user_id integer
  status varchar
  created_at timestamp
}

Table comments {
  id integer [primary key]
  body text
  user_id integer
  post_id integer
  created_at timestamp
}

Ref: posts.user_id > users.id // many-to-one
Ref: comments.user_id > users.id
Ref: comments.post_id > posts.id
`

export interface CheatsheetExample {
    code: string
    desc: string
}

export interface CheatsheetSection {
    title: string
    examples: CheatsheetExample[]
}

export const CHEATSHEET_ITEMS: CheatsheetSection[] = [
    {
        title: "Tables",
        examples: [
            { code: "Table users { ... }", desc: "Define a table" },
            { code: "Table schema.users { ... }", desc: "With schema name" },
        ],
    },
    {
        title: "Columns",
        examples: [
            { code: "id integer [primary key]", desc: "Primary key" },
            { code: "email varchar [unique]", desc: "Unique constraint" },
            { code: "name varchar [not null]", desc: "Not null" },
            { code: "status varchar [default: 'active']", desc: "Default value" },
        ],
    },
    {
        title: "References",
        examples: [
            { code: "Ref: posts.user_id > users.id", desc: "Many-to-one" },
            { code: "Ref: users.id - profiles.id", desc: "One-to-one" },
            { code: "Ref: posts.tags <> tags.posts", desc: "Many-to-many" },
        ],
    },
    {
        title: "Indexes",
        examples: [
            { code: "indexes { email [unique] }", desc: "Unique index" },
            { code: "indexes { (user_id, post_id) [pk] }", desc: "Composite PK" },
        ],
    },
    {
        title: "Enums",
        examples: [
            { code: "Enum status { draft, published }", desc: "Define enum" },
            { code: "status status_enum", desc: "Use as column type" },
        ],
    },
]
