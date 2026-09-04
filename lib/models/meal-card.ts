import { Schema, model, models, type InferSchemaType } from "mongoose";

const mealCardSchema = new Schema(
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
    balance: {
      type: Number,
      required: true,
      default: 0,
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

mealCardSchema.index({ createdBy: 1, name: 1 });

export type MealCardDocument = InferSchemaType<typeof mealCardSchema> & {
  _id: string;
};

if (models.MealCard) {
  delete models.MealCard;
}

export const MealCardModel = model("MealCard", mealCardSchema);
