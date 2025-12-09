import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Send, MapPin } from 'lucide-react';
import catImage from '../assets/cat.jpg';
import dogImage from '../assets/dog.png';
import otterImage from '../assets/otter.png';
import { DateRangePicker } from './DateRangePicker';
import { MapScreen } from './MapScreen';
import { useRealtimeTTS } from '../hooks/useRealtimeTTS';
// import { api } from '../utils/api'; // Unused

interface TravelChatBotProps {
    character: 'cat' | 'dog' | 'otter';
    onClose: () => void;
    onComplete: (data: TravelData) => void;
}

interface TravelData {
    participants: number;
    startDate: string;
    endDate: string;
    region: string;
    placeName?: string;
    schedules?: Array<{ day: number; date: string; destination: string; places: any[] }>;
}

interface Message {
    type: 'cat' | 'user';
    content: string | React.ReactNode;
    timestamp: Date;
}

type Step = 'participants' | 'dates' | 'region' | 'day-selection' | 'complete';

const CHARACTER_CONFIG = {
    cat: {
        name: '까칠냥',
        image: catImage,
        greeting: '안녕하냥! 🐱\n나는 똑부러진 여행 플래너 까칠냥이야!',
        question: '어디로 놀러가고 싶냥? (예: 강릉, 부산)'
    },
    dog: {
        name: '순둥멍',
        image: dogImage,
        greeting: '안녕하멍! 🐶\n나는 다정한 여행 친구 순둥멍이야!',
        question: '어디로 놀러가고 싶어요? (예: 강릉, 부산)'
    },
    otter: {
        name: '엉뚱수달',
        image: otterImage,
        greeting: '안녕하세달! 🦦\n저는 엉뚱한 여행 도우미 수달이에요!',
        question: '어디로 놀러가고 싶으신가요? (예: 강릉, 부산)'
    }
};

