import assert from "node:assert/strict"
import test from "node:test"

import { HTTP_STATUS_CODES } from "./httpStatusCodes.ts"

test("catalog exposes every explicitly registered IANA status code in ascending order", () => {
  const expectedCodes = [
    100, 101, 102, 103, 104,
    200, 201, 202, 203, 204, 205, 206, 207, 208, 226,
    300, 301, 302, 303, 304, 305, 306, 307, 308,
    400, 401, 402, 403, 404, 405, 406, 407, 408, 409, 410, 411, 412, 413,
    414, 415, 416, 417, 418, 421, 422, 423, 424, 425, 426, 428, 429, 431, 451,
    500, 501, 502, 503, 504, 505, 506, 507, 508, 510, 511,
  ]

  assert.deepEqual(
    HTTP_STATUS_CODES.map(({ code }) => code),
    expectedCodes,
  )
})

test("418 uses its developer-facing I'm a Teapot name", () => {
  const status = HTTP_STATUS_CODES.find(({ code }) => code === 418)

  assert.equal(status?.name, "I'm a Teapot")
})
