export interface DisplayDocument {
  title: string;
  url: string;
}

export interface DisplayResponse {
  documents: DisplayDocument[];
}

export type DisplayRendererState =
  | { kind: 'loading' }
  | { kind: 'success'; documents: DisplayDocument[] }
  | { kind: 'empty' }
  | { kind: 'error'; message: string };
