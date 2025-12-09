import { motion } from "motion/react";
import { Train } from "lucide-react";
import skyImage from "../assets/bg.png";

interface HeroSectionProps {
  onLogin: () => void;
  onSignup: () => void;
}

export function HeroSection({ onLogin, onSignup }: HeroSectionProps) {
  return (
    <section style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* 1. 배경 이미지 (고정! 움직임 없음) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${skyImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "brightness(0.9)", // 글씨 잘 보이게 살짝 어둡게
          zIndex: 0
        }}
      />

      {/* 배경 위에 살짝 어두운 막 (글씨 가독성용) */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.3), transparent)',
        zIndex: 1
      }} />

      {/* 2. 움직이는 기차 (얘만 움직임!) */}
      <motion.div
        style={{
          position: 'absolute',
          bottom: '25%', // 기차 높이 조절
          left: 0,
          zIndex: 10
        }}
        initial={{ x: "-50vw" }} // 화면 왼쪽 밖에서 시작
        animate={{ x: "120vw" }}   // 화면 오른쪽 끝까지 이동
        transition={{
          duration: 25, // 속도 (숫자가 클수록 느림)
          repeat: Infinity,
          ease: "linear",
          repeatDelay: 0,
        }}
      >
        <TrainIllustration />
      </motion.div>

      {/* 3. 메인 텍스트 & 버튼 (고정) */}
      <div style={{
        position: 'relative',
        zIndex: 20,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 16px',
        textAlign: 'center'
      }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <h1 style={{
            fontFamily: "Georgia, serif",
            fontSize: "clamp(2rem, 8vw, 5rem)", // 반응형 폰트 크기
            lineHeight: "1.2",
            color: "white",
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            marginBottom: "24px"
          }}>
            TRIP PLANNER
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2vw, 1.5rem)",
            color: "rgba(255,255,255,0.9)",
            marginBottom: "48px",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)"
          }}>
            trip is free
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <motion.button
              onClick={onLogin}
              style={{
                position: 'relative',
                padding: '16px 35px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.2)', // 반투명 배경
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)', // 유리 효과
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '15px'
              }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Train size={24} />
              로그인
            </motion.button>

            {/* <motion.button
              onClick={onSignup}
              style={{
                position: 'relative',
                padding: '16px 48px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.2)', // 반투명 배경
                border: '2px solid rgba(255,255,255,0.4)',
                color: 'white',
                fontSize: '1.25rem',
                fontWeight: '500',
                cursor: 'pointer',
                backdropFilter: 'blur(10px)', // 유리 효과
                overflow: 'hidden',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px'
              }}
              whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.98 }}
            >
              <Train size={24} />
              회원가입
            </motion.button> */}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// 기차 그림 컴포넌트 (그대로 유지)
function TrainIllustration() {
  return (
    <div style={{ width: "400px", height: "200px", position: 'relative' }}>
      {/* 그림자 */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '8px', backgroundColor: 'rgba(0,0,0,0.2)', filter: 'blur(4px)' }} />

      {/* 기차 본체 SVG */}
      <svg viewBox="0 0 400 200" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 10px 10px rgba(0,0,0,0.3))' }}>
        <g>
          {/* 지붕 */}
          <rect x="50" y="80" width="300" height="80" rx="8" fill="#F5F5DC" />
          <rect x="50" y="80" width="300" height="40" rx="8" fill="#FFFACD" />
          {/* 하단 띠 */}
          <rect x="50" y="105" width="300" height="20" fill="#90EE90" />

          {/* 창문들 */}
          <rect x="70" y="90" width="50" height="35" rx="4" fill="#87CEEB" opacity="0.7" />
          <rect x="140" y="90" width="50" height="35" rx="4" fill="#87CEEB" opacity="0.7" />
          <rect x="210" y="90" width="50" height="35" rx="4" fill="#87CEEB" opacity="0.7" />
          <rect x="280" y="90" width="50" height="35" rx="4" fill="#87CEEB" opacity="0.7" />

          {/* 창문 반사광 */}
          <rect x="75" y="95" width="15" height="10" rx="2" fill="white" opacity="0.5" />
          <rect x="145" y="95" width="15" height="10" rx="2" fill="white" opacity="0.5" />
          <rect x="215" y="95" width="15" height="10" rx="2" fill="white" opacity="0.5" />
          <rect x="285" y="95" width="15" height="10" rx="2" fill="white" opacity="0.5" />

          {/* 바퀴 */}
          <circle cx="100" cy="165" r="18" fill="#333" />
          <circle cx="100" cy="165" r="12" fill="#666" />
          <circle cx="180" cy="165" r="18" fill="#333" />
          <circle cx="180" cy="165" r="12" fill="#666" />
          <circle cx="260" cy="165" r="18" fill="#333" />
          <circle cx="260" cy="165" r="12" fill="#666" />

          {/* 운전석 앞부분 */}
          <rect x="340" y="90" width="15" height="60" rx="4" fill="#8B4513" />
          <rect x="310" y="125" width="25" height="35" rx="2" fill="#8B4513" />
          <circle cx="330" cy="142" r="2" fill="#FFD700" />
        </g>
      </svg>
    </div>
  );
}