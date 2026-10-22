import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Upload, Loader2, Volume2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface VoiceRecorderProps {
  onAudioSaved: (url: string) => void;
  initialAudioUrl?: string | null;
  userId?: string;
}

export default function VoiceRecorder({ onAudioSaved, initialAudioUrl, userId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(initialAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (initialAudioUrl) {
      setAudioUrl(initialAudioUrl);
    }
  }, [initialAudioUrl]);

  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Select appropriate MIME type supported by browser
      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        } else {
          mimeType = '';
        }
      }

      const mediaRecorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlobResult = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        setAudioBlob(audioBlobResult);
        const url = URL.createObjectURL(audioBlobResult);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());

        // Auto upload
        await uploadAudio(audioBlobResult);
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err: any) {
      console.error("Error accessing microphone:", err);
      alert("No se pudo acceder al micrófono. Por favor asegúrate de otorgar los permisos necesarios en tu navegador.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const togglePlayback = () => {
    if (!audioUrl) return;
    if (!audioElementRef.current) {
      audioElementRef.current = new Audio(audioUrl);
      audioElementRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play().catch(e => console.error("Playback error:", e));
      setIsPlaying(true);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/')) {
      alert("Por favor selecciona un archivo de audio válido (MP3, M4A, WAV, etc.)");
      return;
    }

    setAudioUrl(URL.createObjectURL(file));
    await uploadAudio(file);
  };

  const uploadAudio = async (blobOrFile: Blob | File) => {
    setIsUploading(true);
    setUploadSuccess(false);
    try {
      const extension = (blobOrFile as File).name?.split('.').pop() || 'webm';
      const fileName = `voicenotes/${userId || 'anon'}_${Date.now()}.${extension}`;
      
      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(fileName, blobOrFile, {
          contentType: blobOrFile.type || 'audio/webm',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('memories')
        .getPublicUrl(fileName);

      onAudioSaved(publicUrl);
      setAudioUrl(publicUrl);
      setUploadSuccess(true);
    } catch (err: any) {
      console.error("Error uploading audio:", err);
      alert("Error al guardar la nota de voz. Inténtalo de nuevo.");
    } finally {
      setIsUploading(false);
    }
  };

  const clearAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current = null;
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setUploadSuccess(false);
    setRecordingTime(0);
    onAudioSaved('');
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-[#181818] border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="text-red-500" size={18} />
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Nota de Voz / Mensaje Dedicado
          </h4>
        </div>
        {uploadSuccess && (
          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 bg-emerald-950/60 border border-emerald-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={12} /> Guardada
          </span>
        )}
      </div>

      <p className="text-xs text-zinc-400 leading-relaxed">
        Graba o sube tus propias palabras para tu persona especial. Este mensaje se grabará en la caja musical o se escuchará al escanear el QR.
      </p>

      {/* ÁREA DE GRABACIÓN / ESTADO */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        {!audioUrl && !isRecording && (
          <button
            type="button"
            onClick={startRecording}
            className="w-full sm:w-auto px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-950/40 active:scale-95"
          >
            <Mic size={16} /> Grabar con Micrófono
          </button>
        )}

        {isRecording && (
          <div className="w-full flex items-center justify-between bg-red-950/40 border border-red-800/80 p-3 rounded-xl animate-pulse">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              <span className="text-xs font-mono font-bold text-red-200">
                Grabando: {formatSeconds(recordingTime)}
              </span>
            </div>
            <button
              type="button"
              onClick={stopRecording}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all"
            >
              <Square size={14} fill="currentColor" /> Detener
            </button>
          </div>
        )}

        {audioUrl && !isRecording && (
          <div className="w-full flex items-center justify-between bg-zinc-900 border border-zinc-700/80 p-3 rounded-xl">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={togglePlayback}
                className="w-9 h-9 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center transition-all shadow-md"
              >
                {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
              <div className="text-left">
                <p className="text-xs font-bold text-white">Mensaje de voz listo</p>
                <p className="text-[10px] text-zinc-400">Toca para reproducir</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isUploading ? (
                <div className="flex items-center gap-1 text-[11px] text-zinc-400 font-medium">
                  <Loader2 size={14} className="animate-spin text-red-500" /> Subiendo...
                </div>
              ) : (
                <button
                  type="button"
                  onClick={clearAudio}
                  className="p-2 text-zinc-400 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800"
                  title="Eliminar y grabar de nuevo"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* BOTÓN SUBIR ARCHIVO */}
        {!isRecording && !audioUrl && (
          <label className="w-full sm:w-auto px-5 py-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-95">
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span>O subir audio</span>
            <input
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        )}
      </div>
    </div>
  );
}
