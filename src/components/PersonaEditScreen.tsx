import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PersonaEditScreenProps {
    onClose: () => void;
}

export function PersonaEditScreen({ onClose }: PersonaEditScreenProps) {
    const [personaInfo, setPersonaInfo] = useState({
        preferred_food: '',
        non_preferred_food: '',
        preferred_theme: '',
        preferred_region: '',
        non_preferred_region: '',
        transportation: '',
        travel_budget: '',
        accommodation_type: ''
    });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setPersonaInfo({
                    preferred_food: user.preferred_food || '',
                    non_preferred_food: user.non_preferred_food || '',
                    preferred_theme: user.preferred_theme || '',
                    preferred_region: user.preferred_region || '',
                    non_preferred_region: user.non_preferred_region || '',
                    transportation: user.transportation || '',
                    travel_budget: user.travel_budget || '',
                    accommodation_type: user.accommodation_type || ''
                });
            } catch (e) {
                console.error('Error loading persona info:', e);
            }
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                const updatedUser = { ...user, ...personaInfo };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                alert('페르소나 정보가 수정되었습니다.');
                onClose();
            } catch (e) {
                console.error('Error saving persona info:', e);
            }
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
                left: '50%',
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
            {/* Header */}
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
                    onClick={onClose}
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
                <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#2D8B5F',
                    margin: 0
                }}>
                    페르소나 수정
                </h2>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                <form onSubmit={handleSubmit}>
                    {/* 선호 음식 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            선호 음식
                        </label>
                        <input
                            type="text"
                            value={personaInfo.preferred_food}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, preferred_food: e.target.value })}
                            placeholder="예: 한식, 양식, 일식"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 비선호 음식 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            비선호 음식
                        </label>
                        <input
                            type="text"
                            value={personaInfo.non_preferred_food}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, non_preferred_food: e.target.value })}
                            placeholder="예: 매운 음식, 해산물"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 선호 테마 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            선호 테마
                        </label>
                        <input
                            type="text"
                            value={personaInfo.preferred_theme}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, preferred_theme: e.target.value })}
                            placeholder="예: 자연, 문화, 액티비티"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 선호 지역 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            선호 지역
                        </label>
                        <input
                            type="text"
                            value={personaInfo.preferred_region}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, preferred_region: e.target.value })}
                            placeholder="예: 제주도, 부산, 강원도"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 비선호 지역 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            비선호 지역
                        </label>
                        <input
                            type="text"
                            value={personaInfo.non_preferred_region}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, non_preferred_region: e.target.value })}
                            placeholder="예: 번잡한 도시"
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    {/* 이동 수단 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            이동 수단
                        </label>
                        <select
                            value={personaInfo.transportation}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, transportation: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">선택하세요</option>
                            <option value="자가용">자가용</option>
                            <option value="대중교통">대중교통</option>
                            <option value="렌터카">렌터카</option>
                            <option value="도보">도보</option>
                            <option value="자전거">자전거</option>
                        </select>
                    </div>

                    {/* 여행 예산 */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            여행 예산
                        </label>
                        <select
                            value={personaInfo.travel_budget}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, travel_budget: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">선택하세요</option>
                            <option value="10만원 이하">10만원 이하</option>
                            <option value="10-30만원">10-30만원</option>
                            <option value="30-50만원">30-50만원</option>
                            <option value="50-100만원">50-100만원</option>
                            <option value="100만원 이상">100만원 이상</option>
                        </select>
                    </div>

                    {/* 숙소 종류 */}
                    <div style={{ marginBottom: '30px' }}>
                        <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#333',
                            marginBottom: '8px'
                        }}>
                            숙소 종류
                        </label>
                        <select
                            value={personaInfo.accommodation_type}
                            onChange={(e) => setPersonaInfo({ ...personaInfo, accommodation_type: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '14px',
                                borderRadius: '8px',
                                border: '1px solid #ddd',
                                fontSize: '15px',
                                boxSizing: 'border-box',
                                backgroundColor: 'white'
                            }}
                        >
                            <option value="">선택하세요</option>
                            <option value="호텔">호텔</option>
                            <option value="펜션">펜션</option>
                            <option value="게스트하우스">게스트하우스</option>
                            <option value="리조트">리조트</option>
                            <option value="캠핑">캠핑</option>
                            <option value="한옥">한옥</option>
                        </select>
                    </div>

                    {/* 수정 버튼 */}
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                            color: 'white',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: 'pointer'
                        }}
                    >
                        페르소나 수정
                    </motion.button>
                </form>
            </div>
        </motion.div>
    );
}
