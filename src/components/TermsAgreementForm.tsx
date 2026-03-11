import { motion } from 'motion/react';
import { useState } from 'react';
import { Check, X } from 'lucide-react';

interface TermsAgreementFormProps {
    onNext: () => void;
    onBack: () => void;
}

type TermType = 'personal' | 'terms' | 'location' | null;

const TERMS_CONTENT = {
    personal: {
        title: '개인정보 수집 및 이용 동의',
        content: `1. 개인정보의 수집 및 이용 목적
- 서비스 제공 및 회원 관리
- 고객 문의사항 응대
- 신규 서비스 개발 및 마케팅

2. 수집하는 개인정보 항목
- 필수항목: 아이디, 비밀번호, 이름, 이메일, 생년월일
- 선택항목: 주소, 전화번호

3. 개인정보의 보유 및 이용 기간
- 회원 탈퇴 시까지
- 관계 법령에 따라 보존할 필요가 있는 경우 해당 기간까지

개인정보 수집 및 이용에 동의하지 않으실 수 있으며, 동의하지 않는 경우 회원가입이 제한됩니다.`
    },
    terms: {
        title: '이용 약관 동의',
        content: `제1조 (목적)
본 약관은 TRIP PLANNER(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "서비스"란 회사가 제공하는 여행 계획 및 관련 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 회사와 이용계약을 체결한 자를 말합니다.

제3조 (약관의 효력 및 변경)
1. 본 약관은 서비스를 이용하고자 하는 모든 회원에게 그 효력이 발생합니다.
2. 회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 변경할 수 있습니다.

제4조 (서비스의 제공)
회사는 회원에게 여행 계획, 일정 관리, 정보 제공 등의 서비스를 제공합니다.`
    },
    location: {
        title: '위치기반 서비스 이용 동의',
        content: `1. 위치정보 수집 목적
- 사용자 위치 기반 여행지 추천
- 주변 관광지 및 편의시설 정보 제공
- 경로 안내 및 내비게이션 서비스

2. 수집하는 위치정보
- GPS를 통한 정확한 위치정보
- Wi-Fi 및 기지국 기반 대략적 위치정보

3. 위치정보 보유 및 이용 기간
- 서비스 제공 기간 동안
- 회원 탈퇴 또는 위치정보 이용 동의 철회 시 즉시 파기

4. 위치정보 이용 거부권
회원은 위치기반 서비스 이용에 대한 동의를 거부할 수 있으며, 동의하지 않는 경우 위치 기반 서비스 이용이 제한될 수 있습니다.`
    }
};

