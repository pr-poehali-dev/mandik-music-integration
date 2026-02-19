import { useState, useRef, useEffect, useCallback } from "react";
import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const HERO_IMAGE = "https://cdn.poehali.dev/projects/24890db7-3222-4ff4-9aed-fc2c37fb3095/files/2d6364fc-58db-4767-aa32-b5fbdff7dae1.jpg";

interface Track {
  id: number;
  title: string;
  duration: string;
  durationSec: number;
  album: string;
  src: string;
}

const ALBUMS = [
  { name: "Все треки", filter: "" },
  { name: "Синглы", filter: "Синглы" },
  { name: "EP", filter: "EP" },
];

const TRACKS: Track[] = [
  { id: 1, title: "Ночной город", duration: "3:24", durationSec: 204, album: "Синглы", src: "" },
  { id: 2, title: "Дым", duration: "2:58", durationSec: 178, album: "Синглы", src: "" },
  { id: 3, title: "Молодой", duration: "3:12", durationSec: 192, album: "Синглы", src: "" },
  { id: 4, title: "На районе", duration: "3:45", durationSec: 225, album: "EP", src: "" },
  { id: 5, title: "Тени", duration: "2:42", durationSec: 162, album: "EP", src: "" },
  { id: 6, title: "Без сна", duration: "3:33", durationSec: 213, album: "EP", src: "" },
  { id: 7, title: "Выше", duration: "3:08", durationSec: 188, album: "Синглы", src: "" },
  { id: 8, title: "Пламя", duration: "2:55", durationSec: 175, album: "EP", src: "" },
];

const NAV_ITEMS = [
  { label: "Главная", href: "#hero" },
  { label: "Музыка", href: "#music" },
  { label: "Видео", href: "#video" },
  { label: "О артисте", href: "#about" },
  { label: "Соцсети", href: "#socials" },
  { label: "Контакты", href: "#contacts" },
];

