import React, { useState, useEffect, useRef } from 'react';
import { Mic, Square, Loader2, RefreshCw } from 'lucide-react';

interface VoiceRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  initialText?: string;
  placeholder?: string;
}

// Declaraciones para Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceRecorder({ onTranscriptionComplete, initialText = '', placeholder = "Ej: Mi papá es increíble..." }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState(initialText);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Inicializar SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'es-MX'; // Español por defecto

    recognition.onstart = () => {
      setIsRecording(true);
      setError(null);
    };

    recognition.onresult = (event: any) => {
      let currentInterim = '';
      let currentFinal = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          currentFinal += event.results[i][0].transcript + ' ';
        } else {
          currentInterim += event.results[i][0].transcript;
        }
      }

      if (currentFinal) {
        setTranscript(prev => {
          const newText = prev + currentFinal;
          onTranscriptionComplete(newText);
          return newText;
        });
      }
      setInterimTranscript(currentInterim);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error !== 'no-speech') {
        setError('Error con el micrófono. Por favor asegúrate de haber dado los permisos o intenta escribiendo.');
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Actualizar el estado final si quedó algo flotando
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscriptionComplete]);

  const toggleRecording = () => {
    if (!isSupported) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error(e);
        // Fallback si ya estaba iniciado u otro error
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTranscript(val);
    onTranscriptionComplete(val);
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    onTranscriptionComplete('');
    if (isRecording) recognitionRef.current?.stop();
  };

  return (
    <div className="w-full space-y-4">
      {isSupported && (
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={toggleRecording}
            className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 shadow-xl ${
              isRecording 
                ? 'bg-red-500 hover:bg-red-600 scale-110 shadow-red-500/40' 
                : 'bg-naranja-500 hover:bg-naranja-600 hover:scale-105 shadow-naranja-500/40'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="text-white animate-pulse" size={32} fill="currentColor" />
                <span className="absolute -inset-4 rounded-full border-4 border-red-500 opacity-20 animate-ping"></span>
                <span className="absolute -inset-8 rounded-full border-2 border-red-500 opacity-10 animate-ping" style={{ animationDelay: '200ms' }}></span>
              </>
            ) : (
              <Mic className="text-white" size={36} />
            )}
          </button>
          
          <div className="text-center h-6">
            {isRecording ? (
              <span className="text-red-500 font-bold text-sm tracking-widest uppercase flex items-center gap-2 justify-center animate-pulse">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Escuchando...
              </span>
            ) : (
              <span className="text-ink-500 font-medium text-sm">
                Toca para grabar tu historia
              </span>
            )}
          </div>
          
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      )}

      {!isSupported && (
        <div className="bg-amber-50 text-amber-800 p-3 rounded-xl text-xs font-medium border border-amber-200">
          Tu navegador no soporta notas de voz. Por favor, escribe tu historia abajo.
        </div>
      )}

      <div className="relative">
        <textarea
          ref={textareaRef}
          value={transcript + interimTranscript}
          onChange={handleTextChange}
          placeholder={placeholder}
          className="w-full h-40 p-4 border-2 border-naranja-100 rounded-2xl focus:border-naranja-500 focus:ring-0 resize-none font-medium text-ink-800 placeholder:text-ink-300 transition-all bg-white"
        />
        
        {(transcript || interimTranscript) && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute top-3 right-3 text-ink-400 hover:text-red-500 bg-white rounded-full p-1 shadow-sm border border-blush-50 transition-colors"
            title="Borrar texto"
          >
            <RefreshCw size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
