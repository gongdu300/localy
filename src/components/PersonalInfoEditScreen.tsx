import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, User, Mail, MapPin, Calendar, X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface PersonalInfoEditScreenProps {
    onClose: () => void;
}

import { validateName, validateNickname, validateEmail, validatePhone, validateBirth } from '../utils/validation';

const myUrl = window.location.protocol + "//" + window.location.hostname + ":8000";

export function PersonalInfoEditScreen({ onClose }: PersonalInfoEditScreenProps) {
    // 1. 회원가입 때 썼던 필드들과 동일하게 상태 관리
    const [userInfo, setUserInfo] = useState({
        user_id: '',
        user_name: '',
        user_nickname: '',
        user_email: '',
        user_phone: '',
        user_post: '',
        user_addr1: '',
        user_addr2: '',
        user_birth: '',
        user_gender: ''
    });

    // Validation errors
    const [nameError, setNameError] = useState('');
    const [nicknameError, setNicknameError] = useState('');
    const [emailError, setEmailError] = useState('');
    const [phoneError, setPhoneError] = useState('');
    const [birthError, setBirthError] = useState('');

    // Nickname duplicate check
    const [originalNickname, setOriginalNickname] = useState('');
    const [isNicknameChecked, setIsNicknameChecked] = useState(true);
    const [isNicknameAvailable, setIsNicknameAvailable] = useState(true);

    // Email verification
    const [originalEmail, setOriginalEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [isCodeSent, setIsCodeSent] = useState(false);
    const [isEmailVerified, setIsEmailVerified] = useState(true);
    const [timeLeft, setTimeLeft] = useState(0);

    // Address modal state
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);

    // 2. 화면이 열리면 localStorage에서 내 정보 가져오기
    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                console.log('Loaded user from localStorage:', user);
                setUserInfo({
                    user_id: user.user_id || '',
                    user_name: user.user_name || '',
                    user_nickname: user.user_nickname || '',
                    user_email: user.user_email || '',
                    user_phone: user.user_phone || '',
                    user_post: user.user_post || '',
                    user_addr1: user.user_addr1 || '',
                    user_addr2: user.user_addr2 || '',
                    user_birth: user.user_birth || '',
                    user_gender: user.user_gender || ''
                });
                setOriginalNickname(user.user_nickname || '');
                setOriginalEmail(user.user_email || '');
            } catch (e) {
                console.error('사용자 정보 로딩 실패:', e);
            }
        }
    }, []);

    // Email verification timer
    useEffect(() => {
        if (timeLeft > 0 && !isEmailVerified) {
            const timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isEmailVerified]);

    // Open address modal and init Daum Postcode
    useEffect(() => {
        if (isAddressModalOpen) {
            console.log('[Address Modal] Opening...');

            const initPostcode = () => {
                console.log('[Address Modal] Attempting to initialize');
                const container = document.getElementById('daum-postcode-container-edit');

                if (!container) {
                    console.error('[Address Modal] Container not found, retrying...');
                    setTimeout(initPostcode, 200);
                    return;
                }

                console.log('[Address Modal] Container found:', container);

                if (window.daum && window.daum.Postcode) {
                    console.log('[Address Modal] Daum Postcode available, embedding...');
                    try {
                        new window.daum.Postcode({
                            oncomplete: function (data: any) {
                                console.log('[Address Modal] Address selected:', data);
                                setUserInfo(prev => ({
                                    ...prev,
                                    user_post: data.zonecode,
                                    user_addr1: data.roadAddress
                                }));
                                setIsAddressModalOpen(false);
                            },
                            width: '100%',
                            height: '100%'
                        }).embed(container);
                        console.log('[Address Modal] Embed successful');
                    } catch (error) {
                        console.error('[Address Modal] Embed error:', error);
                    }
                } else {
                    console.error('[Address Modal] Daum Postcode not available, retrying...');
                    setTimeout(initPostcode, 200);
                }
            };

            // Wait longer for DOM to be ready
            const timer = setTimeout(initPostcode, 300);
            return () => clearTimeout(timer);
        }
    }, [isAddressModalOpen]);

    const handleCheckNickname = async () => {
        const validation = validateNickname(userInfo.user_nickname);
        if (!validation.isValid) {
            setNicknameError(validation.errorMessage || '');
            alert(validation.errorMessage);
            return;
        }

        try {
            const response = await fetch(`${myUrl}/auth/check-nickname/${encodeURIComponent(userInfo.user_nickname)}`);
            const data = await response.json();

            setIsNicknameChecked(true);
            setIsNicknameAvailable(data.available);

            if (data.available) {
                setNicknameError('');
                alert('사용 가능한 닉네임입니다.');
            } else {
                setNicknameError('이미 사용 중인 닉네임입니다.');
                alert('이미 사용 중인 닉네임입니다.');
            }
        } catch (error) {
            console.error('Nickname check error:', error);
            alert('서버 연결에 실패했습니다.');
        }
    };

    const handleSendVerificationCode = async () => {
        console.log('📧 인증번호 버튼 클릭! email:', userInfo.user_email);
        const validation = validateEmail(userInfo.user_email);
        if (!validation.isValid) {
            setEmailError(validation.errorMessage || '');
            alert(validation.errorMessage);
            return;
        }

        if (!userInfo.user_email) {
            alert('이메일을 입력해주세요.');
            return;
        }

        setIsCodeSent(true);
        setTimeLeft(180);

        try {
            console.log('API 요청 시작: /auth/send-verification');
            const response = await fetch(`${myUrl}/auth/send-verification`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userInfo.user_email })
            });
            console.log('API 응답 받음:', response.status);

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || '인증번호 발송에 실패했습니다.');
                setIsCodeSent(false);
                setTimeLeft(0);
                return;
            }

            if (data.dev_code) {
                console.log('🔑 [개발용 인증번호]:', data.dev_code);
            }
            alert('인증번호가 발송되었습니다.');
        } catch (error) {
            console.error('Send verification error:', error);
            alert('서버 연결에 실패했습니다.');
            setIsCodeSent(false);
            setTimeLeft(0);
        }
    };

    const handleVerifyCode = async () => {
        console.log('✅ 인증번호 확인 버튼 클릭! code:', verificationCode);
        if (!verificationCode) {
            alert('인증번호를 입력해주세요.');
            return;
        }

        try {
            console.log('API 요청 시작: /auth/verify-email');
            const response = await fetch(`${myUrl}/auth/verify-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userInfo.user_email, code: verificationCode })
            });
            console.log('API 응답 받음:', response.status);

            const data = await response.json();

            if (!response.ok) {
                alert(data.detail || '인증번호가 올바르지 않습니다.');
                return;
            }

            setIsEmailVerified(true);
            setEmailError('');
            alert('이메일 인증이 완료되었습니다.');
        } catch (error) {
            console.error('Verify code error:', error);
            alert('서버 연결에 실패했습니다.');
        }
    };

    // 3. 수정된 정보 저장하기
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate all fields before submitting
        const nameValidation = validateName(userInfo.user_name);
        const nicknameValidation = validateNickname(userInfo.user_nickname);
        const emailValidation = validateEmail(userInfo.user_email);
        const birthValidation = validateBirth(userInfo.user_birth);

        if (!nameValidation.isValid) {
            setNameError(nameValidation.errorMessage || '');
            alert(nameValidation.errorMessage);
            return;
        }
        if (!nicknameValidation.isValid) {
            setNicknameError(nicknameValidation.errorMessage || '');
            alert(nicknameValidation.errorMessage);
            return;
        }
        if (!emailValidation.isValid) {
            setEmailError(emailValidation.errorMessage || '');
            alert(emailValidation.errorMessage);
            return;
        }
        if (!birthValidation.isValid) {
            setBirthError(birthValidation.errorMessage || '');
            alert(birthValidation.errorMessage);
            return;
        }

        // Check nickname availability if changed
        const nicknameChanged = userInfo.user_nickname !== originalNickname;
        if (nicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) {
            alert('닉네임 중복확인을 완료해주세요.');
            return;
        }

        // Check email verification if changed
        const emailChanged = userInfo.user_email !== originalEmail;
        if (emailChanged && !isEmailVerified) {
            alert('이메일 인증을 완료해주세요.');
            return;
        }

        const userStr = localStorage.getItem('user');

        if (userStr) {
            try {
                const currentUser = JSON.parse(userStr);
                // 기존 정보에 수정된 정보 합치기
                const updatedUser = { ...currentUser, ...userInfo };

                // localStorage 업데이트
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // TODO: 여기서 백엔드 서버로도 전송해야 완벽합니다.
                // fetch('http://localhost:8000/auth/update', { ... })

                alert('개인정보가 수정되었습니다.');
                onClose();
            } catch (e) {
                console.error('저장 실패:', e);
                alert('저장에 실패했습니다.');
            }
        }
    };

    // 우편번호 찾기 - Modal 방식으로 변경
    const handleSearchAddress = () => {
        setIsAddressModalOpen(true);
    };

    const nicknameChanged = userInfo.user_nickname !== originalNickname;
    const emailChanged = userInfo.user_email !== originalEmail;

    return (
        <>
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
                {/* 헤더 */}
                <div style={{
                    padding: '20px 30px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)'
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
                        개인정보 수정
                    </h2>
                </div>

                {/* 입력 폼 영역 */}
                <div style={{ flex: 1, overflowY: 'scroll', padding: '30px', paddingBottom: '100px' }}>
                    <form onSubmit={handleSubmit}>

                        {/* 아이디 (수정 불가) */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>아이디</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={iconStyle} />
                                <input
                                    type="text"
                                    value={userInfo.user_id}
                                    disabled
                                    style={{ ...inputStyle, backgroundColor: '#f5f5f5', color: '#999' }}
                                />
                            </div>
                        </div>

                        {/* 이름 */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>이름</label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={iconStyle} />
                                <input
                                    type="text"
                                    value={userInfo.user_name}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUserInfo({ ...userInfo, user_name: val });
                                        const validation = validateName(val);
                                        setNameError(validation.isValid ? '' : validation.errorMessage || '');
                                    }}
                                    style={inputStyle}
                                />
                            </div>
                            {nameError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{nameError}</p>}
                        </div>

                        {/* 닉네임 */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>닉네임</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <User size={18} style={iconStyle} />
                                    <input
                                        type="text"
                                        value={userInfo.user_nickname}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setUserInfo({ ...userInfo, user_nickname: val });
                                            if (val !== originalNickname) {
                                                setIsNicknameChecked(false);
                                                setIsNicknameAvailable(false);
                                            } else {
                                                setIsNicknameChecked(true);
                                                setIsNicknameAvailable(true);
                                            }
                                            const validation = validateNickname(val);
                                            setNicknameError(validation.isValid ? '' : validation.errorMessage || '');
                                        }}
                                        style={inputStyle}
                                    />
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={handleCheckNickname}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        minWidth: '85px',
                                        padding: '12px 16px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    중복확인
                                </motion.button>
                            </div>
                            {nicknameError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{nicknameError}</p>}
                        </div>

                        {/* 이메일 */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>이메일</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <div style={{ position: 'relative', flex: 1 }}>
                                    <Mail size={18} style={iconStyle} />
                                    <input
                                        type="email"
                                        value={userInfo.user_email}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setUserInfo({ ...userInfo, user_email: val });
                                            if (val !== originalEmail) {
                                                setIsCodeSent(false);
                                                setIsEmailVerified(false);
                                            } else {
                                                setIsEmailVerified(true);
                                            }
                                            const validation = validateEmail(val);
                                            setEmailError(validation.isValid ? '' : validation.errorMessage || '');
                                        }}
                                        style={inputStyle}
                                    />
                                </div>
                                <motion.button
                                    type="button"
                                    onClick={handleSendVerificationCode}
                                    disabled={isEmailVerified && !emailChanged}
                                    whileHover={{ scale: (isEmailVerified && !emailChanged) ? 1 : 1.05 }}
                                    whileTap={{ scale: (isEmailVerified && !emailChanged) ? 1 : 0.95 }}
                                    style={{
                                        minWidth: '85px',
                                        padding: '12px 16px',
                                        height: '46px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: (isEmailVerified && !emailChanged) ? '#ccc' : 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                                        color: 'white',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        cursor: (isEmailVerified && !emailChanged) ? 'not-allowed' : 'pointer',
                                        whiteSpace: 'nowrap',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {isCodeSent ? '재전송' : '인증번호'}
                                </motion.button>
                            </div>
                            {emailError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{emailError}</p>}
                            {isCodeSent && !isEmailVerified && (
                                <>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <input
                                            type="text"
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value)}
                                            placeholder="인증번호 6자리"
                                            maxLength={6}
                                            style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '2px solid rgba(45, 139, 95, 0.2)', fontSize: '14px', boxSizing: 'border-box' }}
                                        />
                                        <motion.button
                                            type="button"
                                            onClick={handleVerifyCode}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            style={{ minWidth: '65px', padding: '12px 16px', height: '46px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)', color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        >
                                            확인
                                        </motion.button>
                                    </div>
                                    {timeLeft > 0 && (
                                        <div style={{ marginTop: '4px', fontSize: '13px', color: '#e74c3c', fontWeight: '600' }}>
                                            ⏱️ {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                                        </div>
                                    )}
                                    {timeLeft === 0 && (
                                        <div style={{ marginTop: '4px', fontSize: '13px', color: '#e74c3c', fontWeight: '600' }}>
                                            ⚠️ 인증시간이 만료되었습니다. 재전송 버튼을 눌러주세요.
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* 주소 (우편번호 검색) */}
                        <div style={{ marginBottom: '24px' }}>
                            <label style={labelStyle}>주소</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                <input
                                    type="text"
                                    value={userInfo.user_post}
                                    placeholder="우편번호"
                                    readOnly
                                    style={{ ...inputStyle, width: '100px', paddingLeft: '14px' }}
                                />
                                <motion.button
                                    type="button"
                                    onClick={handleSearchAddress}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    style={{
                                        padding: '0 20px',
                                        borderRadius: '12px',
                                        border: '1px solid #2D8B5F',
                                        backgroundColor: 'white',
                                        color: '#2D8B5F',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    검색
                                </motion.button>
                            </div>
                            <div style={{ position: 'relative', marginBottom: '8px' }}>
                                <MapPin size={18} style={iconStyle} />
                                <input
                                    type="text"
                                    value={userInfo.user_addr1}
                                    placeholder="기본 주소"
                                    readOnly
                                    style={inputStyle}
                                />
                            </div>
                            <input
                                type="text"
                                value={userInfo.user_addr2}
                                onChange={(e) => setUserInfo({ ...userInfo, user_addr2: e.target.value })}
                                placeholder="상세 주소를 입력하세요"
                                style={{ ...inputStyle, paddingLeft: '14px' }}
                            />
                        </div>

                        {/* 생년월일 */}
                        <div style={{ marginBottom: '32px' }}>
                            <label style={labelStyle}>생년월일</label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={iconStyle} />
                                <input
                                    type="date"
                                    value={userInfo.user_birth}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setUserInfo({ ...userInfo, user_birth: val });
                                        const validation = validateBirth(val);
                                        setBirthError(validation.isValid ? '' : validation.errorMessage || '');
                                    }}
                                    style={inputStyle}
                                />
                            </div>
                            {birthError && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '4px' }}>{birthError}</p>}
                        </div>

                        {/* 수정 버튼 */}
                        <motion.button
                            type="submit"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            disabled={
                                (nicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) ||
                                (emailChanged && !isEmailVerified) ||
                                !!nameError || !!nicknameError || !!emailError || !!birthError
                            }
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                background: (
                                    (nicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) ||
                                    (emailChanged && !isEmailVerified) ||
                                    nameError || nicknameError || emailError || birthError
                                )
                                    ? '#ccc'
                                    : 'linear-gradient(135deg, #2D8B5F 0%, #3BA474 100%)',
                                color: 'white',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: (
                                    (nicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) ||
                                    (emailChanged && !isEmailVerified) ||
                                    nameError || nicknameError || emailError || birthError
                                )
                                    ? 'not-allowed'
                                    : 'pointer',
                                boxShadow: (
                                    (nicknameChanged && (!isNicknameChecked || !isNicknameAvailable)) ||
                                    (emailChanged && !isEmailVerified) ||
                                    nameError || nicknameError || emailError || birthError
                                )
                                    ? 'none'
                                    : '0 4px 12px rgba(45, 139, 95, 0.3)'
                            }}
                        >
                            수정 완료
                        </motion.button>
                    </form>
                </div>
            </motion.div>

            {/* Address Search Modal */}
            <AnimatePresence>
                {isAddressModalOpen && (
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
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '20px'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            style={{
                                width: '100%',
                                maxWidth: '500px',
                                height: '600px',
                                backgroundColor: 'white',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                                display: 'flex',
                                flexDirection: 'column'
                            }}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '20px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                backgroundColor: '#2D8B5F'
                            }}>
                                <h3 style={{ color: 'white', fontSize: '18px', fontWeight: '600', margin: 0 }}>주소 검색</h3>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsAddressModalOpen(false)}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <X size={20} />
                                </motion.button>
                            </div>

                            {/* Daum Postcode Container */}
                            <div
                                id="daum-postcode-container-edit"
                                style={{
                                    width: '100%',
                                    height: 'calc(100% - 60px)'
                                }}
                            />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// 스타일 객체들
const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px'
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 14px 14px 44px', // 아이콘 공간 확보
    borderRadius: '12px',
    border: '1px solid #e0e0e0',
    fontSize: '15px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
    outline: 'none'
};

const iconStyle: React.CSSProperties = {
    position: 'absolute',
    left: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#2D8B5F',
    opacity: 0.6,
    pointerEvents: 'none'
};