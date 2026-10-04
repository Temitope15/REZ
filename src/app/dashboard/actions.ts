'use server'

import {revalidatePath} from 'next/cache'
import {sanityWrite} from '@/lib/sanity'
import {dispatchJob} from '@/lib/jobs'

export async function updateArticle(formData: FormData) {
  const id = String(formData.get('id'))
  const slug = String(formData.get('slug'))
  const keywords = String(formData.get('keywords') || '')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean)
  await sanityWrite
    .patch(id)
    .set({
      title: String(formData.get('title') || ''),
      kind: String(formData.get('kind') || 'faq'),
      question: String(formData.get('question') || ''),
      summary: String(formData.get('summary') || ''),
      body: String(formData.get('body') || ''),
      keywords,
      enabled: formData.get('enabled') === 'on',
      needsReview: false,
      conflictNote: formData.get('clearConflict') === 'on' ? '' : undefined,
    })
    .commit()
  revalidatePath(`/dashboard/${slug}`)
  revalidatePath(`/dashboard/${slug}/articles/${id}`)
}

export async function createArticle(formData: FormData) {
  const businessId = String(formData.get('businessId'))
  const slug = String(formData.get('slug'))
  await sanityWrite.create({
    _type: 'knowledgeArticle',
    business: {_type: 'reference', _ref: businessId},
    title: String(formData.get('title') || 'New article'),
    kind: String(formData.get('kind') || 'faq'),
    question: String(formData.get('question') || ''),
    summary: String(formData.get('summary') || ''),
    body: String(formData.get('body') || ''),
    keywords: [],
    sourceUrls: [],
    confidence: 1,
    needsReview: false,
    enabled: true,
  })
  revalidatePath(`/dashboard/${slug}`)
}

export async function deleteArticle(formData: FormData) {
  const id = String(formData.get('id'))
  const slug = String(formData.get('slug'))
  await sanityWrite.delete(id)
  revalidatePath(`/dashboard/${slug}`)
}

export async function resolveTicket(formData: FormData) {
  const id = String(formData.get('id'))
  const slug = String(formData.get('slug'))
  await sanityWrite.patch(id).set({status: 'resolved'}).commit()
  revalidatePath(`/dashboard/${slug}`)
  revalidatePath(`/dashboard/${slug}/tickets/${id}`)
}

/** Push edited articles into the Sanity Context Knowledge Base. */
export async function refreshKnowledgeBase(formData: FormData) {
  const businessId = String(formData.get('businessId'))
  const slug = String(formData.get('slug'))
  await dispatchJob('refresh-kb', businessId).catch((err) => console.error('refresh dispatch failed', err))
  revalidatePath(`/dashboard/${slug}`)
}

export async function reingest(formData: FormData) {
  const businessId = String(formData.get('businessId'))
  const slug = String(formData.get('slug'))
  await dispatchJob('ingest', businessId).catch((err) => console.error('ingest dispatch failed', err))
  revalidatePath(`/dashboard/${slug}`)
}

export async function updateBusiness(formData: FormData) {
  const businessId = String(formData.get('businessId'))
  const slug = String(formData.get('slug'))
  await sanityWrite
    .patch(businessId)
    .set({
      escalationEmail: String(formData.get('escalationEmail') || ''),
      tone: String(formData.get('tone') || ''),
      hours: String(formData.get('hours') || ''),
      description: String(formData.get('description') || ''),
      widget: {
        botName: String(formData.get('botName') || 'Rez'),
        greeting: String(formData.get('greeting') || ''),
        accentColor: String(formData.get('accentColor') || '#2563eb'),
      },
    })
    .commit()
  revalidatePath(`/dashboard/${slug}`)
}
