import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Users, ArrowRight, ChevronLeft, Save, Check } from 'lucide-react';
import { useState } from 'react';
import { MapScreen } from './MapScreen';
import { DateRangePicker } from './DateRangePicker';

interface Place {
    id: number;
    day: number;
    name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
}

interface TravelData {
    title: string;
    destination: string;
    startDate: string;
    endDate: string;
    participants: number;
    places: Place[];
}

interface TravelScheduleEditorProps {
    onClose: () => void;
    onComplete: (data: TravelData) => void;
    initialData?: Partial<TravelData>;
}

// Region data structure
const REGIONS: Record<string, string[]> = {
    '서울': ['강남', '강동', '강북', '강서', '관악', '광진', '구로', '금천', '노원', '도봉', '동대문', '동작', '마포', '서대문', '서초', '성동', '성북', '송파', '양천', '영등포', '용산', '은평', '종로', '중구', '중랑'],
    '경기/인천': ['가양', '강릉', '고양', '과천', '광명', '광주', '구리', '군포', '김포', '남양주', '동두천', '부천', '성남', '수원', '시흥', '안산', '안성', '안양', '양주', '여주', '연천', '오산', '용인', '의왕', '의정부', '이천', '파주', '평택', '포천', '하남', '화성'],
    '충청/대전': ['계룡', '공주', '논산', '당진', '보령', '서산', '세종', '아산', '천안', '청주', '충주'],
    '전라/광주': ['광양', '군산', '김제', '나주', '목포', '순천', '여수', '익산', '전주', '정읍'],
    '경북/대구': ['경산', '경주', '구미', '김천', '문경', '상주', '안동', '영주', '영천', '포항'],
    '경남/부산/울산': ['거제', '김해', '마산', '밀양', '사천', '양산', '진주', '창원', '통영'],
    '강원': ['강릉', '동해', '속초', '원주', '춘천', '태백'],
    '제주': ['서귀포', '제주시']
};

