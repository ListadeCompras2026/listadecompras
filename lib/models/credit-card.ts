import { Schema, model, models, type InferSchemaType } from "mongoose";

const creditCardSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    lastDigits: {
      type: String,
      trim: true,
      maxlength: 4,
      required: false,
    },
    closingDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
    },
    dueDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

creditCardSchema.index({ createdBy: 1, name: 1 });

export type CreditCardDocument = InferSchemaType<typeof creditCardSchema> & {
  _id: string;
};

if (models.CreditCard) {
  delete models.CreditCard;
}

export const CreditCardModel = model("CreditCard", creditCardSchema);
