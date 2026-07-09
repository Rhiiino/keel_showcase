// stack_sandbox/frontend_web/src/lib/sse.ts

// Server-Sent Events parser for fetch responses (POST /chat/.../stream).
// Reads event: / data: lines from a ReadableStream and invokes a callback per frame.

import { ApiError } from "./api";

export type SseEventHandler = (
  eventName: string,
  data: Record<string, unknown>,
) => void;

/** Throw {@link ApiError} if the response is not OK; otherwise parse the SSE body. */
export async function parseSseStream(
  response: Response,
  onEvent: SseEventHandler,
): Promise<void> {
  if (!response.ok) {
    const body = await response.text();
    throw new ApiError(
      `API ${response.status} ${response.statusText}${body ? `: ${body}` : ""}`,
      response.status,
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new ApiError("Response has no body.", 500);
  }

  const decoder = new TextDecoder();
  let buffer = "";
  let eventName = "message";
  let dataLines: string[] = [];

  const flush = () => {
    if (dataLines.length === 0) {
      return;
    }
    const raw = dataLines.join("\n");
    dataLines = [];
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      onEvent(eventName, parsed);
    } catch {
      onEvent(eventName, { raw });
    }
    eventName = "message";
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
      let line = buffer.slice(0, newlineIndex);
      buffer = buffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) {
        line = line.slice(0, -1);
      }

      if (line === "") {
        flush();
        continue;
      }
      if (line.startsWith(":")) {
        continue;
      }
      if (line.startsWith("event:")) {
        eventName = line.slice(6).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }
  }

  if (buffer.trim()) {
    const line = buffer.trim();
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  flush();
}
