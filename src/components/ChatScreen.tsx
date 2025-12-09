import { motion } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import catImage from '../assets/cat.jpg';

const myUrl = window.location.protocol + "//" + window.location.hostname + ":8000";

interface ChatScreenProps {
    userName: string;
    onComplete: (characterData?: {
        character: 'cat' | 'dog' | 'otter';
        mbtiTraits: { type_e: string; type_j: string };
        reason: string;
    }) => void;
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'cat';
    timestamp: Date;
}

type QuestionStep =
    | 'like_food' | 'hate_food' | 'theme' | 'like_region' | 'avoid_region'
    | 'transportation' | 'budget' | 'accommodation'
    | 'planning' | 'social' | 'detail_focus' | 'decision_style' | 'energy_source' | 'preparation'
    | 'analyzing' | 'complete';

interface QuestionConfig {
    question: string;
    options: string[];
    fieldName: string;
    questionType: 'food' | 'theme' | 'region' | 'transportation' | 'budget' | 'accommodation';
}

const QUESTIONS: Record<QuestionStep, QuestionConfig | null> = {
    like_food: {
        question: "좋아하는 음식이 뭐야? 🍽️",
        options: ["한식", "양식", "중식", "일식"],
        fieldName: "persona_like_food",
        questionType: "food"
    },
    hate_food: {
        question: "못 먹는 음식이 있어?",
        options: ["매운 음식", "생선", "채소", "없음"],
        fieldName: "persona_hate_food",
        questionType: "food"
    },
    theme: {
        question: "어떤 여행 테마를 좋아해? 🎨",
        options: ["자연 탐방", "문화 체험", "맛집 투어", "액티비티"],
        fieldName: "persona_theme",
        questionType: "theme"
    },
    like_region: {
        question: "가보고 싶은 지역은? 🗺️",
        options: ["서울", "부산", "제주", "강원도"],
        fieldName: "persona_like_region",
        questionType: "region"
    },
    avoid_region: {
        question: "피하고 싶은 지역이 있어?",
        options: ["복잡한 도시", "외딴 시골", "섬 지역", "없음"],
        fieldName: "persona_avoid_region",
        questionType: "region"
    },
    transportation: {
        question: "선호하는 이동 수단은? 🚗",
        options: ["대중교통", "렌터카", "택시/카풀", "도보"],
        fieldName: "persona_transportation",
        questionType: "transportation"
    },
    budget: {
        question: "1박 예산은 얼마나 생각해? 💰",
        options: ["10만원 이하", "30만원", "50만원", "제한 없음"],
        fieldName: "persona_travel_budget",
        questionType: "budget"
    },
    accommodation: {
        question: "어떤 숙소를 선호해? 🏨",
        options: ["호텔", "펜션", "게스트하우스", "에어비앤비"],
        fieldName: "persona_accommodation_type",
        questionType: "accommodation"
    },
    planning: null,  // 이미 moveToNextStep에서 처리
    social: null,    // 이미 moveToNextStep에서 처리
    detail_focus: null,  // moveToNextStep에서 처리
    decision_style: null,  // moveToNextStep에서 처리
    energy_source: null,  // moveToNextStep에서 처리
    preparation: null,  // moveToNextStep에서 처리
    analyzing: null,
    complete: null
};

const STEP_ORDER: QuestionStep[] = [
    'like_food', 'hate_food', 'theme', 'like_region', 'avoid_region',
    'transportation', 'budget', 'accommodation',
    'planning', 'social', 'detail_focus', 'decision_style', 'energy_source', 'preparation',
    'analyzing', 'complete'
];

