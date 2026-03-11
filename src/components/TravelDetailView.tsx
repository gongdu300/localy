import { motion } from 'motion/react';
import { ArrowLeft, MapPin, Calendar, Users, Trash2, Clock, Navigation } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TravelDetailViewProps {
    travel: {
        id: number;
        title: string;
        image: string;
        startDate: string;
        endDate: string;
        participants: number;
        destination: string;
        places: any[];
    };
    onClose: () => void;
    onDelete: (travelId: number) => void;
}

export function TravelDetailView({ travel, onClose, onDelete }: TravelDetailViewProps) {
    // 카테고리 색상 매핑
    const categoryColors: { [key: string]: string } = {
        lodging: '#667eea',
        restaurant: '#f093fb',
        tourist_attraction: '#4facfe',
        cafe: '#43e97b',
        shopping_mall: '#fa709a',
        숙소: '#667eea',
        맛집: '#f093fb',
        랜드마크: '#4facfe',
        카페: '#43e97b',
        쇼핑: '#fa709a'
    };

    const categoryLabels: { [key: string]: string } = {
        lodging: '숙소',
        restaurant: '맛집',
        tourist_attraction: '랜드마크',
        cafe: '카페',
        shopping_mall: '쇼핑'
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getMonth() + 1}/${date.getDate()}`;
    };

    const formatFullDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };

    // Group places by day
    const groupPlacesByDay = () => {
        const grouped: { [key: number]: any[] } = {};

        // Check if places have nested structure from chatbot (schedules with places inside)
        if (travel.places.length > 0 && travel.places[0].day !== undefined && travel.places[0].places) {
            // Flatten nested structure: each schedule has { day, date, destination, places: [...] }
            travel.places.forEach(schedule => {
                const day = schedule.day || 1;
                if (!grouped[day]) grouped[day] = [];

                // Add each place from the nested places array
                if (schedule.places && Array.isArray(schedule.places)) {
                    schedule.places.forEach((place: any) => {
                        grouped[day].push({
                            ...place,
                            day: day  // Ensure day property is set
                        });
                    });
                }
            });
        } else if (travel.places.length > 0 && travel.places[0].day !== undefined) {
            // Places already have day property (flat structure)
            travel.places.forEach(place => {
                const day = place.day || 1;
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(place);
            });
        } else {
            // Otherwise put all in day 1
            grouped[1] = travel.places;
        }

        return grouped;
    };

    const placesByDay = groupPlacesByDay();
    const days = Object.keys(placesByDay).map(Number).sort((a, b) => a - b);

    // Calculate stats
    const totalPlaces = travel.places.length;
    const estimatedHours = totalPlaces * 1.5; // 1.5 hours per place
    const estimatedCost = totalPlaces * 15000; // 15,000 won per place

    // Generate time for each place (starting at 9:00)
    const generateTime = (dayIndex: number, placeIndex: number) => {
        const startHour = 9;
        const minutesPerPlace = 90; // 1.5 hours
        const totalMinutes = startHour * 60 + (placeIndex * minutesPerPlace);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    };

    const getDayDate = (dayNum: number) => {
        const startDate = new Date(travel.startDate);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayNum - 1);
        return formatFullDate(dayDate.toISOString());
    };

    return createPortal(
        <>
            {/* 전체 viewport를 덮는 배경 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    zIndex: 3999,
                    backdropFilter: 'blur(8px)'
                }}
                onClick={onClose}
            />

            {/* 중앙 정렬을 위한 고정 컨테이너 */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '100%',
                    maxWidth: '430px',
                    height: '100vh',
                    zIndex: 4000,
                    pointerEvents: 'none'
                }}
            >
                {/* 슬라이드 애니메이션이 적용되는 내부 컨테이너 */}
                <motion.div
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#f8f9fa',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        boxShadow: '0 0 60px rgba(0, 0, 0, 0.5)',
                        pointerEvents: 'auto'
                    }}
                >
                    {/* 헤더 */}
                    <div style={{
                        padding: '16px 20px',
                        backgroundColor: 'white',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                        zIndex: 10
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
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
                            <div style={{ flex: 1 }}>
                                <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', margin: 0 }}>
                                    최적화된 일정
                                </h2>
                                <p style={{ fontSize: '12px', color: '#999', margin: '4px 0 0 0' }}>
                                    {travel.destination} · {formatDate(travel.startDate)} - {formatDate(travel.endDate)} ({days.length}일)
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* 여행 통계 */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        padding: '16px 20px',
                        backgroundColor: 'white',
                        borderBottom: '1px solid #e9ecef'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <Navigation size={20} color="#4facfe" style={{ margin: '0 auto 4px' }} />
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                                {(totalPlaces * 0.5).toFixed(1)}km
                            </div>
                            <div style={{ fontSize: '11px', color: '#999' }}>총 이동거리</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <Clock size={20} color="#f093fb" style={{ margin: '0 auto 4px' }} />
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                                {Math.floor(estimatedHours)}h {Math.round((estimatedHours % 1) * 60)}m
                            </div>
                            <div style={{ fontSize: '11px', color: '#999' }}>소요시간</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <span style={{ fontSize: '20px', display: 'block', margin: '0 auto 4px' }}>💰</span>
                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#333' }}>
                                {Math.floor(estimatedCost / 10000)}만원
                            </div>
                            <div style={{ fontSize: '11px', color: '#999' }}>예상 경비</div>
                        </div>
                    </div>

                    {/* 일정 타임라인 */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                        {days.map((dayNum, dayIdx) => {
                            const dayPlaces = placesByDay[dayNum] || [];
                            return (
                                <motion.div
                                    key={dayNum}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: dayIdx * 0.1 }}
                                    style={{ marginBottom: '24px' }}
                                >
                                    {/* Day 헤더 */}
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
                                        <Calendar size={18} color="#2D8B5F" />
                                        <div>
                                            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#2D8B5F' }}>
                                                Day {dayNum}
                                            </div>
                                            <div style={{ fontSize: '12px', color: '#999' }}>
                                                {getDayDate(dayNum)} · {dayPlaces.length}개 장소 방문 예정
                                            </div>
                                        </div>
                                    </div>

                                    {/* 타임라인 */}
                                    <div style={{ position: 'relative', paddingLeft: '32px' }}>
                                        {/* 세로 라인 */}
                                        <div style={{
                                            position: 'absolute',
                                            left: '11px',
                                            top: 0,
                                            bottom: 0,
                                            width: '2px',
                                            background: 'linear-gradient(180deg, #2D8B5F 0%, #4facfe 100%)'
                                        }} />

                                        {dayPlaces.map((place, placeIdx) => {
                                            const color = categoryColors[place.category] || '#2D8B5F';
                                            const time = generateTime(dayIdx, placeIdx);
                                            const duration = 60; // 60 minutes per place
                                            const label = categoryLabels[place.category] || place.category || '장소';

                                            return (
                                                <div key={placeIdx} style={{ marginBottom: '16px', position: 'relative' }}>
                                                    {/* 타임라인 포인트 */}
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
                                                        {placeIdx + 1}
                                                    </div>

                                                    {/* 장소 카드 */}
                                                    <div style={{
                                                        backgroundColor: 'white',
                                                        borderRadius: '12px',
                                                        padding: '16px',
                                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                                                        borderLeft: `3px solid ${color}`
                                                    }}>
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
                                                                {duration}분
                                                            </div>
                                                        </div>

                                                        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333', marginBottom: '2px' }}>
                                                            {time}
                                                        </div>

                                                        <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#333', margin: '8px 0 4px 0' }}>
                                                            {place.name}
                                                        </h4>

                                                        {(place.vicinity || place.address) && (
                                                            <p style={{
                                                                fontSize: '12px',
                                                                color: '#666',
                                                                margin: '4px 0',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '4px'
                                                            }}>
                                                                <MapPin size={12} />
                                                                {place.vicinity || place.address}
                                                            </p>
                                                        )}

                                                        {place.rating && (
                                                            <div style={{
                                                                fontSize: '12px',
                                                                color: '#2D8B5F',
                                                                marginTop: '6px',
                                                                fontWeight: '600'
                                                            }}>
                                                                ⭐ {place.rating} {place.user_ratings_total && `· 리뷰 ${place.user_ratings_total}개`}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* 이동 시간 표시 (마지막 장소 제외) */}
                                                    {placeIdx < dayPlaces.length - 1 && (
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
                                                            <span>도보 {Math.floor(Math.random() * 10) + 5}분 · {(Math.random() * 0.5 + 0.1).toFixed(1)}km</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            );
                        })}

                        {/* 삭제하기 버튼 */}
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                                if (window.confirm('정말로 이 일정을 삭제하시겠습니까?')) {
                                    onDelete(travel.id);
                                    onClose();
                                }
                            }}
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: 'none',
                                backgroundColor: '#FFE5E5',
                                color: '#E84A5F',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                marginTop: '20px'
                            }}
                        >
                            <Trash2 size={18} />
                            삭제하기
                        </motion.button>
                    </div>
                </motion.div>
            </div>
        </>,
        document.body
    );
}
