import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { validatePassword, getPasswordStrength } from '../utils/validation';

const myUrl = window.location.protocol + "//" + window.location.hostname + ":8000";

interface PasswordEditScreenProps {
    onClose: () => void;
    onBack?: () => void;
    userId: string;
}

export function PasswordEditScreen({ onClose, onBack, userId }: PasswordEditScreenProps) {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 새 비밀번호 검증
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
            alert(passwordValidation.errorMessage || '비밀번호 요구사항을 충족하지 않습니다.');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('새 비밀번호가 일치하지 않습니다.');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${myUrl}/auth/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: userId,
                    current_password: currentPassword,
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (response.ok) {
                alert('비밀번호가 수정되었습니다.');
                onClose();
            } else {
                alert(data.detail || '비밀번호 변경에 실패했습니다.');
            }
        } catch (error) {
            console.error(error);
            alert('서버 오류가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
                position: 'fixed',
                top: 0,
                left: '49.65%',
                transform: 'translateX(-50%)',
                width: '100%',
                maxWidth: '480px',
                height: '100vh',
                backgroundColor: 'white',
                zIndex: 1200,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
            }}
        >
            <div style={{
                padding: '20px 30px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
            }}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onBack || onClose}
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        border: 'none',
                        backgroundColor: '#f8f9fa',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ArrowLeft size={20} color="#666" />
                </motion.button>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#2D8B5F', margin: 0 }}>
                    비밀번호 수정
                </h2>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                            현재 비밀번호
                        </label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="현재 비밀번호를 입력하세요"
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                            새 비밀번호
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val.length <= 16) {
                                    setNewPassword(val);
                                }
                            }}
                            placeholder="8-16자, 영어, 특수문자 1개, 숫자 3개 이상"
                            maxLength={16}
                            style={{ width: '100%', padding: '14px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' }}
                        />
                        {newPassword && (() => {
                            const strength = getPasswordStrength(newPassword);
                            return (
                                <div style={{ marginTop: '8px', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span style={{ color: strength.hasValidLength ? '#27ae60' : '#e74c3c' }}>✓ 8-16자</span>
                                        <span style={{ color: strength.hasEnglish ? '#27ae60' : '#e74c3c' }}>✓ 영어 포함</span>
                                        <span style={{ color: strength.hasSpecialChar ? '#27ae60' : '#e74c3c' }}>✓ 특수문자 1개 이상</span>
                                        <span style={{ color: strength.hasMinNumbers ? '#27ae60' : '#e74c3c' }}>✓ 숫자 3개 이상</span>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    <div style={{ marginBottom: '30px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
                            새 비밀번호 확인
                        </label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="새 비밀번호를 다시 입력하세요"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: `1px solid ${confirmPassword && newPassword !== confirmPassword ? 'red' : '#ddd'}`,
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                        {confirmPassword && newPassword !== confirmPassword && (
                            <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>비밀번호가 일치하지 않습니다.</p>
                        )}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={isLoading}
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isLoading ? '#ccc' : 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: isLoading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isLoading ? '변경 중...' : '비밀번호 수정'}
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}