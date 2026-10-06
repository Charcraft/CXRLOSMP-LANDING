import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    tech: z.array(z.string()),
    year: z.string(),
    pattern: z.enum(['circuit', 'vinyl', 'data', 'neon']),
    primaryHue: z.number().min(0).max(360),
    secondaryHue: z.number().min(0).max(360),
    featured: z.boolean().default(false),
    demo: z.string().url().optional(),
    repo: z.string().url().optional(),
    metric: z.string().optional(),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: 'src/content/experience' }),
  schema: z.object({
    role: z.string(),
    company: z.string(),
    period: z.string(),
    description: z.string(),
    type: z.enum(['work', 'education', 'certification']),
  }),
});

export const collections = { projects, experience };