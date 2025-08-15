"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  onResult: (text: string) => void;
  lang: "TH" | "EN" | "CN";
};

function pickMime(): { mime: string; ext: string } {
  const cands = [
    { mime: "audio/webm", ext: "webm" },
    { mime: "audio/ogg", ext: "ogg" },
    { mime: "audio/mp4", ext: "m4a" },
  ];
  for (const c of cands)
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c.mime))
      return c;
  return { mime: "audio/webm", ext: "webm" };
}

const langToASRCode = { TH: "th", EN: "en", CN: "zh" } as const;

type Status = "idle" | "recording" | "preview" | "processing" | "error";

export default function VoiceSearchModal({ open, onClose, onResult, lang }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [sec, setSec] = useState(0);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const blobRef = useRef<Blob | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const t = {
    recordingTitle: lang === "EN" ? "Listening…" : lang === "CN" ? "正在聆听…" : "กำลังฟัง…",
    processingTitle: lang === "EN" ? "Transcribing…" : lang === "CN" ? "正在转写…" : "กำลังถอดเสียง…",
    errorTitle: lang === "EN" ? "Something went wrong" : lang === "CN" ? "发生错误" : "เกิดข้อผิดพลาด",
    micDenied:
      lang === "EN"
        ? "Please allow microphone access or your browser may not be supported."
        : lang === "CN"
        ? "请允许麦克风权限，或您的浏览器可能不受支持。"
        : "กรุณาอนุญาตไมโครโฟน หรือเบราว์เซอร์ไม่รองรับ",
    asrFailed: lang === "EN" ? "Could not transcribe audio" : lang === "CN" ? "无法转写音频" : "ไม่สามารถถอดเสียงได้",
    asrError: lang === "EN" ? "Error while transcribing" : lang === "CN" ? "转写时出错" : "เกิดข้อผิดพลาดในการถอดเสียง",
  };

  const startRecording = async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      setSec(0);
      setErrorMsg("");
      setStatus("idle");
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      blobRef.current = null;
      audioRef.current?.pause();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const { mime } = pickMime();
      const rec = new MediaRecorder(stream, { mimeType: mime });
      mediaRef.current = rec;
      chunksRef.current = [];

      rec.ondataavailable = (e) => {
        if (e.data?.size > 0) chunksRef.current.push(e.data);
      };

      rec.onstop = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        stream.getTracks().forEach((t) => t.stop());

        try {
          const blob = new Blob(chunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          blobRef.current = blob;
          setBlobUrl(url);
          audioRef.current = new Audio(url);
          setStatus("preview");
        } catch {
          setErrorMsg(t.asrError);
          setStatus("error");
        }
      };

      rec.start();
      setStatus("recording");
      timerRef.current = setInterval(() => setSec((s) => s + 1), 1000);
    } catch {
      setErrorMsg(t.micDenied);
      setStatus("error");
    }
  };

  const stopRecording = () => {
    try {
      if (mediaRef.current && mediaRef.current.state !== "inactive") {
        mediaRef.current.stop();
      } else {
        setStatus("preview");
      }
    } catch {
      setStatus("preview");
    }
  };

  const replay = async () => {
    try {
      if (!audioRef.current && blobUrl) audioRef.current = new Audio(blobUrl);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        await audioRef.current.play();
      }
    } catch {}
  };

  const recordAgain = () => startRecording();

  const deleteTake = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    audioRef.current?.pause();
    if (blobUrl) URL.revokeObjectURL(blobUrl);
    blobRef.current = null;
    setBlobUrl(null);
    setSec(0);
    setStatus("idle");
    onClose();
  };

  const confirmAndSend = async () => {
    if (!blobRef.current) return;
    setStatus("processing");
    try {
      const { mime } = pickMime();
      const fd = new FormData();
      fd.append("file", blobRef.current, `voice.${mime.includes("mp4") ? "m4a" : "webm"}`);
      fd.append("lang", langToASRCode[lang]);
      fd.append("mock", "1");

      const res = await fetch("/api/voice-search?mock=1", { method: "POST", body: fd });
      const data = await res.json();

      if (data?.text) {
        onResult(data.text);
        onClose();
      } else {
        setErrorMsg(t.asrFailed);
        setStatus("error");
      }
    } catch {
      setErrorMsg(t.asrError);
      setStatus("error");
    }
  };

  useEffect(() => {
    if (!open) return;
    startRecording();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      try {
        if (mediaRef.current?.state !== "inactive") mediaRef.current?.stop();
      } catch {}
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lang]);

  if (!open) return null;

  const mm = String(Math.floor(sec / 60)).padStart(2, "0");
  const ss = String(sec % 60).padStart(2, "0");

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
        onClick={status === "recording" ? stopRecording : onClose}
      />

      {/* Circular, Futuristic Neon Modal */}
      <div className="fixed inset-0 grid place-items-center z-[61]">
        <div
          className={[
            "relative rounded-full",
            "w-[min(88vw,240px)] h-[min(88vw,240px)]",
            "bg-[radial-gradient(79%_79%_at_50%_50%,rgba(15,27,49,.92)_0%,rgba(15,27,49,.85)_60%,rgba(15,27,49,.7)_100%)]",
            "border border-white/10",
            "shadow-[0_0_30px_rgba(52,188,177,.45),inset_0_0_24px_rgba(74,53,130,.35)]",
            "overflow-hidden",
          ].join(" ")}
          role="dialog"
          aria-modal="true"
          aria-label="Voice search"
        >
          {/* Neon rotating ring */}
          <span className="absolute inset-[-2px] rounded-full neon-ring" aria-hidden />

          {/* ✅ Recording text moved ABOVE mic + 50% font size */}
          {status === "recording" && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[20px] font-semibold text-white/90">
                {t.recordingTitle}
              </div>
              <div className="text-[20px] mt-0.5 text-white/70 tracking-wide">
                {mm}:{ss}
              </div>
            </div>
          )}

          {/* Inner content (Mic / EQ) */}
          <div className="absolute inset-0 grid place-items-center">
            <div className="relative w-[70%] aspect-square rounded-full bg-white/2 ring-1 ring-white/10">
              <span className={`aura ${status === "recording" ? "" : "paused"}`} aria-hidden />
              <div className="eq-wrap">
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="eq-bar"
                    style={{
                      animationDelay: `${i * 0.06}s`,
                      animationPlayState: status === "recording" ? "running" : "paused",
                      opacity: status === "recording" ? 1 : 0.55,
                    }}
                    aria-hidden
                  />
                ))}
              </div>
              <div className="mic">
                <svg viewBox="0 0 24 24" className="h-7 w-7">
                  <path
                    fill="currentColor"
                    d="M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Status text (bottom) — shown for non-recording states */}
          {status !== "recording" && (
            <div className="absolute bottom-14 left-1/2 -translate-x-1/2 text-center pointer-events-none">
              <div className="text-[15px] tracking-wide text-white/90">
                {status === "processing"
                  ? t.processingTitle
                  : status === "error"
                  ? t.errorTitle
                  : status === "preview"
                  ? (lang === "EN" ? "Confirm voice search" : lang === "CN" ? "预览录音" : "ยืนยันการค้นหาด้วยเสียง")
                  : ""}
              </div>
              {status === "error" && (
                <div className="text-[10px] mt-0.5 text-rose-300/90">{errorMsg}</div>
              )}
            </div>
          )}

          {/* Icon Buttons */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3">
            {status === "recording" ? (
              <>
                <button onClick={stopRecording} aria-label="Stop" title="Stop" className="icon-btn neon">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <rect x="8" y="8" width="8" height="8" fill="currentColor" rx="1" />
                  </svg>
                </button>
                <button onClick={onClose} aria-label="Cancel" title="Cancel" className="icon-btn ghost">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.3-6.3z" />
                  </svg>
                </button>
              </>
            ) : status === "preview" ? (
              <>
                {/* (optional) Replay / Record Again — หากต้องการเปิดใช้งานให้ uncomment
                <button onClick={replay} aria-label="Replay" title="Replay" className="icon-btn neon">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6a6 6 0 1 1-6-6z" />
                  </svg>
                </button>
                <button onClick={recordAgain} aria-label="Record again" title="Record again" className="icon-btn neon">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <circle cx="12" cy="12" r="5" fill="currentColor" />
                  </svg>
                </button>
                */}
                <button onClick={deleteTake} aria-label="Delete" title="Delete" className="icon-btn ghost">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M9 3h6l1 2h4v2H4V5h4l1-2Zm1 6h2v8h-2V9Zm4 0h2v8h-2V9ZM7 9h2v8H7V9Z" />
                  </svg>
                </button>
                <button onClick={confirmAndSend} aria-label="Confirm" title="Confirm" className="icon-btn neon">
                  <svg viewBox="0 0 24 24" className="h-4 w-4">
                    <path fill="currentColor" d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </button>
              </>
            ) : (
              <button onClick={onClose} aria-label="Close" title="Close" className="icon-btn neon">
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path fill="currentColor" d="M18.3 5.71 12 12l6.3 6.29-1.41 1.42L10.59 13.4 4.29 19.7 2.88 18.3 9.17 12 2.88 5.71 4.29 4.29l6.3 6.3 6.3-6.3z" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Neon / Futuristic styles */}
      <style jsx>{`
        :root {
          --neon1: var(--zp-primary);
          --neon2: #7c3aed;
          --neon3: #22d3ee;
          --ring: conic-gradient(from 0deg, var(--neon1), var(--neon2), var(--neon3), var(--neon1));
        }
        .neon-ring { background: var(--ring); filter: blur(8px) saturate(140%); animation: spin 6s linear infinite; opacity: .9; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .aura {
          position: absolute; inset: -8%; border-radius: 9999px;
          background:
            radial-gradient(60% 60% at 50% 50%, rgba(52,188,177,.35), transparent 60%),
            radial-gradient(60% 60% at 50% 50%, rgba(124,58,237,.25), transparent 70%);
          box-shadow: 0 0 30px rgba(52,188,177,.45), inset 0 0 24px rgba(124,58,237,.35);
          animation: pulse 2.4s ease-in-out infinite; pointer-events: none;
        }
        .aura.paused { animation-play-state: paused; opacity:.85; }
        @keyframes pulse { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.04);opacity:.92;} }

        .eq-wrap { position: absolute; inset: 0; display: grid; place-items: center; }
        .eq-bar {
          position: absolute; bottom: 26%; width: 6px; height: 16px; border-radius: 6px;
          background: linear-gradient(180deg, var(--neon1), var(--neon2));
          box-shadow: 0 0 8px var(--neon1); animation: eq 1.2s ease-in-out infinite; transform-origin: center bottom;
        }
        .eq-bar:nth-child(1)  { left: 50%; transform: translateX(-96px); }
        .eq-bar:nth-child(2)  { left: 50%; transform: translateX(-72px); }
        .eq-bar:nth-child(3)  { left: 50%; transform: translateX(-48px); }
        .eq-bar:nth-child(4)  { left: 50%; transform: translateX(-24px); }
        .eq-bar:nth-child(5)  { left: 50%; transform: translateX(0px); }
        .eq-bar:nth-child(6)  { left: 50%; transform: translateX(24px); }
        .eq-bar:nth-child(7)  { left: 50%; transform: translateX(48px); }
        .eq-bar:nth-child(8)  { left: 50%; transform: translateX(72px); }
        .eq-bar:nth-child(9)  { left: 50%; transform: translateX(96px); }
        @keyframes eq { 0%,100% { height: 14px; } 40% { height: 44px; } 70% { height: 26px; } }

        .mic { position: absolute; inset: 0; display: grid; place-items: center; color: #e7fdf9; text-shadow: 0 0 10px rgba(34,211,238,.5); filter: drop-shadow(0 2px 8px rgba(52,188,177,.5)); pointer-events: none; }

        .icon-btn {
          height: 34px; width: 34px; display: grid; place-items: center;
          border-radius: 9999px; border: 1px solid rgba(255,255,255,.15);
          background: rgba(255,255,255,.06); color: white; backdrop-filter: blur(6px);
          transition: all .2s ease;
        }
        .icon-btn:hover { transform: translateY(-1px); }
        .icon-btn.neon { box-shadow: 0 0 12px rgba(52,188,177,.55), inset 0 0 10px rgba(124,58,237,.35); outline: 1px solid color-mix(in srgb, var(--neon1) 50%, transparent); }
        .icon-btn.ghost { opacity: .85; }
        .icon-btn svg { color: #e8fff9; }
      `}</style>
    </>
  );
}
