import mongoose, { Schema, Document } from 'mongoose';

export interface IResult extends Document {
  userId?: mongoose.Types.ObjectId;
  guestId?: string;
  wpm: number;
  accuracy: number;
  errorCount: number;
  duration: number;  // seconds
  mode: '15' | '30' | '60' | '120';
  wordCount: number;
  createdAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    guestId: {
      type: String,
      required: false,
    },
    wpm: { type: Number, required: true },
    accuracy: { type: Number, required: true },
    errorCount: { type: Number, required: true, default: 0 },
    duration: { type: Number, required: true },
    mode: {
      type: String,
      enum: ['15', '30', '60', '120'],
      required: true,
    },
    wordCount: { type: Number, required: true },
  },
  { timestamps: true }
);

ResultSchema.index({ userId: 1, createdAt: -1 });
ResultSchema.index({ wpm: -1 });

export const Result = mongoose.model<IResult>('Result', ResultSchema);
