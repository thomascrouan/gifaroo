import { Gif } from './gif.model';

export interface Favorite {
  id: string;
  gif: Gif;
  addedAt: string;
}