export function ChatScreen({ userName, onComplete }: ChatScreenProps) {
    const [currentStep, setCurrentStep] = useState<QuestionStep>('like_food');
    const [messages, setMessages] = useState<Message[]>([
        {
            id: 1,
            text: `안녕하세요, ${userName} 님! 👋\n저는 여행 도우미 ?이에요!`,
            sender: 'cat',
            timestamp: new Date()
        },
        {
            id: 2,
            text: '좋아하는 음식이 뭐야? 🍽️',
            sender: 'cat',
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [showOtherInput, setShowOtherInput] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [personaData, setPersonaData] = useState<Record<string, string>>({});
    const [planningAnswer, setPlanningAnswer] = useState('');
    const [socialAnswer, setSocialAnswer] = useState('');
    const [detailFocusAnswer, setDetailFocusAnswer] = useState('');
    const [decisionStyleAnswer, setDecisionStyleAnswer] = useState('');
    const [energySourceAnswer, setEnergySourceAnswer] = useState('');
    const [preparationAnswer, setPreparationAnswer] = useState('');

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const parseAnswer = async (questionType: string, userInput: string): Promise<string> => {
        try {
            const response = await fetch(`${myUrl}/api/parse-answer`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question_type: questionType,
                    user_input: userInput
                })
            });
            const result = await response.json();
            return result.success ? result.parsed_text : userInput;
        } catch (e) {
            console.error('Parse error:', e);
            return userInput;
        }
    };

    const handleOptionSelect = async (option: string) => {
        const config = QUESTIONS[currentStep];
        if (!config) return;

        const userMessage: Message = {
            id: messages.length + 1,
            text: option,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        setPersonaData(prev => ({
            ...prev,
            [config.fieldName]: option
        }));

        moveToNextStep();
    };

    const handleOtherSubmit = async () => {
        if (!inputText.trim()) return;

        const config = QUESTIONS[currentStep];
        if (!config) return;

        const userMessage: Message = {
            id: messages.length + 1,
            text: inputText,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        const parsedAnswer = await parseAnswer(config.questionType, inputText);

        setPersonaData(prev => ({
            ...prev,
            [config.fieldName]: parsedAnswer
        }));

        setInputText('');
        setShowOtherInput(false);
        moveToNextStep();
    };

    const handleMBTIAnswer = (answer: string) => {
        const userMessage: Message = {
            id: messages.length + 1,
            text: answer,
            sender: 'user',
            timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);

        if (currentStep === 'planning') {
            setPlanningAnswer(answer);
        } else if (currentStep === 'social') {
            setSocialAnswer(answer);
        } else if (currentStep === 'detail_focus') {
            setDetailFocusAnswer(answer);
        } else if (currentStep === 'decision_style') {
            setDecisionStyleAnswer(answer);
        } else if (currentStep === 'energy_source') {
            setEnergySourceAnswer(answer);
        } else if (currentStep === 'preparation') {
            setPreparationAnswer(answer);
        }

        setInputText('');
        moveToNextStep();
    };

    const moveToNextStep = () => {
        const currentIndex = STEP_ORDER.indexOf(currentStep);
        const nextStep = STEP_ORDER[currentIndex + 1];

        setTimeout(() => {
            let catResponse = '';

            if (nextStep === 'planning') {
                catResponse = '좋아요! 이제 당신의 여행 스타일을 알아볼게요! 🎒\n\n여행 계획을 세울 때, 분 단위로 짜는 편이야? 아니면 그때그때 발길 닿는 대로?';
            } else if (nextStep === 'social') {
                catResponse = '음... 재밌네요! 🤔\n\n사람 많고 북적이는 곳이 좋아? 아니면 한적하고 조용한 곳?';
            } else if (nextStep === 'detail_focus') {
                catResponse = '거의 다 왔어요! 조금만 더! 💪\n\n여행에서 가장 중요한 건 뭐라고 생각해?';
            } else if (nextStep === 'decision_style') {
                catResponse = '좋아요! 다음 질문~ 🎯\n\n일정 짤 때 뭐가 제일 중요해?';
            } else if (nextStep === 'energy_source') {
                catResponse = '거의 끝났어요! 😊\n\n여행 마지막 날은 어떻게 보내고 싶어?';
            } else if (nextStep === 'preparation') {
                catResponse = '마지막 질문이에요! 🎉\n\n여행 짐 쌀 때는 어떤 스타일이야?';
            } else if (nextStep === 'analyzing') {
                catResponse = '분석 중이에요... 잠시만 기다려주세요! 🤔';
                setTimeout(() => analyzePersona(), 1500);
            } else {
                const nextConfig = QUESTIONS[nextStep];
                if (nextConfig) {
                    catResponse = nextConfig.question;
                }
            }

            if (catResponse) {
                const responseMessage: Message = {
                    id: messages.length + 2,
                    text: catResponse,
                    sender: 'cat',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, responseMessage]);
            }

            setCurrentStep(nextStep);
        }, 800);
    };

    const analyzePersona = async () => {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const user = JSON.parse(userStr);
            const userId = user.user_id;

            const response = await fetch(`${myUrl}/api/analyze-persona`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    planning: planningAnswer,
                    social: socialAnswer,
                    detail_focus: detailFocusAnswer,
                    decision_style: decisionStyleAnswer,
                    energy_source: energySourceAnswer,
                    preparation: preparationAnswer
                })
            });

            const result = await response.json();

            if (response.ok) {
                await savePersonaToBackend(userId);

                onComplete({
                    character: result.character,
                    mbtiTraits: result.mbti_traits,
                    reason: result.reason
                });
            } else {
                console.error('Persona analysis failed:', result);
            }
        } catch (e) {
            console.error('Error analyzing persona:', e);
        }
    };

    const savePersonaToBackend = async (userId: string) => {
        try {
            await fetch(`${myUrl}/auth/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    ...personaData
                })
            });
        } catch (e) {
            console.error('Failed to save persona data:', e);
        }
    };

    const handleSend = () => {
        if (!inputText.trim()) return;

        if (currentStep === 'planning' || currentStep === 'social' ||
            currentStep === 'detail_focus' || currentStep === 'decision_style' ||
            currentStep === 'energy_source' || currentStep === 'preparation') {
            handleMBTIAnswer(inputText);
        } else if (showOtherInput) {
            handleOtherSubmit();
        }
    };

    const currentConfig = QUESTIONS[currentStep];
    const showOptions = currentConfig && !showOtherInput;
    const showTextInput = currentStep === 'planning' || currentStep === 'social' ||
        currentStep === 'detail_focus' || currentStep === 'decision_style' ||
        currentStep === 'energy_source' || currentStep === 'preparation' ||
        showOtherInput;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(45, 139, 95, 0.05) 0%, rgba(59, 164, 116, 0.05) 100%)'
        }}>
            {/* Mobile App Container */}
            <div style={{
                width: '100%',
                maxWidth: '480px',
                height: '100%',
                maxHeight: '800px',
                display: 'flex',
                flexDirection: 'column',
                background: 'white',
                borderRadius: '0',
                boxShadow: '0 0 40px rgba(0,0,0,0.15)',
                overflow: 'hidden'
            }}>
                {/* Header - Mystery Animal Silhouette */}
                <div style={{
                    padding: '40px 20px',
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    {/* Large Mystery Animal Silhouette */}
                    <svg width="160" height="160" viewBox="0 0 200 200" style={{
                        filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.5))'
                    }}>
                        {/* Generic animal silhouette - could be cat, dog, or otter */}
                        <path d="M100,30 C120,30 140,40 150,60 C160,80 165,100 160,120 C155,140 145,150 130,155 C115,160 85,160 70,155 C55,150 45,140 40,120 C35,100 40,80 50,60 C60,40 80,30 100,30 Z"
                            fill="rgba(0,0,0,0.8)" />
                        {/* Ears */}
                        <ellipse cx="70" cy="45" rx="15" ry="25" fill="rgba(0,0,0,0.8)" transform="rotate(-20 70 45)" />
                        <ellipse cx="130" cy="45" rx="15" ry="25" fill="rgba(0,0,0,0.8)" transform="rotate(20 130 45)" />
                        {/* Question mark overlay */}
                        <text x="100" y="130" fontSize="80" fontWeight="900" fill="rgba(255,255,255,0.3)" textAnchor="middle">?</text>
                    </svg>

                    {/* Text */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '22px',
                            marginBottom: '6px',
                            letterSpacing: '0.5px'
                        }}>
                            누가 당신의 여행 파트너가 될까요?
                        </div>
                        <div style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '14px'
                        }}>
                            성향 분석 중...
                        </div>
                    </div>
                </div>

                {/* Messages Area */}
                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    background: 'linear-gradient(135deg, rgba(45, 139, 95, 0.02) 0%, rgba(59, 164, 116, 0.02) 100%)'
                }}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '75%'
                            }}
                        >
                            <div style={{
                                padding: '12px 16px',
                                borderRadius: '16px',
                                background: msg.sender === 'user'
                                    ? 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)'
                                    : 'white',
                                color: msg.sender === 'user' ? 'white' : '#333',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                whiteSpace: 'pre-wrap',
                                fontSize: '15px',
                                lineHeight: '1.5',
                                wordBreak: 'keep-all'
                            }}>
                                {msg.text}
                            </div>
                        </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div style={{
                    padding: '20px',
                    background: 'white',
                    borderTop: '1px solid rgba(45, 139, 95, 0.1)',
                    boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
                }}>
                    {showOptions && (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '10px',
                                marginBottom: '10px'
                            }}>
                                {currentConfig.options.map((option) => (
                                    <motion.button
                                        key={option}
                                        onClick={() => handleOptionSelect(option)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        style={{
                                            padding: '12px',
                                            borderRadius: '12px',
                                            border: '2px solid rgba(45, 139, 95, 0.2)',
                                            background: 'white',
                                            color: '#2D8B5F',
                                            fontSize: '14px',
                                            fontWeight: '600',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {option}
                                    </motion.button>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowOtherInput(true)}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '2px dashed rgba(45, 139, 95, 0.3)',
                                    background: 'transparent',
                                    color: '#2D8B5F',
                                    fontSize: '13px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                ✍️ 직접 입력하기
                            </button>
                        </>
                    )}

                    {showTextInput && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                                placeholder={showOtherInput ? "직접 입력해주세요..." : "답변을 입력하세요..."}
                                style={{
                                    flex: 1,
                                    padding: '14px 16px',
                                    borderRadius: '12px',
                                    border: '2px solid rgba(45, 139, 95, 0.2)',
                                    fontSize: '15px',
                                    outline: 'none'
                                }}
                            />
                            <motion.button
                                onClick={handleSend}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    padding: '14px 20px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <Send size={20} />
                            </motion.button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}