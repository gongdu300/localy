import { motion } from 'motion/react';
import { Check } from 'lucide-react';

interface SignupCompleteProps {
    userName: string;
    onGoHome: () => void;
    onGoLogin: () => void;
}

export function SignupComplete({ userName, onGoHome, onGoLogin }: SignupCompleteProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            style={{
                width: '100%',
                height: '100vh',
                background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.98)',
                    borderRadius: '24px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    textAlign: 'center'
                }}
            >
                {/* Success Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                    style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 8px 24px rgba(45, 139, 95, 0.4)'
                    }}
                >
                    <Check size={40} color="white" strokeWidth={3} />
                </motion.div>

                {/* Title */}
                <motion.h2
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#2D8B5F',
                        marginBottom: '12px'
                    }}
                >
                    회원가입 완료!
                </motion.h2>

                {/* Message */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    style={{
                        fontSize: '16px',
                        color: '#666',
                        marginBottom: '32px',
                        lineHeight: '1.6'
                    }}
                >
                    {userName}님, 환영합니다! 🎉<br />
                    이제 여행 계획을 시작해보세요!
                </motion.p>

                {/* Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px'
                    }}
                >
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGoHome}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(45, 139, 95, 0.3)'
                        }}
                    >
                        메인으로
                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onGoLogin}
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '2px solid #2D8B5F',
                            background: 'white',
                            color: '#2D8B5F',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        로그인
                    </motion.button>
                </motion.div>
            </motion.div>
        </motion.div>
    );
}
