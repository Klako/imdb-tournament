import { IProfile } from './models/profile';

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
