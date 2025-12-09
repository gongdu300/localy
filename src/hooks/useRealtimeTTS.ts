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

    // AudioContext 초기화
    useEffect(() => {
        // AudioContext는 사용자 상호작용 후 생성
        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    const playAudioChunk = useCallback(async (base64Audio: string) => {
        try {
            // AudioContext 초기화 (첫 재생 시)
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioContext();
            }

            // Base64 → ArrayBuffer
            const audioData = atob(base64Audio);
            const audioArray = new Uint8Array(audioData.length);
            for (let i = 0; i < audioData.length; i++) {
                audioArray[i] = audioData.charCodeAt(i);
            }

            // WAV 디코딩
            const audioBuffer = await audioContextRef.current.decodeAudioData(
                audioArray.buffer
            );

            // 즉시 재생
            const source = audioContextRef.current.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            source.start();
            audioQueueRef.current.push(source);

            setIsPlaying(true);

            source.onended = () => {
                // 큐에서 제거
                audioQueueRef.current = audioQueueRef.current.filter(s => s !== source);

                // 모든 오디오 재생 완료
                if (audioQueueRef.current.length === 0) {
                    setIsPlaying(false);
                }
            };

            console.log('🔊 Audio playing...');
        } catch (err) {
            console.error('Audio playback error:', err);
        }
    }, []);

    const sendMessage = useCallback((message: string, character: string = 'otter') => {
        // WebSocket 연결
        const ws = new WebSocket('ws://localhost:8000/api/ws/chat');
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            setIsConnected(true);

            // 메시지 전송
            ws.send(JSON.stringify({
                message,
                character
            }));
        };

        ws.onmessage = async (event) => {
            const data: WSMessage = JSON.parse(event.data);

            if (data.type === 'language_detected') {
                console.log(`🌐 Language detected: ${data.content}, TTS: ${data.use_tts}`);
            }

            if (data.type === 'text_chunk') {
                options.onTextChunk(data.content);
            }

            if (data.type === 'audio_chunk') {
                console.log('🎤 Received audio chunk');
                await playAudioChunk(data.content);
            }

            if (data.type === 'complete') {
                console.log('✅ Response complete');
                options.onComplete(data.content);
                ws.close();
            }

            if (data.type === 'error') {
                console.error('❌ WebSocket error:', data.content);
                options.onError(data.content);
                ws.close();
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket error:', error);
            options.onError('WebSocket connection failed');
            setIsConnected(false);
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket closed');
            setIsConnected(false);
        };
    }, [options, playAudioChunk]);

    const stopAudio = useCallback(() => {
        // 모든 오디오 중지
        audioQueueRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Already stopped
            }
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
