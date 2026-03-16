export type HttpStatusCategory = "1xx" | "2xx" | "3xx" | "4xx" | "5xx"

export type HttpStatusCode = {
  code: number
  name: string
  description: string
  category: HttpStatusCategory
  example?: {
    request: string
    response: string
  }
}

export const HTTP_STATUS_CODES: HttpStatusCode[] = [
  // 1xx Informational
  { code: 100, name: "Continue", description: "The server has received the request headers and the client should proceed to send the request body.", category: "1xx", example: { request: "POST /upload HTTP/1.1\nHost: example.com\nExpect: 100-continue\nContent-Length: 1048576", response: "HTTP/1.1 100 Continue" } },
  { code: 101, name: "Switching Protocols", description: "The server is switching protocols as requested by the client via the Upgrade header.", category: "1xx", example: { request: "GET /chat HTTP/1.1\nHost: example.com\nUpgrade: websocket\nConnection: Upgrade", response: "HTTP/1.1 101 Switching Protocols\nUpgrade: websocket\nConnection: Upgrade" } },
  { code: 102, name: "Processing", description: "The server has received and is processing the request, but no response is available yet (WebDAV).", category: "1xx" },
  { code: 103, name: "Early Hints", description: "Used to return some response headers before final HTTP message, allowing the browser to preload resources.", category: "1xx", example: { request: "GET / HTTP/1.1\nHost: example.com", response: "HTTP/1.1 103 Early Hints\nLink: </style.css>; rel=preload; as=style" } },

  // 2xx Success
  { code: 200, name: "OK", description: "The request succeeded. The response body contains the requested resource.", category: "2xx", example: { request: "GET /api/users/1 HTTP/1.1\nHost: api.example.com", response: "HTTP/1.1 200 OK\nContent-Type: application/json\n\n{\"id\": 1, \"name\": \"Alice\"}" } },
  { code: 201, name: "Created", description: "The request succeeded and a new resource was created. Typically returned after POST requests.", category: "2xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{\"name\": \"Bob\"}", response: "HTTP/1.1 201 Created\nLocation: /api/users/2\n\n{\"id\": 2, \"name\": \"Bob\"}" } },
  { code: 202, name: "Accepted", description: "The request has been accepted for processing, but the processing has not been completed.", category: "2xx", example: { request: "POST /api/reports/generate HTTP/1.1", response: "HTTP/1.1 202 Accepted\n\n{\"jobId\": \"abc123\", \"status\": \"queued\"}" } },
  { code: 204, name: "No Content", description: "The request succeeded but there is no content to send in the response body.", category: "2xx", example: { request: "DELETE /api/users/1 HTTP/1.1", response: "HTTP/1.1 204 No Content" } },
  { code: 206, name: "Partial Content", description: "The server is delivering only part of the resource due to a Range header sent by the client.", category: "2xx", example: { request: "GET /video.mp4 HTTP/1.1\nRange: bytes=0-1023", response: "HTTP/1.1 206 Partial Content\nContent-Range: bytes 0-1023/146515" } },

  // 3xx Redirection
  { code: 301, name: "Moved Permanently", description: "The requested resource has been permanently moved to a new URL. Search engines will update their links.", category: "3xx", example: { request: "GET /old-page HTTP/1.1", response: "HTTP/1.1 301 Moved Permanently\nLocation: /new-page" } },
  { code: 302, name: "Found", description: "The resource temporarily resides at a different URL. The client should continue to use the original URL.", category: "3xx", example: { request: "GET /temp-redirect HTTP/1.1", response: "HTTP/1.1 302 Found\nLocation: /temporary-location" } },
  { code: 304, name: "Not Modified", description: "The resource has not been modified since the last request. The client can use its cached version.", category: "3xx", example: { request: "GET /api/data HTTP/1.1\nIf-None-Match: \"abc123\"", response: "HTTP/1.1 304 Not Modified" } },
  { code: 307, name: "Temporary Redirect", description: "The resource temporarily resides at a different URL. Unlike 302, the request method must not change.", category: "3xx", example: { request: "POST /api/submit HTTP/1.1", response: "HTTP/1.1 307 Temporary Redirect\nLocation: /api/v2/submit" } },
  { code: 308, name: "Permanent Redirect", description: "The resource has been permanently moved. Unlike 301, the request method must not change.", category: "3xx", example: { request: "POST /api/old HTTP/1.1", response: "HTTP/1.1 308 Permanent Redirect\nLocation: /api/new" } },

  // 4xx Client Error
  { code: 400, name: "Bad Request", description: "The server cannot process the request due to malformed syntax, invalid parameters, or missing required fields.", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{invalid json}", response: "HTTP/1.1 400 Bad Request\n\n{\"error\": \"Invalid JSON in request body\"}" } },
  { code: 401, name: "Unauthorized", description: "Authentication is required. The client must provide valid credentials (e.g., Bearer token, API key).", category: "4xx", example: { request: "GET /api/profile HTTP/1.1", response: "HTTP/1.1 401 Unauthorized\nWWW-Authenticate: Bearer" } },
  { code: 403, name: "Forbidden", description: "The server understood the request but refuses to authorize it. The client does not have permission.", category: "4xx", example: { request: "DELETE /api/admin/users/1 HTTP/1.1\nAuthorization: Bearer user-token", response: "HTTP/1.1 403 Forbidden\n\n{\"error\": \"Admin access required\"}" } },
  { code: 404, name: "Not Found", description: "The requested resource could not be found on the server.", category: "4xx", example: { request: "GET /api/users/999 HTTP/1.1", response: "HTTP/1.1 404 Not Found\n\n{\"error\": \"User not found\"}" } },
  { code: 405, name: "Method Not Allowed", description: "The HTTP method used is not supported for the requested resource.", category: "4xx", example: { request: "DELETE /api/readonly-resource HTTP/1.1", response: "HTTP/1.1 405 Method Not Allowed\nAllow: GET, HEAD" } },
  { code: 408, name: "Request Timeout", description: "The server timed out waiting for the request from the client.", category: "4xx" },
  { code: 409, name: "Conflict", description: "The request conflicts with the current state of the resource (e.g., duplicate entry, version mismatch).", category: "4xx", example: { request: "PUT /api/users/1 HTTP/1.1\nIf-Match: \"old-etag\"\n\n{\"name\": \"Updated\"}", response: "HTTP/1.1 409 Conflict\n\n{\"error\": \"Resource was modified by another request\"}" } },
  { code: 410, name: "Gone", description: "The resource was once available but has been intentionally and permanently removed.", category: "4xx" },
  { code: 413, name: "Content Too Large", description: "The request body is larger than the server is willing to accept.", category: "4xx", example: { request: "POST /api/upload HTTP/1.1\nContent-Length: 104857600", response: "HTTP/1.1 413 Content Too Large\n\n{\"error\": \"Maximum upload size is 10MB\"}" } },
  { code: 415, name: "Unsupported Media Type", description: "The media type of the request body is not supported by the server.", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: text/xml\n\n<user><name>Bob</name></user>", response: "HTTP/1.1 415 Unsupported Media Type\n\n{\"error\": \"Expected application/json\"}" } },
  { code: 422, name: "Unprocessable Content", description: "The request body is syntactically correct but semantically invalid (e.g., validation errors).", category: "4xx", example: { request: "POST /api/users HTTP/1.1\nContent-Type: application/json\n\n{\"name\": \"\", \"email\": \"not-an-email\"}", response: "HTTP/1.1 422 Unprocessable Content\n\n{\"errors\": {\"name\": \"required\", \"email\": \"invalid\"}}" } },
  { code: 429, name: "Too Many Requests", description: "The client has sent too many requests in a given time period (rate limiting).", category: "4xx", example: { request: "GET /api/search?q=test HTTP/1.1", response: "HTTP/1.1 429 Too Many Requests\nRetry-After: 60\n\n{\"error\": \"Rate limit exceeded\"}" } },
  { code: 451, name: "Unavailable For Legal Reasons", description: "The resource is unavailable due to legal reasons, such as censorship or government-mandated restrictions.", category: "4xx" },

  // 5xx Server Error
  { code: 500, name: "Internal Server Error", description: "The server encountered an unexpected condition that prevented it from fulfilling the request.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 500 Internal Server Error\n\n{\"error\": \"An unexpected error occurred\"}" } },
  { code: 502, name: "Bad Gateway", description: "The server, acting as a gateway or proxy, received an invalid response from the upstream server.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 502 Bad Gateway\n\n{\"error\": \"Upstream service unavailable\"}" } },
  { code: 503, name: "Service Unavailable", description: "The server is temporarily unable to handle the request, usually due to maintenance or overload.", category: "5xx", example: { request: "GET /api/data HTTP/1.1", response: "HTTP/1.1 503 Service Unavailable\nRetry-After: 300\n\n{\"error\": \"Service under maintenance\"}" } },
  { code: 504, name: "Gateway Timeout", description: "The server, acting as a gateway or proxy, did not receive a timely response from the upstream server.", category: "5xx", example: { request: "GET /api/slow-query HTTP/1.1", response: "HTTP/1.1 504 Gateway Timeout\n\n{\"error\": \"Upstream server timed out\"}" } },
]

export const CATEGORY_LABELS: Record<HttpStatusCategory, string> = {
  "1xx": "Informational",
  "2xx": "Success",
  "3xx": "Redirection",
  "4xx": "Client Error",
  "5xx": "Server Error",
}

export const CATEGORY_STYLES: Record<HttpStatusCategory, string> = {
  "1xx": "bg-blue-500/15 text-blue-500",
  "2xx": "bg-green-500/15 text-green-500",
  "3xx": "bg-yellow-500/15 text-yellow-500",
  "4xx": "bg-orange-500/15 text-orange-500",
  "5xx": "bg-red-500/15 text-red-500",
}
