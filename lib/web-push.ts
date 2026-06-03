import webpush from 'web-push'
import { PushSubscriptionModel } from '@/lib/models/push-subscription'

type NotificationPayload = {
  title: string
  body: string
  url?: string
}

function canUseWebPush() {
  return Boolean(
    process.env.VAPID_SUBJECT &&
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
      process.env.VAPID_PRIVATE_KEY
  )
}

function configureWebPush() {
  if (!canUseWebPush()) {
    return false
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT as string,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string
  )

  return true
}

export async function sendPushToUser(userId: string, payload: NotificationPayload) {
  if (!configureWebPush()) {
    return
  }

  const subscriptions = await PushSubscriptionModel.find({ userId }).lean()
  if (!subscriptions.length) {
    return
  }

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/',
  })

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.keys.p256dh,
              auth: subscription.keys.auth,
            },
          },
          body
        )
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          await PushSubscriptionModel.deleteOne({ endpoint: subscription.endpoint })
        }
      }
    })
  )
}
