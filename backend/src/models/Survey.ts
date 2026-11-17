import mongoose, { Schema, Document } from 'mongoose';
import { Question, SurveyStatus } from '@survey/shared';

export interface ISurveyDoc extends Document {
  rootId: string;
  version: number;
  isLatest: boolean;
  title: string;
  description?: string;
  questions: Question[];
  status: SurveyStatus;
  createdBy?: mongoose.Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
}

const SurveySchema = new Schema<ISurveyDoc>(
  {
    rootId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    isLatest: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    questions: {
      type: Schema.Types.Mixed,
      required: true,
      default: [],
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed'],
      default: 'draft',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
SurveySchema.index({ rootId: 1, version: 1 }, { unique: true });
SurveySchema.index({ rootId: 1, isLatest: 1 });

export const SurveyModel = mongoose.model<ISurveyDoc>('Survey', SurveySchema);
