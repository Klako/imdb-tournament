import { Document } from 'mongoose';

export interface IRoom extends Document {
  id: string,
  movies: [{ id: string, owner: string }],
  users: [string],
  owner: string,
  settings: {
    minperuser: number,
    maxperuser: number,
    candropinvote: boolean
  },
  state: string,
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
          data: string
        },
        movie2: {
          id: string,
          data: string
        }
      }],
      userVotes: [{
        user: string,
        votes: [string]
      }]
    }
  }
}

export function connect(): Promise<Model<IRoom>>;
