// 정규식 및 유효성 검사 유틸리티

// 아이디: 영문자와 숫자만 허용 (특수문자, 한글 불가)
export const USERNAME_REGEX = /^[a-zA-Z0-9]+$/;

// 이름: 한글만 허용 (영어, 숫자, 특수문자 불가)
export const NAME_REGEX = /^[가-힣]+$/;

// 비밀번호 검증 규칙
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 16;

// 비밀번호: 영어가 포함되어 있는지 확인
export const hasEnglish = (password: string): boolean => {
    const englishRegex = /[a-zA-Z]/;
    return englishRegex.test(password);
};

// 비밀번호: 특수문자가 최소 1개 포함되어 있는지 확인
export const hasSpecialChar = (password: string): boolean => {
    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    return specialCharRegex.test(password);
};

// 비밀번호: 숫자가 최소 3개 포함되어 있는지 확인
export const hasMinNumbers = (password: string): boolean => {
    const numbers = password.match(/\d/g);
    return numbers !== null && numbers.length >= 3;
};

// 유효성 검사 함수들
export interface ValidationResult {
    isValid: boolean;
    errorMessage?: string;
}

// 아이디 유효성 검사
export const validateUsername = (username: string): ValidationResult => {
    if (!username) {
        return { isValid: false, errorMessage: '아이디를 입력해주세요.' };
    }
    if (!USERNAME_REGEX.test(username)) {
        return { isValid: false, errorMessage: '아이디는 영문자와 숫자만 사용할 수 있습니다.' };
    }
    return { isValid: true };
};

// 이름 유효성 검사
export const validateName = (name: string): ValidationResult => {
    if (!name) {
        return { isValid: false, errorMessage: '이름을 입력해주세요.' };
    }
    if (!NAME_REGEX.test(name)) {
        return { isValid: false, errorMessage: '이름은 한글만 입력 가능합니다.' };
    }
    return { isValid: true };
};

// 비밀번호 유효성 검사
export const validatePassword = (password: string): ValidationResult => {
    if (!password) {
        return { isValid: false, errorMessage: '비밀번호를 입력해주세요.' };
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
        return { isValid: false, errorMessage: `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.` };
    }
    if (password.length > PASSWORD_MAX_LENGTH) {
        return { isValid: false, errorMessage: `비밀번호는 최대 ${PASSWORD_MAX_LENGTH}자까지 입력 가능합니다.` };
    }
    if (!hasEnglish(password)) {
        return { isValid: false, errorMessage: '비밀번호에 영어를 포함해야 합니다.' };
    }
    if (!hasSpecialChar(password)) {
        return { isValid: false, errorMessage: '비밀번호에 특수문자를 최소 1개 포함해야 합니다.' };
    }
    if (!hasMinNumbers(password)) {
        return { isValid: false, errorMessage: '비밀번호에 숫자를 최소 3개 포함해야 합니다.' };
    }
    return { isValid: true };
};

// 닉네임 유효성 검사 (기본적인 체크만, 중복 확인은 API 호출 필요)
export const validateNickname = (nickname: string): ValidationResult => {
    if (!nickname) {
        return { isValid: false, errorMessage: '닉네임을 입력해주세요.' };
    }
    if (nickname.length < 2) {
        return { isValid: false, errorMessage: '닉네임은 최소 2자 이상이어야 합니다.' };
    }
    return { isValid: true };
};

// 비밀번호 강도 표시를 위한 헬퍼 함수
export interface PasswordStrength {
    hasValidLength: boolean;
    hasEnglish: boolean;
    hasSpecialChar: boolean;
    hasMinNumbers: boolean;
}

export const getPasswordStrength = (password: string): PasswordStrength => {
    return {
        hasValidLength: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
        hasEnglish: hasEnglish(password),
        hasSpecialChar: hasSpecialChar(password),
        hasMinNumbers: hasMinNumbers(password)
    };
};

// 이메일 유효성 검사
export const validateEmail = (email: string): ValidationResult => {
    if (!email) {
        return { isValid: false, errorMessage: '이메일을 입력해주세요.' };
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, errorMessage: '올바른 이메일 형식이 아닙니다.' };
    }
    return { isValid: true };
};

// 전화번호 유효성 검사 (한국 전화번호 형식)
export const validatePhone = (phone: string): ValidationResult => {
    if (!phone) {
        return { isValid: false, errorMessage: '전화번호를 입력해주세요.' };
    }
    const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
    if (!phoneRegex.test(phone)) {
        return { isValid: false, errorMessage: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)' };
    }
    return { isValid: true };
};

// 생년월일 유효성 검사
export const validateBirth = (birth: string): ValidationResult => {
    if (!birth) {
        return { isValid: false, errorMessage: '생년월일을 입력해주세요.' };
    }
    const birthDate = new Date(birth);
    const today = new Date();
    const minAge = 14; // 최소 나이 제한
    const maxAge = 120; // 최대 나이 제한

    const age = today.getFullYear() - birthDate.getFullYear();

    if (isNaN(birthDate.getTime())) {
        return { isValid: false, errorMessage: '올바른 날짜 형식이 아닙니다.' };
    }
    if (birthDate > today) {
        return { isValid: false, errorMessage: '생년월일은 오늘 이전이어야 합니다.' };
    }
    if (age < minAge) {
        return { isValid: false, errorMessage: `만 ${minAge}세 이상만 가입할 수 있습니다.` };
    }
    if (age > maxAge) {
        return { isValid: false, errorMessage: '올바른 생년월일을 입력해주세요.' };
    }
    return { isValid: true };
};
