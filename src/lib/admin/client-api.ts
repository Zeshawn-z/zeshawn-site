export async function requireOk(response: Response, fallback: string): Promise<Response> {
  if (response.ok) return response;
  const body = await response.json().catch(() => null);
  throw new Error(typeof body?.error === "string" ? body.error : `${fallback}（HTTP ${response.status}）`);
}
