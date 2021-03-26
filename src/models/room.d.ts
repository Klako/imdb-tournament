import { Document } from 'mongoose';

export interface ISettings {
  minperuser: number;
  maxperuser: number;
  candropinvote: boolean;
}

export interface IRoom extends Document {
  movies: [{ id: string, owner: string }];
  addMovie(imdbId: string): Promise<void>;
  removeMovie(imdbId: string): void;
  users: [string];
  addUser(user: string): void;
  removeUser(user: string): void;
  hasUser(user: string): boolean;
  owner: string;
  settings: {
    minperuser: number,
    maxperuser: number,
    candropinvote: boolean
  },
  state: string;
  setState(state: string): void;
  tournament: {
    movies: [{
      id: string,
      data: object,
      eliminated: boolean
    }],
    brackets: [[{
      id: string,
      data: object
    }]],
    activeBracket: {
      number: number,
      movies: [{
        id: string,
        data: object
      }],
      pairings: [{
        movie1: {
          id: string,
          data: object
        },
        movie2: {
          id: string,
          data: object
        }
      }],
      userVotes: [{
        user: string,
        votes: [string]
      }],
      winner: string
    }
  };
  initTournament(): void;
  bracketise(): void;
  initBracket(): void;
  setUserVotes(): void;
  allUsersHaveVotes(): boolean;
  endBracket(): void;
  getBracketResults(): {
    winners: [{ id: string, points: number }],
    losers: [{ id: string, points: number }]
  };
}

export function connect(): Promise<Model<IRoom>>;

export function createRoom(): Promise<IRoom>;
export function getRoom(roomId: string): Promise<IRoom>;
export function roomExists(roomId: string): Promise<boolean>;