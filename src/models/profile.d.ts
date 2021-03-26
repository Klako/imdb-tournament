import { Document, Model } from 'mongoose';

export interface IProfile extends Document {
  name: string;
  setName(newName: string): void;
}

export function connect(): Promise<Model<IProfile>>;

export function create(): Promise<IProfile>;
export function get(profileId: string): Promise<IProfile>;