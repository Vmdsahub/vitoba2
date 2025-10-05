import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  X,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
} from "lucide-react";

interface VideoPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  filename: string;
}

export default function VideoPlayer({
  isOpen,
  onClose,
  src,
  filename,
}: VideoPlayerProps) {
  // Estados do player
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const progressRef = useRef<HTMLDivElement>(null);



  // Reset quando modal abre/fecha
  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
      setIsLoading(true);
      setShowControls(true);
    }
  }, [isOpen]);

  // Event listeners do vídeo
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let animationFrame: number;
    
    const updateProgress = () => {
      if (video && !isNaN(video.currentTime)) {
        setCurrentTime(video.currentTime);
      }
      if (isPlaying) {
        animationFrame = requestAnimationFrame(updateProgress);
      }
    };

    const handleTimeUpdate = () => {
      if (video && !isNaN(video.currentTime)) {
        setCurrentTime(video.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (video && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
      setIsLoading(false);
      animationFrame = requestAnimationFrame(updateProgress);
    };

    const handlePause = () => {
      setIsPlaying(false);
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };

    const handleLoadedMetadata = () => {
      if (video && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
        setCurrentTime(video.currentTime || 0);
        const aspectRatio = video.videoWidth / video.videoHeight;
        setVideoAspectRatio(aspectRatio);
      }
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsBuffering(false);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handleCanPlayThrough = () => {
      setIsBuffering(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
    };



    // Fullscreen events
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("canplaythrough", handleCanPlayThrough);
    video.addEventListener("loadstart", handleLoadStart);

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("canplaythrough", handleCanPlayThrough);
      video.removeEventListener("loadstart", handleLoadStart);

      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isOpen, isPlaying]);

  // Controles do player
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(console.error);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const newTime = parseFloat(e.target.value);
    if (!isNaN(newTime) && newTime >= 0 && newTime <= duration) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar || !duration) return;

    const rect = progressBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;
    
    if (newTime >= 0 && newTime <= duration) {
      video.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const skip = (seconds: number) => {
    const video = videoRef.current;
    if (!video) return;

    const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const changePlaybackRate = (rate: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
    toast.success(`Velocidade alterada para ${rate}x`);
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Erro ao alternar fullscreen:", error);
      toast.error("Não foi possível alternar para tela cheia");
    }
  };



  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = filename || "video";
    link.click();
    toast.success("Download iniciado");
  };

  const restart = () => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = 0;
    setCurrentTime(0);
  };

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying && !showSettings) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2000);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        skip(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        skip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setVolume(prev => Math.min(1, prev + 0.1));
        break;
      case 'ArrowDown':
        e.preventDefault();
        setVolume(prev => Math.max(0, prev - 0.1));
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (!document.fullscreenElement) {
          onClose();
        }
        break;
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isPlaying, volume]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const isVertical = videoAspectRatio !== null && videoAspectRatio < 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90"
      onClick={handleBackdropClick}
      style={{ 
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.95) 100%)',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => !showSettings && setShowControls(false)}
      >
        {/* Video Container */}
        <div
          className="relative rounded-xl overflow-hidden shadow-2xl"
          style={{
            maxWidth: isVertical ? '50vh' : '95vw',
            maxHeight: isVertical ? '90vh' : '85vh',
            minWidth: isVertical ? '300px' : '400px',
            minHeight: isVertical ? '400px' : '225px',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.3))',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          {/* Video Element */}
          <video
            ref={videoRef}
            className="w-full h-full object-contain bg-black"
            onClick={togglePlay}
            preload="metadata"
            playsInline
            controls={false}
            src={src}
            style={{
              borderRadius: '12px'
            }}
          >
            Seu navegador não suporta vídeo HTML5.
          </video>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
                <span className="text-white text-sm">Carregando vídeo...</span>
              </div>
            </div>
          )}

          {/* Buffering Indicator */}
          {isBuffering && !isLoading && (
            <div className="absolute top-4 left-4 flex items-center gap-2 bg-black bg-opacity-60 px-3 py-1 rounded-full">
              <Loader2 className="h-4 w-4 text-white animate-spin" />
              <span className="text-white text-xs">Carregando...</span>
            </div>
          )}

          {/* Close Button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-30 bg-black bg-opacity-60 backdrop-blur-md text-white hover:bg-opacity-80 border border-white border-opacity-20 rounded-full w-10 h-10 p-0 transition-all duration-200"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Play/Pause Center Button */}
          {!isLoading && (
            <div 
              className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 ${
                showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <Button
                onClick={togglePlay}
                variant="ghost"
                className="bg-black bg-opacity-60 backdrop-blur-md text-white hover:bg-opacity-80 border border-white border-opacity-30 rounded-full w-16 h-16 p-0 pointer-events-auto transition-all duration-200 hover:scale-110"
              >
                {isPlaying ? (
                  <Pause className="h-8 w-8" />
                ) : (
                  <Play className="h-8 w-8 ml-1" />
                )}
              </Button>
            </div>
          )}

          {/* Controls Overlay */}
          <div
            className={`absolute bottom-0 left-0 right-0 transition-all duration-300 ${
              showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{
              background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
              backdropFilter: 'blur(10px)'
            }}
          >
            {/* Progress Bar */}
            <div className="px-4 pt-6 pb-2">
              <div 
                ref={progressRef}
                className="relative w-full h-2 bg-white bg-opacity-20 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                {/* Progress Fill */}
                <div 
                  className="h-full bg-white rounded-full transition-all duration-100 ease-linear"
                  style={{
                    width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                  }}
                />
                {/* Progress Thumb */}
                <div 
                  className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-100 ease-linear opacity-0 group-hover:opacity-100"
                  style={{
                    left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                  }}
                />
                {/* Invisible Input */}
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime || 0}
                  onChange={handleSeek}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
            </div>

            {/* Controls Row */}
            <div className="flex items-center justify-between px-4 pb-4">
              {/* Left Controls */}
              <div className="flex items-center gap-3">


                {/* Play/Pause */}
                <Button
                  onClick={togglePlay}
                  variant="ghost"
                  size="sm"
                  className="bg-white bg-opacity-15 backdrop-blur-md text-white hover:bg-opacity-25 border border-white border-opacity-30 rounded-full w-10 h-10 p-0 transition-all duration-200"
                >
                  {isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </Button>





                {/* Volume Controls */}
                <div className="flex items-center gap-2 ml-2">
                  <Button
                    onClick={toggleMute}
                    variant="ghost"
                    size="sm"
                    className="bg-white bg-opacity-10 backdrop-blur-md text-white hover:bg-opacity-20 border border-white border-opacity-20 rounded-full w-8 h-8 p-0 transition-all duration-200"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="h-4 w-4" />
                    ) : (
                      <Volume2 className="h-4 w-4" />
                    )}
                  </Button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-20 h-1 bg-white bg-opacity-20 rounded-full appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`,
                    }}
                  />
                </div>

                {/* Time Display */}
                <span className="text-white text-sm font-mono ml-2">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2">
                {/* Settings */}
                <div className="relative">
                  <Button
                    onClick={() => setShowSettings(!showSettings)}
                    variant="ghost"
                    size="sm"
                    className="bg-white bg-opacity-10 backdrop-blur-md text-white hover:bg-opacity-20 border border-white border-opacity-20 rounded-full w-9 h-9 p-0 transition-all duration-200"
                    title="Configurações"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>

                  {/* Settings Menu */}
                  {showSettings && (
                    <div className="absolute bottom-full right-0 mb-2 bg-black bg-opacity-80 backdrop-blur-md border border-white border-opacity-20 rounded-lg p-2 min-w-[120px]">
                      <div className="text-white text-xs font-medium mb-2">Velocidade</div>
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`block w-full text-left px-2 py-1 text-xs rounded transition-colors ${
                            playbackRate === rate
                              ? 'bg-blue-500 text-white'
                              : 'text-white hover:bg-white hover:bg-opacity-10'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  )}
                </div>



                {/* Fullscreen */}
                <Button
                  onClick={toggleFullscreen}
                  variant="ghost"
                  size="sm"
                  className="bg-white bg-opacity-10 backdrop-blur-md text-white hover:bg-opacity-20 border border-white border-opacity-20 rounded-full w-9 h-9 p-0 transition-all duration-200"
                  title="Tela cheia"
                >
                  {isFullscreen ? (
                    <Minimize className="h-4 w-4" />
                  ) : (
                    <Maximize className="h-4 w-4" />
                  )}
                </Button>

                {/* Download */}
                <Button
                  onClick={handleDownload}
                  variant="ghost"
                  size="sm"
                  className="bg-white bg-opacity-10 backdrop-blur-md text-white hover:bg-opacity-20 border border-white border-opacity-20 rounded-full w-9 h-9 p-0 transition-all duration-200"
                  title="Download"
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            
            .slider {
              outline: none;
            }
            
            .slider::-webkit-slider-thumb {
              appearance: none;
              width: 12px;
              height: 12px;
              background: white;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            
            .slider::-moz-range-thumb {
              width: 12px;
              height: 12px;
              background: white;
              border: none;
              border-radius: 50%;
              cursor: pointer;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            }
            
            .slider::-moz-range-track {
              background: transparent;
            }
          `,
        }}
      />
    </div>
  );
}