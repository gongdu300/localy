import { motion, AnimatePresence } from 'motion/react';
import { Plus, Bot, Map, X } from 'lucide-react';
import { useState } from 'react';

interface FloatingActionButtonProps {
    onAIClick: () => void;
    onMapClick: () => void;
}

export function FloatingActionButton({ onAIClick, onMapClick }: FloatingActionButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
    };

    // 옵션 버튼 공통 스타일
    const optionButtonStyle: React.CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 24px', // 패딩을 조금 더 키워 시원한 느낌
        borderRadius: '30px', // 둥글기를 살짝 줄여 모던하게
        border: 'none',
        color: 'white',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        backdropFilter: 'blur(10px)', // 트렌디한 블러 효과 추가
    };

    return (
        <div style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column-reverse',
            alignItems: 'center',
            gap: '20px', // 간격 조정
            zIndex: 999
        }}>
            {/* Main FAB Button (항상 맨 아래에 위치) */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleMenu}
                // 회전 애니메이션 제거
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '18px 36px',
                    borderRadius: '40px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    boxShadow: '0 10px 30px -10px rgba(45, 139, 95, 0.6)', // 더 부드럽고 깊은 그림자
                    position: 'relative',
                    zIndex: 10
                }}
            >
                {/* 아이콘 교체 애니메이션 (회전 대신 부드러운 전환) */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={isOpen ? 'close' : 'open'}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                    >
                        {isOpen ? <X size={28} strokeWidth={3} /> : <Plus size={28} strokeWidth={3} />}
                    </motion.div>
                </AnimatePresence>
                <motion.span
                    animate={{
                        opacity: isOpen ? 0 : 1,
                        width: isOpen ? 0 : 'auto',
                        marginLeft: isOpen ? 0 : '12px'
                    }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{
                        overflow: 'hidden',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {!isOpen && '새 여행 추가하기'}
                </motion.span>
            </motion.button>

            {/* 옵션 버튼들 (메인 버튼 위에 나타남) */}
            <AnimatePresence>
                {isOpen && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column-reverse',
                        gap: '16px',
                        marginBottom: '10px',
                        alignItems: 'center'
                    }}>
                        {/* Option 2: 직접 추가하기 (지도) - 트렌디한 피치-코랄 톤 */}
                        <motion.button
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: 0.05, type: "spring", stiffness: 300, damping: 25 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                onMapClick();
                                setIsOpen(false);
                            }}
                            style={{
                                ...optionButtonStyle,
                                background: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 55%, #FF99AC 100%)', // 트렌디한 피치-코랄 그라데이션
                                boxShadow: '0 8px 25px -8px rgba(255, 106, 136, 0.5)',
                            }}
                        >
                            <Map size={22} strokeWidth={2.5} />
                            직접 추가하기
                        </motion.button>

                        {/* Option 1: AI와 함께 만들기 - 세련된 블루-퍼플 톤 */}
                        <motion.button
                            initial={{ opacity: 0, y: 20, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.9 }}
                            transition={{ duration: 0.3, delay: 0.1, type: "spring", stiffness: 300, damping: 25 }}
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                onAIClick();
                                setIsOpen(false);
                            }}
                            style={{
                                ...optionButtonStyle,
                                background: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)', // 세련된 블루-퍼플 파스텔 그라데이션
                                boxShadow: '0 8px 25px -8px rgba(142, 197, 252, 0.5)',
                            }}
                        >
                            <Bot size={22} strokeWidth={2.5} />
                            AI와 함께 만들기
                        </motion.button>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}