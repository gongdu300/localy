import { motion, AnimatePresence } from 'motion/react';
import { Settings, Bell, MapPin, Plus, X, Plane, Train, Globe, Sparkles, Hand, Calendar, Lightbulb, BarChart3, Building2, Home, TreePine, Mountain, Wallet, Backpack, Camera } from 'lucide-react';
import { TravelChatBot } from './TravelChatBot';
import { MapScreen } from './MapScreen';
import { TravelDetailView } from './TravelDetailView';
import { PasswordEditScreen } from './PasswordEditScreen';
import { PersonalInfoEditScreen } from './PersonalInfoEditScreen';
import { PersonaEditScreen } from './PersonaEditScreen';
import { useState, useEffect } from 'react';
import { TravelScheduleEditor } from './TravelScheduleEditor';
import { BottomNav } from './BottomNav';
import { TripCardSlider } from './TripCardSlider';
import chatbotAvatar from '../assets/chatbot.jpg';

const myUrl = window.location.protocol + "//" + window.location.hostname + ":8000";

interface TravelItem {
    id: number;
    title: string;
    image: string;
    startDate: string;
    endDate: string;
    participants: number;
    destination: string;
    places: any[];
}

// 더미 여행 카드 인터페이스
interface TravelCard {
    id: number;
    title: string;
    destination: string;
    date: string;
    gradient: string;
    shadowColor?: string; // 유색 그림자용
    participants?: number;
    image?: string;
}

interface Notification {
    id: number;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
}

// 인기 여행지 인터페이스
interface PopularDestination {
    id: number;
    name: string;
    location: string;
    image: string;
    gradient: string;
    description: string;
}

const sampleNotifications: Notification[] = [
    {
        id: 1,
        title: '새로운 축제 소식',
        message: '제주 동백꽃 축제가 다음 주에 시작됩니다!',
        time: '5분 전',
        isRead: false
    }
];

// 하드코딩된 샘플 여행 데이터
const sampleTravelItems: TravelItem[] = [
    {
        id: 1001,
        title: '부산 해운대 여행',
        destination: '부산광역시',
        startDate: '2025-12-20',
        endDate: '2025-12-23',
        participants: 3,
        image: 'url(https://images.unsplash.com/photo-1536098561742-ca998e48cbcc?w=800&q=80)', // 부산 해운대
        places: []
    },
    {
        id: 1002,
        title: '제주 한라산 트레킹',
        destination: '제주특별자치도',
        startDate: '2025-12-25',
        endDate: '2025-12-28',
        participants: 2,
        image: 'url(https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80)', // 제주 한라산
        places: []
    },
    {
        id: 1003,
        title: '강릉 겨울바다',
        destination: '강원도 강릉시',
        startDate: '2026-01-05',
        endDate: '2026-01-07',
        participants: 4,
        image: 'url(https://images.unsplash.com/photo-1583037189850-1921ae7c6c22?w=800&q=80)', // 강릉 겨울바다
        places: []
    }
];

// 인기 여행지 데이터
const popularDestinations: PopularDestination[] = [
    {
        id: 1,
        name: '경주 불국사',
        location: '경상북도 경주시',
        gradient: 'linear-gradient(135deg, #FFF4E1 0%, #FFE5B4 100%)',
        image: 'Building2',
        description: '천년 고도의 아름다운 사찰'
    },
    {
        id: 2,
        name: '남해 독일마을',
        location: '경상남도 남해군',
        gradient: 'linear-gradient(135deg, #E8F4F8 0%, #BDE0FE 100%)',
        image: 'Home',
        description: '이국적인 풍경의 해안 마을'
    },
    {
        id: 3,
        name: '담양 죽녹원',
        location: '전라남도 담양군',
        gradient: 'linear-gradient(135deg, #E8F8E8 0%, #C1E1C1 100%)',
        image: 'TreePine',
        description: '시원한 대나무 숲길'
    },
    {
        id: 4,
        name: '속초 설악산',
        location: '강원도 속초시',
        gradient: 'linear-gradient(135deg, #FFF0F5 0%, #FFD7E5 100%)',
        image: 'Mountain',
        description: '웅장한 산과 아름다운 단풍'
    }
];

