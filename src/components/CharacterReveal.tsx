import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import catImage from '../assets/cat.jpg';
import dogImage from '../assets/dog.png';
import otterImage from '../assets/otter.png';

interface CharacterRevealProps {
    character: 'cat' | 'dog' | 'otter';
    mbtiTraits: { type_e: string; type_j: string };
    reason: string;
    onComplete: () => void;
    onRetry: () => void;  // 페르소나 재작성
}

export function CharacterReveal({ character, mbtiTraits, reason, onComplete, onRetry }: CharacterRevealProps) {
    const [showCharacter, setShowCharacter] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    const characterData = {
        cat: { name: '까칠냥', image: catImage, color: '#FF6B9D' },
        dog: { name: '순둥멍', image: dogImage, color: '#FFA500' },
        otter: { name: '엉뚱수달', image: otterImage, color: '#4ECDC4' }
    };

    const char = characterData[character];
    const personalityText = `${mbtiTraits.type_j === 'J' ? '계획적' : '즉흥적'}이고 ${mbtiTraits.type_e === 'E' ? '활동적' : '차분한'}`;

    useEffect(() => {
        // 1초 후 상자 열림 + 캐릭터 등장
        const timer1 = setTimeout(() => {
            setShowCharacter(true);
            setShowConfetti(true);
        }, 1000);

        // 자동 완료 제거 - 사용자가 버튼 클릭

        return () => {
            clearTimeout(timer1);
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            {/* 색종이 효과 */}
            {showConfetti && [...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    initial={{ y: -100, x: Math.random() * window.innerWidth, rotate: 0 }}
                    animate={{
                        y: window.innerHeight + 100,
                        rotate: 360 * 3,
                        transition: { duration: 3 + Math.random() * 2, ease: 'linear' }
                    }}
                    style={{
                        position: 'absolute',
                        width: '10px',
                        height: '10px',
                        backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347'][i % 4],
                        borderRadius: i % 2 === 0 ? '50%' : '0'
                    }}
                />
            ))}

            {/* 메인 콘텐츠 */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    textAlign: 'center',
                    zIndex: 10
                }}
            >
                {/* 상자 열리는 애니메이션 */}
                {!showCharacter ? (
                    <motion.div
                        animate={{
                            rotateY: [0, 10, -10, 0],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            repeatType: 'loop'
                        }}
                        style={{
                            fontSize: '120px',
                            filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.3))'
                        }}
                    >
                        🎁
                    </motion.div>
                ) : (
                    <>
                        {/* 축하 메시지 */}
                        <motion.h1
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            style={{
                                color: 'white',
                                fontSize: '48px',
                                fontWeight: '800',
                                marginBottom: '20px',
                                textShadow: '0 4px 20px rgba(0,0,0,0.3)'
                            }}
                        >
                            🎉 축하합니다! 🎉
                        </motion.h1>

                        {/* MBTI 설명 */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            style={{
                                color: 'rgba(255,255,255,0.95)',
                                fontSize: '20px',
                                marginBottom: '30px',
                                fontWeight: '500'
                            }}
                        >
                            당신의 성향은 <strong>{personalityText}</strong> 스타일!
                        </motion.p>

                        {/* 캐릭터 이미지 */}
                        <motion.div
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                                delay: 0.5,
                                type: 'spring',
                                stiffness: 200,
                                damping: 15
                            }}
                            style={{
                                margin: '0 auto 30px',
                                width: '200px',
                                height: '200px',
                                borderRadius: '50%',
                                overflow: 'hidden',
                                border: `6px solid ${char.color}`,
                                boxShadow: `0 0 40px ${char.color}, 0 10px 50px rgba(0,0,0,0.3)`,
                                background: 'white'
                            }}
                        >
                            <img
                                src={char.image}
                                alt={char.name}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                }}
                            />
                        </motion.div>

                        {/* 캐릭터 이름 */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            style={{
                                color: char.color,
                                fontSize: '42px',
                                fontWeight: '900',
                                marginBottom: '20px',
                                textShadow: '0 4px 20px rgba(0,0,0,0.5)',
                                filter: 'drop-shadow(0 0 10px white)'
                            }}
                        >
                            {char.name}
                        </motion.h2>

                        {/* 설명 */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1 }}
                            style={{
                                color: 'white',
                                fontSize: '18px',
                                maxWidth: '500px',
                                margin: '0 auto',
                                lineHeight: '1.6',
                                padding: '20px',
                                background: 'rgba(0,0,0,0.2)',
                                borderRadius: '16px',
                                backdropFilter: 'blur(10px)'
                            }}
                        >
                            {reason}
                        </motion.p>
                    </>
                )}
            </motion.div>

            {/* 버튼 */}
            {showCharacter && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    style={{
                        position: 'absolute',
                        bottom: '60px',
                        display: 'flex',
                        gap: '20px',
                        zIndex: 20
                    }}
                >
                    {/* 페르소나 재작성하기 */}
                    <motion.button
                        onClick={onRetry}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '16px 32px',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: 'white',
                            background: 'rgba(255,255,255,0.2)',
                            border: '2px solid white',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                            transition: 'all 0.3s'
                        }}
                    >
                        🔄 페르소나 재작성하기
                    </motion.button>

                    {/* 다음 */}
                    <motion.button
                        onClick={onComplete}
                        whileHover={{ scale: 1.05, boxShadow: `0 0 30px ${char.color}` }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                            padding: '16px 48px',
                            fontSize: '18px',
                            fontWeight: '700',
                            color: 'white',
                            background: char.color,
                            border: 'none',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            boxShadow: `0 4px 20px ${char.color}80`,
                            transition: 'all 0.3s'
                        }}
                    >
                        다음 ✨
                    </motion.button>
                </motion.div>
            )}
        </div>
    );
}
