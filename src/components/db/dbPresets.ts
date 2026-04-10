import type { Preset } from "@/components/shared/PresetsDrawer"

export const DB_PRESETS: Preset[] = [
    {
        name: "E-commerce",
        category: "Common Schemas",
        description: "Users, products, orders, and reviews",
        content: `Table users {
  id integer [primary key]
  username varchar [not null, unique]
  email varchar [not null, unique]
  password_hash varchar [not null]
  full_name varchar
  created_at timestamp [default: \`now()\`]
}

Table products {
  id integer [primary key]
  name varchar [not null]
  description text
  price decimal [not null]
  stock_quantity integer [not null, default: 0]
  category varchar
  created_at timestamp [default: \`now()\`]
}

Table orders {
  id integer [primary key]
  user_id integer [not null]
  status varchar [not null, default: 'pending']
  total_amount decimal [not null]
  shipping_address text
  created_at timestamp [default: \`now()\`]
}

Table order_items {
  id integer [primary key]
  order_id integer [not null]
  product_id integer [not null]
  quantity integer [not null]
  unit_price decimal [not null]
}

Table reviews {
  id integer [primary key]
  user_id integer [not null]
  product_id integer [not null]
  rating integer [not null]
  comment text
  created_at timestamp [default: \`now()\`]
}

Ref: orders.user_id > users.id
Ref: order_items.order_id > orders.id
Ref: order_items.product_id > products.id
Ref: reviews.user_id > users.id
Ref: reviews.product_id > products.id
`,
    },
    {
        name: "Blog",
        category: "Common Schemas",
        description: "Users, posts, comments, and tags",
        content: `Table users {
  id integer [primary key]
  username varchar [not null, unique]
  email varchar [not null, unique]
  bio text
  avatar_url varchar
  created_at timestamp [default: \`now()\`]
}

Table posts {
  id integer [primary key]
  title varchar [not null]
  slug varchar [not null, unique]
  body text [note: 'Markdown content']
  user_id integer [not null]
  status varchar [not null, default: 'draft']
  published_at timestamp
  created_at timestamp [default: \`now()\`]
}

Table comments {
  id integer [primary key]
  body text [not null]
  user_id integer [not null]
  post_id integer [not null]
  parent_id integer
  created_at timestamp [default: \`now()\`]
}

Table tags {
  id integer [primary key]
  name varchar [not null, unique]
  slug varchar [not null, unique]
}

Table post_tags {
  id integer [primary key]
  post_id integer [not null]
  tag_id integer [not null]
}

Ref: posts.user_id > users.id
Ref: comments.user_id > users.id
Ref: comments.post_id > posts.id
Ref: comments.parent_id > comments.id
Ref: post_tags.post_id > posts.id
Ref: post_tags.tag_id > tags.id
`,
    },
    {
        name: "SaaS Multi-tenant",
        category: "Application Schemas",
        description: "Tenants, users, plans, and subscriptions",
        content: `Table tenants {
  id integer [primary key]
  name varchar [not null]
  slug varchar [not null, unique]
  domain varchar [unique]
  plan_id integer [not null]
  created_at timestamp [default: \`now()\`]
}

Table users {
  id integer [primary key]
  tenant_id integer [not null]
  email varchar [not null, unique]
  full_name varchar [not null]
  role varchar [not null, default: 'member']
  is_active integer [not null, default: 1]
  created_at timestamp [default: \`now()\`]
}

Table plans {
  id integer [primary key]
  name varchar [not null, unique]
  price_monthly decimal [not null]
  price_yearly decimal [not null]
  max_users integer
  max_storage_gb integer
  features text [note: 'JSON array of feature flags']
}

Table subscriptions {
  id integer [primary key]
  tenant_id integer [not null]
  plan_id integer [not null]
  status varchar [not null, default: 'active']
  current_period_start timestamp [not null]
  current_period_end timestamp [not null]
  cancelled_at timestamp
  created_at timestamp [default: \`now()\`]
}

Table invoices {
  id integer [primary key]
  subscription_id integer [not null]
  amount decimal [not null]
  status varchar [not null, default: 'pending']
  due_date timestamp [not null]
  paid_at timestamp
}

Ref: tenants.plan_id > plans.id
Ref: users.tenant_id > tenants.id
Ref: subscriptions.tenant_id > tenants.id
Ref: subscriptions.plan_id > plans.id
Ref: invoices.subscription_id > subscriptions.id
`,
    },
    {
        name: "Auth System",
        category: "Application Schemas",
        description: "Users, roles, permissions, and sessions",
        content: `Table users {
  id integer [primary key]
  username varchar [not null, unique]
  email varchar [not null, unique]
  password_hash varchar [not null]
  is_active integer [not null, default: 1]
  email_verified_at timestamp
  last_login_at timestamp
  created_at timestamp [default: \`now()\`]
}

Table roles {
  id integer [primary key]
  name varchar [not null, unique]
  description text
}

Table permissions {
  id integer [primary key]
  name varchar [not null, unique]
  resource varchar [not null]
  action varchar [not null]
  description text
}

Table user_roles {
  id integer [primary key]
  user_id integer [not null]
  role_id integer [not null]
  granted_at timestamp [default: \`now()\`]
}

Table role_permissions {
  id integer [primary key]
  role_id integer [not null]
  permission_id integer [not null]
}

Table sessions {
  id integer [primary key]
  user_id integer [not null]
  token varchar [not null, unique]
  ip_address varchar
  user_agent text
  expires_at timestamp [not null]
  created_at timestamp [default: \`now()\`]
}

Ref: user_roles.user_id > users.id
Ref: user_roles.role_id > roles.id
Ref: role_permissions.role_id > roles.id
Ref: role_permissions.permission_id > permissions.id
Ref: sessions.user_id > users.id
`,
    },
]
