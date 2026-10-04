import Link from 'next/link'
import {sanityRead, type BusinessDoc} from '@/lib/sanity'
import {hostOf} from '../../ui'
import {DemoWidget} from './DemoWidget'

export const dynamic = 'force-dynamic'

interface Article {
  _id: string
  title: string
  kind: string
  question?: string
  summary?: string
}

/**
 * A stand-in version of the business's own website, built from what REZ learned about it,
 * with the REZ widget installed. Lets the owner try the agent exactly as a customer would.
 */
export default async function DemoPage({params}: {params: Promise<{key: string}>}) {
  const {key} = await params
  const business = await sanityRead.fetch<(BusinessDoc & {articles: Article[]}) | null>(
    `*[_type == "business" && publicKey == $key][0]{
      ..., "articles": *[_type == "knowledgeArticle" && business._ref == ^._id && enabled != false] | order(confidence desc, title asc){_id, title, kind, question, summary}
    }`,
    {key},
  )

  if (!business) {
    return (
      <main className="grid min-h-screen place-items-center bg-bg p-6 text-center">
        <div>
          <div className="font-display text-[28px]">No business found for this key</div>
          <Link href="/dashboard" className="mt-3 inline-block text-sm text-muted underline">Back to the dashboard</Link>
        </div>
      </main>
    )
  }

  const ready = business.status === 'ready' || Boolean(business.knowledgeBaseId)
  const products = business.articles.filter((a) => a.kind === 'product').slice(0, 4)
  const faqs = business.articles.filter((a) => a.kind === 'faq' || a.kind === 'policy').slice(0, 4)
  const contact = business.contact || {}
  const host = hostOf(business.websiteUrl)
  const nav = [products.length ? 'Products' : null, faqs.length ? 'Help' : null, contact.email || contact.phone ? 'Contact' : null].filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-bg text-ink">
      {/* Banner so nobody mistakes this for the real site */}
      <div className="border-b border-line bg-surface-2 px-4 py-2 text-center text-[12.5px] text-muted">
        A preview of <strong className="text-ink">{host}</strong> with REZ installed, built from what REZ learned. Not the real website.
        <Link href={`/dashboard/${business.slug.current}`} className="ml-2 underline hover:text-ink">Back to dashboard</Link>
      </div>

      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-ink text-[15px] font-bold text-white">{business.name.slice(0, 1).toUpperCase()}</div>
          <div className="font-display text-[20px]" style={{letterSpacing: '-0.03em'}}>{business.name}</div>
        </div>
        <nav className="hidden gap-6 text-[14px] text-muted sm:flex">
          {nav.map((n) => (
            <a key={n} href={`#${n.toLowerCase()}`} className="hover:text-ink">{n}</a>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24 pt-10">
        <h1 className="font-display max-w-3xl text-[40px] leading-[1] sm:text-[60px]">
          {business.description ? business.description.split(/(?<=[.!?])\s/)[0] : `Welcome to ${business.name}.`}
        </h1>
        {business.description && business.description.split(/(?<=[.!?])\s/).length > 1 && (
          <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-muted">{business.description.split(/(?<=[.!?])\s/).slice(1).join(' ')}</p>
        )}
        {business.hours && <p className="mt-3 text-[14px] text-muted">Hours: {business.hours}</p>}

        {products.length > 0 && (
          <section id="products" className="mt-16">
            <h2 className="font-display text-[24px]" style={{letterSpacing: '-0.025em'}}>Products</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((p) => (
                <div key={p._id} className="rounded-2xl border border-line bg-surface p-4">
                  <div className="mb-3 aspect-[4/3] rounded-xl bg-[repeating-linear-gradient(135deg,#efeeea_0_10px,#f7f6f3_10px_20px)]" />
                  <div className="font-medium">{p.title}</div>
                  {p.summary && <p className="mt-1 line-clamp-3 text-[13px] text-muted">{p.summary}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {faqs.length > 0 && (
          <section id="help" className="mt-16">
            <h2 className="font-display text-[24px]" style={{letterSpacing: '-0.025em'}}>Common questions</h2>
            <div className="mt-5 divide-y divide-line rounded-2xl border border-line bg-surface">
              {faqs.map((f) => (
                <details key={f._id} className="group px-5 py-4">
                  <summary className="cursor-pointer list-none font-medium marker:hidden">{f.question || f.title}</summary>
                  {f.summary && <p className="mt-2 text-[14px] leading-relaxed text-muted">{f.summary}</p>}
                </details>
              ))}
            </div>
            <p className="mt-3 text-[13px] text-muted">Something else? Ask the chat in the corner.</p>
          </section>
        )}

        {(contact.email || contact.phone || contact.address) && (
          <section id="contact" className="mt-16 rounded-2xl border border-line bg-surface p-6">
            <h2 className="font-display text-[20px]" style={{letterSpacing: '-0.025em'}}>Contact</h2>
            <div className="mt-2 grid gap-1 text-[14px] text-muted">
              {contact.email && <div>{contact.email}</div>}
              {contact.phone && <div>{contact.phone}</div>}
              {contact.address && <div>{contact.address}</div>}
            </div>
          </section>
        )}

        {!products.length && !faqs.length && (
          <p className="mt-16 text-[15px] text-muted">
            {ready ? 'REZ found no public pages to build this preview from, but the chat still works.' : 'REZ is still reading this website. The chat opens as soon as it is done.'}
          </p>
        )}
      </main>

      <DemoWidget publicKey={business.publicKey} ready={ready} />
    </div>
  )
}
