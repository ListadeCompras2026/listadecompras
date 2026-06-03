import { Schema, model, models, type InferSchemaType } from 'mongoose'

const shoppingItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    unit: { type: String, required: true, trim: true, default: 'un' },
    checked: { type: Boolean, required: true, default: false },
    category: { type: String, required: true, trim: true, default: 'others' },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true, default: Date.now },
  },
  {
    _id: false,
  }
)

const shoppingListSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    items: {
      type: [shoppingItemSchema],
      default: [],
      required: true,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
    sharedWith: {
      type: [String],
      default: [],
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed'],
      default: 'active',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

shoppingListSchema.index({ createdBy: 1, status: 1 })
shoppingListSchema.index({ sharedWith: 1, status: 1 })

export type ShoppingListDocument = InferSchemaType<typeof shoppingListSchema> & { _id: string }

export const ShoppingListModel =
  models.ShoppingList || model('ShoppingList', shoppingListSchema)
