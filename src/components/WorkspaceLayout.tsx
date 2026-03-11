import { motion } from "motion/react";
import { Send, MapPin, Calendar, UtensilsCrossed, Flag, Star, BookOpen } from "lucide-react";

// 1. 여기에 'userName'을 받을 거라고 명시(Interface 정의)합니다.
interface WorkspaceLayoutProps {
  userName?: string;
}

// 2. 컴포넌트 함수 인자에서 { userName }을 받아옵니다.
export function WorkspaceLayout({ userName }: WorkspaceLayoutProps) {

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      backgroundColor: 'rgba(0,0,0,0.6)', // 배경 살짝 어둡게 (집중 모드)
      backdropFilter: 'blur(5px)',
      padding: '40px',
      boxSizing: 'border-box',
      gap: '40px'
    }}>

      {/* --- [왼쪽 30%] AI 챗봇 영역 --- */}
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          flex: 3,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderRadius: '24px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          border: '1px solid rgba(255,255,255,0.5)'
        }}
      >
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#2E4A3D', marginBottom: '4px' }}>
            AI 여행 가이드
          </h2>
          {/* 3. 여기서 받아온 이름을 보여줍니다! (없으면 '여행자'라고 뜸) */}
          <p style={{ color: '#557F6A', fontSize: '0.9rem' }}>
            반가워요, <span style={{ fontWeight: 'bold', color: '#6B9D7A' }}>{userName || '여행자'}</span>님!
            <br />어디로 떠나실 건가요?
          </p>
        </div>

        {/* 채팅 내용 영역 (예시) */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ alignSelf: 'flex-start', backgroundColor: '#F0FFF0', padding: '12px 16px', borderRadius: '16px 16px 16px 4px', color: '#333', fontSize: '0.95rem' }}>
            안녕하세요! {userName}님의 취향에 딱 맞는 여행지를 찾아드릴게요. 🌿
          </div>
        </div>

        {/* 입력창 */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="예: 제주도 힐링 코스 추천해줘"
            style={{
              width: '100%',
              padding: '14px 48px 14px 16px',
              borderRadius: '99px',
              border: '1px solid #ddd',
              outline: 'none',
              backgroundColor: '#F8F9FA'
            }}
          />
          <button style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#6B9D7A' }}>
            <Send size={20} />
          </button>
        </div>
      </motion.div>


      {/* --- [오른쪽 70%] 다이어리 영역 --- */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          flex: 7,
          position: 'relative',
          perspective: '1500px' // 3D 효과를 위한 원근감
        }}
      >
        {/* 실제 다이어리 책 모양 */}
        <div style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#F5F5DC', // 종이 색상
          borderRadius: '12px 24px 24px 12px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          display: 'flex',
          overflow: 'hidden',
          position: 'relative' // 인덱스 탭 기준점
        }}>

          {/* 왼쪽 페이지 (속지) */}
          <div style={{ flex: 1, borderRight: '1px solid #e0e0d0', padding: '40px', backgroundColor: '#fffdf5' }}>
            <h3 style={{ fontFamily: 'serif', fontSize: '1.5rem', color: '#8B4513', borderBottom: '2px solid #8B4513', paddingBottom: '10px', marginBottom: '20px' }}>
              Journey Schedule
            </h3>
            {/* 줄 노트 느낌 */}
            <div style={{ lineHeight: '2.5rem', backgroundImage: 'linear-gradient(#e0e0d0 1px, transparent 1px)', backgroundSize: '100% 2.5rem' }}>
              <p style={{ color: '#555' }}>1일차: 도착 및 숙소 체크인...</p>
              <p style={{ color: '#555' }}>2일차:</p>
            </div>
          </div>

          {/* 오른쪽 페이지 (지도/사진) */}
          <div style={{ flex: 1, padding: '40px', backgroundColor: '#fffdf5', position: 'relative' }}>
            <div style={{ width: '100%', height: '100%', backgroundColor: '#eef', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#99a' }}>
              지도 API 영역 (Kakao Map)
            </div>
          </div>

          {/* --- 인덱스 탭 (책 오른쪽 바깥에 붙이기) --- */}
          <div style={{ position: 'absolute', right: 0, top: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { icon: Calendar, label: '일정', color: '#FFB6C1' },
              { icon: MapPin, label: '숙소', color: '#87CEEB' },
              { icon: UtensilsCrossed, label: '맛집', color: '#90EE90' },
              { icon: Flag, label: '미션', color: '#DDA0DD' },
              { icon: Star, label: '엔딩', color: '#FFD700' },
            ].map((tab, i) => (
              <div key={i} style={{
                width: '50px',
                height: '40px',
                backgroundColor: tab.color,
                borderRadius: '8px 0 0 8px', // 왼쪽만 둥글게 (책 안쪽으로 들어간 느낌) -> 반대로 하려면 오른쪽으로 빼야함
                // 수정: 책 오른쪽 바깥으로 튀어나오게 하려면 레이아웃을 좀 더 복잡하게 짜야하는데, 
                // 일단은 책 안쪽 오른편에 붙여둘게요. (원하시면 책 바깥으로 빼는 스타일로 바꿔드려요!)
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '-2px 2px 5px rgba(0,0,0,0.1)',
                transform: 'translateX(10px)' // 살짝 튀어나오게
              }}>
                <tab.icon size={20} color="white" />
              </div>
            ))}
          </div>

        </div>
      </motion.div>
    </div>
  );
}