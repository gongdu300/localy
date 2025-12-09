/**
 * 실시간 TTS WebSocket Hook
 */
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseRealtimeTTSOptions {
    onTextChunk: (chunk: string) => void;
    onComplete: (fullText: string) => void;
    onError: (error: string) => void;
}

interface WSMessage {
    type: 'text_chunk' | 'audio_chunk' | 'complete' | 'error' | 'language_detected';
    content: string;
    use_tts?: boolean;
}

export function useRealtimeTTS(options: UseRealtimeTTSOptions) {
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<AudioBufferSourceNode[]>([]);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isConnected, setIsConnected] = useState(false);

    // Callbacks ref to ensure latest version is called
    const optionsRef = useRef(options);

    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // AudioContext 초기화
    useEffect(() => {
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playAudioChunk = useCallback(async (base64Audio: string) => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            const audioData = atob(base64Audio);
            const audioArray = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
            }

            const audioBuffer = await audioContextRef.current.decodeAudioData(audioArray.buffer);
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.start();
            audioQueueRef.current.push(source);
            setIsPlaying(true);

            source.onended = () => {
                audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);
                if (audioQueueRef.current.length === 0) {
                    setIsPlaying(false);
                }
            };
        } catch (err) {
            console.error('Audio playback error:', err);
        }
    }, []);

    // Persistent WebSocket Connection
    useEffect(() => {
        console.log('🔌 Connecting to WebSocket...');
        const ws = new WebSocket('ws://localhost:8000/api/ws/chat');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);
        };

        ws.onmessage = async (event) => {
            const data: WSMessage = JSON.parse(event.data);
            const currentOptions = optionsRef.current; // Use latest callbacks

            if (data.type === 'language_detected') {
                console.log(`🌐 Language detected: ${data.content}, TTS: ${data.use_tts}`);
            }

            if (data.type === 'text_chunk') {
                currentOptions.onTextChunk(data.content);
            }

            if (data.type === 'audio_chunk') {
                console.log('🎤 Received audio chunk');
                await playAudioChunk(data.content);
            }

            if (data.type === 'complete') {
                console.log('✅ Response complete');
                currentOptions.onComplete(data.content);
                // Do NOT close connection here
            }

            if (data.type === 'error') {
                console.error('❌ WebSocket error:', data.content);
                currentOptions.onError(data.content);
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error event:', error);
            optionsRef.current.onError('WebSocket connection failed');
            setIsConnected(false);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket closed');
            setIsConnected(false);
        };

        return () => {
            console.log('🧹 Cleaning up WebSocket...');
            ws.close();
        };
    }, []); // Run once on mount

    const sendMessage = useCallback((message: string, character: string = 'otter') => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                message,
                character
            }));
        } else {
            console.error('WebSocket is not connected');
            optionsRef.current.onError('Connection lost. Please try again.');
        }
    }, []);

    const stopAudio = useCallback(() => {
        audioQueueRef.current.forEach(source => {
            try { source.stop(); } catch (e) { }
        });
        audioQueueRef.current = [];
        setIsPlaying(false);
    }, []);

    const disconnect = useCallback(() => {
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }
        stopAudio();
    }, [stopAudio]);

    return {
        sendMessage,
        isPlaying,
        isConnected,
        stopAudio,
        disconnect
    };
}
