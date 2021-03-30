import { Reference } from 'vimdb';

export interface Movie {
  id: string,
  title: string,
  image: {
    small: string,
    big: string
  }
}

export function getMovie(id: string): Promise<Movie>;

export function search(term: string): Promise<Movie[]>;