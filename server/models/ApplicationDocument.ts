import { Schema, model, Document, Types } from 'mongoose';

export interface IApplicationDocument extends Document {
  application?: Types.ObjectId;
  verification?: Types.ObjectId;
  instrument?: Types.ObjectId;
  docType: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const applicationDocumentSchema = new Schema<IApplicationDocument>(
  {
    application: { type: Schema.Types.ObjectId, ref: 'Application', index: true },
    verification: { type: Schema.Types.ObjectId, ref: 'Verification', index: true },
    instrument: { type: Schema.Types.ObjectId, ref: 'Instrument', index: true },
    docType: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
  }
);

export const ApplicationDocument = model<IApplicationDocument>('ApplicationDocument', applicationDocumentSchema);
