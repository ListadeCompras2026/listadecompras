import { Schema, model, models, type InferSchemaType } from "mongoose";

const purchaseItemSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    unit: { type: String, required: true, trim: true },
    checked: { type: Boolean, required: true, default: true },
    category: { type: String, required: true, trim: true },
    addedBy: { type: String, required: true },
    addedAt: { type: Date, required: true },
    unitPrice: { type: Number, required: false, min: 0 },
    totalPrice: { type: Number, required: false, min: 0 },
  },
  {
    _id: false,
  }
);

const purchaseSchema = new Schema(
  {
    listId: {
      type: String,
      required: false,
      default: "",
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
      enum: ["credit", "debit", "pix", "cash", "meal"],
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
    completedByName: {
      type: String,
      required: false,
      trim: true,
    },
    items: {
      type: [purchaseItemSchema],
      required: true,
      default: [],
    },
    receiptKey: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    receiptUrl: {
      type: String,
      required: false,
      trim: true,
    },
    cardId: {
      type: String,
      required: false,
      index: true,
    },
    mealCardId: {
      type: String,
      required: false,
      index: true,
    },
    source: {
      type: String,
      enum: ["list", "standalone"],
      required: true,
      default: "list",
      index: true,
    },
    category: {
      type: String,
      required: false,
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

purchaseSchema.index({ completedBy: 1, completedAt: -1 });

export type PurchaseDocument = InferSchemaType<typeof purchaseSchema> & {
  _id: string;
};

if (models.Purchase) {
  delete models.Purchase;
}

export const PurchaseModel = model("Purchase", purchaseSchema);