export function TermsAgreementForm({ onNext, onBack }: TermsAgreementFormProps) {
    const [allAgreed, setAllAgreed] = useState(false);
    const [personalInfo, setPersonalInfo] = useState(false);
    const [termsOfUse, setTermsOfUse] = useState(false);
    const [locationService, setLocationService] = useState(false);
    const [selectedTerm, setSelectedTerm] = useState<TermType>(null);

    const handleAllAgreedChange = (checked: boolean) => {
        setAllAgreed(checked);
        setPersonalInfo(checked);
        setTermsOfUse(checked);
        setLocationService(checked);
    };

    const handleIndividualChange = () => {
        // Check if all individual items are checked
        const allChecked = personalInfo && termsOfUse && locationService;
        setAllAgreed(allChecked);
    };

    const handleNext = () => {
        if (!personalInfo || !termsOfUse) {
            alert('필수 약관에 동의해주세요.');
            return;
        }
        onNext();
    };

    const handleTermClick = (e: React.MouseEvent, termType: TermType) => {
        e.stopPropagation();
        setSelectedTerm(termType);
    };

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    padding: '40px',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(45, 139, 95, 0.2)',
                    border: '1px solid rgba(45, 139, 95, 0.1)'
                }}
            >
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: '#2D8B5F', marginBottom: '8px' }}>
                        회원가입
                    </h2>
                    <p style={{ color: '#666', fontSize: '14px' }}>
                        서비스 이용을 위해 아래의 권리 개인정보를 수집합니다
                    </p>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '16px' }}>
                        이용 약관 동의
                    </h3>
                    <p style={{ fontSize: '12px', color: '#666', marginBottom: '8px', lineHeight: '1.6' }}>
                        에어비 퍼블리시 회원가입 및 서비스 제공을 위해 아래와 같이 개인정보를 수집합니다. 내용을 자세히 읽은 후 동의하여 주십시오.
                    </p>
                    <p style={{ fontSize: '12px', color: '#666', fontWeight: '600', marginBottom: '16px' }}>
                        개인정보 수집·이용 내역
                    </p>
                    <p style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>
                        • 수집목적: 네트워크, 이메일, 비밀번호
                    </p>
                </div>

                {/* 전체 동의 */}
                <div
                    onClick={() => handleAllAgreedChange(!allAgreed)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        background: 'rgba(45, 139, 95, 0.08)',
                        borderRadius: '12px',
                        marginBottom: '16px',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    <CustomCheckbox checked={allAgreed} />
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#2D8B5F' }}>
                        전체 동의
                    </span>
                </div>

                {/* 개별 약관 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            userSelect: 'none'
                        }}
                    >
                        <div
                            onClick={() => {
                                setPersonalInfo(!personalInfo);
                                setTimeout(handleIndividualChange, 0);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                        >
                            <CustomCheckbox checked={personalInfo} />
                            <span style={{ fontSize: '14px', color: '#333' }}>
                                개인정보 수집 및 이용 동의
                            </span>
                        </div>
                        <span
                            onClick={(e) => handleTermClick(e, 'personal')}
                            style={{ fontSize: '20px', color: '#ccc', cursor: 'pointer', padding: '8px' }}
                        >
                            ›
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            userSelect: 'none'
                        }}
                    >
                        <div
                            onClick={() => {
                                setTermsOfUse(!termsOfUse);
                                setTimeout(handleIndividualChange, 0);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                        >
                            <CustomCheckbox checked={termsOfUse} />
                            <span style={{ fontSize: '14px', color: '#333' }}>
                                이용 약관 동의
                            </span>
                        </div>
                        <span
                            onClick={(e) => handleTermClick(e, 'terms')}
                            style={{ fontSize: '20px', color: '#ccc', cursor: 'pointer', padding: '8px' }}
                        >
                            ›
                        </span>
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px',
                            userSelect: 'none'
                        }}
                    >
                        <div
                            onClick={() => {
                                setLocationService(!locationService);
                                setTimeout(handleIndividualChange, 0);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, cursor: 'pointer' }}
                        >
                            <CustomCheckbox checked={locationService} />
                            <span style={{ fontSize: '14px', color: '#333' }}>
                                위치기반 서비스 이용 동의
                            </span>
                        </div>
                        <span
                            onClick={(e) => handleTermClick(e, 'location')}
                            style={{ fontSize: '20px', color: '#ccc', cursor: 'pointer', padding: '8px' }}
                        >
                            ›
                        </span>
                    </div>
                </div>

                {/* 버튼들 - 돌아가기와 다음 버튼을 나란히 배치 */}
                <div style={{ display: 'flex', gap: '12px' }}>
                    <motion.button
                        type="button"
                        onClick={onBack}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            flex: 1,
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
                        돌아가기
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={handleNext}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        style={{
                            flex: 1,
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
                        다음
                    </motion.button>
                </div>
            </motion.div>

            {/* 약관 상세 모달 */}
            {selectedTerm && (
                <TermsDetailModal
                    title={TERMS_CONTENT[selectedTerm].title}
                    content={TERMS_CONTENT[selectedTerm].content}
                    onClose={() => setSelectedTerm(null)}
                />
            )}
        </>
    );
}

interface CustomCheckboxProps {
    checked: boolean;
}

function CustomCheckbox({ checked }: CustomCheckboxProps) {
    return (
        <div
            style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                border: '2px solid',
                borderColor: checked ? '#2D8B5F' : '#ddd',
                background: checked ? '#2D8B5F' : 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s ease',
                flexShrink: 0
            }}
        >
            {checked && <Check size={16} color="white" strokeWidth={3} />}
        </div>
    );
}

interface TermsDetailModalProps {
    title: string;
    content: string;
    onClose: () => void;
}

function TermsDetailModal({ title, content, onClose }: TermsDetailModalProps) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000,
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                style={{
                    width: '100%',
                    maxWidth: '500px',
                    maxHeight: '80vh',
                    background: 'white',
                    borderRadius: '20px',
                    padding: '32px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '24px'
                }}>
                    <h3 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2D8B5F', margin: 0 }}>
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#666'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                <div style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '16px',
                    background: '#f8f9fa',
                    borderRadius: '12px',
                    marginBottom: '24px'
                }}>
                    <p style={{
                        fontSize: '14px',
                        color: '#333',
                        lineHeight: '1.8',
                        whiteSpace: 'pre-line',
                        margin: 0
                    }}>
                        {content}
                    </p>
                </div>

                <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
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
                    확인
                </motion.button>
            </motion.div>
        </motion.div>
    );
}
