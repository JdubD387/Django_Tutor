export class ServiceError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export async function readJson(response: Response, limit = 1_000_000): Promise<unknown> {
  if (!response.ok) {
    if (response.body) await response.body.cancel();
    throw new ServiceError(response.status === 401 || response.status === 403 ? 403 : 502,
      response.status === 401 || response.status === 403 ? 'The service rejected these credentials or this model. Check access and try again.' : 'The external service could not complete this request. Try again later.');
  }
  if (!response.body) throw new ServiceError(502, 'The service returned an empty response.');
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      bytes += result.value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new ServiceError(502, 'The service response exceeded the allowed size.'); }
      chunks.push(result.value);
    }
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch (error) {
    if (error instanceof ServiceError) throw error;
    throw new ServiceError(502, 'The service returned an invalid response.');
  } finally { reader.releaseLock(); }
}
