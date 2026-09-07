import { Schema, model, Document, Types } from 'mongoose';

export interface INotification extends Document {
  user: Types.ObjectId;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    read: { type: Boolean, default: false },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const Notification = model<INotification>('Notification', notificationSchema);
