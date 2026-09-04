import { Schema, model, models, type InferSchemaType } from "mongoose";

const bankAccountSchema = new Schema(
  {
    createdBy: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
    },
    configured: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

export type BankAccountDocument = InferSchemaType<typeof bankAccountSchema> & {
  _id: string;
};

export const BankAccountModel =
  models.BankAccount || model("BankAccount", bankAccountSchema);
