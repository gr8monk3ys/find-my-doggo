import { describe, expect, it } from 'vitest';
import { readApiResponse } from '@/lib/api-response';

const json = (body: unknown) => new Response(JSON.stringify(body));

describe('readApiResponse', () => {
  it('reads field errors, an error message and the delivered flag', async () => {
    const parsed = await readApiResponse(json({ fields: { email: 'Invalid' }, error: 'Bad', delivered: true }));
    expect(parsed).toEqual({ fields: { email: 'Invalid' }, error: 'Bad', delivered: true });
  });

  it('collapses a non-JSON body to an empty envelope', async () => {
    expect(await readApiResponse(new Response('<html>502</html>'))).toEqual({});
  });

  it('collapses a malformed envelope to an empty envelope', async () => {
    expect(await readApiResponse(json({ fields: 'nope' }))).toEqual({});
  });
});
