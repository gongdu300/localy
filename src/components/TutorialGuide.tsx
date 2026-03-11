import { motion } from 'motion/react';
import { X, Menu, Plus, Calendar } from 'lucide-react';

interface TutorialGuideProps {
    onClose: () => void;
}

export function TutorialGuide({ onClose }: TutorialGuideProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                backdropFilter: 'blur(8px)',
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '500px',
                    backgroundColor: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '24px',
                    padding: '40px 30px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
                }}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#f0f0f0',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#e0e0e0';
                        e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    <X size={20} color="#666" />
                </button>

                {/* Title */}
                <motion.h2
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{
                        fontSize: '26px',
                        fontWeight: 'bold',
                        color: '#2D8B5F',
                        marginBottom: '24px',
                        textAlign: 'center'
                    }}
                >
                    🌏 서비스 가이드
                </motion.h2>

                {/* Guide Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Item 1 - Logo */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px solid #e9ecef'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <span style={{ fontSize: '24px' }}>🏠</span>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                좌측 상단 로고
                            </h3>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                클릭하면 메인 화면으로 돌아갑니다
                            </p>
                        </div>
                    </motion.div>

                    {/* Item 2 - Menu */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px solid #e9ecef'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #6B9D7A 0%, #7FB08E 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Menu size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                우측 상단 메뉴
                            </h3>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                프로필, 설정 등을 확인할 수 있습니다
                            </p>
                        </div>
                    </motion.div>

                    {/* Item 3 - Add Button */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px solid #e9ecef'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #FFB74D 0%, #FFA726 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Plus size={24} color="white" strokeWidth={3} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                추가하기 버튼
                            </h3>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                새로운 여행 일정을 만들 수 있습니다
                            </p>
                        </div>
                    </motion.div>

                    {/* Item 4 - Travel List */}
                    <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            padding: '16px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '12px',
                            border: '2px solid #e9ecef'
                        }}
                    >
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'linear-gradient(135deg, #64B5F6 0%, #42A5F5 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Calendar size={24} color="white" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#333', marginBottom: '4px' }}>
                                여행 일정 목록
                            </h3>
                            <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                                예정된 여행과 기간, 인원을 확인하세요
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Start Button */}
                <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onClose}
                    style={{
                        width: '100%',
                        marginTop: '32px',
                        padding: '16px',
                        borderRadius: '12px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                        color: 'white',
                        fontSize: '18px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(45, 139, 95, 0.3)'
                    }}
                >
                    시작하기
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
