import {defineField, defineType} from 'sanity'

export const business = defineType({
  name: 'business',
  title: 'Business',
  type: 'document',
  fields: [
    defineField({name: 'name', type: 'string', validation: (r) => r.required()}),
    defineField({name: 'slug', type: 'slug', options: {source: 'name'}, validation: (r) => r.required()}),
    defineField({name: 'websiteUrl', title: 'Website URL', type: 'url', validation: (r) => r.required()}),
    defineField({name: 'description', type: 'text', rows: 3, description: 'What the business does, in one or two sentences.'}),
    defineField({name: 'tone', type: 'string', description: 'How the agent should sound, e.g. warm and concise.'}),
    defineField({name: 'hours', type: 'string', description: 'Opening hours as written on the site.'}),
    defineField({
      name: 'contact',
      type: 'object',
      fields: [
        defineField({name: 'email', type: 'string'}),
        defineField({name: 'phone', type: 'string'}),
        defineField({name: 'address', type: 'string'}),
      ],
    }),
    defineField({
      name: 'escalationEmail',
      type: 'string',
      description: 'Where REZ sends tickets it cannot resolve.',
      validation: (r) => r.required().email(),
    }),
    defineField({name: 'publicKey', type: 'string', description: 'Key embedded in the widget script tag.', readOnly: true}),
    defineField({name: 'allowedDomains', type: 'array', of: [{type: 'string'}], description: 'Domains allowed to load the widget.'}),
    defineField({name: 'knowledgeBaseId', title: 'Sanity Context Knowledge Base ID', type: 'string', readOnly: true}),
    defineField({
      name: 'status',
      type: 'string',
      options: {list: ['pending', 'crawling', 'extracting', 'building', 'ready', 'error']},
      initialValue: 'pending',
      readOnly: true,
    }),
    defineField({name: 'statusMessage', type: 'string', readOnly: true}),
    defineField({name: 'lastIngestedAt', type: 'datetime', readOnly: true}),
    defineField({
      name: 'widget',
      type: 'object',
      fields: [
        defineField({name: 'botName', type: 'string', initialValue: 'Rez'}),
        defineField({name: 'greeting', type: 'string', initialValue: 'Hi! How can I help you today?'}),
        defineField({name: 'accentColor', type: 'string', initialValue: '#2563eb'}),
      ],
    }),
  ],
  preview: {select: {title: 'name', subtitle: 'status'}},
})
