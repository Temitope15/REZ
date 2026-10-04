import {defineField, defineType} from 'sanity'

export const ARTICLE_KINDS = ['faq', 'policy', 'howto', 'troubleshooting', 'product', 'about', 'contact'] as const

export const knowledgeArticle = defineType({
  name: 'knowledgeArticle',
  title: 'Knowledge article',
  type: 'document',
  description: 'One small, single-topic answer the agent can give. Businesses edit these.',
  fields: [
    defineField({name: 'business', type: 'reference', to: [{type: 'business'}], validation: (r) => r.required()}),
    defineField({name: 'title', type: 'string', validation: (r) => r.required()}),
    defineField({
      name: 'kind',
      type: 'string',
      options: {list: [...ARTICLE_KINDS]},
      validation: (r) => r.required(),
    }),
    defineField({name: 'question', type: 'string', description: 'The customer question this answers, in their words.'}),
    defineField({name: 'summary', type: 'text', rows: 2, description: 'One or two sentence answer.'}),
    defineField({name: 'body', type: 'text', rows: 12, description: 'Full answer in Markdown. Keep it to one topic.'}),
    defineField({name: 'keywords', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'sourceUrls', title: 'Source URLs', type: 'array', of: [{type: 'url'}]}),
    defineField({name: 'sources', type: 'array', of: [{type: 'reference', to: [{type: 'sourcePage'}]}]}),
    defineField({name: 'confidence', type: 'number', description: '0 to 1, how sure the extractor was.'}),
    defineField({name: 'needsReview', type: 'boolean', initialValue: false}),
    defineField({name: 'conflictNote', type: 'text', rows: 3, description: 'Set when two pages disagreed.'}),
    defineField({name: 'enabled', type: 'boolean', initialValue: true, description: 'Disable to hide from the agent without deleting.'}),
  ],
  preview: {select: {title: 'title', subtitle: 'kind'}},
})
