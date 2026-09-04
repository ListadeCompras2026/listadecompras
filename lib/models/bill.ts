import { Schema, model, models, type InferSchemaType } from "mongoose";

const billSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    category: {
      type: String,
      enum: [
        "housing",
        "utilities",
        "transport",
        "health",
        "education",
        "subscriptions",
        "insurance",
        "taxes",
        "others",
      ],
      default: "others",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
      required: true,
      index: true,
    },
    recurrence: {
      type: String,
      enum: ["monthly", "once"],
      default: "monthly",
      required: true,
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
    paidAt: {
      type: Date,
      required: false,
    },
    paymentMethod: {
      type: String,
      enum: ["credit", "debit", "pix", "cash", "meal"],
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

billSchema.index({ createdBy: 1, year: 1, month: 1, status: 1 });

export type BillDocument = InferSchemaType<typeof billSchema> & { _id: string };

export const BillModel = models.Bill || model("Bill", billSchema);
