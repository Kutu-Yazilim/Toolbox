import { type Preset } from "@/components/shared/PresetsDrawer"

export const YAML_JSON_PRESETS: Preset[] = [
  {
    name: "Server Config",
    category: "Configuration",
    description: "Typical server configuration with database and logging",
    content: `server:
  host: localhost
  port: 8080
  ssl: true

database:
  driver: postgres
  host: db.example.com
  port: 5432
  name: myapp
  credentials:
    username: admin
    password: secret

logging:
  level: info
  outputs:
    - console
    - file
  file:
    path: /var/log/app.log
    maxSize: 10MB`,
  },
  {
    name: "Docker Compose",
    category: "DevOps",
    description: "Docker Compose service definition",
    content: `version: "3.8"
services:
  web:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./html:/usr/share/nginx/html
    depends_on:
      - api
  api:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://localhost:5432/app
    ports:
      - "3000:3000"`,
  },
  {
    name: "GitHub Actions",
    category: "DevOps",
    description: "CI/CD workflow configuration",
    content: `name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test`,
  },
  {
    name: "Kubernetes Deployment",
    category: "DevOps",
    description: "K8s deployment manifest",
    content: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: my-app
  labels:
    app: my-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: my-app
  template:
    metadata:
      labels:
        app: my-app
    spec:
      containers:
        - name: my-app
          image: my-app:latest
          ports:
            - containerPort: 8080
          resources:
            limits:
              memory: "256Mi"
              cpu: "500m"`,
  },
]
