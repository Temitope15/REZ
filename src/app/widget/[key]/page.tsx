import {sanityRead, type BusinessDoc} from '@/lib/sanity'
import {ChatWidget} from './ChatWidget'

export const dynamic = 'force-dynamic'

export default async function WidgetPage({params}: {params: Promise<{key: string}>}) {
  const {key} = await params
  const business = await sanityRead.fetch<Pick<BusinessDoc, 'name' | 'status' | 'widget' | 'knowledgeBaseId'> | null>(
    `*[_type == "business" && publicKey == $key][0]{name, status, widget, knowledgeBaseId}`,
    {key},
  )
  if (!business) {
    return (
      <div style={{fontFamily: 'system-ui', padding: 24, color: '#444'}}>
        This chat widget is not configured. Check the data-rez-key on the script tag.
      </div>
    )
  }
  return (
    <ChatWidget
      widgetKey={key}
      businessName={business.name}
      botName={business.widget?.botName || 'Rez'}
      greeting={business.widget?.greeting || `Hi! I'm Rez, ${business.name}'s assistant. How can I help?`}
      accent={business.widget?.accentColor || '#2563eb'}
      ready={business.status === 'ready' || Boolean(business.knowledgeBaseId)}
    />
  )
}
