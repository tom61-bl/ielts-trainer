"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import type { AudioSection } from "@/lib/types";

export type AudioHandle = {
  seek: (seconds: number) => void;
  getTime: () => number;
};

function format(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${mins}:${rest.toString().padStart(2, "0")}`;
}

export const AudioPlayer = forwardRef<
  AudioHandle,
  {
    src?: string;
    sections: AudioSection[];
    activeSection?: number;
    onTime: (seconds: number) => void;
  }
>(function AudioPlayer({ src, sections, activeSection, onTime }, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [error, setError] = useState(false);

  useImperativeHandle(ref, () => ({
    seek(seconds: number) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(0, seconds);
      void audio.play().catch(() => setError(true));
    },
    getTime() {
      return audioRef.current?.currentTime ?? 0;
    },
  }));

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  if (!src) return null;

  return (
    <div className="border-b border-line p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span>听力</span>
        <span>
          {format(time)} / {format(duration)}
        </span>
      </div>
      {error ? (
        <p className="mb-2 text-sm text-wrong">音频没有载入。</p>
      ) : null}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={(event) => {
          const next = event.currentTarget.currentTime;
          setTime(next);
          onTime(next);
        }}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onError={() => setError(true)}
      />
      <input
        className="w-full accent-[var(--primary)]"
        type="range"
        min={0}
        max={duration || 0}
        step={0.1}
        value={Math.min(time, duration || 0)}
        aria-label="听力进度"
        onChange={(event) => {
          const next = Number(event.target.value);
          if (audioRef.current) audioRef.current.currentTime = next;
          setTime(next);
        }}
      />
      <div className="mt-2 flex flex-wrap gap-1">
        {sections.map((section) => (
          <button
            key={section.section}
            className={`rounded-full px-2 py-1 text-xs ${activeSection === section.section ? "bg-primary text-white" : "bg-primary-soft text-primary"}`}
            onClick={() => {
              if (audioRef.current) {
                audioRef.current.currentTime = section.start;
                void audioRef.current.play();
              }
            }}
          >
            {section.title.split("·")[0]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          className="btn btn-primary h-11 w-11 px-0"
          onClick={() => {
            const audio = audioRef.current;
            if (!audio) return;
            if (audio.paused) void audio.play();
            else audio.pause();
          }}
          aria-label={playing ? "暂停" : "播放"}
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
        <button
          className="btn btn-ghost h-11 px-3"
          onClick={() => {
            if (!audioRef.current) return;
            audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10);
          }}
        >
          <RotateCcw size={14} />
          10 秒
        </button>
        <label className="ml-auto text-xs text-muted">
          倍速
          <select
            className="field ml-2 h-11 w-auto py-0"
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
          >
            {[0.75, 1, 1.25, 1.5].map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
});
