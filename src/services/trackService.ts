import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Mood, Track, AudioResolution } from '../types/music';

/**
 * Fetches tracks from Supabase PostgreSQL database filtered by mood.
 * Returns null if Supabase is not configured, offline, or returns 0 tracks,
 * allowing the application to seamlessly fall back to local mock data.
 */
export async function fetchTracksFromSupabase(mood: Mood): Promise<Track[] | null> {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('tracks')
      .select('id, title, artist, duration, audio_path, audio_url, order_index')
      .eq('mood', mood)
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (error) {
      console.warn(`[Supabase] Could not fetch tracks for ${mood}:`, error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data.map((t) => {
      let resolvedUrl: string | null = null;
      if (t.audio_url) {
        resolvedUrl = t.audio_url;
      } else if (t.audio_path && supabase) {
        const cleanPath = t.audio_path.replace(/track-0?(\d+)\.mp3$/i, '$1.mp3');
        const { data: storageData } = supabase.storage.from('music').getPublicUrl(cleanPath);
        resolvedUrl = storageData?.publicUrl || null;
      }

      return {
        id: t.id,
        title: t.title,
        artist: t.artist,
        duration: t.duration || 180,
        audioPath: t.audio_path,
        audioUrl: resolvedUrl,
        orderIndex: t.order_index ?? 0,
      };
    });
  } catch (err) {
    console.warn('[Supabase] Network/Unexpected error while fetching tracks:', err);
    return null;
  }
}

/**
 * Resolves the streaming audio URL following the industry-standard priority:
 * 1. Supabase CDN (Storage bucket or direct audio URL)
 * 2. User custom-uploaded audio for this session
 * 3. Local downloaded MP3 in public/music/{mood}
 * 4. Quiet fallback when no audio exists
 */
export function resolveAudioSource(
  mood: Mood,
  index: number,
  track: { title: string; audioUrl?: string | null },
  catalog: Record<string, string[]>,
  customAudio: Record<string, { url: string; name: string }>
): AudioResolution {
  // 1. Supabase CDN (if explicitly set on track from DB)
  if (track.audioUrl) {
    return {
      url: track.audioUrl,
      isReal: true,
      source: 'cdn',
      label: 'CDN Stream',
    };
  }

  // 2. Custom session audio
  const customKey = `${mood}-${index}`;
  if (customAudio[customKey]) {
    return {
      url: customAudio[customKey].url,
      isReal: true,
      source: 'custom',
      label: customAudio[customKey].name,
    };
  }

  // 3. Direct Supabase Storage CDN (ensures streaming works even before/without DB sync)
  if (isSupabaseConfigured && supabase) {
    const { data: storageData } = supabase.storage
      .from('music')
      .getPublicUrl(`${mood}/${index + 1}.mp3`);

    if (storageData?.publicUrl) {
      return {
        url: storageData.publicUrl,
        isReal: true,
        source: 'cdn',
        label: 'CDN Stream',
      };
    }
  }

  // 4. Local directory scanning (public/music/{mood})
  const moodFiles = catalog[mood] || [];
  if (moodFiles.length > 0) {
    const numStr = String(index + 1);
    const paddedNum = numStr.padStart(2, '0');
    const cleanTitle = track.title.toLowerCase().replace(/[^a-z0-9]/g, '');

    const match = moodFiles.find((u) => {
      const decoded = decodeURIComponent(u).toLowerCase();
      const baseName = decoded.split('/').pop()?.replace(/\.[^/.]+$/, '') || '';
      const cleanBase = baseName.replace(/[^a-z0-9]/g, '');
      return (
        baseName === numStr ||
        baseName === paddedNum ||
        baseName === `track${numStr}` ||
        baseName === `track${paddedNum}` ||
        baseName === `track-${numStr}` ||
        baseName === `track-${paddedNum}` ||
        cleanBase === cleanTitle
      );
    });

    if (match) {
      const decodedName = decodeURIComponent(match.split('/').pop() || 'mp3');
      return { url: match, isReal: true, source: 'local', label: decodedName };
    }

    if (index < moodFiles.length) {
      const decodedName = decodeURIComponent(moodFiles[index].split('/').pop() || 'mp3');
      return { url: moodFiles[index], isReal: true, source: 'local', label: decodedName };
    }
  }

  // 5. Quiet fallback
  return {
    url: null,
    isReal: false,
    source: 'none',
    label: null,
  };
}
