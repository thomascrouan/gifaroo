export type GifSource = 'klipy' | 'local';

export interface Gif {
  sourceId: string;
  source: GifSource;
  title: string;
  url: string;
  previewUrl: string;
}
