import { Document, Model } from 'mongoose';

export interface IProfile extends Document {
  name: string;
  setName(newName: string): void;
}

export function connect(): Promise<Model<IProfile>>;

const profileSchema: Schema<IProfile>;

declare global {
  namespace Express {
    interface Request {
      profile: IProfile;
    }
  }
}

declare module 'express-session' {
  interface SessionData {
    profileId: string;
  }
}