// [수정] 부드러운 파스텔톤 + 유색 그림자 적용
const dummyTravelCards: TravelCard[] = [
    {
        id: 101,
        title: '강남 여행',
        destination: '서울 강남구',
        date: '12.15 - 12.17',
        // 부드러운 라벤더 파스텔
        gradient: 'linear-gradient(135deg, #E0C3FC 0%, #ADA7FF 100%)',
        shadowColor: 'rgba(173, 167, 255, 0.35)'
    },
    {
        id: 102,
        title: '부산 여행',
        destination: '부산광역시',
        date: '12.20 - 12.23',
        // 따뜻한 코랄 핑크 파스텔
        gradient: 'linear-gradient(135deg, #FFD1DC 0%, #FFABAB 100%)',
        shadowColor: 'rgba(255, 171, 171, 0.35)'
    },
    {
        id: 103,
        title: '제주도 여행',
        destination: '제주특별자치도',
        date: '12.25 - 12.28',
        // 상쾌한 민트 파스텔
        gradient: 'linear-gradient(135deg, #C9F0DB 0%, #A8E6CF 100%)',
        shadowColor: 'rgba(168, 230, 207, 0.35)'
    }
];
interface TravelDashboardProps {
    onLogoClick?: () => void;
}

export function TravelDashboard({ onLogoClick }: TravelDashboardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isPasswordEditOpen, setIsPasswordEditOpen] = useState(false);
    const [isPersonalInfoEditOpen, setIsPersonalInfoEditOpen] = useState(false);
    const [isPersonaEditOpen, setIsPersonaEditOpen] = useState(false);
    const [isChatBotDragging, setIsChatBotDragging] = useState(false);
    const [isMyPageOpen, setIsMyPageOpen] = useState(false); // 마이페이지 상태 추가
    const [activeTab, setActiveTab] = useState<'home' | 'notifications' | 'my' | 'settings'>('home');
    const [notifications] = useState<Notification[]>(sampleNotifications);
    const [isChatBotOpen, setIsChatBotOpen] = useState(false);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [isNotificationEnabled, setIsNotificationEnabled] = useState(true);
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
    const [tripData, setTripData] = useState<{ participants: number; startDate: string; endDate: string; region: string } | null>(null);
    const [selectedTravel, setSelectedTravel] = useState<TravelItem | null>(null);
    const [isDetailViewOpen, setIsDetailViewOpen] = useState(false);
    const [isScheduleEditorOpen, setIsScheduleEditorOpen] = useState(false);

    // 현재 로그인한 사용자 ID 가져오기
    const getUserId = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.user_id || 'guest';
            } catch (e) {
                return 'guest';
            }
        }
        return 'guest';
    };

    // localStorage에서 사용자별 travels 상태 초기화
    const [travels, setTravels] = useState<TravelItem[]>(() => {
        const userId = getUserId();
        const saved = localStorage.getItem(`travels_${userId}`);
        // localStorage에 데이터가 없으면 샘플 데이터 사용
        return saved ? JSON.parse(saved) : sampleTravelItems;
    });

    // 더미 카드 상태 관리 (동적 렌더링)
    const [travelCards, setTravelCards] = useState<TravelCard[]>([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(1); // 중앙 카드 인덱스

    // travels 상태를 travelCards로 변환
    useEffect(() => {
        const gradients = [
            { gradient: 'linear-gradient(135deg, #E0C3FC 0%, #ADA7FF 100%)', shadowColor: 'rgba(173, 167, 255, 0.35)' },
            { gradient: 'linear-gradient(135deg, #FFD1DC 0%, #FFABAB 100%)', shadowColor: 'rgba(255, 171, 171, 0.35)' },
            { gradient: 'linear-gradient(135deg, #C9F0DB 0%, #A8E6CF 100%)', shadowColor: 'rgba(168, 230, 207, 0.35)' },
            { gradient: 'linear-gradient(135deg, #FFF9C4 0%, #FFE082 100%)', shadowColor: 'rgba(255, 224, 130, 0.35)' },
            { gradient: 'linear-gradient(135deg, #E1BEE7 0%, #CE93D8 100%)', shadowColor: 'rgba(206, 147, 216, 0.35)' },
        ];

        const cards: TravelCard[] = travels.map((travel, index) => {
            const colorScheme = gradients[index % gradients.length];

            // travel.image가 url()로 시작하면 그대로 사용, 아니면 gradient 사용
            let finalImage = colorScheme.gradient;
            if (travel.image && travel.image.startsWith('url(')) {
                finalImage = travel.image;
            }

            return {
                id: travel.id,
                title: `${travel.destination} 여행`,
                destination: travel.destination,
                date: formatDateRange(travel.startDate, travel.endDate),
                gradient: colorScheme.gradient,
                shadowColor: colorScheme.shadowColor,
                participants: travel.participants,
                image: finalImage
            };
        });
        setTravelCards(cards);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [travels]);

    // 일정 저장 핸들러 (중복 방지 + 이미지 자동 검색)
    const handleScheduleSave = async (newTravel: TravelItem) => {
        // 중복 확인: 같은 destination과 날짜가 있는지 체크
        const isDuplicate = travels.some(travel =>
            travel.destination === newTravel.destination &&
            travel.startDate === newTravel.startDate &&
            travel.endDate === newTravel.endDate
        );

        if (isDuplicate) {
            alert('이미 동일한 일정이 저장되어 있습니다.');
            return;
        }

        // 이미지가 없으면 백엔드 API로 랜드마크 이미지 검색
        let travelWithImage = { ...newTravel };
        if (!newTravel.image || newTravel.image.startsWith('linear-gradient')) {
            console.log('🖼️ Fetching landmark image for:', newTravel.destination);
            try {
                const response = await fetch(`${myUrl}/api/search/landmark-image`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ destination: newTravel.destination })
                });

                console.log('API Response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('API Response data:', data);
                    if (data.image_url) {
                        travelWithImage.image = `url(${data.image_url})`;
                        console.log('✅ Image URL set:', travelWithImage.image);
                    } else {
                        console.log('⚠️ No image_url in response');
                    }
                } else {
                    console.error('❌ API request failed:', response.statusText);
                }
            } catch (error) {
                console.error('❌ Failed to fetch landmark image:', error);
                // 실패해도 계속 진행 (gradient 사용)
            }
        } else {
            console.log('Image already exists:', newTravel.image);
        }

        const userId = getUserId();
        const updatedTravels = [...travels, travelWithImage];
        setTravels(updatedTravels);
        localStorage.setItem(`travels_${userId}`, JSON.stringify(updatedTravels));

        // 저장 후 맵 닫기
        setIsMapOpen(false);
    };

    const handleNewTravelSave = async (travelData: any) => {
        const newTravel: TravelItem = {
            id: Date.now(),
            title: travelData.title,
            destination: travelData.destination,
            startDate: travelData.startDate,
            endDate: travelData.endDate,
            participants: travelData.participants,
            image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Default gradient
            places: travelData.places
        };

        // 이미지 자동 검색
        let travelWithImage = { ...newTravel };
        console.log('🖼️ Fetching landmark image for:', newTravel.destination);
        try {
            const response = await fetch(`${myUrl}/api/search/landmark-image`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ destination: newTravel.destination })
            });

            console.log('API Response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('API Response data:', data);
                if (data.image_url) {
                    travelWithImage.image = `url(${data.image_url})`;
                    console.log('✅ Image URL set:', travelWithImage.image);
                } else {
                    console.log('⚠️ No image_url in response');
                }
            } else {
                console.error('❌ API request failed:', response.statusText);
            }
        } catch (error) {
            console.error('❌ Failed to fetch landmark image:', error);
            // 실패해도 계속 진행 (gradient 사용)
        }

        const userId = getUserId();
        const updatedTravels = [...travels, travelWithImage];
        setTravels(updatedTravels);
        localStorage.setItem(`travels_${userId}`, JSON.stringify(updatedTravels));
        setIsScheduleEditorOpen(false);
    };

    // 일정 삭제 핸들러
    const handleScheduleDelete = (travelId: number) => {
        const userId = getUserId();
        const updatedTravels = travels.filter(travel => travel.id !== travelId);
        setTravels(updatedTravels);
        localStorage.setItem(`travels_${userId}`, JSON.stringify(updatedTravels));
    };

    // 로그아웃 핸들러
    const handleLogout = () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            localStorage.removeItem('user');  // 유저 정보 삭제
            localStorage.removeItem('token'); // [추가] 토큰(세션) 삭제
            // 자동 로그인 정보 삭제
            localStorage.removeItem('autoLogin');
            localStorage.removeItem('savedUsername');
            localStorage.removeItem('savedPassword');
            window.location.href = '/';
        }
    };

    // 회원탈퇴 핸들러
    const handleWithdraw = async () => {
        if (!window.confirm('정말로 회원탈퇴 하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.')) {
            return;
        }

        const userId = getUserId(); // 아까 만든 그 함수 사용!

        try {
            // 1. 백엔드에 삭제 요청 보내기
            const response = await fetch(`${myUrl}/auth/withdraw/${userId}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                alert('회원 탈퇴가 완료되었습니다.\n이용해 주셔서 감사합니다.');

                // 2. 브라우저에 남은 흔적 지우기 (로그아웃과 동일)
                localStorage.clear();
                window.location.href = '/';
            } else {
                alert('회원 탈퇴 처리에 실패했습니다. 관리자에게 문의해주세요.');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            alert('서버 연결 중 오류가 발생했습니다.');
        }
    };

    // localStorage에서 사용자 정보 가져오기
    const getUserName = () => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                return user.user_nickname || "사용자";
            } catch (e) {
                return "사용자";
            }
        }
        return "사용자";
    };

    const userId = getUserId();
    const userName = getUserName();
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const formatDateRange = (start: string, end: string) => {
        if (!start || !end) return 'N/A';
        const startDate = new Date(start);
        const endDate = new Date(end);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return 'N/A';
        return `${startDate.getMonth() + 1}/${startDate.getDate()} - ${endDate.getMonth() + 1}/${endDate.getDate()}`;
    };

    return (
        <div style={{
            width: '100%',
            minHeight: '100vh',
            // 파스텔 톤앤톤 배경 (수채화 감성)
            background: `
                radial-gradient(at 85% 15%, rgba(224, 195, 252, 0.4) 0, transparent 50%),
                radial-gradient(at 15% 55%, rgba(240, 255, 240, 0.3) 0, transparent 50%),
                radial-gradient(at 70% 85%, rgba(255, 235, 245, 0.35) 0, transparent 50%),
                radial-gradient(at 30% 25%, rgba(180, 212, 232, 0.25) 0, transparent 50%),
                #F9FCF5
            `,
            display: 'flex',
            flexDirection: 'column',
            paddingBottom: '100px' // 하단 네비게이션 공간 넉넉히 확보
        }}>
            {/* Header (글래스모피즘) - 로고만 표시 */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px 30px',
                    backgroundColor: 'rgba(255, 255, 255, 0.45)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderTop: 'none',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.06)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 100
                }}
            >
                <div
                    onClick={onLogoClick}
                    style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #89C765 0%, #6FB558 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        cursor: 'pointer',
                        userSelect: 'none'
                    }}
                >
                    ODIGANYANG 😻
                </div>
            </motion.header>

            {/* Main Content */}
            < main style={{
                flex: 1,
                padding: '20px',
                width: '100%',
                maxWidth: '600px', // 모바일 뷰처럼 보이게 제한
                margin: '0 auto',
                overflowX: 'hidden' // 가로 스크롤 방지
            }
            }>
                {/* 광고 배너 영역 */}
                < motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{
                        background: 'linear-gradient(135deg, #89C765 0%, #6FB558 100%)',
                        borderRadius: '20px',
                        padding: '40px 30px',
                        marginBottom: '30px',
                        textAlign: 'center',
                        boxShadow: '0 6px 24px rgba(137, 199, 101, 0.3)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}
                >
                    {/* 배경 장식 - lucide-react 아이콘 */}
                    < div style={{
                        position: 'absolute',
                        top: '20px',
                        right: '30px',
                        opacity: 0.15
                    }}>
                        <Plane size={64} color="white" strokeWidth={1.5} />
                    </div >
                    <div style={{
                        position: 'absolute',
                        bottom: '20px',
                        left: '30px',
                        opacity: 0.15
                    }}>
                        <Train size={48} color="white" strokeWidth={1.5} />
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        margin: '0 0 10px 0',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        <h1 style={{
                            margin: 0,
                            fontSize: '28px',
                            fontWeight: 'bold',
                            color: 'white'
                        }}>
                            새로운 여행의 시작
                        </h1>
                        <Sparkles size={24} color="white" fill="white" opacity={0.9} />
                    </div>
                    <p style={{
                        margin: 0,
                        fontSize: '15px',
                        color: 'rgba(255, 255, 255, 0.9)',
                        position: 'relative',
                        zIndex: 1
                    }}>
                        오디가냥에서 특별한 추억을 만들어보세요
                    </p>
                </motion.div >

                {/* CGV-Style Coverflow 여행 카드 슬라이더 */}
                < div className="mt-8" >
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#4A5A40',
                        marginBottom: '10px',
                        paddingLeft: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        내 여행 계획
                        <Calendar size={20} strokeWidth={2.5} />
                    </h2>
                    {/* 카드 슬라이더 컴포넌트 */}
                    <TripCardSlider
                        cards={travelCards}
                        onCardClick={(card) => {
                            const travel = travels.find(t => t.id === card.id);
                            if (travel) {
                                setSelectedTravel(travel);
                                setIsDetailViewOpen(true);
                            }
                        }}
                    />
                </div >

                {/* 인기 여행지 섹션 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    style={{ marginTop: '40px' }}
                >
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#4A5A40',
                        marginBottom: '16px',
                        paddingLeft: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        인기 여행지
                        <MapPin size={20} strokeWidth={2.5} />
                    </h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '16px',
                        paddingLeft: '10px',
                        paddingRight: '10px'
                    }}>
                        {popularDestinations.map((destination) => (
                            <motion.div
                                key={destination.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                style={{
                                    background: destination.gradient,
                                    borderRadius: '16px',
                                    padding: '20px',
                                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                                    cursor: 'pointer',
                                    textAlign: 'center',
                                    border: '1px solid rgba(255, 255, 255, 0.5)',
                                    backdropFilter: 'blur(10px)'
                                }}
                            >
                                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
                                    {destination.image === 'Building2' && <Building2 size={48} strokeWidth={1.5} color="#8B6C42" />}
                                    {destination.image === 'Home' && <Home size={48} strokeWidth={1.5} color="#5A9FD4" />}
                                    {destination.image === 'TreePine' && <TreePine size={48} strokeWidth={1.5} color="#6B8E5D" />}
                                    {destination.image === 'Mountain' && <Mountain size={48} strokeWidth={1.5} color="#9B7C9F" />}
                                </div>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    margin: '0 0 4px 0'
                                }}>
                                    {destination.name}
                                </h3>
                                <p style={{
                                    fontSize: '12px',
                                    color: '#666',
                                    margin: '0 0 8px 0'
                                }}>
                                    {destination.location}
                                </p>
                                <p style={{
                                    fontSize: '13px',
                                    color: '#555',
                                    margin: 0,
                                    lineHeight: '1.4'
                                }}>
                                    {destination.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* 여행 팁 섹션 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    style={{ marginTop: '40px' }}
                >
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#4A5A40',
                        marginBottom: '16px',
                        paddingLeft: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        여행 팁
                        <Lightbulb size={20} strokeWidth={2.5} />
                    </h2>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        paddingLeft: '10px',
                        paddingRight: '10px'
                    }}>
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            style={{
                                background: 'linear-gradient(135deg, #FFF9E6 0%, #FFE5B4 100%)',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(255, 229, 180, 0.5)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #FFD580 0%, #FFBB33 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Wallet size={20} color="#fff" strokeWidth={2.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    margin: 0
                                }}>
                                    예산 관리 팁
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#555',
                                margin: 0,
                                lineHeight: '1.6',
                                paddingLeft: '52px'
                            }}>
                                현지 결제보다 모바일 페이를 활용하면 환율 혜택을 받을 수 있어요!
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            style={{
                                background: 'linear-gradient(135deg, #E8F8F5 0%, #C1E1C1 100%)',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(193, 225, 193, 0.5)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #A8E6CF 0%, #7FD3A6 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Backpack size={20} color="#fff" strokeWidth={2.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    margin: 0
                                }}>
                                    짐 싸기 팁
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#555',
                                margin: 0,
                                lineHeight: '1.6',
                                paddingLeft: '52px'
                            }}>
                                멀티탭과 보조배터리는 필수! 여행지에서 충전이 어려울 수 있어요.
                            </p>
                        </motion.div>

                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            style={{
                                background: 'linear-gradient(135deg, #FFE5F5 0%, #FFD1E8 100%)',
                                borderRadius: '16px',
                                padding: '20px',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(255, 209, 232, 0.5)'
                            }}
                        >
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginBottom: '8px'
                            }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    background: 'linear-gradient(135deg, #FFC1DC 0%, #FFB3D9 100%)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Camera size={20} color="#fff" strokeWidth={2.5} />
                                </div>
                                <h3 style={{
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    color: '#333',
                                    margin: 0
                                }}>
                                    사진 촬영 팁
                                </h3>
                            </div>
                            <p style={{
                                fontSize: '14px',
                                color: '#555',
                                margin: 0,
                                lineHeight: '1.6',
                                paddingLeft: '52px'
                            }}>
                                골든 아워(일출/일몰 1시간 전후)가 가장 아름다운 사진을 남길 수 있어요!
                            </p>
                        </motion.div>
                    </div>
                </motion.div>

                {/* 나의 여행 통계 */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{ marginTop: '40px', marginBottom: '20px' }}
                >
                    <h2 style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#4A5A40',
                        marginBottom: '16px',
                        paddingLeft: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        나의 여행 통계
                        <BarChart3 size={20} strokeWidth={2.5} />
                    </h2>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(137, 199, 101, 0.15) 0%, rgba(111, 181, 88, 0.1) 100%)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginLeft: '10px',
                        marginRight: '10px',
                        boxShadow: '0 4px 16px rgba(137, 199, 101, 0.1)',
                        border: '1px solid rgba(137, 199, 101, 0.2)',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '20px',
                            textAlign: 'center'
                        }}>
                            <div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #89C765 0%, #6FB558 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '8px'
                                }}>
                                    {travels.length}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666'
                                }}>
                                    총 여행 수
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #89C765 0%, #6FB558 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '8px'
                                }}>
                                    {new Set(travels.map(t => t.destination)).size}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666'
                                }}>
                                    방문 도시
                                </div>
                            </div>
                            <div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: 'bold',
                                    background: 'linear-gradient(135deg, #89C765 0%, #6FB558 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    marginBottom: '8px'
                                }}>
                                    {travels.reduce((sum, t) => sum + t.participants, 0)}
                                </div>
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666'
                                }}>
                                    함께한 사람
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </main >

            {/* Chat Bot */}
            <AnimatePresence>
                {
                    isChatBotOpen && (
                        <TravelChatBot
                            onClose={() => setIsChatBotOpen(false)}
                            onComplete={async (data) => {
                                console.log('Travel data received:', data);

                                // Create travel item from chatbot data
                                const newTravel: TravelItem = {
                                    id: Date.now(),
                                    title: `${data.region} 여행`,
                                    destination: data.region,
                                    startDate: data.startDate,
                                    endDate: data.endDate,
                                    participants: data.participants,
                                    image: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                                    places: data.schedules || []
                                };

                                // 이미지 자동 검색
                                let travelWithImage = { ...newTravel };
                                console.log('🖼️ Fetching landmark image for:', newTravel.destination);
                                try {
                                    const response = await fetch(`${myUrl}/api/search/landmark-image`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({ destination: newTravel.destination })
                                    });

                                    console.log('API Response status:', response.status);
                                    if (response.ok) {
                                        const responseData = await response.json();
                                        console.log('API Response data:', responseData);
                                        if (responseData.image_url) {
                                            travelWithImage.image = `url(${responseData.image_url})`;
                                            console.log('✅ Image URL set:', travelWithImage.image);
                                        } else {
                                            console.log('⚠️ No image_url in response');
                                        }
                                    } else {
                                        console.error('❌ API request failed:', response.statusText);
                                    }
                                } catch (error) {
                                    console.error('❌ Failed to fetch landmark image:', error);
                                    // 실패해도 계속 진행 (gradient 사용)
                                }

                                // Save to travels list
                                const userId = getUserId();
                                const updatedTravels = [...travels, travelWithImage];
                                setTravels(updatedTravels);
                                localStorage.setItem(`travels_${userId}`, JSON.stringify(updatedTravels));

                                // Close chatbot and show detail view
                                setIsChatBotOpen(false);
                                setSelectedTravel(travelWithImage);
                                setIsDetailViewOpen(true);
                            }}
                            onMapSelect={(location) => {
                                setSelectedLocation(location);
                                setIsMapOpen(true);
                            }}
                        />
                    )
                }
            </AnimatePresence >

            {/* Schedule Editor */}
            <AnimatePresence>
                {
                    isScheduleEditorOpen && (
                        <TravelScheduleEditor
                            onClose={() => setIsScheduleEditorOpen(false)}
                            onComplete={handleNewTravelSave}
                        />
                    )
                }
            </AnimatePresence >

            {/* Notification Panel */}
            <AnimatePresence>
                {
                    isNotificationOpen && (
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
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{
                                padding: '20px 30px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#2D8B5F',
                                    margin: 0
                                }}>
                                    알림
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsNotificationOpen(false)}
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
                                    <X size={20} color="#666" />
                                </motion.button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        style={{
                                            padding: '20px',
                                            backgroundColor: notification.isRead ? 'white' : '#f0f9f5',
                                            borderRadius: '12px',
                                            marginBottom: '12px',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '8px'
                                        }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                color: '#333'
                                            }}>
                                                {notification.title}
                                            </h3>
                                            <span style={{ fontSize: '12px', color: '#999' }}>
                                                {notification.time}
                                            </span>
                                        </div>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '14px',
                                            color: '#666',
                                            lineHeight: '1.5'
                                        }}>
                                            {notification.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Settings Panel */}
            <AnimatePresence>
                {
                    isSettingsOpen && (
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
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{
                                padding: '20px 30px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#2D8B5F',
                                    margin: 0
                                }}>
                                    설정
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsSettingsOpen(false)}
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
                                    <X size={20} color="#666" />
                                </motion.button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                {/* 앱 설정 */}
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    marginBottom: '30px',
                                    overflow: 'hidden'
                                }}>
                                    {/* 푸시 알림 */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        borderBottom: '1px solid #f0f0f0'
                                    }}>
                                        <span style={{ fontSize: '15px', color: '#333' }}>
                                            푸시 알림
                                        </span>
                                        <button
                                            onClick={() => setIsNotificationEnabled(!isNotificationEnabled)}
                                            style={{
                                                width: '48px',
                                                height: '28px',
                                                borderRadius: '14px',
                                                border: 'none',
                                                background: isNotificationEnabled ? '#2D8B5F' : '#ccc',
                                                cursor: 'pointer',
                                                position: 'relative',
                                                transition: 'background 0.3s'
                                            }}
                                        >
                                            <div style={{
                                                width: '20px',
                                                height: '20px',
                                                borderRadius: '50%',
                                                backgroundColor: 'white',
                                                position: 'absolute',
                                                top: '4px',
                                                left: isNotificationEnabled ? '24px' : '4px',
                                                transition: 'left 0.3s'
                                            }} />
                                        </button>
                                    </div>

                                    {/* 캐시 삭제 */}
                                    <button style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        border: 'none',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        color: '#333',
                                        textAlign: 'left'
                                    }}>
                                        캐시 삭제
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>

                                    {/* 라이센스 */}
                                    <button style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        border: 'none',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        color: '#333',
                                        textAlign: 'left'
                                    }}>
                                        라이센스
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>

                                    {/* 약관 및 이용동의 */}
                                    <button style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        border: 'none',
                                        borderBottom: '1px solid #f0f0f0',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        color: '#333',
                                        textAlign: 'left'
                                    }}>
                                        약관 및 이용동의
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>

                                    {/* 버전 정보 */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px'
                                    }}>
                                        <span style={{ fontSize: '15px', color: '#333' }}>
                                            버전 정보
                                        </span>
                                        <span style={{ fontSize: '14px', color: '#999' }}>
                                            v1.0.0
                                        </span>
                                    </div>
                                </div>

                                {/* 고객센터 */}
                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    marginBottom: '20px',
                                    overflow: 'hidden'
                                }}>
                                    <button style={{
                                        width: '100%',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        padding: '16px 20px',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        color: '#333',
                                        textAlign: 'left'
                                    }}>
                                        고객센터
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>
                                </div>

                                {/* 로그아웃 버튼 */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleLogout}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#f1f3f5',
                                        color: '#666',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        marginBottom: '12px'
                                    }}
                                >
                                    로그아웃
                                </motion.button>

                                {/* 회원탈퇴 버튼 */}
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleWithdraw}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        backgroundColor: '#FFEBEE',
                                        color: '#E84A5F',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer'
                                    }}
                                >
                                    회원탈퇴
                                </motion.button>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* My Page Panel */}
            <AnimatePresence>
                {
                    isMyPageOpen && (
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
                                zIndex: 1000,
                                display: 'flex',
                                flexDirection: 'column',
                                boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)'
                            }}
                        >
                            <div style={{
                                padding: '20px 30px',
                                borderBottom: '1px solid #eee',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h2 style={{
                                    fontSize: '24px',
                                    fontWeight: 'bold',
                                    color: '#2D8B5F',
                                    margin: 0
                                }}>
                                    마이페이지
                                </h2>
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setIsMyPageOpen(false)}
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
                                    <X size={20} color="#666" />
                                </motion.button>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                                {/* 환영 메시지 */}
                                <div style={{
                                    backgroundColor: '#FFF5E6',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    marginBottom: '30px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px'
                                }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'linear-gradient(135deg, #FFE5AE 0%, #FFD580 100%)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        <Hand size={26} color="#FF9800" strokeWidth={2} />
                                    </div>
                                    <span style={{
                                        fontSize: '16px',
                                        fontWeight: '600',
                                        color: '#2D8B5F'
                                    }}>
                                        {userName}님 반가워요!
                                    </span>
                                </div>

                                {/* 계정 관리 */}
                                <h3 style={{
                                    margin: '0 0 12px 0',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    color: '#999'
                                }}>
                                    계정 관리
                                </h3>

                                <div style={{
                                    backgroundColor: 'white',
                                    borderRadius: '12px',
                                    marginBottom: '30px',
                                    overflow: 'hidden'
                                }}>
                                    {/* 비밀번호 수정 */}
                                    <button
                                        onClick={() => setIsPasswordEditOpen(true)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            border: 'none',
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            color: '#333',
                                            textAlign: 'left'
                                        }}
                                    >
                                        비밀번호 수정
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>

                                    {/* 개인정보 수정 */}
                                    <button
                                        onClick={() => setIsPersonalInfoEditOpen(true)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            border: 'none',
                                            borderBottom: '1px solid #f0f0f0',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            color: '#333',
                                            textAlign: 'left'
                                        }}
                                    >
                                        개인정보 수정
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>

                                    {/* 페르소나 수정 */}
                                    <button
                                        onClick={() => setIsPersonaEditOpen(true)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '16px 20px',
                                            border: 'none',
                                            backgroundColor: 'transparent',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            color: '#333',
                                            textAlign: 'left'
                                        }}
                                    >
                                        페르소나 수정
                                        <span style={{ color: '#ccc' }}>›</span>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )
                }
            </AnimatePresence >

            {/* Password Edit Screen */}
            <AnimatePresence>
                {
                    isPasswordEditOpen && (
                        <PasswordEditScreen
                            userId={userId}
                            onClose={() => setIsPasswordEditOpen(false)}
                            onBack={() => setIsPasswordEditOpen(false)} // 뒤로가기 눌러도 닫히게
                        />
                    )
                }
            </AnimatePresence >

            {/* Personal Info Edit Screen */}
            <AnimatePresence>
                {
                    isPersonalInfoEditOpen && (
                        <PersonalInfoEditScreen onClose={() => setIsPersonalInfoEditOpen(false)} />
                    )
                }
            </AnimatePresence >

            {/* Persona Edit Screen */}
            <AnimatePresence>
                {
                    isPersonaEditOpen && (
                        <PersonaEditScreen onClose={() => setIsPersonaEditOpen(false)} />
                    )
                }
            </AnimatePresence >

            {/* Map Modal */}
            <AnimatePresence>
                {
                    isMapOpen && (
                        <MapScreen
                            tripData={tripData || {
                                destination: '',
                                participants: 1,
                                startDate: '',
                                endDate: ''
                            }}
                            onClose={() => setIsMapOpen(false)}
                            initialLocation={selectedLocation}
                            onScheduleSave={handleScheduleSave}
                        />
                    )
                }
            </AnimatePresence >

            {/* Detail View */}
            <AnimatePresence>
                {
                    isDetailViewOpen && selectedTravel && (
                        <TravelDetailView
                            travel={selectedTravel}
                            onClose={() => setIsDetailViewOpen(false)}
                            onDelete={handleScheduleDelete}
                        />
                    )
                }
            </AnimatePresence >

            {/* Floating Chatbot Button */}
            <motion.button
                drag
                dragMomentum={false}
                dragElastic={0}
                onDragStart={() => setIsChatBotDragging(true)}
                onDragEnd={() => setTimeout(() => setIsChatBotDragging(false), 100)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                    if (!isChatBotDragging) {
                        setIsChatBotOpen(true);
                    }
                }}
                style={{
                    position: 'fixed',
                    bottom: '120px',
                    right: 'max(30px, calc(50% - 210px))',
                    width: '70px',
                    height: '70px',
                    borderRadius: '50%',
                    border: '3px solid rgba(137, 199, 101, 0.5)',
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    boxShadow: '0 8px 24px rgba(137, 199, 101, 0.4), 0 0 0 0 rgba(137, 199, 101, 0.5)',
                    cursor: 'grab',
                    zIndex: 999,
                    padding: 0,
                    overflow: 'hidden',
                    animation: 'pulse 2s infinite'
                }}
            >
                <img
                    src={chatbotAvatar}
                    alt="챗봇"
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        pointerEvents: 'none'
                    }}
                />
                {/* Pulse animation style */}
                <style>{`
                    @keyframes pulse {
                        0%, 100% {
                            box-shadow: 0 8px 24px rgba(137, 199, 101, 0.4), 0 0 0 0 rgba(137, 199, 101, 0.5);
                        }
                        50% {
                            box-shadow: 0 8px 24px rgba(137, 199, 101, 0.6), 0 0 0 12px rgba(137, 199, 101, 0);
                        }
                    }
                `}</style>
            </motion.button>

            {/* [수정] Bottom Navigation */}
            < BottomNav
                activeTab="home"
                onHomeClick={() => { }}
                onNotificationClick={() => setIsNotificationOpen(true)}
                onAIScheduleClick={() => setIsChatBotOpen(true)}
                onManualScheduleClick={() => setIsScheduleEditorOpen(true)}
                onMyPageClick={() => setIsMyPageOpen(true)} // 마이페이지 열기
                onSettingsClick={() => setIsSettingsOpen(true)} // 하단바 설정 버튼으로 설정 패널 열기
            />
        </div >
    );
}