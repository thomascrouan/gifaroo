import { Gif } from './gif.model';

export interface Collection {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export type CollectionPayload = Pick<Collection, 'name' | 'description'>;

export interface CollectionGif {
  id: string;
  collectionId: string;
  gif: Gif;
  addedAt: string;
}
