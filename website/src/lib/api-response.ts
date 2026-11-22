import { z } from 'zod';
import type { Dog } from '@/lib/types';

const ApiResponse = z.object({
  fields: z.record(z.string(), z.string()).optional(),
  error: z.string().optional(),
  delivered: z.boolean().optional(),
  dog: z.custom<Dog>().optional(),
});

export type ApiResponse = z.infer<typeof ApiResponse>;

/** The JSON envelope our write routes answer with; anything unreadable collapses to an empty envelope. */
export async function readApiResponse(response: Response): Promise<ApiResponse> {
  const parsed = ApiResponse.safeParse(await response.json().catch(() => ({})));
  return parsed.success ? parsed.data : {};
}