export function TravelChatBot({ character, onClose, onComplete }: TravelChatBotProps) {
    const [step, setStep] = useState<Step>('participants');
    const config = CHARACTER_CONFIG[character];
    const [messages, setMessages] = useState<Message[]>([
        {
            type: 'cat',
            content: config.greeting,
            timestamp: new Date()
        },
        {
            type: 'cat',
            content: config.question,
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [travelData, setTravelData] = useState<Partial<TravelData>>({});
    const [selectedDestination, setSelectedDestination] = useState<{ name: string; address: string; lat: number; lng: number } | null>(null);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Day-by-day planning state
    const [totalDays, setTotalDays] = useState(0);
    const [currentDay, setCurrentDay] = useState(1);
    const [daySchedules, setDaySchedules] = useState<Array<{ day: number; date: string; destination: string; places: any[] }>>([]);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [recommendations] = useState<Array<{ name: string; address: string; lat: number; lng: number }>>([]);

    // Real-time response state
    const [streamingResponse, setStreamingResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // WebSocket TTS Hook
    const { isPlaying, isConnected, sendMessage } = useRealtimeTTS({
        onTextChunk: (chunk) => {
            setStreamingResponse(prev => prev + chunk);
        },
        onComplete: (fullText) => {
            console.log('✅ Response complete:', fullText);
            // 완료 시 스트리밍 리셋
            setStreamingResponse('');
        },
        onError: (error) => {
            console.error('❌ Error:', error);
            setMessages(prev => prev.slice(0, -1));
            addMessage('cat', '죄송해요, 연결에 문제가 생겼어요. 😿');
            setStreamingResponse('');
            setIsLoading(false);
        }
    });

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 스트리밍 응답 업데이트 시 마지막 메시지 갱신
    useEffect(() => {
        if (streamingResponse && isLoading) {
            setMessages(prev => {
                const lastMsg = prev[prev.length - 1];
                if (lastMsg && lastMsg.type === 'cat') {
                    return [...prev.slice(0, -1), { type: 'cat', content: streamingResponse, timestamp: new Date() }];
                }
                return prev;
            });
        }
    }, [streamingResponse, isLoading]);

    const addMessage = (type: 'cat' | 'user', content: string | React.ReactNode) => {
        setMessages(prev => [...prev, { type, content, timestamp: new Date() }]);
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userInput = input.trim();
        setInput('');
        addMessage('user', userInput);
        setIsLoading(true);
        setStreamingResponse('');

        // 빈 봇 메시지 추가 (스트리밍으로 채워질 예정)
        addMessage('cat', '');

        try {
            sendMessage(userInput, character);
        } catch (error) {
            console.error('WebSocket error:', error);
            setMessages(prev => prev.slice(0, -1));
            addMessage('cat', '죄송해요, 연결에 문제가 생겼어요. 😿');
            setIsLoading(false);
        }
    };

    const handleDateConfirm = () => {
        if (!startDate || !endDate) {
            return;
        }

        if (new Date(startDate) > new Date(endDate)) {
            return;
        }

        // Calculate total days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setTotalDays(diffDays);

        addMessage('user', `${startDate} ~ ${endDate}`);
        setTravelData(prev => ({ ...prev, startDate, endDate }));

        setTimeout(() => {
            addMessage('cat', `${startDate}부터 ${endDate}까지이군요! 🗓️`);
            setTimeout(() => {
                addMessage('cat', '어디로 여행 가시나요?\n(예: 부산, 경기도, 제주 등)');
                setStep('region');
            }, 800);
        }, 500);
    };

    const handleDestinationSelect = (destination: { name: string; address: string; lat: number; lng: number }) => {
        setSelectedDestination(destination);
        // Don't open MapScreen immediately - just show preview
    };

    const getDateForDay = (day: number) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + day - 1);
        const month = date.getMonth() + 1;
        const dayOfMonth = date.getDate();
        return `${month}월 ${dayOfMonth}일`;
    };

    const handleDayScheduleSave = (mapTravelData: any) => {
        const start = new Date(startDate);
        const currentDate = new Date(start);
        currentDate.setDate(start.getDate() + currentDay - 1);
        const dateStr = currentDate.toISOString().split('T')[0];

        const daySchedule = {
            day: currentDay,
            date: dateStr,
            destination: selectedDestination?.name || '',
            places: mapTravelData.places || []
        };

        const updatedSchedules = [...daySchedules, daySchedule].sort((a, b) => a.day - b.day);
        setDaySchedules(updatedSchedules);

        setIsMapOpen(false);
        setSelectedDestination(null);

        // Move to next day or complete
        if (currentDay < totalDays) {
            const nextDay = currentDay + 1;
            setCurrentDay(nextDay);

            addMessage('user', `Day ${currentDay}: ${selectedDestination?.name}`);
            setTimeout(() => {
                addMessage('cat', `Day ${nextDay}의 여행지를 선택해주세요!`);

                // Show recommendations again for next day
                setTimeout(() => {
                    addMessage('cat',
                        <div>
                            <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: '600' }}>
                                {travelData.region} 지역의 추천 여행지
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {recommendations.map((dest, index) => (
                                    <motion.button
                                        key={index}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => handleDestinationSelect(dest)}
                                        style={{
                                            padding: '14px 16px',
                                            borderRadius: '12px',
                                            border: '2px solid #2D8B5F',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '10px'
                                        }}
                                    >
                                        <MapPin size={20} color="#2D8B5F" style={{ marginTop: '2px', flexShrink: 0 }} />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '15px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                                {dest.name}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#666', lineHeight: '1.4' }}>
                                                {dest.address}
                                            </div>
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    );
                }, 500);
            }, 500);
        } else {
            // Last day completed - save trip
            addMessage('user', `Day ${currentDay}: ${selectedDestination?.name}`);
            setTimeout(() => {
                addMessage('cat', '모든 날짜의 여행지가 선택되었어요! 멋진 여행이 될 것 같아요! 🎉');

                setTimeout(() => {
                    // Complete with all schedules
                    if (travelData.participants && startDate && endDate && travelData.region) {
                        onComplete({
                            participants: travelData.participants,
                            startDate,
                            endDate,
                            region: travelData.region,
                            placeName: updatedSchedules[0]?.destination || '',
                            schedules: updatedSchedules  // Pass all day schedules
                        });
                    }
                    onClose();
                }, 1500);
            }, 800);
        }
    };

    // Render MapScreen if open
    if (isMapOpen && selectedDestination) {
        const dayDate = getDateForDay(currentDay);
        return (
            <MapScreen
                onClose={() => setIsMapOpen(false)}
                onScheduleSave={handleDayScheduleSave}
                initialLocation={selectedDestination}
                tripData={{
                    destination: selectedDestination.name,
                    participants: travelData.participants || 1,
                    startDate: dayDate,
                    endDate: dayDate
                }}
            />
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                zIndex: 4000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    height: '100%',
                    maxHeight: '90vh',  // Limit height to 90% viewport on mobile
                    backgroundColor: '#FFF5E6',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                {/* 뒤로가기 버튼 - 좌측 상단 */}
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        left: '20px',
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: 'rgba(255, 255, 255, 0.3)',
                        backdropFilter: 'blur(10px)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 100,
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}
                >
                    <ArrowLeft size={24} color="#333" />
                </motion.button>

                {/* 고양이 이미지 영역 */}
                <motion.div
                    initial={{ y: -30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }}
                    style={{
                        padding: '0',
                        textAlign: 'center',
                        background: 'transparent'
                    }}
                >
                    <motion.img
                        src={config.image}
                        alt={config.name}
                        animate={{
                            y: [0, -5, 0],
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                        style={{
                            width: '100%',
                            height: '280px',
                            objectFit: 'cover',
                            objectPosition: 'center',
                            display: 'block'
                        }}
                    />
                </motion.div>

                {/* 채팅 영역 */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'rgba(255, 255, 255, 0.5)',
                    borderTopLeftRadius: '30px',
                    borderTopRightRadius: '30px',
                    minHeight: 0  // Allow flex item to shrink below content size
                }}>
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    alignSelf: message.type === 'cat' ? 'flex-start' : 'flex-end',
                                    maxWidth: '80%'
                                }}
                            >
                                <div style={{
                                    padding: '12px 16px',
                                    borderRadius: message.type === 'cat' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                                    backgroundColor: message.type === 'cat' ? 'white' : '#2D8B5F',
                                    color: message.type === 'cat' ? '#333' : 'white',
                                    fontSize: '14px',
                                    lineHeight: '1.5',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {message.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                </div>

                {/* 지도 미리보기 */}
                <AnimatePresence>
                    {selectedDestination && (
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            style={{
                                position: 'absolute',
                                bottom: 80,
                                left: 0,
                                right: 0,
                                height: '400px',
                                backgroundColor: 'white',
                                borderTopLeftRadius: '20px',
                                borderTopRightRadius: '20px',
                                boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
                                display: 'flex',
                                flexDirection: 'column',
                                zIndex: 200
                            }}
                        >
                            {/* 헤더 */}
                            <div style={{
                                padding: '16px 20px',
                                borderBottom: '1px solid #eee'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '700', color: '#333', marginBottom: '4px' }}>
                                    {selectedDestination.name}
                                </h3>
                                <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                                    {selectedDestination.address}
                                </p>
                            </div>

                            {/* 지도 */}
                            <div style={{ flex: 1, padding: '12px' }}>
                                <iframe
                                    src={`https://www.google.com/maps?q=${selectedDestination.lat},${selectedDestination.lng}&hl=ko&z=14&output=embed`}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        border: 'none',
                                        borderRadius: '12px'
                                    }}
                                />
                            </div>

                            {/* 버튼들 */}
                            <div style={{
                                padding: '12px 16px 16px',
                                display: 'flex',
                                gap: '10px'
                            }}>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedDestination(null)}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: '2px solid #e0e0e0',
                                        backgroundColor: 'white',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        color: '#666'
                                    }}
                                >
                                    닫기
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => {
                                        // Open MapScreen when 선택 button is clicked
                                        setIsMapOpen(true);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '14px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 8px rgba(45, 139, 95, 0.3)'
                                    }}
                                >
                                    선택
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 입력 필드 / 날짜 선택 UI */}
                <div style={{
                    padding: '16px 20px',
                    paddingBottom: step === 'dates' ? '20px' : '16px',  // Extra bottom padding for dates
                    backgroundColor: 'white',
                    borderTop: '1px solid #eee',
                    maxHeight: step === 'dates' ? '50vh' : 'auto',  // Reduced from 60vh to 50vh
                    overflowY: step === 'dates' ? 'auto' : 'visible',
                    flexShrink: 0
                }}>
                    {step === 'dates' ? (
                        // 날짜 선택 UI
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            <DateRangePicker
                                startDate={startDate}
                                endDate={endDate}
                                onDateSelect={(start, end) => {
                                    setStartDate(start);
                                    setEndDate(end);
                                }}
                                minDate={new Date().toISOString().split('T')[0]}
                            />

                            {/* 확인 버튼 */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleDateConfirm}
                                disabled={!startDate || !endDate}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: startDate && endDate
                                        ? 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)'
                                        : '#e0e0e0',
                                    color: 'white',
                                    fontSize: '15px',
                                    fontWeight: '600',
                                    cursor: startDate && endDate ? 'pointer' : 'not-allowed',
                                    boxShadow: startDate && endDate ? '0 2px 8px rgba(45, 139, 95, 0.3)' : 'none'
                                }}
                            >
                                날짜 확인
                            </motion.button>
                        </div>
                    ) : step === 'day-selection' ? (
                        // 여행지 선택 중 - 텍스트 입력 숨김
                        <div style={{
                            padding: '16px',
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            위 목록에서 여행지를 선택해주세요
                        </div>
                    ) : (
                        // 일반 텍스트 입력 UI
                        <div style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="메시지를 입력하세요..."
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '24px',
                                    border: '2px solid #eee',
                                    fontSize: '14px',
                                    outline: 'none',
                                    fontFamily: 'inherit'
                                }}
                            />
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={handleSend}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    backgroundColor: '#2D8B5F',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={20} color="white" />
                            </motion.button>
                        </div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
