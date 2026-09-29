export class HttpError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export async function requireOk(response: Response, fallback: string): Promise<Response> {
  if (response.ok) return response;
  const body = await response.json().catch(() => null);
  throw new HttpError(
    typeof body?.error === "string" ? body.error : `${fallback}（HTTP ${response.status}）`,
    response.status
  );
}
