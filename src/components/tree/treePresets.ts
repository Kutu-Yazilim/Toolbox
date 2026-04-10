import type { Preset } from "@/components/shared/PresetsDrawer"

export const TREE_PRESETS: Preset[] = [
    {
        name: "Flutter App",
        category: "Mobile",
        description: "Standard Flutter project with features architecture",
        content: `lib
  navigation
    components
    providers
    shells
    app_router.dart
  theme
    providers
      app_color_provider.dart
      app_theme_provider.dart
    colors
      tailwind_colors.dart
      app_colors.dart
    app_size.dart
    app_text_style.dart
    app_color_scheme.dart
  features
    home
      models
      repositories
      services
      presentation
        components
        home_page.dart
      providers
    auth
      models
      repositories
      services
      presentation
        components
        auth_page.dart
      providers
  shared
    models
    interfaces
    services
    components
    utils
    constants
    enums
    extensions`,
    },
    {
        name: "React (CRA)",
        category: "Frontend",
        description: "Create React App project structure",
        content: `src
  components
    Header
      Header.tsx
      Header.module.css
      Header.test.tsx
    Footer
      Footer.tsx
      Footer.module.css
  hooks
    useAuth.ts
    useApi.ts
  contexts
    AuthContext.tsx
    ThemeContext.tsx
  pages
    Home
      Home.tsx
      Home.module.css
    About
      About.tsx
  services
    api.ts
    auth.ts
  utils
    helpers.ts
    constants.ts
  types
    index.ts
  App.tsx
  index.tsx
public
  index.html
  favicon.ico`,
    },
    {
        name: "Next.js App Router",
        category: "Frontend",
        description: "Next.js 14+ project with App Router",
        content: `src
  app
    layout.tsx
    page.tsx
    globals.css
    loading.tsx
    error.tsx
    not-found.tsx
    api
      auth
        route.ts
      users
        route.ts
    dashboard
      layout.tsx
      page.tsx
      settings
        page.tsx
  components
    ui
      button.tsx
      input.tsx
      dialog.tsx
    layout
      header.tsx
      sidebar.tsx
      footer.tsx
  hooks
    use-auth.ts
    use-debounce.ts
  lib
    utils.ts
    db.ts
  types
    index.ts
public
  images
  fonts`,
    },
    {
        name: "Node.js API",
        category: "Backend",
        description: "Express.js REST API project structure",
        content: `src
  controllers
    auth.controller.ts
    users.controller.ts
    posts.controller.ts
  middleware
    auth.middleware.ts
    error.middleware.ts
    validate.middleware.ts
  models
    user.model.ts
    post.model.ts
  routes
    auth.routes.ts
    users.routes.ts
    posts.routes.ts
  services
    auth.service.ts
    users.service.ts
    email.service.ts
  utils
    logger.ts
    helpers.ts
  config
    database.ts
    env.ts
  types
    index.ts
  app.ts
  server.ts
tests
  unit
  integration`,
    },
    {
        name: "Python Package",
        category: "Backend",
        description: "Standard Python package layout",
        content: `src
  mypackage
    __init__.py
    core
      __init__.py
      engine.py
      processor.py
    models
      __init__.py
      base.py
      user.py
    utils
      __init__.py
      helpers.py
      validators.py
    cli.py
    config.py
tests
  __init__.py
  conftest.py
  test_engine.py
  test_processor.py
  test_models.py
docs
  conf.py
  index.rst
  api.rst
pyproject.toml
setup.cfg`,
    },
    {
        name: "Go Module",
        category: "Backend",
        description: "Go project with standard layout",
        content: `cmd
  server
    main.go
  cli
    main.go
internal
  handler
    auth.go
    users.go
    middleware.go
  service
    auth.go
    users.go
  repository
    postgres
      users.go
      migrations.go
    redis
      cache.go
  model
    user.go
    session.go
  config
    config.go
pkg
  logger
    logger.go
  validator
    validator.go
api
  openapi.yaml
go.mod
go.sum
Makefile`,
    },
]
