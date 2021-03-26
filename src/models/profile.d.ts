import { Document, Model } from 'mongoose';

export interface IProfile extends Document {
  name: string
}

export function connect(): Promise<Model<IProfile>>;

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
