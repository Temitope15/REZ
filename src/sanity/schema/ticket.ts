import {defineField, defineType} from 'sanity'

export const ticket = defineType({
  name: 'ticket',
  title: 'Ticket',
  type: 'document',
  description: 'An escalation the agent could not resolve. Customer email is masked here. The full email went to the business.',
  fields: [
    defineField({name: 'business', type: 'reference', to: [{type: 'business'}], validation: (r) => r.required()}),
    defineField({name: 'status', type: 'string', options: {list: ['open', 'resolved']}, initialValue: 'open'}),
    defineField({name: 'priority', type: 'string', options: {list: ['low', 'normal', 'high']}, initialValue: 'normal'}),
    defineField({name: 'category', type: 'string'}),
    defineField({name: 'subject', type: 'string'}),
    defineField({name: 'summary', type: 'text', rows: 3}),
    defineField({name: 'reason', type: 'string', description: 'Why the agent escalated.'}),
    defineField({name: 'customerName', type: 'string'}),
    defineField({name: 'customerEmailMasked', type: 'string'}),
    defineField({name: 'transcript', type: 'text', rows: 15}),
    defineField({name: 'suggestedReply', type: 'text', rows: 5}),
    defineField({name: 'sessionId', type: 'string'}),
    defineField({name: 'emailSent', type: 'boolean', initialValue: false}),
    defineField({name: 'createdAt', type: 'datetime'}),
  ],
  preview: {select: {title: 'subject', subtitle: 'status'}},
})
