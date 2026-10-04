import {sanityWrite, type BusinessDoc} from '@/lib/sanity'
import {newPublicKey, slugify} from '@/lib/ingest'
import {dispatchJob} from '@/lib/jobs'

export const maxDuration = 300

/** Onboarding: create a business and kick off ingestion in the background. */
export async function POST(req: Request) {
  const body = (await req.json()) as {name?: string; websiteUrl?: string; escalationEmail?: string}
  const {name, websiteUrl, escalationEmail} = body
  if (!name || !websiteUrl || !escalationEmail) {
    return Response.json({error: 'name, websiteUrl and escalationEmail are required'}, {status: 400})
  }
  let hostname: string
  try {
    hostname = new URL(websiteUrl).hostname
  } catch {
    return Response.json({error: 'websiteUrl is not a valid URL'}, {status: 400})
  }

  const slug = slugify(name)
  const existing = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && slug.current == $slug][0]`, {slug})
  const business =
    existing ||
    ((await sanityWrite.create({
      _type: 'business',
      name,
      slug: {_type: 'slug', current: slug},
      websiteUrl,
      escalationEmail,
      publicKey: newPublicKey(),
      allowedDomains: [hostname, hostname.replace(/^www\./, '')],
      status: 'pending',
      widget: {botName: 'Rez', greeting: `Hi! I'm Rez, ${name}'s assistant. How can I help?`, accentColor: '#0b0b0c'},
    })) as unknown as BusinessDoc)

  try {
    await dispatchJob('ingest', business._id)
  } catch (err) {
    return Response.json({error: `Could not start ingestion: ${(err as Error).message}`, id: business._id, slug}, {status: 502})
  }

  return Response.json({id: business._id, slug, publicKey: business.publicKey, status: existing ? existing.status : 'pending'})
}

export async function GET() {
  const rows = await sanityWrite.fetch(`*[_type == "business"] | order(_createdAt desc){_id, name, slug, websiteUrl, status, statusMessage, lastIngestedAt, knowledgeBaseId}`)
  return Response.json(rows)
}
