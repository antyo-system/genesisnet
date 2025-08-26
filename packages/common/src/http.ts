/**
 * HTTP helper sederhana berbasis fetch (Node 18+ punya global fetch).
 * Throw error jika status bukan 2xx.
 */
export async function httpGet<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`[GET ${url}] ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function httpPost<T = unknown>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`[POST ${url}] ${res.status} ${res.statusText} :: ${text}`);
  }
  return res.json() as Promise<T>;
}
