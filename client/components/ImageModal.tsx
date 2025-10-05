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
} from "lucide-react";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  src: string;
  alt: string;
  isVideo?: boolean;
}

export default function ImageModal({
  isOpen,
  onClose,
  src,
  alt,
  isVideo = false,
}: ImageModalProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [videoAspectRatio, setVideoAspectRatio] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isOpen) {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [isOpen]);

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
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("durationchange", handleDurationChange);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("durationchange", handleDurationChange);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [isOpen, isPlaying]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
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

  const handleVideoLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
      const aspectRatio = video.videoWidth / video.videoHeight;
      setVideoAspectRatio(aspectRatio);
    }
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

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1500);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt || (isVideo ? "video" : "image");
    link.click();
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      // Force fullscreen with multiple browser support
      if (video.requestFullscreen) {
        video.requestFullscreen({ navigationUI: "hide" });
      } else if ((video as any).webkitRequestFullscreen) {
        (video as any).webkitRequestFullscreen();
      } else if ((video as any).mozRequestFullScreen) {
        (video as any).mozRequestFullScreen();
      } else if ((video as any).msRequestFullscreen) {
        (video as any).msRequestFullscreen();
      }
    } catch (error) {
      console.log("Tentando fullscreen alternativo:", error);
      // Try alternative fullscreen approach
      try {
        const element = video.parentElement || video;
        if ((element as any).requestFullscreen) {
          (element as any).requestFullscreen();
        }
      } catch (e) {
        console.log("Fullscreen não disponível neste ambiente");
      }
    }
  };

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ animation: "none" }}
    >
      <div 
        className="relative rounded-2xl overflow-hidden"
        style={{
          maxWidth: videoAspectRatio !== null && videoAspectRatio < 1 ? "60vh" : "90vw",
          maxHeight: "90vh",
        }}
      >
        {/* Glass container */}
        <div
          className="relative bg-black bg-opacity-20 backdrop-blur-xl border border-white border-opacity-20 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(0, 0, 0, 0.1)",
            backdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          {/* Close button */}
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 z-20 bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-10 h-10 p-0"
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              backdropFilter: "blur(10px)",
            }}
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Content */}
          {isVideo ? (
            <div
              className="relative"
              onMouseMove={handleMouseMove}
              onMouseLeave={() => setShowControls(false)}
            >
              <video
                ref={videoRef}
                className="max-w-full max-h-[80vh] object-contain rounded-2xl"
                style={{
                  display: "block",
                  ...(videoAspectRatio !== null && {
                    minWidth: videoAspectRatio < 1 ? "300px" : "400px",
                    minHeight: videoAspectRatio < 1 ? "400px" : "300px",
                    maxWidth: videoAspectRatio < 1 ? "50vh" : "90vw",
                    maxHeight: videoAspectRatio < 1 ? "80vh" : "70vh",
                  }),
                }}
                onClick={togglePlay}
                onLoadedMetadata={handleVideoLoadedMetadata}
                preload="metadata"
                playsInline
                controls={false}
                src={src}
              >
                Seu navegador não suporta vídeo HTML5.
              </video>

              {/* Glass controls overlay */}
              <div
                className={`absolute bottom-0 left-0 right-0 p-4 transition-opacity duration-150 ${
                  showControls ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  background:
                    "linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0.3), transparent)",
                  backdropFilter: "blur(10px)",
                }}
              >
                {/* Progress bar */}
                <div className="mb-3 relative">
                  {/* Background track */}
                  <div className="w-full h-2 bg-white bg-opacity-30 rounded-lg">
                    {/* Progress fill */}
                    <div 
                      className="h-full bg-white bg-opacity-90 rounded-lg transition-all duration-75 ease-linear"
                      style={{
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                      }}
                    />
                  </div>
                  {/* Invisible input for interaction */}
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime || 0}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer slider"
                  />
                  {/* Custom thumb */}
                  <div 
                    className="absolute top-1/2 w-4 h-4 bg-white rounded-full shadow-lg transform -translate-y-1/2 -translate-x-1/2 transition-all duration-75 ease-linear pointer-events-none"
                    style={{
                      left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`
                    }}
                  />
                </div>

                {/* Controls row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <Button
                      onClick={togglePlay}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-10 h-10 p-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(10px)",
                      }}
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>

                    {/* Volume */}
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={toggleMute}
                        variant="ghost"
                        size="sm"
                        className="bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-8 h-8 p-0"
                        style={{
                          background: "rgba(255, 255, 255, 0.15)",
                          backdropFilter: "blur(10px)",
                        }}
                      >
                        {isMuted ? (
                          <VolumeX className="h-3 w-3" />
                        ) : (
                          <Volume2 className="h-3 w-3" />
                        )}
                      </Button>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={isMuted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-white bg-opacity-30 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${volume * 100}%, rgba(255,255,255,0.3) ${volume * 100}%, rgba(255,255,255,0.3) 100%)`,
                        }}
                      />
                    </div>

                    {/* Time */}
                    <span className="text-white text-sm font-mono">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  {/* Controls buttons */}
                  <div className="flex items-center gap-2">
                    {/* Fullscreen button */}
                    <Button
                      onClick={handleFullscreen}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-10 h-10 p-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(10px)",
                      }}
                      title="Tela cheia"
                    >
                      <Maximize className="h-4 w-4" />
                    </Button>

                    {/* Download button */}
                    <Button
                      onClick={handleDownload}
                      variant="ghost"
                      size="sm"
                      className="bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-10 h-10 p-0"
                      style={{
                        background: "rgba(255, 255, 255, 0.15)",
                        backdropFilter: "blur(10px)",
                      }}
                      title="Download do vídeo"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <img
                src={src}
                alt={alt}
                className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                style={{ display: "block" }}
              />
              {/* Download button for images */}
              <Button
                onClick={handleDownload}
                variant="ghost"
                size="sm"
                className="absolute bottom-4 right-4 z-20 bg-white bg-opacity-20 backdrop-blur-md text-white hover:bg-opacity-30 border border-white border-opacity-30 rounded-full w-10 h-10 p-0"
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  backdropFilter: "blur(10px)",
                }}
                title="Download da imagem"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .slider {
          outline: none;
        }
        
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 0;
          height: 0;
          background: transparent;
        }
        
        .slider::-moz-range-thumb {
          width: 0;
          height: 0;
          background: transparent;
          border: none;
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
