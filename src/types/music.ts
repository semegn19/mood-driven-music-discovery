export type Mood = 'calm' | 'focused' | 'melancholic' | 'energetic' | 'romantic' | 'chaotic';

export interface Track {
  id?: string;
  title: string;
  artist: string;
  duration: number;
  audioPath?: string | null;
  audioUrl?: string | null;
  orderIndex?: number;
}

export interface AudioResolution {
  url: string | null;
  isReal: boolean;
  source: 'cdn' | 'local' | 'custom' | 'none';
  label: string | null;
}
