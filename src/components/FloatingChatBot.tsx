import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';
import { Message as AIMessage } from '../utils/aiApi';
import catImage from '../assets/cat.jpg';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface ChatMessage {
    id: number;
    text: string;
    sender: 'user' | 'cat';
    timestamp: Date;
}

export function FloatingChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 1,
            text: '야, 뭐 물어볼 거 있냐냥? 귀찮지만... 말해보라냥.',
            sender: 'cat',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [conversationHistory, setConversationHistory] = useState<AIMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage: ChatMessage = {
            id: messages.length + 1,
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        const userInput = inputText;
        setInputText('');
        setIsLoading(true);

        try {
            // LangGraph 멀티에이전트 시스템 호출
            const response = await fetch(`${API_BASE_URL}/api/langgraph/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userInput,
                    conversation_history: conversationHistory
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const catMessage: ChatMessage = {
                id: messages.length + 2,
                text: data.response,
                sender: 'cat',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, catMessage]);

            setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: userInput },
                { role: 'assistant', content: data.response }
            ]);

        } catch (error) {
            console.error('LangGraph AI 응답 실패:', error);

            const fallback: ChatMessage = {
                id: messages.length + 2,
                text: '...서버가 응답 안 하다냥. 나중에 다시 물어보라냥.',
                sender: 'cat',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, fallback]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* 플로팅 버튼 */}
            <AnimatePresence>
                {!isOpen && (
                    <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsOpen(true)}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            border: 'none',
                            boxShadow: '0 8px 24px rgba(243, 156, 18, 0.4)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            zIndex: 9999
                        }}
                    >
                        <MessageCircle size={32} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* 챗봇 창 */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            position: 'fixed',
                            bottom: '24px',
                            right: '24px',
                            width: '380px',
                            height: '600px',
                            maxHeight: '80vh',
                            background: '#fff',
                            borderRadius: '24px',
                            boxShadow: '0 12px 48px rgba(0,0,0,0.2)',
                            zIndex: 9999,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* 헤더 */}
                        <div style={{
                            background: 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)',
                            padding: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img
                                    src={catImage}
                                    alt="까칠이"
                                    style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        border: '2px solid white'
                                    }}
                                />
                                <div>
                                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
                                        까칠이 (LangGraph)
                                    </div>
                                    <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
                                        {isLoading ? 'GPT-4 처리중...' : '온라인'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white'
                                }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* 메시지 영역 */}
                        <div style={{
                            flex: 1,
                            overflowY: 'auto',
                            padding: '20px',
                            background: '#fef9e7',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                        }}>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    style={{
                                        display: 'flex',
                                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{
                                        maxWidth: '75%',
                                        padding: '12px 16px',
                                        borderRadius: '16px',
                                        background: message.sender === 'user'
                                            ? 'linear-gradient(135deg, #2D8B5F 0%, #3DAF7A 100%)'
                                            : '#fff',
                                        color: message.sender === 'user' ? '#fff' : '#333',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        whiteSpace: 'pre-wrap'
                                    }}>
                                        {message.text}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 입력 영역 */}
                        <div style={{
                            padding: '16px',
                            background: '#fff',
                            borderTop: '2px solid rgba(243, 156, 18, 0.2)',
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center'
                        }}>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder={isLoading ? "까칠이가 생각중이다냥..." : "메시지를 입력하세요..."}
                                disabled={isLoading}
                                style={{
                                    flex: 1,
                                    padding: '12px 16px',
                                    borderRadius: '24px',
                                    border: '2px solid rgba(243, 156, 18, 0.3)',
                                    fontSize: '14px',
                                    outline: 'none',
                                    background: isLoading ? '#f5f5f5' : '#fef9e7',
                                    cursor: isLoading ? 'not-allowed' : 'text',
                                    opacity: isLoading ? 0.6 : 1
                                }}
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || isLoading}
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: (inputText.trim() && !isLoading)
                                        ? 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)'
                                        : '#ddd',
                                    color: '#fff',
                                    cursor: (inputText.trim() && !isLoading) ? 'pointer' : 'not-allowed',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: (inputText.trim() && !isLoading) ? '0 4px 12px rgba(243, 156, 18, 0.3)' : 'none'
                                }}
                            >
                                {isLoading ? '...' : <Send size={20} />}
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
