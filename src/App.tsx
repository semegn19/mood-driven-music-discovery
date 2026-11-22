import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, LayoutGroup, motion, MotionConfig } from 'motion/react';
import './index.css';
import type { Mood, Track } from './types/music';
import { fetchTracksFromSupabase, resolveAudioSource } from './services/trackService';
const moods: Mood[] = ['calm', 'focused', 'melancholic', 'energetic', 'romantic', 'chaotic'];
const photos = {
  calm: 'https://images.pexels.com/photos/11204108/pexels-photo-11204108.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200',
  melancholic: 'https://images.pexels.com/photos/16158304/pexels-photo-16158304.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1200',
  romantic: 'https://images.pexels.com/photos/20757454/pexels-photo-20757454.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=900',
};
const worlds: Record<Mood, { tagline: string; title: string; description: string; genre: string; tracks: string[]; artists: string[] }> = {
  calm: { tagline: 'A little room to breathe', title: 'Nothing to do.\nNowhere to be.', description: 'Let the world carry on without you for a little while.', genre: 'Ambient / Soft folk / Slow mornings', tracks: ['Bloom', 'Slow Motion', 'After Rain', 'Somewhere Else', 'Soft Hours', 'Window Seat', 'Still Water', 'A Little Less', 'The Space Between', 'Daylight, Slowly', 'Unfold', 'Coming Home'], artists: ['Hana Moon', 'The Quiet Atlas', 'Low Tide', 'June & the Pines'] },
  focused: { tagline: 'Remove the noise. Find the signal.', title: 'TUNED IN.\nLOCKED ON.', description: 'One thing at a time. Everything else can wait.', genre: 'Minimal / Instrumental / Deep work', tracks: ['First Principle', 'Monochrome', 'Flow State', 'No Distractions', 'Iteration 04', 'In Sequence', 'The Architecture', 'Clean Signal', 'Pattern Recognition', 'Parallel Lines', 'Resolution', 'Process Complete'], artists: ['Studio Null', 'Analog Systems', 'Index / 01', 'Form & Function'] },
  melancholic: { tagline: 'For the things you can’t quite say', title: 'The city sleeps.\nYou don’t.', description: 'Some songs understand without asking any questions.', genre: 'After hours / Dream pop / Lonely streets', tracks: ['Last Train Home', 'Blue Hour', 'A Familiar Stranger', 'Nothing Left to Say', 'Streetlights', 'Someone I Knew', 'Rain on the Line', 'The Other Side', 'Almost, Always', 'Night Windows', 'Empty Cinema', 'Until Morning'], artists: ['The Night Archive', 'Pale Cinema', 'Sunday, Somewhere', 'Milo Grey'] },
  energetic: { tagline: 'Less thinking. More moving.', title: 'TURN IT UP.\nLET IT OUT.', description: 'For running nowhere. For dancing everywhere.', genre: 'Breakbeats / Indie dance / Pure adrenaline', tracks: ['GO! GO! GO!', 'Good Trouble', 'Maximum Joy', 'Shake the Room', 'No Brakes', 'Hot Concrete', 'Get Up Again', 'All Systems Go', 'Off the Ground', 'Louder, Please', 'Full Tilt', 'One More Time'], artists: ['The Big Feel', 'Kick Assembly', 'Electric Picnic', 'Run Club'] },
  romantic: { tagline: 'The world can wait', title: 'A little closer.\nA little longer.', description: 'For the kind of evening you wish would never end.', genre: 'Slow soul / Velvet jazz / Close company', tracks: ['Stay a Little', 'Velvet Sunday', 'Only You Know', 'Between Us', 'In a Different Life', 'Candlelight', 'Under Your Spell', 'The Way You Do', 'Tenderly', 'Half Past Midnight', 'A Love Like This', 'Don’t Go Yet'], artists: ['Cleo Valentine', 'Maison Blue', 'Elliot Rose', 'The Velvet Hours'] },
  chaotic: { tagline: 'No genre. No rules. No skips.', title: 'MAKE NO\nSENSE.', description: 'Your brain has 47 tabs open. This is the soundtrack.', genre: 'Post-everything / Left turns / Good noise', tracks: ['Brain Soup', 'Wait, What?', 'Wrong Way / Right Time', '404: Genre Not Found', 'Kitchen Disco', 'Pleasantly Unhinged', 'Plot Twist', 'Too Many Tabs', 'Loose Wires', 'Everything Bagel', 'Do Not Organize', '??? (In a Good Way)'], artists: ['TV Dinner', 'Mild Panic!', 'The Unrelated', 'ctrl+z'] },
};
const time = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;
function Icon({ name, size = 20 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{name === 'play' ? <path d="m9 5 11 7-11 7z" fill="currentColor" stroke="none" /> : name === 'pause' ? <><path d="M8 5v14M16 5v14" strokeWidth="4" /></> : name === 'prev' ? <><path d="M6 5v14" strokeWidth="2.5" /><path d="m19 5-10 7 10 7z" fill="currentColor" stroke="none" /></> : name === 'next' ? <><path d="m5 5 10 7-10 7z" fill="currentColor" stroke="none" /><path d="M18 5v14" strokeWidth="2.5" /></> : name === 'shuffle' ? <><polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" /></> : name === 'volume' ? <><path d="m11 4-5 4H3v8h3l5 4z" /><path d="M15 8c3 2 3 6 0 8M18 5c5 4 5 10 0 14" /></> : name === 'mute' ? <><path d="m11 4-5 4H3v8h3l5 4zM16 9l6 6M22 9l-6 6" /></> : name === 'arrow' ? <path d="M5 19 19 5M5 5h14v14" /> : name === 'close' ? <path d="m6 6 12 12M6 18 18 6" /> : name === 'refresh' ? <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" /> : <><path d="M3 7h13l-3-3m3 3-3 3M21 17H8l3 3m-3-3 3-3" /></>}</svg>;
}
function Star({ className = '' }: { className?: string }) { return <svg className={className} viewBox="0 0 200 200" aria-hidden="true"><path d="m100 0 13 61 37-48-17 61 54-24-41 46 54 4-56 22 42 28-61-3 25 40-43-28-7 41-14-49-36 36 13-51-50 14 36-37-49-13 60-8-47-37 61 17-24-54 47 41z" fill="currentColor" /></svg>; }
function Artwork({ mood, full = false }: { mood: Mood; full?: boolean }) {
  return <div className={`artwork art-${mood} ${full ? 'full-art' : ''}`} aria-label={`${mood} playlist artwork`} role="img">
    {mood === 'calm' ? full ? <><img src={photos.calm} alt="A lone boat on a quiet, mist-covered lake" /><span className="art-caption">the art of doing nothing</span></> : <><div className="ripple">{Array.from({ length: 10 }, (_, i) => <i key={i} style={{ width: `${22 + i * 15}%`, height: `${22 + i * 15}%` }} />)}</div><span className="sleeve-tiny">take your time.</span></> : null}
    {mood === 'focused' && <><div className="focus-cross">+</div><div className="focus-grid" /><span className="focus-coordinate">40.7128° N<br />74.0060° W</span><div className="focus-bars">{[35, 65, 48, 82, 57, 100, 76, 48, 65, 30, 57, 90].map((h, i) => <i key={i} style={{ height: `${h}%` }} />)}</div><span className="focus-code">SIGNAL_001 / 120 BPM</span></>}
    {mood === 'melancholic' && <><img src={photos.melancholic} alt="An empty city street reflecting lights after rain" /><span className="night-moon" /><span className="night-caption">somewhere,<br /><em>after midnight.</em></span><span className="sleeve-tiny">a soundtrack for the long way home</span></>}
    {mood === 'energetic' && <><Star className="energy-star" /><span className="energy-go">GO!</span><span className="energy-caption">Play it loud ↗</span></>}
    {mood === 'romantic' && (full ? <><img src={photos.romantic} alt="Red tulips in a glass vase against a dark backdrop" /><span className="romantic-script">just us.</span></> : <><svg className="flower" viewBox="0 0 200 180" fill="none" stroke="currentColor" strokeWidth="1"><path d="M100 102c-54-9-64-47-35-51-8-35 24-43 35-13 18-31 48-16 37 10 36 4 28 40-9 45 18 27-15 44-28 9-26 36-58 12-31-8M101 88c-28-37 23-43 9-8-15 30-42-6-17-13M100 99c-10 28-1 40-8 69m7-31c28 3 34-19 34-19-26-1-34 19-34 19m-2 16c-21-1-34-16-34-16 23-8 34 16 34 16" /></svg><span className="romantic-script">a little closer.</span></>)}
    {mood === 'chaotic' && <><span className="chaos-small">100% unfiltered</span><span className="chaos-word word-one">OFF</span><span className="chaos-word word-two">BEAT</span><span className="chaos-sticker">!?</span><div className="chaos-check" /><span className="chaos-bottom">Expect the unexpected ↗</span></>}
  </div>;
}
function MoodChoices({ select, active, compact = false }: { select: (m: Mood) => void; active: Mood | null; compact?: boolean }) {
  return <div className={`mood-choices ${compact ? 'compact' : ''}`}>{moods.map((m, i) => <button className={`mood-choice choice-${m} ${active === m ? 'selected' : ''}`} key={m} onClick={() => select(m)} aria-label={`Feel ${m}: ${worlds[m].tagline.toLowerCase()}`}><div className="sleeve-wrap"><Artwork mood={m} /><span className="sleeve-enter"><Icon name="arrow" /></span></div><div className="mood-label"><span className="mood-number">0{i + 1}</span><span className="mood-name">{m}</span><span className="mood-dot">↗</span></div><span className="mood-detail">{['Find your quiet', 'Get in the zone', 'Feel it all', 'Let it out', 'Come a little closer', 'Embrace the mess'][i]}</span></button>)}</div>;
}
function Vinyl() {
  return <div className="vinyl-composition" aria-hidden="true"><svg className="vinyl-type" viewBox="0 0 260 260"><defs><path id="circleText" d="M130,130m-109,0a109,109 0 1,1 218,0a109,109 0 1,1-218,0" /></defs><text><textPath href="#circleText" startOffset="0%">SIX MOODS. SIX WORLDS. ONE YOU. • SIX MOODS. SIX WORLDS. ONE YOU. • </textPath></text></svg><div className="vinyl"><div className="vinyl-label"><span>WSILT</span><span className="vinyl-hole" /><span>SIDE / YOU</span></div></div><span className="vinyl-spark" aria-hidden="true">♫</span><span className="vinyl-arrow">↙</span></div>;
}
function Modal({ children, onClose, title }: { children: ReactNode; onClose: () => void; title: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { ref.current?.showModal(); const prev = document.body.style.overflow; document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = prev; }; }, []);
  return <dialog ref={ref} className="modal" onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="modal-inner"><div className="modal-top"><span className="eyebrow">WHAT SHOULD I LISTEN TO?</span><button className="icon-button" onClick={onClose} aria-label="Close dialog"><Icon name="close" /></button></div><h2>{title}</h2>{children}</div></dialog>;
}