export function TravelScheduleEditor({ onClose, onComplete, initialData }: TravelScheduleEditorProps) {
    const [step, setStep] = useState(1);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const [selectedDay, setSelectedDay] = useState(1);
    const [destinationLocation, setDestinationLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);

    // Basic Info State
    const [destination, setDestination] = useState(initialData?.destination || '');
    const [selectedProvince, setSelectedProvince] = useState<string>('서울');
    const [isRegionPanelOpen, setIsRegionPanelOpen] = useState(true);
    const [startDate, setStartDate] = useState(initialData?.startDate || '');
    const [endDate, setEndDate] = useState(initialData?.endDate || '');
    const [participants, setParticipants] = useState(initialData?.participants || 1);

    // Schedule State
    const [places, setPlaces] = useState<Place[]>(initialData?.places || []);

    // Calculate days
    const getDaysArray = () => {
        if (!startDate || !endDate) return [];
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return Array.from({ length: diffDays }, (_, i) => i + 1);
    };

    const days = getDaysArray();

    const handleNextStep = () => {
        if (!destination || !startDate || !endDate) {
            alert('모든 정보를 입력해주세요.');
            return;
        }
        setStep(2);
    };

    const handleAddPlace = async (dayNum: number) => {
        setSelectedDay(dayNum);

        // Geocode destination if not already done
        if (destination && !destinationLocation) {
            if (typeof google !== 'undefined' && google.maps) {
                try {
                    const geocoder = new google.maps.Geocoder();
                    geocoder.geocode(
                        { address: destination + ', 대한민국' },
                        (results, status) => {
                            if (status === 'OK' && results && results[0] && results[0].geometry) {
                                const location = {
                                    lat: results[0].geometry.location.lat(),
                                    lng: results[0].geometry.location.lng(),
                                    name: destination
                                };
                                setDestinationLocation(location);
                            }
                        }
                    );
                } catch (error) {
                    console.error('Geocoding error:', error);
                }
            }
        }

        setIsMapOpen(true);
    };

    const handlePlaceSelect = (location: any) => {
        const newPlace: Place = {
            id: Date.now(),
            day: selectedDay,
            name: location.name || '선택한 장소',
            category: location.category || '기타',
            address: location.address || '',
            lat: location.lat,
            lng: location.lng
        };
        setPlaces([...places, newPlace]);
        setIsMapOpen(false);
    };

    const handleScheduleSave = (travelData: any) => {
        // Map the places from the optimized schedule to the format expected by TravelData
        const formattedPlaces: Place[] = travelData.places.map((place: any, index: number) => ({
            id: Date.now() + index,
            day: selectedDay, // Assign to current selected day
            name: place.name,
            category: place.category || 'place',
            address: place.vicinity || '',
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0
        }));

        // Add places to the current day
        setPlaces([...places, ...formattedPlaces]);
        setIsMapOpen(false);
    };

    const handleSave = () => {
        const travelData: TravelData = {
            title: `${destination} 여행`,
            destination,
            startDate,
            endDate,
            participants,
            places
        };
        onComplete(travelData);
    };

    const getPlacesForDay = (dayNum: number) => {
        return places.filter(p => p.day === dayNum);
    };

    const formatDate = (dayNumber: number) => {
        if (!startDate) return '';
        const date = new Date(startDate);
        date.setDate(date.getDate() + dayNumber - 1);
        return `${date.getMonth() + 1}.${date.getDate()}/${['일', '월', '화', '수', '목', '금', '토'][date.getDay()]}`;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                zIndex: 2000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                style={{
                    width: '100%',
                    maxWidth: '600px',
                    height: '90vh',
                    background: '#F8F9FA',
                    borderRadius: '24px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    background: 'white',
                    borderBottom: '1px solid #E9ECEF',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {step === 2 && (
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => setStep(1)}
                                style={{
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    padding: '4px'
                                }}
                            >
                                <ChevronLeft size={24} color="#495057" />
                            </motion.button>
                        )}
                        <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                            {step === 1 ? '여행 기본 정보' : '상세 일정 편집'}
                        </h2>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onClose}
                        style={{
                            width: '32px', height: '32px',
                            borderRadius: '50%',
                            background: '#F1F3F5',
                            border: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        <X size={18} color="#495057" />
                    </motion.button>
                </div>

                {/* Content */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.div
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}
                            >
                                {/* Destination - Collapsible Two Panel Selection */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '12px' }}>
                                        어디로 떠나시나요?
                                    </label>

                                    {/* Collapsed State - Shows selected destination */}
                                    {!isRegionPanelOpen && destination && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => setIsRegionPanelOpen(true)}
                                            style={{
                                                width: '100%',
                                                padding: '16px 20px',
                                                borderRadius: '16px',
                                                border: '1px solid #2D8B5F',
                                                background: '#F0F9F4',
                                                color: '#2D8B5F',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <span>{destination}</span>
                                            <Check size={20} />
                                        </motion.button>
                                    )}

                                    {/* Expanded State - Shows region selection panel */}
                                    <AnimatePresence>
                                        {isRegionPanelOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 400, opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                style={{
                                                    display: 'flex',
                                                    gap: '16px',
                                                    border: '1px solid #DEE2E6',
                                                    borderRadius: '16px',
                                                    overflow: 'hidden',
                                                    backgroundColor: 'white'
                                                }}
                                            >
                                                {/* Left Panel - Provinces */}
                                                <div style={{
                                                    width: '40%',
                                                    borderRight: '1px solid #E9ECEF',
                                                    overflowY: 'auto',
                                                    backgroundColor: '#F8F9FA'
                                                }}>
                                                    {Object.keys(REGIONS).map((province) => (
                                                        <motion.button
                                                            key={province}
                                                            whileHover={{ backgroundColor: '#F1F3F5' }}
                                                            onClick={() => setSelectedProvince(province)}
                                                            style={{
                                                                width: '100%',
                                                                padding: '16px 20px',
                                                                border: 'none',
                                                                borderBottom: '1px solid #E9ECEF',
                                                                background: selectedProvince === province ? 'white' : 'transparent',
                                                                color: selectedProvince === province ? '#2D8B5F' : '#495057',
                                                                fontSize: '15px',
                                                                fontWeight: selectedProvince === province ? '600' : '500',
                                                                cursor: 'pointer',
                                                                textAlign: 'left',
                                                                display: 'flex',
                                                                justifyContent: 'space-between',
                                                                alignItems: 'center',
                                                                transition: 'all 0.2s',
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            <span>{province}</span>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{
                                                                    fontSize: '12px',
                                                                    color: '#868E96'
                                                                }}>({REGIONS[province].length})</span>
                                                                {selectedProvince === province && (
                                                                    <Check size={16} color="#2D8B5F" />
                                                                )}
                                                            </div>
                                                        </motion.button>
                                                    ))}
                                                </div>

                                                {/* Right Panel - Districts */}
                                                <div style={{
                                                    flex: 1,
                                                    overflowY: 'auto',
                                                    padding: '16px'
                                                }}>
                                                    <div style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: 'repeat(2, 1fr)',
                                                        gap: '8px'
                                                    }}>
                                                        {REGIONS[selectedProvince]?.map((district) => (
                                                            <motion.button
                                                                key={district}
                                                                whileHover={{ scale: 1.02 }}
                                                                whileTap={{ scale: 0.98 }}
                                                                onClick={() => {
                                                                    setDestination(district);
                                                                    setIsRegionPanelOpen(false);
                                                                }}
                                                                style={{
                                                                    padding: '12px 14px',
                                                                    borderRadius: '10px',
                                                                    border: destination === district ? '2px solid #2D8B5F' : '1px solid #E9ECEF',
                                                                    background: destination === district ? '#F0F9F4' : 'white',
                                                                    color: destination === district ? '#2D8B5F' : '#495057',
                                                                    fontSize: '14px',
                                                                    fontWeight: destination === district ? '600' : '500',
                                                                    cursor: 'pointer',
                                                                    textAlign: 'center',
                                                                    transition: 'all 0.2s'
                                                                }}
                                                            >
                                                                {district}
                                                            </motion.button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Dates - Unified Calendar */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '12px' }}>
                                        언제 가시나요?
                                    </label>
                                    <DateRangePicker
                                        startDate={startDate}
                                        endDate={endDate}
                                        onDateSelect={(start, end) => {
                                            setStartDate(start);
                                            setEndDate(end);
                                        }}
                                        minDate={new Date().toISOString().split('T')[0]}
                                    />
                                </div>

                                {/* Participants */}
                                <div>
                                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                        몇 명이서 가나요?
                                    </label>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '16px',
                                        background: 'white',
                                        borderRadius: '16px',
                                        border: '1px solid #DEE2E6'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <Users size={20} color="#ADB5BD" />
                                            <span style={{ fontSize: '16px', fontWeight: '500' }}>{participants}명</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setParticipants(Math.max(1, participants - 1))}
                                                style={{
                                                    width: '32px', height: '32px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #DEE2E6',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                -
                                            </button>
                                            <button
                                                onClick={() => setParticipants(participants + 1)}
                                                style={{
                                                    width: '32px', height: '32px',
                                                    borderRadius: '8px',
                                                    border: '1px solid #DEE2E6',
                                                    background: 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleNextStep}
                                    style={{
                                        marginTop: 'auto',
                                        padding: '16px',
                                        background: '#2D8B5F',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    일정 만들기 시작
                                    <ArrowRight size={20} />
                                </motion.button>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                            >
                                <div style={{ marginBottom: '24px' }}>
                                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>{destination} 여행</h1>
                                    <p style={{ color: '#868E96', fontSize: '14px' }}>
                                        {startDate} - {endDate} · {participants}명
                                    </p>
                                </div>

                                <div style={{ flex: 1, overflowY: 'auto' }}>
                                    {days.map((dayNum) => {
                                        const dayPlaces = getPlacesForDay(dayNum);

                                        // Category colors mapping
                                        const categoryColors: { [key: string]: string } = {
                                            'place': '#2D8B5F',
                                            'lodging': '#667eea',
                                            'restaurant': '#f093fb',
                                            'tourist_attraction': '#4facfe',
                                            'cafe': '#43e97b',
                                            'shopping_mall': '#fa709a'
                                        };

                                        const categoryLabels: { [key: string]: string } = {
                                            'place': '장소',
                                            'lodging': '숙소',
                                            'restaurant': '맛집',
                                            'tourist_attraction': '랜드마크',
                                            'cafe': '카페',
                                            'shopping_mall': '쇼핑'
                                        };

                                        return (
                                            <div key={dayNum} style={{ marginBottom: '32px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    marginBottom: '16px',
                                                    padding: '12px 16px',
                                                    backgroundColor: 'white',
                                                    borderRadius: '12px',
                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
                                                }}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2D8B5F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                                        <line x1="16" y1="2" x2="16" y2="6"></line>
                                                        <line x1="8" y1="2" x2="8" y2="6"></line>
                                                        <line x1="3" y1="10" x2="21" y2="10"></line>
                                                    </svg>
                                                    <div>
                                                        <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: '#2D8B5F', margin: 0 }}>Day {dayNum}</h3>
                                                        <span style={{ fontSize: '12px', color: '#868E96' }}>{formatDate(dayNum)} · {dayPlaces.length}개 장소 방문 예정</span>
                                                    </div>
                                                </div>

                                                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                                    {/* Vertical timeline line */}
                                                    {dayPlaces.length > 0 && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            left: '11px',
                                                            top: 0,
                                                            bottom: '80px',
                                                            width: '2px',
                                                            background: 'linear-gradient(180deg, #2D8B5F 0%, #4facfe 100%)'
                                                        }} />
                                                    )}

                                                    {dayPlaces.map((place, idx) => {
                                                        const color = categoryColors[place.category] || '#2D8B5F';
                                                        const label = categoryLabels[place.category] || place.category || '장소';

                                                        // Calculate estimated time (starting at 09:00, 90 minutes per place)
                                                        const startHour = 9;
                                                        const minutesPerPlace = 90;
                                                        const totalMinutes = startHour * 60 + (idx * minutesPerPlace);
                                                        const hours = Math.floor(totalMinutes / 60);
                                                        const minutes = totalMinutes % 60;
                                                        const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

                                                        return (
                                                            <div key={place.id} style={{ marginBottom: '16px', position: 'relative' }}>
                                                                {/* Timeline point */}
                                                                <div style={{
                                                                    position: 'absolute',
                                                                    left: '-32px',
                                                                    top: '8px',
                                                                    width: '24px',
                                                                    height: '24px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: color,
                                                                    border: '3px solid white',
                                                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontSize: '11px',
                                                                    fontWeight: 'bold'
                                                                }}>
                                                                    {idx + 1}
                                                                </div>

                                                                {/* Place card */}
                                                                <motion.div
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    style={{
                                                                        backgroundColor: 'white',
                                                                        borderRadius: '12px',
                                                                        padding: '16px',
                                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                                        borderLeft: `3px solid ${color}`
                                                                    }}
                                                                >
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                                        <div style={{
                                                                            display: 'inline-block',
                                                                            padding: '4px 8px',
                                                                            borderRadius: '6px',
                                                                            backgroundColor: `${color}20`,
                                                                            fontSize: '10px',
                                                                            fontWeight: '600',
                                                                            color: color
                                                                        }}>
                                                                            {label}
                                                                        </div>
                                                                        <div style={{ fontSize: '11px', color: '#999' }}>
                                                                            60분
                                                                        </div>
                                                                    </div>

                                                                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                                                                        {time}
                                                                    </div>

                                                                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#333', margin: '8px 0 4px 0' }}>
                                                                        {place.name}
                                                                    </h4>

                                                                    {place.address && (
                                                                        <p style={{
                                                                            fontSize: '12px',
                                                                            color: '#666',
                                                                            margin: '4px 0',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '4px'
                                                                        }}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                                                                <circle cx="12" cy="10" r="3"></circle>
                                                                            </svg>
                                                                            {place.address}
                                                                        </p>
                                                                    )}
                                                                </motion.div>

                                                                {/* Travel time between places (not for last place) */}
                                                                {idx < dayPlaces.length - 1 && (
                                                                    <div style={{
                                                                        marginLeft: '8px',
                                                                        marginTop: '8px',
                                                                        marginBottom: '8px',
                                                                        fontSize: '11px',
                                                                        color: '#999',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '4px'
                                                                    }}>
                                                                        <span>→</span>
                                                                        <span>도보 {Math.floor(Math.random() * 10) + 5}분 · 0.5km</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}

                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleAddPlace(dayNum)}
                                                        style={{
                                                            width: '100%',
                                                            padding: '12px',
                                                            borderRadius: '12px',
                                                            border: '1px dashed #ADB5BD',
                                                            background: 'white',
                                                            color: '#495057',
                                                            fontSize: '14px',
                                                            fontWeight: '500',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            gap: '8px',
                                                            marginTop: '8px'
                                                        }}
                                                    >
                                                        <Plus size={16} />
                                                        장소 추가
                                                    </motion.button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleSave}
                                    style={{
                                        marginTop: '16px',
                                        padding: '16px',
                                        background: '#2D8B5F',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        boxShadow: '0 4px 12px rgba(45, 139, 95, 0.3)'
                                    }}
                                >
                                    <Save size={20} />
                                    여행 저장 완료
                                </motion.button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            <AnimatePresence>
                {isMapOpen && (
                    <MapScreen
                        onClose={() => setIsMapOpen(false)}
                        onSelect={handlePlaceSelect}
                        onScheduleSave={handleScheduleSave}
                        initialLocation={destinationLocation}
                        selectedDay={selectedDay}
                        tripData={{
                            destination,
                            participants,
                            startDate,
                            endDate
                        }}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
}
