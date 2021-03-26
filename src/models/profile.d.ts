import { Document, Model } from 'mongoose';

export interface IProfile extends Document {
  name: string;
  setName(newName: string): void;
}

export function connect(): Promise<Model<IProfile>>;
