-- ==============================================================================
-- Mood-Driven Music Discovery - Supabase Database Schema & Storage Configuration
-- ==============================================================================

-- 1. Create the tracks table
CREATE TABLE IF NOT EXISTS public.tracks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    artist TEXT NOT NULL,
    mood TEXT NOT NULL CHECK (mood IN ('calm', 'focused', 'melancholic', 'energetic', 'romantic', 'chaotic')),
    duration INTEGER NOT NULL DEFAULT 180, -- Duration in seconds
    audio_path TEXT,                      -- Path inside Supabase Storage bucket, e.g. 'calm/1.mp3'
    audio_url TEXT,                       -- Optional absolute CDN URL override
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexes for fast query performance
CREATE INDEX IF NOT EXISTS idx_tracks_mood_order ON public.tracks (mood, order_index);
CREATE INDEX IF NOT EXISTS idx_tracks_active ON public.tracks (is_active);

-- 3. Grants and Row Level Security (RLS)
-- Grant usage on public schema and tracks table to API roles
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.tracks TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

ALTER TABLE public.tracks ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access to active tracks
DROP POLICY IF EXISTS "Allow public read access to active tracks" ON public.tracks;
CREATE POLICY "Allow public read access to active tracks"
    ON public.tracks
    FOR SELECT
    TO anon, authenticated
    USING (is_active = true);