export default function App() {
  const [mood, setMood] = useState<Mood | null>(null);
  const [dialog, setDialog] = useState<'mood' | 'about' | null>(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(.35);
  const [shuffle, setShuffle] = useState(false);

  const [catalog, setCatalog] = useState<Record<string, string[]>>({});
  const [customAudio] = useState<Record<string, { url: string; name: string }>>({});
  const [dbTracks, setDbTracks] = useState<Record<string, Track[]>>({});
  const [isRealAudio, setIsRealAudio] = useState(false);
  const [, setAudioLabel] = useState<string | null>(null);
  const [realDurations, setRealDurations] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const moodRef = useRef(mood);
  moodRef.current = mood;
  const currentRef = useRef(current);
  currentRef.current = current;

  // Fetch dynamic tracks from Supabase if configured; fall back to static mock data
  useEffect(() => {
    if (!mood) return;
    if (dbTracks[mood]) return;

    let active = true;
    fetchTracksFromSupabase(mood).then(fetched => {
      if (active && fetched && fetched.length > 0) {
        setDbTracks(prev => ({ ...prev, [mood]: fetched }));
      }
    });

    return () => { active = false; };
  }, [mood]);

  const data = mood ? worlds[mood] : null;
  const staticTracks: Track[] = data ? data.tracks.map((title, i) => ({
    title,
    artist: data.artists[i % 4],
    duration: (mood && realDurations[`${mood}-${i}`]) || (172 + (i * 37) % 130)
  })) : [];

  const tracks: Track[] = (mood && dbTracks[mood] && dbTracks[mood].length > 0)
    ? dbTracks[mood].map((t, i) => ({
        ...t,
        duration: (mood && realDurations[`${mood}-${i}`]) || t.duration || (172 + (i * 37) % 130)
      }))
    : staticTracks;

  const track = tracks[current];
  const activeDuration = track?.duration || 180;

  const refreshCatalog = () => {
    fetch('/api/music-catalog')
      .then(r => r.ok ? r.json() : fetch('/music/catalog.json').then(r2 => r2.json()))
      .then(d => { if (d && typeof d === 'object') setCatalog(d); })
      .catch(() => {
        fetch('/music/catalog.json')
          .then(r => r.json())
          .then(d => { if (d && typeof d === 'object') setCatalog(d); })
          .catch(() => {});
      });
  };

  useEffect(() => {
    refreshCatalog();
    const onFocus = () => refreshCatalog();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const shuffleRef = useRef(shuffle);
  shuffleRef.current = shuffle;

  const selectMood = (m: Mood) => {
    setMood(m);
    setCurrent(0);
    setProgress(0);
    setDialog(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };
  const prev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setProgress(0);
      return;
    }
    const len = tracks.length || 12;
    setCurrent(v => (v - 1 + len) % len);
    setProgress(0);
  };
  const next = () => {
    const len = tracks.length || 12;
    if (shuffleRef.current && len > 1) {
      let rand = Math.floor(Math.random() * len);
      if (rand === currentRef.current) rand = (rand + 1) % len;
      setCurrent(rand);
    } else {
      setCurrent(v => (v + 1) % len);
    }
    setProgress(0);
  };
  const nextRef = useRef(next);
  nextRef.current = next;

  const playTrack = (i: number) => {
    if (i === current) {
      setPlaying(!playing);
    } else {
      setCurrent(i);
      setProgress(0);
      setPlaying(true);
    }
  };

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    const onTimeUpdate = () => {
      setProgress(audio.currentTime);
    };
    const onLoadedMetadata = () => {
      if (Number.isFinite(audio.duration) && audio.duration > 0) {
        const dur = Math.round(audio.duration);
        const m = moodRef.current;
        const c = currentRef.current;
        if (m) {
          setRealDurations(prev => ({ ...prev, [`${m}-${c}`]: dur }));
        }
      }
    };
    const onEnded = () => {
      nextRef.current();
    };
    const onError = () => {
      setIsRealAudio(false);
    };
    const onPlaying = () => {
      setIsRealAudio(true);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('playing', onPlaying);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('playing', onPlaying);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mood) return;

    const currentTrack = tracks[current];
    if (!currentTrack) return;

    const resolved = resolveAudioSource(mood, current, currentTrack, catalog, customAudio);
    if (resolved.isReal && resolved.url) {
      if (audio.src !== resolved.url) {
        audio.src = resolved.url;
        audio.load();
      }
      setAudioLabel(resolved.label);

      if (playing) {
        audio.play().then(() => {
          setIsRealAudio(true);
        }).catch(() => {
          setIsRealAudio(false);
        });
      } else {
        setIsRealAudio(true);
      }
    } else {
      audio.removeAttribute('src');
      setIsRealAudio(false);
      setAudioLabel(null);
    }
  }, [mood, current, tracks, catalog, customAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !mood) return;

    if (playing) {
      if (audio.src && audio.src !== window.location.href) {
        audio.play().then(() => {
          setIsRealAudio(true);
        }).catch(() => {
          setIsRealAudio(false);
        });
      }
    } else {
      audio.pause();
    }
  }, [playing]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (dialog || (e.target instanceof HTMLElement && ['INPUT', 'BUTTON', 'TEXTAREA'].includes(e.target.tagName))) return;
      if ('123456'.includes(e.key) && e.key.length === 1) selectMood(moods[Number(e.key) - 1]);
      if (e.code === 'Space' && mood) {
        e.preventDefault();
        setPlaying(p => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [mood, dialog]);

  const handleSeek = (seconds: number) => {
    setProgress(seconds);
    if (isRealAudio && audioRef.current && Number.isFinite(seconds)) {
      audioRef.current.currentTime = seconds;
    }
  };

  return <MotionConfig reducedMotion="user" transition={{ type: 'spring', stiffness: 95, damping: 22 }}><LayoutGroup><div className={`app ${mood ? `world world-${mood}` : 'landing'}`}>
    <header className="site-header"><button className="brand" onClick={() => { setMood(null); setPlaying(false); setProgress(0); }} aria-label="What should I listen to? Home"><span className="brand-mark"><i /><i /><i /><i /></span><span>WHAT SHOULD<br />I LISTEN TO<span className="brand-question">?</span></span></button><span className="header-tag"><i /> A little less algorithm. A little more you.</span><button className="header-action" onClick={() => setDialog(mood ? 'mood' : 'about')}>{mood ? 'Change mood' : 'About'}<Icon name={mood ? 'switch' : 'arrow'} size={16} /></button></header>
    {!mood ? <motion.main className="landing-main" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <section className="landing-hero"><div className="hero-copy"><div className="eyebrow hero-eyebrow"><span /> Your next listen starts with you.</div><h1>HOW ARE <span className="headline-asterisk" aria-hidden="true">♫</span><br />YOU FEELING<span className="question-mark">?</span></h1><p>No right answer. No overthinking. Just pick a feeling.</p></div><div className="hero-aside"><Vinyl /><p>Different moods.<br />Different music.<br /><span>Completely different worlds.</span></p></div></section>
      <section className="mood-section" aria-label="Choose how you feel"><div className="section-line"><span className="eyebrow">01 — Find your frequency</span><span className="selection-hint">Hover to get a feel. Click to go there. <span>↘</span></span></div><MoodChoices select={selectMood} active={mood} /><div className="choice-bottom"><span className="keyboard-hint">Six ways in. No wrong door.</span><button className="random-button" onClick={() => selectMood(moods[Math.floor(Math.random() * moods.length)])}>Can’t decide? <span>Leave it to chance</span><Icon name="switch" size={16} /></button></div></section>
    </motion.main> : <main className="world-main">
      <nav className="world-nav" aria-label="Mood navigation"><span className="world-index">Feeling / 0{moods.indexOf(mood) + 1}</span><div>{moods.map(m => <button key={m} className={m === mood ? 'active' : ''} onClick={() => selectMood(m)} aria-current={m === mood ? 'page' : undefined}>{m}</button>)}</div><span className="world-edition"></span></nav>
      <motion.div layout className="playlist-stage">
        <motion.section layout className="playlist-heading"><motion.div layout="position" className="eyebrow playlist-eyebrow"><span className="status-dot" />{data!.tagline}</motion.div><motion.h1 layout="position" key={`title-${mood}`} initial={{ y: 35, opacity: 0, rotate: mood === 'chaotic' ? -6 : 0 }} animate={{ y: 0, opacity: 1, rotate: mood === 'chaotic' ? -3 : 0 }} transition={{ duration: .55 }}>{data!.title.split('\n').map((line, i) => <span key={i}>{line}</span>)}</motion.h1><motion.p layout="position" className="playlist-description">{data!.description}</motion.p><motion.div layout className="mix-meta"><span>12 tracks</span><span>{time(tracks.reduce((n, t) => n + t.duration, 0)).replace(':', ' min ')} sec</span><span>Curated by feeling</span></motion.div><motion.button layout className="play-mix" onClick={() => setPlaying(!playing)}><Icon name={playing ? 'pause' : 'play'} size={20} />{playing ? 'Pause a moment' : mood === 'energetic' ? 'Let’s go' : mood === 'chaotic' ? 'Press at your own risk' : 'Listen to this feeling'}</motion.button>{mood === 'focused' && <div className="focus-session"><span>Session status</span><strong>{playing ? 'In progress_' : 'Ready_'}</strong><span>Disconnect to connect.</span></div>}</motion.section>
        <motion.div layout className="main-artwork"><motion.div layout className="artwork-frame"><Artwork mood={mood} full /></motion.div><div className="artwork-note"><span>{mood === 'calm' ? 'Inhale. Exhale. Repeat.' : mood === 'romantic' ? 'Side A — Just the two of us' : data!.genre}</span><span>↗</span></div>{mood === 'chaotic' && <span className="chaos-extra">Good taste<br />is boring.</span>}</motion.div>
        <motion.section layout className="track-section" aria-label="Playlist tracks"><motion.div layout className="track-section-heading"><span>{mood === 'focused' ? 'QUEUE / SEQUENCE' : mood === 'chaotic' ? 'THE BEAUTIFUL MESS ↓' : 'YOUR SOUNDTRACK'}</span></motion.div>{mood === 'focused' && <div className="table-header"><span>ID</span><span>TRACK / ARTIST</span><span>WAVEFORM</span><span>TIME</span><span /></div>}<motion.div layout className="track-list">{tracks.map((t, i) => {
          return <motion.button layout="position" className={`track ${current === i ? 'current-track' : ''}`} key={i} onClick={() => playTrack(i)} aria-label={`${playing && current === i ? 'Pause' : 'Play'} ${t.title} by ${t.artist}`}><span className="track-number">{current === i && playing ? <span className="playing-bars"><i /><i /><i /></span> : String(i + 1).padStart(2, '0')}</span><div className="track-art"><Artwork mood={mood} /></div><span className="track-info"><strong>{t.title}</strong><span>{t.artist}</span></span><span className="track-wave" aria-hidden="true">▂▅▃▇▅▂▆▃▅▇▃▁▅▃▆▂</span><span className="track-duration">{time(t.duration)}</span><span className="track-play"><Icon name={current === i && playing ? 'pause' : 'play'} size={16} /></span></motion.button>;
        })}</motion.div></motion.section>
      </motion.div>
    </main>}
    <footer className="site-footer"><span>Not an algorithm. <strong>A feeling.</strong></span><span className="footer-middle">An interactive exploration of music & mood</span><span><span className="tiny-wave">▂▆▃▇▂</span> Made to match your moment.</span></footer>
    <AnimatePresence>{mood && track && <motion.aside layout className="player" aria-label="Music player" initial={{ y: 120, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 120, opacity: 0 }}><div className="player-art"><Artwork mood={mood} /></div><div className="player-track"><span className="player-now">{playing ? 'Now playing' : 'Ready'} <span className="live-dot" /></span><strong>{track.title}</strong><span>{track.artist}</span></div><div className="player-controls"><button className={`icon-button shuffle-button ${shuffle ? 'active' : ''}`} onClick={() => setShuffle(!shuffle)} aria-label={shuffle ? 'Disable shuffle' : 'Enable shuffle'} title={shuffle ? 'Shuffle is on' : 'Shuffle is off'}><Icon name="shuffle" size={17} /></button><button className="icon-button prev-button" onClick={prev} aria-label="Previous track" title="Previous track"><Icon name="prev" size={19} /></button><button className="player-play" onClick={() => setPlaying(!playing)} aria-label={playing ? 'Pause' : 'Play'}><Icon name={playing ? 'pause' : 'play'} size={24} /></button><button className="icon-button next-button" onClick={next} aria-label="Next track" title="Next track"><Icon name="next" size={19} /></button></div><div className="player-progress"><input aria-label="Seek track" type="range" min="0" max={activeDuration} value={Math.min(progress, activeDuration)} onChange={e => handleSeek(Number(e.target.value))} style={{ '--progress': `${activeDuration > 0 ? (Math.min(progress, activeDuration) / activeDuration) * 100 : 0}%` } as React.CSSProperties} /><div><span>{time(progress)}</span><span>{time(activeDuration)}</span></div></div><div className="player-volume"><button className="icon-button" aria-label={volume ? 'Mute' : 'Unmute'} onClick={() => setVolume(volume ? 0 : .35)}><Icon name={volume ? 'volume' : 'mute'} size={18} /></button><input aria-label="Volume" type="range" min="0" max="1" step=".01" value={volume} onChange={e => setVolume(Number(e.target.value))} /></div><button className="player-mood" onClick={() => setDialog('mood')}>{mood}<Icon name="switch" size={15} /></button></motion.aside>}</AnimatePresence>
    {dialog && <Modal onClose={() => setDialog(null)} title={dialog === 'mood' ? 'A change of feeling?' : 'Less algorithm. More you.'}>{dialog === 'mood' ? <><p className="modal-description">Same you. A completely different world. Where to next?</p><MoodChoices select={selectMood} active={mood} compact /><div className="modal-random-wrap"><button className="random-button modal-random-button" onClick={() => selectMood(moods[Math.floor(Math.random() * moods.length)])}>Can’t decide? <span>Select a mood randomly</span><Icon name="switch" size={16} /></button></div><p className="modal-note">Your mood doesn’t have to make sense. It just has to be yours.</p></> : <div className="about-content"><p>What if your music app didn’t just know how you felt — what if it <em>felt it too?</em></p><p>An immersive experience in music, emotion, and the spaces in between. Six moods. Six visual worlds. No recommendation algorithms. No accounts. Just you, choosing a feeling.</p><p className="about-keyboard">Keyboard shortcuts <span>1 — 6</span><br />Play / pause <span>SPACE</span></p><button className="about-cta" onClick={() => setDialog(null)}>Let’s find your frequency <Icon name="arrow" size={18} /></button></div>}</Modal>}
  </div></LayoutGroup></MotionConfig>;
}

