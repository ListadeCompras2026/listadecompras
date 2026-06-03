import { Schema, model, models, type InferSchemaType } from 'mongoose'

const purchaseItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unit: { type: String, required: true, trim: true },
    checked: { type: Boolean, required: true, default: true },
    category: { type: String, required: true, trim: true },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true },
  },
  {
    _id: false,
  }
)

const purchaseSchema = new Schema(
  {
    listId: {
      type: String,
      required: true,
      index: true,
    },
    listName: {
      type: String,
      required: true,
      trim: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['credit', 'debit', 'pix', 'cash', 'meal'],
      required: true,
      index: true,
    },
    store: {
      type: String,
      required: false,
      trim: true,
    },
    completedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    completedBy: {
      type: String,
      required: true,
      index: true,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

purchaseSchema.index({ completedBy: 1, completedAt: -1 })

export type PurchaseDocument = InferSchemaType<typeof purchaseSchema> & { _id: string }

export const PurchaseModel = models.Purchase || model('Purchase', purchaseSchema)
