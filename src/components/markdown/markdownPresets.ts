import { type Preset } from "@/components/shared/PresetsDrawer"

export const MARKDOWN_PRESETS: Preset[] = [
    {
        name: "README Template",
        category: "Templates",
        description: "Standard project README structure",
        content: `# Project Name

> Brief description of your project

## Installation

\`\`\`bash
npm install project-name
\`\`\`

## Usage

\`\`\`javascript
import { thing } from 'project-name'
\`\`\`

## API Reference

| Method | Description |
|--------|-------------|
| \`init()\` | Initialize the library |
| \`run()\` | Execute the main function |

## Contributing

Pull requests are welcome.

## License

[MIT](LICENSE)
`,
    },
    {
        name: "Meeting Notes",
        category: "Templates",
        description: "Template for meeting minutes",
        content: `# Meeting Notes

**Date:** $(date)
**Attendees:** Alice, Bob, Charlie

## Agenda

1. Project status update
2. Blocker discussion
3. Next steps

## Action Items

- [ ] Alice: Complete feature X by Friday
- [ ] Bob: Review PR #42
- [ ] Charlie: Update documentation

## Notes

> Key decision: We agreed to proceed with Option A.
`,
    },
    {
        name: "API Documentation",
        category: "Documentation",
        description: "REST API endpoint documentation",
        content: `# API Documentation

## Endpoints

### GET /api/users

Returns a list of users.

**Headers:**

| Header | Value |
|--------|-------|
| Authorization | Bearer \`<token>\` |

**Response:**

\`\`\`json
{
  "data": [
    { "id": 1, "name": "Alice" }
  ],
  "total": 100
}
\`\`\`

### POST /api/users

Create a new user.

**Request Body:**

\`\`\`json
{
  "name": "Bob",
  "email": "bob@example.com"
}
\`\`\`

**Response:** \`201 Created\`
`,
    },
    {
        name: "Changelog Entry",
        category: "Templates",
        description: "Version changelog format",
        content: `# Changelog

## [1.2.0] - 2024-03-15

### Added
- New feature X for improved performance
- Support for custom themes

### Changed
- Updated dependency Y to v3.0
- Improved error messages

### Fixed
- Fixed crash when input is empty (#123)
- Corrected typo in documentation

### Removed
- Deprecated API endpoint \`/v1/old\`
`,
    },
]
