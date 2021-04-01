import { Document } from 'mongoose';
import { Movie } from './imdb';

export interface ISettings {
  minperuser: number;
  maxperuser: number;
  candropinvote: boolean;
}

export interface IRoom extends Document {
  movies: [{ id: string, owner: string, data: Movie }];
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
      data: Movie,
      eliminated: boolean
    }],
    brackets: [[{
      id: string,
      data: Movie
    }]],
    activeBracket: {
      number: number,
      movies: [{
        id: string,
        data: Movie
      }],
      pairings: [{
        movie1: {
          id: string,
          data: Movie
        },
        movie2: {
          id: string,
          data: Movie
        }
      }],
      userVotes: [{
        user: string,
        votes: [string]
      }],
      winner: {
        id: string,
        title: string,
        image: string
      }
    }
  };
  initTournament(): void;
  bracketise(): void;
  initBracket(): void;
  setUserVotes(): Promise<void>;
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