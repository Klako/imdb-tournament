export interface Movie {
  id: string,
  title: string,
  image: String
}

export function getMovie(id: string): Promise<Movie>;

export function search(term: string): Promise<Movie[]>;