import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { User, Lock } from 'lucide-react';
import BACKGROUND_IMAGE from "../assets/bg.png";

const myUrl = window.location.protocol + "//" + window.location.hostname + ":8000";

interface LoginFormProps {
    onSwitchToSignup: () => void;
    onLoginSuccess: () => void;
    onBack: () => void;
}

export function LoginForm({ onSwitchToSignup, onLoginSuccess, onBack }: LoginFormProps) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [autoLogin, setAutoLogin] = useState(false);

    useEffect(() => {
        const savedAutoLogin = localStorage.getItem('autoLogin');
        if (savedAutoLogin === 'true') {
            const savedUsername = localStorage.getItem('savedUsername');
            const savedPassword = localStorage.getItem('savedPassword');
            if (savedUsername && savedPassword) {
                setUsername(savedUsername);
                setPassword(savedPassword);
                setAutoLogin(true);
                attemptAutoLogin(savedUsername, savedPassword);
            }
        }
    }, []);

    const attemptAutoLogin = async (user: string, pass: string) => {
        try {
            const response = await fetch(`${myUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: user, user_pw: pass })
            });
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('user', JSON.stringify(data));
                onLoginSuccess();
            } else {
                localStorage.removeItem('autoLogin');
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
                setAutoLogin(false);
            }
        } catch (error) {
            setAutoLogin(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${myUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: username, user_pw: password })
            });

            if (!response.ok) {
                const error = await response.json();
                alert(error.detail || '로그인에 실패했습니다.');
                return;
            }

            const data = await response.json();
            localStorage.setItem('user', JSON.stringify(data));

            if (autoLogin) {
                localStorage.setItem('autoLogin', 'true');
                localStorage.setItem('savedUsername', username);
                localStorage.setItem('savedPassword', password);
            } else {
                localStorage.removeItem('autoLogin');
                localStorage.removeItem('savedUsername');
                localStorage.removeItem('savedPassword');
            }
            onLoginSuccess();
        } catch (error) {
            console.error('Login error:', error);
            alert('서버 연결 실패');
        }
    };

    return (
        // [1] 전체 화면 컨테이너 (PC 화면 배경색 & 중앙 정렬 담당)
        <div style={{
            width: '100vw',
            height: '100vh',
            backgroundColor: '#f0f2f5', // PC 화면의 남는 여백 색상 (연한 회색 추천)
            display: 'flex',            // 내용물 중앙 정렬을 위한 Flexbox
            justifyContent: 'center',   // 가로 중앙
            alignItems: 'center',       // 세로 중앙
        }}>

            {/* [2] 실제 앱 화면 (여기에 배경 이미지와 maxWidth 적용) */}
            <div style={{
                position: 'relative',   // absolute 대신 relative 사용 (부모에 맞춰 정렬되도록)
                width: '100%',
                height: '100%',
                maxWidth: '480px',      // 모바일 최대 너비 제한
                backgroundImage: `url(${BACKGROUND_IMAGE})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                flexDirection: 'column', // 내부 요소 정렬
                justifyContent: 'center',
                alignItems: 'center',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)', // 앱 화면이 떠보이게 그림자 추가 (선택사항)
                overflow: 'hidden'      // 둥근 모서리 밖으로 배경 튀어나감 방지
            }}>

                {/* 배경 어둡게 하는 오버레이 */}
                <div style={{
                    position: 'absolute',
                    top: 0, left: 0, width: '100%', height: '100%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
                    zIndex: 1
                }} />
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3 }}
                    style={{
                        position: 'relative',
                        zIndex: 10,
                        width: '90%',
                        maxWidth: '400px',
                        padding: '40px',

                        // 🔥 여기가 핵심: 진짜 유리처럼 만드는 코드
                        background: 'rgba(255, 255, 255, 0.55)', // 흰색 투명도 25% (뒤가 보여야 함)
                        backdropFilter: 'blur(20px)',           // 뒤 배경 흐리게 (아이폰 효과)
                        WebkitBackdropFilter: 'blur(20px)',     // 사파리 브라우저 호환
                        borderRadius: '30px',                   // 둥근 모서리
                        boxShadow: '0 8px 40px 0 rgba(31, 38, 135, 0.15)', // 부드러운 그림자
                        border: '1px solid rgba(255, 255, 255, 0.4)', // 유리 테두리 반사광
                        borderTop: '1px solid rgba(255, 255, 255, 0.7)', // 위쪽 빛 반사 강조
                        borderLeft: '1px solid rgba(255, 255, 255, 0.7)'  // 왼쪽 빛 반사 강조
                    }}
                >

                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <h2 style={{
                            fontSize: '32px',
                            fontWeight: '800',
                            color: '#2e5c47ff', // 숲 배경에 맞춰 짙은 녹색으로 변경 (가독성 UP)
                            marginBottom: '8px',
                            textShadow: '0 2px 4px rgba(255,255,255,0.5)' // 글씨가 배경에 묻히지 않게
                        }}>
                            어서오세요
                        </h2>
                        <p style={{ color: '#2d4a3e', fontSize: '15px', fontWeight: '500' }}>
                            계정에 로그인하세요
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* 아이디 입력창 - 유리 위에 올라가는 거라 반투명하게 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1a5e3f', fontSize: '14px', fontWeight: '700' }}>
                                아이디
                            </label>
                            <div style={{ position: 'relative' }}>
                                <User size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#2D8B5F' }} />
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    placeholder="아이디를 입력하세요"
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 48px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255, 0.6)', // 테두리도 반투명
                                        backgroundColor: 'rgba(255, 255, 255, 0.6)', // 입력창 배경도 살짝 투명하게
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        color: '#333'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'; // 포커스 되면 밝게
                                        e.target.style.boxShadow = '0 0 0 4px rgba(45, 139, 95, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* 비밀번호 입력창 */}
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#1a5e3f', fontSize: '14px', fontWeight: '700' }}>
                                비밀번호
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#2D8B5F' }} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="비밀번호를 입력하세요"
                                    style={{
                                        width: '100%',
                                        padding: '16px 16px 16px 48px',
                                        borderRadius: '20px',
                                        border: '1px solid rgba(255,255,255, 0.6)',
                                        backgroundColor: 'rgba(255, 255, 255, 0.6)',
                                        fontSize: '15px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        color: '#333'
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
                                        e.target.style.boxShadow = '0 0 0 4px rgba(45, 139, 95, 0.2)';
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* 자동 로그인 */}
                        <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <input
                                type="checkbox"
                                id="autoLogin"
                                checked={autoLogin}
                                onChange={(e) => setAutoLogin(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2D8B5F' }}
                            />
                            <label htmlFor="autoLogin" style={{ color: '#2d4a3e', fontSize: '14px', cursor: 'pointer', fontWeight: '600' }}>
                                자동 로그인
                            </label>
                        </div>

                        {/* 버튼 영역 */}
                        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                            <motion.button
                                type="button"
                                onClick={onBack}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 1,
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: '1px solid #2D8B5F',
                                    background: 'rgba(255,255,255,0.8)', // 버튼도 약간 투명
                                    color: '#2D8B5F',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer'
                                }}
                            >
                                돌아가기
                            </motion.button>

                            <motion.button
                                type="submit"
                                whileHover={{ scale: 1.02, boxShadow: "0 10px 20px rgba(45, 139, 95, 0.3)" }}
                                whileTap={{ scale: 0.98 }}
                                style={{
                                    flex: 2,
                                    padding: '16px',
                                    borderRadius: '16px',
                                    border: 'none',
                                    background: 'linear-gradient(135deg, #2D8B5F 0%, #3DAF7A 100%)', // 그라데이션 버튼
                                    color: 'white',
                                    fontSize: '16px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    boxShadow: '0 4px 15px rgba(45, 139, 95, 0.3)'
                                }}
                            >
                                로그인
                            </motion.button>
                        </div>

                        <div style={{ textAlign: 'center' }}>
                            <button
                                type="button"
                                onClick={onSwitchToSignup}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#2d4a3e',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    fontWeight: '600'
                                }}
                            >
                                계정이 없으신가요? <span style={{ color: '#1a5e3f', fontWeight: '800', textDecoration: 'underline' }}>회원가입</span>
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}