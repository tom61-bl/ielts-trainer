"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

export type AudioHandle = {
  seek: (seconds: number) => void;
  getTime: () => number;
};

const rates = [0.75, 1, 1.25, 1.5];

function format(seconds: number) {
  if (!Number.isFinite(seconds)) return "00:00";
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  const rest = whole % 60;
  return `${String(mins).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

function rateLabel(rate: number) {
  return `${rate.toFixed(rate % 1 === 0 ? 1 : 2)}x`;
}

export const AudioPlayer = forwardRef<
  AudioHandle,
  {
    src?: string;
    onTime: (seconds: number) => void;
    onTranscript?: () => void;
    onGrade?: () => void;
  }
>(function AudioPlayer({ src, onTime, onTranscript, onGrade }, ref) {
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

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play().catch(() => setError(true));
    else audio.pause();
  }

  return (
    <div className="exam-transport">
      {src ? (
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
      ) : null}
      <button type="button" className="exam-play" onClick={toggle} disabled={!src} aria-label={playing ? "暂停" : "播放"}>
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </button>
      <span className="exam-time">{format(time)}</span>
      {error ? (
        <span className="exam-audio-note">音频没有载入</span>
      ) : (
        <input
          className="exam-scrub"
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={Math.min(time, duration || 0)}
          aria-label="听力进度"
          disabled={!src}
          onChange={(event) => {
            const next = Number(event.target.value);
            if (audioRef.current) audioRef.current.currentTime = next;
            setTime(next);
          }}
        />
      )}
      <span className="exam-time">{format(duration)}</span>
      <button
        type="button"
        className="exam-rate"
        disabled={!src}
        onClick={() => setRate((current) => rates[(rates.indexOf(current) + 1) % rates.length])}
      >
        {rateLabel(rate)}
      </button>
      <button type="button" className="exam-textbtn" onClick={onTranscript} disabled={!src}>
        听力原文
      </button>
      <button type="button" className="exam-textbtn" onClick={onGrade}>
        查答案
      </button>
    </div>
  );
});
