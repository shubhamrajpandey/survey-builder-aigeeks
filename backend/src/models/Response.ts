import mongoose, { Schema, Document } from 'mongoose';
import { AnswersMap } from '@survey/shared';

export interface IResponseDoc extends Document {
  surveyId: mongoose.Types.ObjectId;
  rootId: string;
  version: number;
  answers: AnswersMap;
  submittedAt: Date;
  meta?: {
    ipHash?: string;
  };
}

const ResponseSchema = new Schema<IResponseDoc>(
  {
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },
    rootId: {
      type: String,
      required: true,
    },
    version: {
      type: Number,
      required: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    meta: {
      ipHash: {
        type: String,
      },
    },
  },
  {
    timestamps: false,
  }
);

ResponseSchema.index({ surveyId: 1 });
ResponseSchema.index({ rootId: 1 });
ResponseSchema.index({ rootId: 1, 'meta.ipHash': 1, submittedAt: -1 });

export const ResponseModel = mongoose.model<IResponseDoc>('Response', ResponseSchema);
