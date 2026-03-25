export type FaqItem = {
  question: string
  answer: string
}

export type ToolFaq = {
  toolId: string
  faqs: FaqItem[]
}

export const TOOL_FAQS: ToolFaq[] = [
  // ─── Dev Tools ────────────────────────────────────────────────
  {
    toolId: "tree",
    faqs: [
      { question: "Is the Tree Generator free to use?", answer: "Yes, it is completely free with no sign-up required." },
      { question: "Is my data safe when using the Tree Generator?", answer: "All processing happens in your browser. No data is sent to any server." },
      { question: "What indentation formats are supported?", answer: "The tool supports both spaces and tabs for indentation. Each level of indentation creates a child node in the tree." },
    ],
  },
  {
    toolId: "db-model",
    faqs: [
      { question: "What is DBML?", answer: "DBML (Database Markup Language) is a simple, readable DSL for defining database schemas. It supports tables, columns, indexes, enums, and relationships." },
      { question: "Is my database schema data private?", answer: "Yes, all processing happens locally in your browser. Your schema data is never sent to any server." },
      { question: "Can I export my ER diagram as an image?", answer: "You can copy the DBML code to share with others. The visual diagram renders in real time from the DBML source." },
      { question: "What relationship types are supported?", answer: "The tool supports one-to-one, one-to-many, and many-to-many relationships using standard DBML reference syntax." },
      { question: "Is the DB Model tool free?", answer: "Yes, completely free with no sign-up or usage limits." },
    ],
  },
  {
    toolId: "json",
    faqs: [
      { question: "Is this JSON formatter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my JSON data safe?", answer: "All processing happens in your browser. No data is sent to any server." },
      { question: "Can I compare two JSON files?", answer: "Yes, switch to the Diff tab to paste two JSON documents and see highlighted differences between them." },
      { question: "Does it support minification?", answer: "Yes, you can format (beautify) or minify JSON with one click." },
      { question: "What happens if my JSON is invalid?", answer: "The editor shows inline error messages pointing to the exact location of the syntax error so you can fix it quickly." },
    ],
  },
  {
    toolId: "regex",
    faqs: [
      { question: "Is the Regex Tester free?", answer: "Yes, it is completely free with no sign-up required." },
      { question: "What regex flags are supported?", answer: "The tool supports global (g), case-insensitive (i), multiline (m), and dotAll (s) flags, which you can toggle with buttons." },
      { question: "Does it show capture groups?", answer: "Yes, capture groups are highlighted in distinct colors and their values are displayed in the match details." },
      { question: "Is my test data private?", answer: "All regex matching happens in your browser. No data is sent to any server." },
      { question: "What regex engine does it use?", answer: "It uses the JavaScript regex engine built into your browser, which follows the ECMAScript specification." },
    ],
  },
  {
    toolId: "api",
    faqs: [
      { question: "Is the API Client free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What HTTP methods are supported?", answer: "The tool supports GET, POST, PUT, PATCH, and DELETE methods." },
      { question: "Can I set custom headers?", answer: "Yes, you can add any number of custom headers as key-value pairs in the headers editor." },
      { question: "Are my API requests private?", answer: "Requests are sent directly from your browser to the target API. No data passes through our servers." },
      { question: "Does it support request body formats?", answer: "Yes, you can send JSON, form-data, and raw text request bodies." },
    ],
  },
  {
    toolId: "markdown",
    faqs: [
      { question: "Is the Markdown Editor free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What Markdown syntax is supported?", answer: "The editor supports CommonMark and GitHub Flavored Markdown (GFM), including tables, task lists, strikethrough, and code blocks." },
      { question: "Can I export the rendered HTML?", answer: "Yes, you can copy the rendered HTML output or the raw Markdown text." },
      { question: "Is my content stored anywhere?", answer: "No, all content stays in your browser. Nothing is saved to any server." },
    ],
  },
  {
    toolId: "sql-formatter",
    faqs: [
      { question: "What SQL dialects are supported?", answer: "The tool supports Standard SQL, PostgreSQL, MySQL, MariaDB, SQLite, BigQuery, and other common dialects." },
      { question: "Is the SQL Formatter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can it minify SQL queries?", answer: "Yes, you can both format (beautify) and minify SQL queries with one click." },
      { question: "Is my SQL data private?", answer: "All formatting happens in your browser. No SQL code is sent to any server." },
    ],
  },
  {
    toolId: "text-diff",
    faqs: [
      { question: "Is the Text Diff tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What diff view modes are available?", answer: "You can view differences in side-by-side mode or inline mode, with color-coded additions and deletions." },
      { question: "Is my text data private?", answer: "All comparison happens in your browser. No text data is sent to any server." },
      { question: "Can it handle large texts?", answer: "Yes, the tool is optimized to handle large text inputs efficiently." },
    ],
  },
  {
    toolId: "json-to-types",
    faqs: [
      { question: "What programming languages are supported?", answer: "The tool generates types for TypeScript, Dart, C#, Python, and Java." },
      { question: "Does it handle nested JSON objects?", answer: "Yes, nested objects and arrays are automatically detected and converted into properly nested type definitions." },
      { question: "Is the JSON to Types tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my JSON data private?", answer: "All type generation happens in your browser. No data is sent to any server." },
      { question: "Does it handle nullable types?", answer: "Yes, null values in the JSON are inferred as nullable types in the generated code." },
    ],
  },
  {
    toolId: "cron",
    faqs: [
      { question: "Is the Cron Builder free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What cron format does it use?", answer: "The tool uses the standard five-field cron format: minute, hour, day of month, month, and day of week." },
      { question: "Does it show when the cron job will run next?", answer: "Yes, the tool displays the next several run times based on your cron expression so you can verify the schedule." },
      { question: "Can I type a cron expression manually?", answer: "Yes, you can either use the visual builder or type a cron expression directly. Both views stay in sync." },
    ],
  },
  {
    toolId: "http-status",
    faqs: [
      { question: "Is the HTTP Status reference free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it include all HTTP status codes?", answer: "Yes, it covers all standard HTTP status codes from 100 to 599, organized by category." },
      { question: "Can I search for a specific status code?", answer: "Yes, use the search bar to find status codes by number or description keyword." },
    ],
  },
  {
    toolId: "chmod",
    faqs: [
      { question: "Is the Chmod Calculator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What is the difference between numeric and symbolic notation?", answer: "Numeric notation uses three digits (e.g., 755) where each digit represents owner, group, and others permissions. Symbolic notation uses letters (e.g., rwxr-xr-x) to show the same information." },
      { question: "Does it generate the chmod command?", answer: "Yes, the tool generates a ready-to-copy chmod command based on your selected permissions." },
    ],
  },
  {
    toolId: "env-editor",
    faqs: [
      { question: "Is the .env Editor free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my .env data safe?", answer: "All processing happens in your browser. No environment variables are sent to any server." },
      { question: "Can I compare two .env files?", answer: "Yes, the tool supports side-by-side comparison of two .env files to spot missing or different variables." },
      { question: "What is value masking?", answer: "Value masking hides sensitive values behind dots so you can safely view and edit .env files during screen sharing." },
    ],
  },
  {
    toolId: "git-builder",
    faqs: [
      { question: "Is the Git Builder free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What git commands are supported?", answer: "The tool supports common git commands including commit, rebase, log, reset, stash, cherry-pick, and more, with their most-used flags and options." },
      { question: "Does it explain what each flag does?", answer: "Yes, each flag and option includes a description so you understand what it does before using the command." },
      { question: "Can I copy the generated command?", answer: "Yes, the generated command is displayed at the top and can be copied with one click." },
    ],
  },
  {
    toolId: "code-screenshot",
    faqs: [
      { question: "Is the Code Screenshot tool free?", answer: "Yes, completely free with no sign-up or watermarks." },
      { question: "What programming languages are supported?", answer: "The tool supports syntax highlighting for dozens of languages including JavaScript, TypeScript, Python, Go, Rust, Java, C#, and many more." },
      { question: "Can I customize the background?", answer: "Yes, you can choose custom background colors, gradients, padding, and window chrome styles." },
      { question: "What export format is available?", answer: "Screenshots are exported as high-resolution PNG images." },
    ],
  },
  // ─── Converters ───────────────────────────────────────────────
  {
    toolId: "encoder",
    faqs: [
      { question: "Is the Encoder tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my data safe?", answer: "All encoding and decoding happens in your browser. No data is sent to any server." },
      { question: "What encoding formats are supported?", answer: "The tool supports Base64 and URL encoding/decoding." },
    ],
  },
  {
    toolId: "timestamp",
    faqs: [
      { question: "Is the Timestamp Converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it support millisecond timestamps?", answer: "Yes, the tool handles both second-precision and millisecond-precision Unix timestamps." },
      { question: "What timezone does it display?", answer: "The tool displays dates in your browser's local timezone." },
    ],
  },
  {
    toolId: "base64-to-file",
    faqs: [
      { question: "Is the Base64 to File tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What file types are supported?", answer: "The tool supports any base64-encoded file. It automatically detects the MIME type and provides previews for images and PDFs." },
      { question: "Is my data private?", answer: "All decoding happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "yaml-json",
    faqs: [
      { question: "Is the YAML/JSON Converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it validate syntax?", answer: "Yes, the tool validates both YAML and JSON syntax and shows error messages for invalid input." },
      { question: "Is my data private?", answer: "All conversion happens in your browser. No data is sent to any server." },
      { question: "Does it preserve data types?", answer: "Yes, the converter preserves data types including strings, numbers, booleans, arrays, and nested objects." },
    ],
  },
  {
    toolId: "number-base",
    faqs: [
      { question: "Is the Number Base Converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What number bases are supported?", answer: "The tool supports binary (base-2), octal (base-8), decimal (base-10), and hexadecimal (base-16)." },
      { question: "Does it show the binary bit layout?", answer: "Yes, the tool includes a visual bit representation to help you see the binary structure of the number." },
    ],
  },
  {
    toolId: "unit-converter",
    faqs: [
      { question: "Is the Unit Converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What unit categories are available?", answer: "The tool supports length, weight, temperature, data size, time, and speed conversions." },
      { question: "Are the conversions accurate?", answer: "Yes, conversions use standard conversion factors with appropriate decimal precision." },
    ],
  },
  {
    toolId: "color-format",
    faqs: [
      { question: "Is the Color Format Converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What color formats are supported?", answer: "The tool supports HEX, RGB, HSL, HSB (HSV), and CMYK color formats." },
      { question: "Does it show a color preview?", answer: "Yes, a live color swatch updates in real time as you enter or change values." },
      { question: "Can I convert from any format to any other?", answer: "Yes, enter a color in any supported format and all other format values are displayed simultaneously." },
    ],
  },
  // ─── Generators ───────────────────────────────────────────────
  {
    toolId: "qr-code",
    faqs: [
      { question: "Is the QR Code Generator free?", answer: "Yes, completely free with no sign-up or watermarks." },
      { question: "Can I customize the QR code colors?", answer: "Yes, you can set custom foreground and background colors, as well as dot styles and corner shapes." },
      { question: "What file format is the download?", answer: "QR codes are downloaded as high-resolution PNG images." },
      { question: "Is there a character limit?", answer: "QR codes can encode up to about 4,296 alphanumeric characters, though shorter content produces more reliable scans." },
    ],
  },
  {
    toolId: "uuid",
    faqs: [
      { question: "Is the UUID Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What UUID versions are supported?", answer: "The tool supports UUID v1 (time-based), v4 (random), and v7 (time-ordered random)." },
      { question: "Can I generate multiple UUIDs at once?", answer: "Yes, you can generate batches of UUIDs in bulk with a single click." },
      { question: "What is the difference between UUID v4 and v7?", answer: "UUID v4 is fully random, while v7 includes a timestamp component that makes the UUIDs sortable by creation time, which is beneficial for database indexing." },
    ],
  },
  {
    toolId: "lorem-ipsum",
    faqs: [
      { question: "Is the Lorem Ipsum Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I generate by word count?", answer: "Yes, you can generate placeholder text by paragraphs, sentences, or word count." },
      { question: "Is it standard lorem ipsum text?", answer: "Yes, the generator produces classic lorem ipsum placeholder text." },
    ],
  },
  {
    toolId: "jwt",
    faqs: [
      { question: "Is the JWT tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my JWT data private?", answer: "All decoding and encoding happens in your browser. No tokens are sent to any server." },
      { question: "What is the difference between Decode and Forge?", answer: "Decode lets you paste an existing JWT to inspect its contents. Forge lets you create a new JWT by editing the header and payload." },
      { question: "What algorithms are supported?", answer: "The tool supports common algorithms including HS256, HS384, HS512, RS256, RS384, RS512, and more." },
      { question: "Can it verify JWT signatures?", answer: "The Decode mode shows the signature portion and algorithm used. You can inspect the claims and expiration time of any JWT." },
    ],
  },
  {
    toolId: "fake-data",
    faqs: [
      { question: "Is the Fake Data Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What data types can I generate?", answer: "The tool generates names, emails, addresses, phone numbers, dates, company names, and many more field types." },
      { question: "Can I generate custom JSON schemas?", answer: "Yes, you can define custom JSON structures and the tool will populate them with realistic fake data." },
      { question: "Is the generated data truly random?", answer: "Yes, each generation produces new, randomized data using the Faker library." },
      { question: "Is my data private?", answer: "All data generation happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "hash",
    faqs: [
      { question: "Is the Hash Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What hash algorithms are supported?", answer: "The tool supports MD5, SHA-1, SHA-256, and SHA-512." },
      { question: "Can I hash files?", answer: "Yes, you can upload a file and the tool will compute its hash value using all supported algorithms." },
      { question: "Is my data private?", answer: "All hashing happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "slug",
    faqs: [
      { question: "Is the Slug Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it support non-Latin characters?", answer: "Yes, the tool includes transliteration support to convert accented and non-Latin characters into URL-safe ASCII equivalents." },
      { question: "What characters are removed?", answer: "Special characters, punctuation, and symbols are removed. Spaces are replaced with hyphens, and the result is lowercased." },
    ],
  },
  // ─── Design ───────────────────────────────────────────────────
  {
    toolId: "colors",
    faqs: [
      { question: "Is the Color Palette tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What color harmonies are available?", answer: "The tool supports complementary, analogous, triadic, split-complementary, tetradic, and other color harmony types." },
      { question: "What color formats are shown?", answer: "Each color is displayed in HEX, RGB, and HSL formats." },
      { question: "Can I copy individual colors?", answer: "Yes, click on any color in the palette to copy its value in your preferred format." },
    ],
  },
  {
    toolId: "board",
    faqs: [
      { question: "Is the Board tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What drawing tools are available?", answer: "The board includes freehand pen, shapes (rectangles, circles, lines, arrows), text, and an eraser tool." },
      { question: "Can I export my drawings?", answer: "Yes, you can export the canvas content for sharing or saving." },
      { question: "Does it support undo/redo?", answer: "Yes, the board supports full undo and redo functionality." },
      { question: "Is my drawing data private?", answer: "All drawing happens locally in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "shapemaker",
    faqs: [
      { question: "What is the Shape Maker?", answer: "The Shape Maker is a vector drawing tool that lets you create custom shapes and export them as Flutter/Dart CustomPainter code or SVG path data." },
      { question: "Is it free to use?", answer: "Yes, completely free with no sign-up required." },
      { question: "Do I need Flutter experience to use it?", answer: "No, you can draw shapes visually with the pen tool. The Flutter code is generated automatically." },
      { question: "What export formats are available?", answer: "You can export shapes as Flutter/Dart CustomPainter code or SVG path data." },
      { question: "Does it support curves?", answer: "Yes, you can create both straight lines and bezier curves by adjusting control point handles." },
    ],
  },
  {
    toolId: "mockup",
    faqs: [
      { question: "Is the Mockup Generator free?", answer: "Yes, completely free with no sign-up or watermarks." },
      { question: "What devices are available?", answer: "The tool includes frames for phones (iPhone, Android), tablets, and desktop monitors." },
      { question: "What image format is the export?", answer: "Mockups are exported as high-resolution PNG images." },
      { question: "Is my uploaded image private?", answer: "All processing happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "timeline",
    faqs: [
      { question: "Is the Timeline Creator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What is the difference between Priority and Date-Based modes?", answer: "Priority & Workload mode focuses on task prioritization and resource allocation. Date-Based mode displays tasks on a calendar timeline with specific start and end dates." },
      { question: "Can I add task dependencies?", answer: "Yes, you can define dependencies between tasks to show which tasks must be completed before others can begin." },
      { question: "Can I export the timeline?", answer: "Yes, you can export or share your timeline visualization." },
      { question: "Is my project data private?", answer: "All processing happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "gradient",
    faqs: [
      { question: "Is the Gradient Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What gradient types are supported?", answer: "The tool supports linear and radial gradients with multiple color stops." },
      { question: "Does it generate Flutter code?", answer: "Yes, the tool outputs both CSS and Flutter/Dart gradient code." },
      { question: "Are there preset gradients?", answer: "Yes, a preset gallery provides ready-made gradients you can use as starting points and customize further." },
    ],
  },
  {
    toolId: "box-shadow",
    faqs: [
      { question: "Is the Box Shadow Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I add multiple shadow layers?", answer: "Yes, you can add multiple shadow layers to create complex shadow effects." },
      { question: "Does it support inset shadows?", answer: "Yes, you can toggle inset mode for any shadow layer." },
      { question: "Does it generate Flutter code?", answer: "Yes, the tool outputs both CSS box-shadow and Flutter BoxShadow code." },
    ],
  },
  {
    toolId: "icon-editor",
    faqs: [
      { question: "Is the Icon Editor free?", answer: "Yes, completely free with no sign-up required." },
      { question: "How many icons are available?", answer: "The tool includes the full Lucide icon library with over 1,000 icons." },
      { question: "What export formats are supported?", answer: "Icons can be exported as SVG, PNG, React JSX components, or Flutter/Dart code." },
      { question: "Can I customize icon colors and sizes?", answer: "Yes, you can adjust the color, size, and stroke width of any icon before exporting." },
      { question: "Is my data private?", answer: "All icon customization happens in your browser. No data is sent to any server." },
    ],
  },
  // ─── Network ──────────────────────────────────────────────────
  {
    toolId: "dns-lookup",
    faqs: [
      { question: "Is the DNS Lookup tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What DNS record types can I query?", answer: "The tool supports A, AAAA, MX, CNAME, TXT, NS, SOA, and other standard record types." },
      { question: "Does it check multiple DNS providers?", answer: "Yes, results are fetched from multiple DNS providers so you can compare and verify propagation." },
      { question: "Can I use it to check DNS propagation?", answer: "Yes, by comparing results across multiple providers, you can see whether DNS changes have propagated globally." },
    ],
  },
  {
    toolId: "whats-my-ip",
    faqs: [
      { question: "Is the What's My IP tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it show my location?", answer: "Yes, the tool displays geolocation information including city, region, country, and timezone based on your IP address." },
      { question: "Can I use it to verify my VPN?", answer: "Yes, if your VPN is active, the tool will show the VPN server's IP address and location instead of your real one." },
    ],
  },
  {
    toolId: "ssl-checker",
    faqs: [
      { question: "Is the SSL Checker free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What information does it show?", answer: "The tool displays the certificate issuer, subject, validity dates, Subject Alternative Names (SAN), and the certificate chain." },
      { question: "Does it check for certificate expiration?", answer: "Yes, the tool clearly shows the expiration date and warns if the certificate is expired or expiring soon." },
      { question: "Can I check any domain?", answer: "Yes, you can check the SSL certificate of any publicly accessible domain." },
    ],
  },
  {
    toolId: "headers-inspector",
    faqs: [
      { question: "Is the Headers Inspector free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What security headers does it check?", answer: "The tool analyzes headers like Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and others." },
      { question: "Does it grade my security headers?", answer: "Yes, the tool provides an analysis of your security header configuration and highlights missing or misconfigured headers." },
      { question: "Can I check any URL?", answer: "Yes, you can inspect the response headers of any publicly accessible URL." },
    ],
  },
  // ─── Security ─────────────────────────────────────────────────
  {
    toolId: "password-generator",
    faqs: [
      { question: "Is the Password Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Are the passwords truly random?", answer: "Yes, passwords are generated using the Web Crypto API, which provides cryptographically secure random number generation." },
      { question: "Is my generated password stored anywhere?", answer: "No, passwords are generated locally in your browser and are never sent to any server." },
      { question: "What is a passphrase?", answer: "A passphrase is a password made of random words separated by a delimiter. Passphrases are easier to remember while still being very secure." },
    ],
  },
  {
    toolId: "encryption",
    faqs: [
      { question: "Is the Encryption tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What encryption algorithm is used?", answer: "The tool uses AES-256-GCM, which is an authenticated encryption standard that provides both confidentiality and integrity." },
      { question: "Is my data safe?", answer: "All encryption and decryption happens in your browser. No plaintext or ciphertext is sent to any server." },
      { question: "What happens if I forget the passphrase?", answer: "Without the correct passphrase, the encrypted text cannot be decrypted. There is no recovery mechanism, so keep your passphrase safe." },
      { question: "Can I encrypt files?", answer: "This tool is designed for text encryption. For file encryption, you would need to convert the file to base64 first or use a dedicated file encryption tool." },
    ],
  },
  {
    toolId: "cert-decoder",
    faqs: [
      { question: "Is the Certificate Decoder free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What certificate formats are supported?", answer: "The tool supports PEM-encoded X.509 certificates. Paste the certificate including the BEGIN and END headers." },
      { question: "What fields are decoded?", answer: "The decoder shows issuer, subject, serial number, validity dates, signature algorithm, key usage, Subject Alternative Names, and other extensions." },
      { question: "Is my certificate data private?", answer: "All decoding happens in your browser. No certificate data is sent to any server." },
    ],
  },
  {
    toolId: "totp",
    faqs: [
      { question: "Is the TOTP Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is it compatible with Google Authenticator?", answer: "Yes, the generated TOTP codes and QR codes are compatible with Google Authenticator, Authy, and other standard TOTP authenticator apps." },
      { question: "Is my secret key stored anywhere?", answer: "No, all TOTP generation happens locally in your browser. Secret keys are never sent to any server." },
      { question: "Can I customize the TOTP settings?", answer: "Yes, you can configure the period (default 30 seconds), number of digits, and hash algorithm." },
      { question: "What is TOTP?", answer: "TOTP (Time-based One-Time Password) is a standard algorithm that generates temporary codes based on a shared secret and the current time, commonly used for two-factor authentication." },
    ],
  },
  {
    toolId: "csp-builder",
    faqs: [
      { question: "Is the CSP Builder free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What is Content-Security-Policy?", answer: "Content-Security-Policy (CSP) is an HTTP header that helps prevent cross-site scripting (XSS) and other injection attacks by specifying which sources of content are allowed to load on your page." },
      { question: "Does it warn about insecure configurations?", answer: "Yes, the tool shows validation warnings for potentially insecure settings like unsafe-inline or overly permissive source lists." },
      { question: "What CSP directives are supported?", answer: "The tool supports all standard CSP directives including default-src, script-src, style-src, img-src, connect-src, font-src, and many more." },
      { question: "Can I start from a template?", answer: "Yes, preset templates are available for common configurations that you can customize to fit your needs." },
    ],
  },
  // ─── Data Tools ───────────────────────────────────────────────
  {
    toolId: "csv-viewer",
    faqs: [
      { question: "Is the CSV Viewer free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I edit the CSV data?", answer: "Yes, you can edit cells inline, sort columns, and re-export the modified data." },
      { question: "Does it support TSV files?", answer: "Yes, the tool supports both CSV (comma-separated) and TSV (tab-separated) formats." },
      { question: "Is my data private?", answer: "All processing happens in your browser. No data is sent to any server." },
      { question: "Can I handle large CSV files?", answer: "Yes, the viewer is optimized to handle large files efficiently in your browser." },
    ],
  },
  {
    toolId: "json-path",
    faqs: [
      { question: "Is the JSON Path tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What is JSONPath?", answer: "JSONPath is a query language for JSON data, similar to XPath for XML. It lets you extract specific values from complex JSON structures using path expressions." },
      { question: "Can I click to get a value's path?", answer: "Yes, click on any value in the tree view and its JSONPath expression is shown and ready to copy." },
      { question: "Is my JSON data private?", answer: "All processing happens in your browser. No data is sent to any server." },
      { question: "Does it handle large JSON files?", answer: "Yes, the tool is designed to handle large, deeply nested JSON documents." },
    ],
  },
  {
    toolId: "data-transformer",
    faqs: [
      { question: "Is the Data Transformer free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What transformation operations are available?", answer: "The tool supports filter, sort, map, rename, and deduplicate operations that can be chained together in a pipeline." },
      { question: "Does it work with both JSON and CSV?", answer: "Yes, you can input and output data in both JSON and CSV formats." },
      { question: "Is my data private?", answer: "All transformations happen in your browser. No data is sent to any server." },
      { question: "Can I chain multiple operations?", answer: "Yes, operations are applied in sequence as a pipeline, so the output of one step becomes the input for the next." },
    ],
  },
  {
    toolId: "sql-playground",
    faqs: [
      { question: "Is the SQL Playground free?", answer: "Yes, completely free with no sign-up required." },
      { question: "How does it run SQL without a server?", answer: "The tool uses SQLite compiled to WebAssembly, which runs entirely in your browser. No database server is needed." },
      { question: "What SQL features are supported?", answer: "It supports standard SQL including SELECT, WHERE, JOIN, GROUP BY, ORDER BY, aggregate functions, and subqueries." },
      { question: "Is my data private?", answer: "All data and queries stay in your browser. Nothing is sent to any server." },
      { question: "Can I join data from multiple files?", answer: "Yes, upload multiple CSV or JSON files and they become separate tables you can JOIN in your SQL queries." },
    ],
  },
  {
    toolId: "chart-builder",
    faqs: [
      { question: "Is the Chart Builder free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What chart types are available?", answer: "The tool supports bar, line, pie, scatter, and area chart types." },
      { question: "Can I import CSV data?", answer: "Yes, you can upload CSV or JSON files to visualize your data." },
      { question: "Can I export the chart?", answer: "Yes, charts can be exported as images for use in reports and presentations." },
      { question: "Is my data private?", answer: "All chart rendering happens in your browser. No data is sent to any server." },
    ],
  },
  // ─── Image Tools ──────────────────────────────────────────────
  {
    toolId: "image-resize",
    faqs: [
      { question: "Is the Image Resize tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is my image data private?", answer: "All resizing happens in your browser. No images are sent to any server." },
      { question: "Can I maintain the aspect ratio?", answer: "Yes, you can lock the aspect ratio to ensure proportional scaling, or unlock it to set custom dimensions independently." },
    ],
  },
  {
    toolId: "image-crop",
    faqs: [
      { question: "Is the Image Crop tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What aspect ratio presets are available?", answer: "The tool includes presets for common ratios like 1:1 (square), 16:9 (widescreen), 4:3, and others, plus a freeform option." },
      { question: "Is my image data private?", answer: "All cropping happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "image-compress",
    faqs: [
      { question: "Is the Image Compress tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does compression reduce image quality?", answer: "You can control the compression level with a quality slider. Higher compression means smaller files but some quality reduction. The preview helps you find the right balance." },
      { question: "Is my image data private?", answer: "All compression happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "image-format",
    faqs: [
      { question: "Is the Format Convert tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What image formats are supported?", answer: "The tool supports conversion between PNG, JPEG, WebP, and AVIF formats." },
      { question: "Is my image data private?", answer: "All conversion happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "color-from-image",
    faqs: [
      { question: "Is the Color Picker tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What color formats are shown?", answer: "Selected colors are displayed in HEX, RGB, and HSL formats." },
      { question: "Does it have a magnifier?", answer: "Yes, a magnifier shows a zoomed-in view of the area around your cursor for precise pixel-level color picking." },
      { question: "Is my image data private?", answer: "All processing happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "placeholder-image",
    faqs: [
      { question: "Is the Placeholder Image Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What dimensions can I set?", answer: "You can set any custom width and height in pixels." },
      { question: "Can I customize the colors?", answer: "Yes, you can set both the background color and text color of the placeholder image." },
    ],
  },
  {
    toolId: "image-to-base64",
    faqs: [
      { question: "Is the Image to Base64 tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What output formats are provided?", answer: "The tool outputs the raw base64 string, a data URI, an HTML img tag, and a CSS background-image declaration." },
      { question: "Is my image data private?", answer: "All conversion happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "favicon",
    faqs: [
      { question: "Is the Favicon Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What favicon sizes are generated?", answer: "The tool generates all standard sizes including 16x16, 32x32, 48x48, 180x180 (Apple Touch), and ICO format." },
      { question: "Does it provide HTML tags?", answer: "Yes, the tool generates ready-to-use HTML link tags that you can paste into your page's head section." },
      { question: "What image format should I upload?", answer: "A square PNG or SVG image works best. The tool will resize it to all required favicon dimensions." },
    ],
  },
  // ─── Fun ──────────────────────────────────────────────────────
  {
    toolId: "wheel-of-fate",
    faqs: [
      { question: "Is the Wheel of Fate free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is the selection truly random?", answer: "Yes, the wheel uses random number generation to determine where it stops. Each option has an equal chance of being selected." },
      { question: "How many options can I add?", answer: "You can add as many options as you like. The wheel automatically adjusts the segment sizes to fit all entries." },
    ],
  },
  {
    toolId: "coin-flip",
    faqs: [
      { question: "Is the Coin Flip tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is the coin flip fair?", answer: "Yes, the outcome is determined by a random number generator with equal 50/50 probability for heads and tails." },
      { question: "Does it track my flip history?", answer: "Yes, the tool keeps a running tally of heads and tails results during your session." },
    ],
  },
  {
    toolId: "dice-roller",
    faqs: [
      { question: "Is the Dice Roller free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What dice types are available?", answer: "The tool supports d4, d6, d8, d10, d12, d20, and d100 dice types." },
      { question: "Can I add modifiers to rolls?", answer: "Yes, you can add positive or negative modifiers that are applied to the total roll result." },
    ],
  },
  {
    toolId: "random-number",
    faqs: [
      { question: "Is the Random Number Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I generate multiple numbers at once?", answer: "Yes, batch mode lets you generate multiple random numbers in a single click." },
      { question: "Does it show distribution?", answer: "Yes, a distribution chart visualizes the spread of generated numbers over time." },
    ],
  },
  {
    toolId: "team-shuffler",
    faqs: [
      { question: "Is the Team Shuffler free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Are the teams balanced?", answer: "Yes, the tool distributes members as evenly as possible across all teams." },
      { question: "Can I set the number of teams?", answer: "Yes, you can specify either the number of teams or the desired team size." },
    ],
  },
  {
    toolId: "bracket",
    faqs: [
      { question: "Is the Bracket Generator free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What bracket format does it use?", answer: "The tool generates single-elimination brackets. Byes are automatically assigned if the number of participants is not a power of two." },
      { question: "Can I select winners interactively?", answer: "Yes, click on a participant in each match to advance them to the next round." },
    ],
  },
  {
    toolId: "random-picker",
    faqs: [
      { question: "Is the Random Picker free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is the selection random?", answer: "Yes, items are selected using a random number generator for fair, unbiased picks." },
      { question: "Can I pick multiple items?", answer: "Yes, you can set how many items to pick from your list." },
    ],
  },
  {
    toolId: "magic-8-ball",
    faqs: [
      { question: "Is the Magic 8-Ball free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Are the answers random?", answer: "Yes, answers are randomly selected from the classic pool of 20 Magic 8-Ball responses." },
      { question: "What types of answers does it give?", answer: "The classic 20 responses include positive answers (e.g., 'It is certain'), neutral answers (e.g., 'Ask again later'), and negative answers (e.g., 'Don't count on it')." },
    ],
  },
  {
    toolId: "rock-paper-scissors",
    faqs: [
      { question: "Is Rock Paper Scissors free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is the computer's choice random?", answer: "Yes, the computer selects its move randomly with equal probability for rock, paper, and scissors." },
      { question: "Does it track scores?", answer: "Yes, the tool tracks wins, losses, and draws across all rounds in your session." },
    ],
  },
  {
    toolId: "would-you-rather",
    faqs: [
      { question: "Is Would You Rather free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I see how others voted?", answer: "Yes, after you vote on a dilemma, the results and percentages are displayed." },
      { question: "Are new questions added?", answer: "The tool includes a curated collection of dilemma questions for endless fun." },
    ],
  },
  {
    toolId: "decision-maker",
    faqs: [
      { question: "Is the Decision Maker free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is the answer random?", answer: "Yes, the tool randomly generates a yes or no answer to your question." },
      { question: "Should I make real decisions with this?", answer: "This tool is meant for fun and entertainment. For important decisions, we recommend careful thought and consideration." },
    ],
  },
  // ─── PDF Tools ────────────────────────────────────────────────
  {
    toolId: "jpg-to-pdf",
    faqs: [
      { question: "Is the JPG to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I convert multiple images at once?", answer: "Yes, upload multiple JPG images and they will be combined into a single PDF with each image as a page." },
      { question: "Is my image data private?", answer: "All conversion happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "png-to-pdf",
    faqs: [
      { question: "Is the PNG to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it preserve PNG transparency?", answer: "Yes, PNG transparency is handled during the conversion to PDF." },
      { question: "Is my image data private?", answer: "All conversion happens in your browser. No images are sent to any server." },
    ],
  },
  {
    toolId: "pdf-merge",
    faqs: [
      { question: "Is the Merge PDF tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Is there a limit on the number of files?", answer: "There is no hard limit. You can merge as many PDF files as your browser's memory allows." },
      { question: "Is my PDF data private?", answer: "All merging happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "pdf-split",
    faqs: [
      { question: "Is the Split PDF tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I extract specific pages?", answer: "Yes, you can select individual pages, page ranges, or set split intervals." },
      { question: "Is my PDF data private?", answer: "All splitting happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "pdf-reorder",
    faqs: [
      { question: "Is the Reorder PDF tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I also remove pages?", answer: "Yes, you can remove unwanted pages in addition to reordering them." },
      { question: "Is my PDF data private?", answer: "All processing happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "pdf-compress",
    faqs: [
      { question: "Is the Compress PDF tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "How much can it reduce file size?", answer: "The compression ratio depends on the content of the PDF. Image-heavy PDFs typically see the largest reductions." },
      { question: "Is my PDF data private?", answer: "All compression happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "pdf-watermark",
    faqs: [
      { question: "Is the Watermark PDF tool free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Can I add image watermarks?", answer: "Yes, you can add either text or image watermarks with customizable opacity, rotation, and position." },
      { question: "Is my PDF data private?", answer: "All watermarking happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "docx-to-pdf",
    faqs: [
      { question: "Is the DOCX to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it preserve formatting?", answer: "The tool preserves formatting, fonts, and layout as closely as possible during conversion." },
      { question: "Is my document data private?", answer: "All conversion happens in your browser. No documents are sent to any server." },
    ],
  },
  {
    toolId: "pptx-to-pdf",
    faqs: [
      { question: "Is the PPTX to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it preserve slide layouts?", answer: "Yes, each slide is rendered as a page in the PDF with the original layout preserved." },
      { question: "Is my presentation data private?", answer: "All conversion happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "xlsx-to-pdf",
    faqs: [
      { question: "Is the XLSX to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it preserve table formatting?", answer: "Yes, the tool preserves cell formatting, borders, and data layout in the PDF output." },
      { question: "Is my spreadsheet data private?", answer: "All conversion happens in your browser. No files are sent to any server." },
    ],
  },
  {
    toolId: "csv-to-pdf",
    faqs: [
      { question: "Is the CSV to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it auto-detect column headers?", answer: "Yes, the first row of the CSV is typically used as column headers in the PDF table." },
      { question: "Is my data private?", answer: "All conversion happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "html-to-pdf",
    faqs: [
      { question: "Is the HTML to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "Does it support CSS styling?", answer: "Yes, inline CSS and embedded styles are rendered in the PDF output." },
      { question: "Is my HTML data private?", answer: "All conversion happens in your browser. No data is sent to any server." },
    ],
  },
  {
    toolId: "markdown-to-pdf",
    faqs: [
      { question: "Is the Markdown to PDF converter free?", answer: "Yes, completely free with no sign-up required." },
      { question: "What Markdown features are supported?", answer: "The converter supports headings, lists, code blocks with syntax highlighting, tables, links, images, bold, italic, and other standard Markdown elements." },
      { question: "Is my document data private?", answer: "All conversion happens in your browser. No data is sent to any server." },
    ],
  },
]

export function getFaqsByToolId(toolId: string): FaqItem[] {
  return TOOL_FAQS.find((f) => f.toolId === toolId)?.faqs ?? []
}
