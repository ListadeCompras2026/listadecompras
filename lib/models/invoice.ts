import { Schema, model, models, type InferSchemaType } from "mongoose";

const cardInvoiceSchema = new Schema(
  {
    cardId: {
      type: String,
      required: true,
      index: true,
    },
    cardName: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 0,
      max: 11,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["open", "paid"],
      default: "open",
      required: true,
      index: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidAt: {
      type: Date,
      required: false,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 240,
      required: false,
    },
    createdBy: {
      type: String,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

cardInvoiceSchema.index({ createdBy: 1, year: 1, month: 1 });
cardInvoiceSchema.index({ cardId: 1, year: 1, month: 1 }, { unique: true });

export type CardInvoiceDocument = InferSchemaType<typeof cardInvoiceSchema> & {
  _id: string;
};

export const CardInvoiceModel =
  models.CardInvoice || model("CardInvoice", cardInvoiceSchema);