-- 4. Storage Setup & RLS Policies:
-- Ensure the music bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('music', 'music', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policy: Allow public read access to audio files in the music bucket
DROP POLICY IF EXISTS "Allow public read from music bucket" ON storage.objects;
CREATE POLICY "Allow public read from music bucket"
    ON storage.objects FOR SELECT
    TO anon, authenticated
    USING (bucket_id = 'music');

-- Policy: Allow uploads to the music bucket
DROP POLICY IF EXISTS "Allow public upload to music bucket" ON storage.objects;
CREATE POLICY "Allow public upload to music bucket"
    ON storage.objects FOR INSERT
    TO anon, authenticated
    WITH CHECK (bucket_id = 'music');

-- Policy: Allow updates (for upserts) to the music bucket
DROP POLICY IF EXISTS "Allow public update to music bucket" ON storage.objects;
CREATE POLICY "Allow public update to music bucket"
    ON storage.objects FOR UPDATE
    TO anon, authenticated
    USING (bucket_id = 'music')
    WITH CHECK (bucket_id = 'music');

-- ==============================================================================
-- 5. Initial Seed Data (72 Tracks across 6 Moods)
-- ==============================================================================

INSERT INTO public.tracks (title, artist, mood, duration, audio_path, order_index) VALUES
-- Calm
('Bloom', 'Hana Moon', 'calm', 172, 'calm/1.mp3', 0),
('Slow Motion', 'The Quiet Atlas', 'calm', 209, 'calm/2.mp3', 1),
('After Rain', 'Low Tide', 'calm', 246, 'calm/3.mp3', 2),
('Somewhere Else', 'June & the Pines', 'calm', 193, 'calm/4.mp3', 3),
('Soft Hours', 'Hana Moon', 'calm', 230, 'calm/5.mp3', 4),
('Window Seat', 'The Quiet Atlas', 'calm', 267, 'calm/6.mp3', 5),
('Still Water', 'Low Tide', 'calm', 214, 'calm/7.mp3', 6),
('A Little Less', 'June & the Pines', 'calm', 251, 'calm/8.mp3', 7),
('The Space Between', 'Hana Moon', 'calm', 288, 'calm/9.mp3', 8),
('Daylight, Slowly', 'The Quiet Atlas', 'calm', 235, 'calm/10.mp3', 9),
('Unfold', 'Low Tide', 'calm', 272, 'calm/11.mp3', 10),
('Coming Home', 'June & the Pines', 'calm', 219, 'calm/12.mp3', 11),

-- Focused
('First Principle', 'Studio Null', 'focused', 172, 'focused/1.mp3', 0),
('Monochrome', 'Analog Systems', 'focused', 209, 'focused/2.mp3', 1),
('Flow State', 'Index / 01', 'focused', 246, 'focused/3.mp3', 2),
('No Distractions', 'Form & Function', 'focused', 193, 'focused/4.mp3', 3),
('Iteration 04', 'Studio Null', 'focused', 230, 'focused/5.mp3', 4),
('In Sequence', 'Analog Systems', 'focused', 267, 'focused/6.mp3', 5),
('The Architecture', 'Index / 01', 'focused', 214, 'focused/7.mp3', 6),
('Clean Signal', 'Form & Function', 'focused', 251, 'focused/8.mp3', 7),
('Pattern Recognition', 'Studio Null', 'focused', 288, 'focused/9.mp3', 8),
('Parallel Lines', 'Analog Systems', 'focused', 235, 'focused/10.mp3', 9),
('Resolution', 'Index / 01', 'focused', 272, 'focused/11.mp3', 10),
('Process Complete', 'Form & Function', 'focused', 219, 'focused/12.mp3', 11),

-- Melancholic
('Last Train Home', 'The Night Archive', 'melancholic', 172, 'melancholic/1.mp3', 0),
('Blue Hour', 'Pale Cinema', 'melancholic', 209, 'melancholic/2.mp3', 1),
('A Familiar Stranger', 'Sunday, Somewhere', 'melancholic', 246, 'melancholic/3.mp3', 2),
('Nothing Left to Say', 'Milo Grey', 'melancholic', 193, 'melancholic/4.mp3', 3),
('Streetlights', 'The Night Archive', 'melancholic', 230, 'melancholic/5.mp3', 4),
('Someone I Knew', 'Pale Cinema', 'melancholic', 267, 'melancholic/6.mp3', 5),
('Rain on the Line', 'Sunday, Somewhere', 'melancholic', 214, 'melancholic/7.mp3', 6),
('The Other Side', 'Milo Grey', 'melancholic', 251, 'melancholic/8.mp3', 7),
('Almost, Always', 'The Night Archive', 'melancholic', 288, 'melancholic/9.mp3', 8),
('Night Windows', 'Pale Cinema', 'melancholic', 235, 'melancholic/10.mp3', 9),
('Empty Cinema', 'Sunday, Somewhere', 'melancholic', 272, 'melancholic/11.mp3', 10),
('Until Morning', 'Milo Grey', 'melancholic', 219, 'melancholic/12.mp3', 11),

-- Energetic
('GO! GO! GO!', 'The Big Feel', 'energetic', 172, 'energetic/1.mp3', 0),
('Good Trouble', 'Kick Assembly', 'energetic', 209, 'energetic/2.mp3', 1),
('Maximum Joy', 'Electric Picnic', 'energetic', 246, 'energetic/3.mp3', 2),
('Shake the Room', 'Run Club', 'energetic', 193, 'energetic/4.mp3', 3),
('No Brakes', 'The Big Feel', 'energetic', 230, 'energetic/5.mp3', 4),
('Hot Concrete', 'Kick Assembly', 'energetic', 267, 'energetic/6.mp3', 5),
('Get Up Again', 'Electric Picnic', 'energetic', 214, 'energetic/7.mp3', 6),
('All Systems Go', 'Run Club', 'energetic', 251, 'energetic/8.mp3', 7),
('Off the Ground', 'The Big Feel', 'energetic', 288, 'energetic/9.mp3', 8),
('Louder, Please', 'Kick Assembly', 'energetic', 235, 'energetic/10.mp3', 9),
('Full Tilt', 'Electric Picnic', 'energetic', 272, 'energetic/11.mp3', 10),
('One More Time', 'Run Club', 'energetic', 219, 'energetic/12.mp3', 11),

-- Romantic
('Stay a Little', 'Cleo Valentine', 'romantic', 172, 'romantic/1.mp3', 0),
('Velvet Sunday', 'Maison Blue', 'romantic', 209, 'romantic/2.mp3', 1),
('Only You Know', 'Elliot Rose', 'romantic', 246, 'romantic/3.mp3', 2),
('Between Us', 'The Velvet Hours', 'romantic', 193, 'romantic/4.mp3', 3),
('In a Different Life', 'Cleo Valentine', 'romantic', 230, 'romantic/5.mp3', 4),
('Candlelight', 'Maison Blue', 'romantic', 267, 'romantic/6.mp3', 5),
('Under Your Spell', 'Elliot Rose', 'romantic', 214, 'romantic/7.mp3', 6),
('The Way You Do', 'The Velvet Hours', 'romantic', 251, 'romantic/8.mp3', 7),
('Tenderly', 'Cleo Valentine', 'romantic', 288, 'romantic/9.mp3', 8),
('Half Past Midnight', 'Maison Blue', 'romantic', 235, 'romantic/10.mp3', 9),
('A Love Like This', 'Elliot Rose', 'romantic', 272, 'romantic/11.mp3', 10),
('Don’t Go Yet', 'The Velvet Hours', 'romantic', 219, 'romantic/12.mp3', 11),

-- Chaotic
('Brain Soup', 'TV Dinner', 'chaotic', 172, 'chaotic/1.mp3', 0),
('Wait, What?', 'Mild Panic!', 'chaotic', 209, 'chaotic/2.mp3', 1),
('Wrong Way / Right Time', 'The Unrelated', 'chaotic', 246, 'chaotic/3.mp3', 2),
('404: Genre Not Found', 'ctrl+z', 'chaotic', 193, 'chaotic/4.mp3', 3),
('Kitchen Disco', 'TV Dinner', 'chaotic', 230, 'chaotic/5.mp3', 4),
('Pleasantly Unhinged', 'Mild Panic!', 'chaotic', 267, 'chaotic/6.mp3', 5),
('Plot Twist', 'The Unrelated', 'chaotic', 214, 'chaotic/7.mp3', 6),
('Too Many Tabs', 'ctrl+z', 'chaotic', 251, 'chaotic/8.mp3', 7),
('Loose Wires', 'TV Dinner', 'chaotic', 288, 'chaotic/9.mp3', 8),
('Everything Bagel', 'Mild Panic!', 'chaotic', 235, 'chaotic/10.mp3', 9),
('Do Not Organize', 'The Unrelated', 'chaotic', 272, 'chaotic/11.mp3', 10),
('??? (In a Good Way)', 'ctrl+z', 'chaotic', 219, 'chaotic/12.mp3', 11)
ON CONFLICT DO NOTHING;
