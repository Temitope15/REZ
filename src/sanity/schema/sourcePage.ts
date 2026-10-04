import {defineField, defineType} from 'sanity'

export const sourcePage = defineType({
  name: 'sourcePage',
  title: 'Source page',
  type: 'document',
  description: 'A crawled page from the business website. Articles cite these.',
  fields: [
    defineField({name: 'business', type: 'reference', to: [{type: 'business'}], validation: (r) => r.required()}),
    defineField({name: 'url', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'contentHash', type: 'string', readOnly: true}),
    defineField({name: 'markdown', type: 'text', rows: 20}),
    defineField({name: 'fetchedAt', type: 'datetime'}),
    defineField({name: 'extracted', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'title', subtitle: 'url'}},
})
