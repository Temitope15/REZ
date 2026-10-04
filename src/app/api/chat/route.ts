import {convertToModelMessages, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream, type UIMessage} from 'ai'
import {fallbackModel} from '@/lib/ai'
import {sanityRead, type BusinessDoc} from '@/lib/sanity'
import {buildSystemPrompt, buildTools, toInsightsMessages, transcriptFromMessages} from '@/lib/agent'
import {saveConversation} from '@/lib/kb'

export const maxDuration = 60

export async function POST(req: Request) {
  const body = (await req.json()) as {messages: UIMessage[]; key?: string; sessionId?: string}
  const key = body.key || req.headers.get('x-rez-key')
  if (!key) return Response.json({error: 'Missing widget key'}, {status: 400})

  const business = await sanityRead.fetch<BusinessDoc | null>(`*[_type == "business" && publicKey == $key][0]`, {key})
  if (!business) return Response.json({error: 'Unknown widget key'}, {status: 404})
  if (business.status !== 'ready' && !business.knowledgeBaseId) {
    return Response.json({error: 'This assistant is still being set up. Please try again in a few minutes.'}, {status: 409})
  }

  const sessionId = body.sessionId || crypto.randomUUID()
  const modelMessages = await convertToModelMessages(body.messages.slice(-30))
  const {tools, usingKnowledgeBase, close} = await buildTools(business, sessionId, () => transcriptFromMessages(modelMessages))

  const result = streamText({
    model: fallbackModel(),
    maxRetries: 0,
    system: buildSystemPrompt(business, usingKnowledgeBase),
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(8),
    temperature: 0.3,
    onEnd: async (event) => {
      await close()
      // Feed Sanity Context Insights: full transcript including tool calls, so the business sees content gaps.
      await saveConversation({
        threadId: `${business.slug.current}:${sessionId}`,
        messages: toInsightsMessages([...modelMessages, ...event.responseMessages]),
        businessSlug: business.slug.current,
        knowledgeBaseId: business.knowledgeBaseId,
        modelId: event.model?.modelId,
        tokenUsage: {inputTokens: event.totalUsage?.inputTokens, outputTokens: event.totalUsage?.outputTokens, totalTokens: event.totalUsage?.totalTokens},
      })
    },
    onError: ({error}) => console.error('chat error', error),
  })

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({stream: result.stream}),
    headers: {'x-rez-session': sessionId, 'Access-Control-Allow-Origin': '*'},
  })
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'content-type, x-rez-key',
    },
  })
}
