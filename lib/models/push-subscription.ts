import { Schema, model, models, type InferSchemaType } from 'mongoose'

const pushSubscriptionSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
      },
      auth: {
        type: String,
        required: true,
      },
    },
    userAgent: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true })

export type PushSubscriptionDocument = InferSchemaType<typeof pushSubscriptionSchema> & {
  _id: string
}

export const PushSubscriptionModel =
  models.PushSubscription || model('PushSubscription', pushSubscriptionSchema)
