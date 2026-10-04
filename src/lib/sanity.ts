import {createClient} from '@sanity/client'

const projectId = process.env.SANITY_PROJECT_ID || process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.SANITY_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

if (!projectId) throw new Error('SANITY_PROJECT_ID is not set')

/** Server-only client with write access. Never import from client components. */
export const sanityWrite = createClient({
  projectId,
  dataset,
  apiVersion: '2026-09-01',
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
})

/** Read-only client. Dataset is public on the free plan, so no token is needed. */
export const sanityRead = createClient({
  projectId,
  dataset,
  apiVersion: '2026-09-01',
  useCdn: true,
})

export type BusinessStatus = 'pending' | 'crawling' | 'extracting' | 'building' | 'ready' | 'error'

export interface BusinessDoc {
  _id: string
  name: string
  slug: {current: string}
  websiteUrl: string
  description?: string
  tone?: string
  hours?: string
  contact?: {email?: string; phone?: string; address?: string}
  escalationEmail: string
  publicKey: string
  allowedDomains?: string[]
  knowledgeBaseId?: string
  status: BusinessStatus
  statusMessage?: string
  lastIngestedAt?: string
  ingestAttempts?: number
  _updatedAt?: string
  widget?: {botName?: string; greeting?: string; accentColor?: string}
}

export interface KnowledgeArticleDoc {
  _id: string
  title: string
  kind: string
  question?: string
  summary?: string
  body?: string
  keywords?: string[]
  sourceUrls?: string[]
  confidence?: number
  needsReview?: boolean
  conflictNote?: string
  enabled?: boolean
}

export async function setBusinessStatus(id: string, status: BusinessStatus, statusMessage?: string) {
  await sanityWrite.patch(id).set({status, statusMessage: statusMessage ?? ''}).commit()
}
