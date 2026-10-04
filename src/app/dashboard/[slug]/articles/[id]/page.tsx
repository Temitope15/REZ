import Link from 'next/link'
import {notFound} from 'next/navigation'
import {sanityWrite, type KnowledgeArticleDoc} from '@/lib/sanity'
import {deleteArticle, updateArticle} from '../../../actions'
import {Badge, Card, CardHeader, KindTag, hostOf, timeAgo} from '../../../../ui'
import {SubmitButton} from '../../SubmitButton'

export const dynamic = 'force-dynamic'

const KINDS = ['faq', 'policy', 'howto', 'troubleshooting', 'product', 'about', 'contact']

export default async function ArticlePage({params}: {params: Promise<{slug: string; id: string}>}) {
  const {slug, id} = await params
  const a = await sanityWrite.fetch<(KnowledgeArticleDoc & {_updatedAt: string}) | null>(`*[_type == "knowledgeArticle" && _id == $id][0]`, {id})
  if (!a) notFound()

  return (
    <main className="mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6">
      <Link href={`/dashboard/${slug}?tab=knowledge`} className="text-sm text-muted hover:text-ink">← Knowledge</Link>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <KindTag kind={a.kind} />
        <h1 className="text-[22px] font-semibold tracking-tight">{a.title}</h1>
        {a.needsReview && <Badge tone="warn">Needs review</Badge>}
      </div>
      <p className="mt-1 text-sm text-muted">Edited {timeAgo(a._updatedAt)}</p>

      {a.conflictNote && (
        <div className="mt-6 rounded-2xl border border-warn/25 bg-warn-soft p-5">
          <div className="font-medium text-warn">Two pages on your site disagree</div>
          <p className="mt-1 text-sm text-ink-2">REZ kept the clearer version below. Check it against the other page, fix the text if needed, then save.</p>
          <pre className="mt-3 whitespace-pre-wrap rounded-xl bg-surface/70 p-3 font-sans text-sm text-ink-2">{a.conflictNote}</pre>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <form action={updateArticle} className="grid gap-4 p-5">
            <input type="hidden" name="id" value={a._id} />
            <input type="hidden" name="slug" value={slug} />
            <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
              <label className="label">Title<input name="title" defaultValue={a.title} required className="field" /></label>
              <label className="label">Type
                <select name="kind" defaultValue={a.kind} className="field">{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
              </label>
            </div>
            <label className="label">Customer question<span className="hint">How a customer would ask it.</span><input name="question" defaultValue={a.question} className="field" /></label>
            <label className="label">Short answer<span className="hint">One or two sentences. The agent leads with this.</span><textarea name="summary" rows={2} defaultValue={a.summary} className="field" /></label>
            <label className="label">Full answer<span className="hint">Markdown. Keep exact numbers, dates and conditions.</span><textarea name="body" rows={14} defaultValue={a.body} className="field font-mono text-[13px] leading-relaxed" /></label>
            <label className="label">Keywords<span className="hint">Comma separated.</span><input name="keywords" defaultValue={(a.keywords || []).join(', ')} className="field" /></label>
            <div className="flex flex-wrap items-center gap-5 text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" name="enabled" defaultChecked={a.enabled !== false} className="h-4 w-4 accent-[var(--accent)]" /> Agent can use this answer</label>
              {a.conflictNote && <label className="flex items-center gap-2"><input type="checkbox" name="clearConflict" defaultChecked className="h-4 w-4 accent-[var(--accent)]" /> Mark conflict resolved</label>}
            </div>
            <div className="flex items-center gap-3 border-t border-line pt-4">
              <SubmitButton variant="primary" pendingLabel="Saving…">Save answer</SubmitButton>
              <span className="text-xs text-muted">Then push edits from the Overview tab.</span>
            </div>
          </form>
        </Card>

        <div className="grid content-start gap-4">
          <Card>
            <CardHeader title="Sources" description="Pages this answer came from." />
            <div className="grid gap-2 p-5">
              {a.sourceUrls && a.sourceUrls.length > 0 ? (
                a.sourceUrls.map((u) => (
                  <a key={u} href={u} target="_blank" rel="noopener" className="truncate rounded-lg bg-surface-2 px-3 py-2 font-mono text-xs text-ink-2 ring-1 ring-line hover:text-accent">
                    {hostOf(u)}
                  </a>
                ))
              ) : (
                <p className="text-sm text-muted">Written by hand.</p>
              )}
              {typeof a.confidence === 'number' && (
                <div className="mt-2">
                  <div className="mb-1 flex justify-between text-xs text-muted"><span>Extraction confidence</span><span>{Math.round(a.confidence * 100)}%</span></div>
                  <div className="h-1.5 rounded-full bg-surface-2 ring-1 ring-line"><div className="h-full rounded-full bg-accent" style={{width: `${Math.round(a.confidence * 100)}%`}} /></div>
                </div>
              )}
            </div>
          </Card>
          <form action={deleteArticle} className="px-1">
            <input type="hidden" name="id" value={a._id} />
            <input type="hidden" name="slug" value={slug} />
            <SubmitButton variant="danger" size="sm" pendingLabel="Deleting…">Delete this answer</SubmitButton>
          </form>
        </div>
      </div>
    </main>
  )
}