const SOCIALS = [
  { name: "Instagram", icon: "Instagram", url: "https://instagram.com/mandik_inst", color: "from-pink-500 to-purple-500" },
  { name: "Telegram", icon: "Send", url: "#", color: "from-blue-400 to-cyan-400" },
  { name: "YouTube", icon: "Youtube", url: "#", color: "from-red-500 to-red-600" },
  { name: "VK", icon: "Users", url: "#", color: "from-blue-500 to-blue-700" },
  { name: "Apple Music", icon: "Music", url: "#", color: "from-pink-400 to-red-400" },
  { name: "Spotify", icon: "Disc3", url: "#", color: "from-green-400 to-green-600" },
];

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const Index = () => {
  const [activeAlbum, setActiveAlbum] = useState("");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(80);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const filteredTracks = activeAlbum
    ? TRACKS.filter((t) => t.album === activeAlbum)
    : TRACKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const playTrack = useCallback((track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying((p) => !p);
      return;
    }
    setCurrentTrack(track);
    setIsPlaying(true);
    setProgress(0);
  }, [currentTrack]);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = setInterval(() => {
        setProgress((p) => {
          if (p >= currentTrack.durationSec) {
            setIsPlaying(false);
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    } else if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, currentTrack]);

  const nextTrack = () => {
    if (!currentTrack) return;
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    const next = TRACKS[(idx + 1) % TRACKS.length];
    setCurrentTrack(next);
    setProgress(0);
    setIsPlaying(true);
  };

  const prevTrack = () => {
    if (!currentTrack) return;
    const idx = TRACKS.findIndex((t) => t.id === currentTrack.id);
    const prev = TRACKS[(idx - 1 + TRACKS.length) % TRACKS.length];
    setCurrentTrack(prev);
    setProgress(0);
    setIsPlaying(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-lg" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <a href="#hero" className="text-xl font-heading font-bold text-gradient">MANDIK</a>
          <div className="hidden md:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                {item.label}
              </a>
            ))}
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden text-foreground">
            <Icon name={mobileMenu ? "X" : "Menu"} size={24} />
          </button>
        </div>
        {mobileMenu && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-4 flex flex-col gap-3">
              {NAV_ITEMS.map((item) => (
                <a key={item.href} href={item.href} onClick={() => setMobileMenu(false)} className="text-base text-muted-foreground hover:text-foreground transition-colors py-1">
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* HERO */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center bg-gradient-hero overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-secondary/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-accent/15 rounded-full blur-[80px] animate-pulse-glow" style={{ animationDelay: "3s" }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 flex flex-col lg:flex-row items-center gap-12 pt-20">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-secondary font-medium text-sm tracking-widest uppercase mb-4 animate-fade-up">mandik_music</p>
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-heading font-900 leading-none mb-6 animate-fade-up">
              <span className="text-gradient">MANDIK</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-lg mb-8 animate-fade-up-delay">
              Музыка, которая цепляет. Слушай новые треки, смотри клипы и будь на связи.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-fade-up-delay-2">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-heading font-semibold px-8 glow-purple"
                onClick={() => document.getElementById("music")?.scrollIntoView({ behavior: "smooth" })}
              >
                <Icon name="Play" size={20} />
                <span className="ml-2">Слушать</span>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-border text-foreground hover:bg-muted font-heading font-semibold px-8"
                onClick={() => window.open("https://instagram.com/mandik_inst", "_blank")}
              >
                <Icon name="Instagram" size={20} />
                <span className="ml-2">Instagram</span>
              </Button>
            </div>
          </div>
          <div className="flex-1 flex justify-center lg:justify-end">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-transparent to-secondary/40 rounded-3xl blur-2xl scale-110" />
              <img
                src={HERO_IMAGE}
                alt="MANDIK"
                className="relative w-72 h-72 sm:w-96 sm:h-96 object-cover rounded-3xl shadow-2xl animate-float"
              />
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <Icon name="ChevronDown" size={28} className="text-muted-foreground" />
        </div>
      </section>

      {/* MUSIC */}
      <section id="music" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-medium tracking-widest uppercase mb-2">Плейлист</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-gradient">Музыка</h2>
          </div>

          <div className="flex gap-3 justify-center mb-10 flex-wrap">
            {ALBUMS.map((a) => (
              <button
                key={a.name}
                onClick={() => setActiveAlbum(a.filter)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                  activeAlbum === a.filter
                    ? "bg-primary text-primary-foreground glow-purple"
                    : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                }`}
              >
                {a.name}
              </button>
            ))}
          </div>

          <div className="bg-card/50 backdrop-blur-sm rounded-2xl border border-border overflow-hidden">
            <div className="grid grid-cols-[40px_1fr_100px_60px] sm:grid-cols-[50px_1fr_120px_80px] items-center px-4 sm:px-6 py-3 border-b border-border text-xs text-muted-foreground font-medium uppercase tracking-wider">
              <span>#</span>
              <span>Трек</span>
              <span className="hidden sm:block">Альбом</span>
              <span className="text-right">
                <Icon name="Clock" size={14} />
              </span>
            </div>

            {filteredTracks.map((track, idx) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                className={`track-row grid grid-cols-[40px_1fr_100px_60px] sm:grid-cols-[50px_1fr_120px_80px] items-center px-4 sm:px-6 py-4 cursor-pointer transition-all hover:bg-muted/50 border-b border-border/50 last:border-0 ${
                  currentTrack?.id === track.id ? "active bg-primary/10" : ""
                }`}
              >
                <div className="relative w-8 h-8 flex items-center justify-center">
                  <span className={`text-sm ${currentTrack?.id === track.id ? "text-primary font-bold" : "text-muted-foreground"}`}>
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Icon name="Volume2" size={16} className="text-primary" />
                    ) : (
                      idx + 1
                    )}
                  </span>
                  <div className="track-play-btn absolute inset-0 flex items-center justify-center bg-primary rounded-full">
                    <Icon name={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"} size={14} className="text-primary-foreground" />
                  </div>
                </div>
                <div>
                  <p className={`font-medium text-sm sm:text-base ${currentTrack?.id === track.id ? "text-primary" : "text-foreground"}`}>
                    {track.title}
                  </p>
                  <p className="text-xs text-muted-foreground">MANDIK</p>
                </div>
                <span className="text-xs text-muted-foreground hidden sm:block">{track.album}</span>
                <span className="text-xs text-muted-foreground text-right">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VIDEO */}
      <section id="video" className="py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">Клипы</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-gradient">Видео</h2>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { title: "Ночной город — Official Video", placeholder: "Скоро" },
              { title: "Дым — Lyric Video", placeholder: "Скоро" },
            ].map((video, i) => (
              <div key={i} className="group relative aspect-video bg-card rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-primary/50 transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/40 transition-all group-hover:scale-110">
                      <Icon name="Play" size={28} className="text-primary" />
                    </div>
                    <p className="font-heading font-semibold text-foreground">{video.title}</p>
                    <p className="text-sm text-muted-foreground mt-1">{video.placeholder}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="lg:w-1/2">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-3xl blur-2xl" />
                <img
                  src={HERO_IMAGE}
                  alt="MANDIK"
                  className="relative w-full max-w-md mx-auto rounded-3xl object-cover aspect-square shadow-2xl"
                />
              </div>
            </div>
            <div className="lg:w-1/2">
              <p className="text-secondary text-sm font-medium tracking-widest uppercase mb-2">О артисте</p>
              <h2 className="text-4xl sm:text-5xl font-heading font-bold text-gradient mb-6">MANDIK</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                MANDIK — молодой и амбициозный музыкант, который создаёт свой уникальный звук на стыке хип-хопа, поп-музыки и электроники.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-6">
                Его треки — это искренние истории о жизни, мечтах и пути наверх. Каждая песня — это часть большой истории, которую он рассказывает через музыку.
              </p>
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-heading font-bold text-gradient">8</p>
                  <p className="text-xs text-muted-foreground mt-1">Треков</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-heading font-bold text-gradient">2</p>
                  <p className="text-xs text-muted-foreground mt-1">Релиза</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-heading font-bold text-gradient">2025</p>
                  <p className="text-xs text-muted-foreground mt-1">Старт</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIALS */}
      <section id="socials" className="py-24 px-4 sm:px-6 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-secondary text-sm font-medium tracking-widest uppercase mb-2">Подписывайся</p>
            <h2 className="text-4xl sm:text-5xl font-heading font-bold text-gradient">Соцсети</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {SOCIALS.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative bg-card rounded-2xl border border-border p-6 flex flex-col items-center gap-3 hover:border-primary/50 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${social.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon name={social.icon} size={24} className="text-white" />
                </div>
                <span className="font-medium text-sm text-foreground">{social.name}</span>
                {social.name === "Instagram" && (
                  <span className="text-xs text-muted-foreground">@mandik_inst</span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACTS */}
      <section id="contacts" className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-accent text-sm font-medium tracking-widest uppercase mb-2">Связаться</p>
          <h2 className="text-4xl sm:text-5xl font-heading font-bold text-gradient mb-6">Контакты</h2>
          <p className="text-muted-foreground mb-10">
            По вопросам сотрудничества и букинга
          </p>

          <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            <a
              href="https://instagram.com/mandik_inst"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                <Icon name="Instagram" size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Instagram</p>
                <p className="text-xs text-muted-foreground">@mandik_inst</p>
              </div>
            </a>
            <a
              href="#"
              className="flex items-center gap-3 bg-card rounded-xl border border-border p-4 hover:border-primary/50 transition-all group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                <Icon name="Send" size={20} className="text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">Telegram</p>
                <p className="text-xs text-muted-foreground">Написать</p>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-border py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xl font-heading font-bold text-gradient">MANDIK</span>
          <p className="text-sm text-muted-foreground">© 2025 MANDIK. Все права защищены.</p>
          <div className="flex gap-4">
            <a href="https://instagram.com/mandik_inst" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Instagram" size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Send" size={20} />
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="Youtube" size={20} />
            </a>
          </div>
        </div>
      </footer>

      {/* BOTTOM PLAYER */}
      {currentTrack && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border shadow-2xl">
          <div className="max-w-7xl mx-auto">
            <input
              type="range"
              className="player-progress w-full"
              min={0}
              max={currentTrack.durationSec}
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
            />
            <div className="flex items-center gap-4 px-4 sm:px-6 pb-3 pt-1">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center shrink-0">
                  <Icon name="Music" size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{currentTrack.title}</p>
                  <p className="text-xs text-muted-foreground">MANDIK</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={prevTrack} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="SkipBack" size={18} />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-primary flex items-center justify-center hover:bg-primary/80 transition-colors glow-purple"
                >
                  <Icon name={isPlaying ? "Pause" : "Play"} size={18} className="text-primary-foreground" />
                </button>
                <button onClick={nextTrack} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Icon name="SkipForward" size={18} />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-end gap-3">
                <span className="text-xs text-muted-foreground hidden sm:block">
                  {formatTime(progress)} / {currentTrack.duration}
                </span>
                <div className="hidden sm:flex items-center gap-2">
                  <Icon name="Volume2" size={14} className="text-muted-foreground" />
                  <input
                    type="range"
                    className="player-volume w-20"
                    min={0}
                    max={100}
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
