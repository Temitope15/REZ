/**
 * Local pipeline runner. Creates (or reuses) a business and runs the full ingest.
 *   npx tsx --env-file=.env.local scripts/ingest.mts "Acme Shop" https://acme.example support@acme.example [--no-kb] [--pages=40]
 */
import {sanityWrite, type BusinessDoc} from '../src/lib/sanity'
import {ingestBusiness, newPublicKey, slugify} from '../src/lib/ingest'
import {buildKnowledgeBase, ensureKnowledgeBase} from '../src/lib/kb'

const args = process.argv.slice(2)
const flags = new Set(args.filter((a) => a.startsWith('--')))
const positional = args.filter((a) => !a.startsWith('--'))
const [name, websiteUrl, escalationEmail] = positional
if (!name || !websiteUrl || !escalationEmail) {
  console.error('usage: npx tsx --env-file=.env.local scripts/ingest.mts <name> <websiteUrl> <escalationEmail> [--no-kb] [--pages=N]')
  process.exit(1)
}
const pagesFlag = [...flags].find((f) => f.startsWith('--pages='))
const maxPages = pagesFlag ? Number(pagesFlag.split('=')[1]) : 40

const slug = slugify(name)
let business = await sanityWrite.fetch<BusinessDoc | null>(`*[_type == "business" && slug.current == $slug][0]`, {slug})
if (!business) {
  const hostname = new URL(websiteUrl).hostname
  business = (await sanityWrite.create({
    _type: 'business',
    name,
    slug: {_type: 'slug', current: slug},
    websiteUrl,
    escalationEmail,
    publicKey: newPublicKey(),
    allowedDomains: [hostname, hostname.replace(/^www\./, '')],
    status: 'pending',
    widget: {botName: 'Rez', greeting: `Hi! I'm Rez, ${name}'s assistant. How can I help?`, accentColor: '#2563eb'},
  })) as unknown as BusinessDoc
  console.log('created business', business._id)
} else {
  console.log('reusing business', business._id)
}
console.log('widget key:', business.publicKey)

if (flags.has('--kb-only')) {
  await sanityWrite.patch(business._id).set({status: 'building', statusMessage: 'Building the knowledge base in Sanity Context'}).commit()
  const hadKb = Boolean(business.knowledgeBaseId)
  const kbId = await ensureKnowledgeBase(business)
  console.log('knowledge base', kbId, hadKb ? '(refresh)' : '(build)')
  console.log(await buildKnowledgeBase(kbId, hadKb ? 'refresh' : 'build'))
  await sanityWrite.patch(business._id).set({status: 'ready', statusMessage: 'Knowledge base ready', lastIngestedAt: new Date().toISOString()}).commit()
  console.log('done')
  process.exit(0)
}

const result = await ingestBusiness(business._id, {maxPages, buildKb: !flags.has('--no-kb')})
console.log('done', result)
