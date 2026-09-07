import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  OWNER = 'OWNER',
  BACK_OFFICE = 'BACK_OFFICE',
  LMO = 'LMO',
  VERIFICATION_OFFICER = 'VERIFICATION_OFFICER',
  ADMIN = 'ADMIN',
}

export interface IUser extends Document {
  _id: Schema.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  state: string;
  district: string;
  businessName?: string;
  designation?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(password: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.OWNER,
    },
    state: { type: String, required: true, default: 'Telangana' },
    district: { type: String, required: true, default: 'Hyderabad' },
    businessName: { type: String, trim: true },
    designation: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = model<IUser>('User', userSchema);
