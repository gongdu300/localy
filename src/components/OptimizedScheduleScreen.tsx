import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, MapPin, Clock, DollarSign, Navigation, Calendar, TrendingUp, Save } from 'lucide-react';
import React from 'react';

interface Place {
    place_id: string;
    name: string;
    vicinity?: string;
    rating?: number;
    category: string;
    geometry?: {
        location: google.maps.LatLng;
    };
}

interface OptimizedScheduleScreenProps {
    places: Place[];
    tripData: {
        destination: string;
        startDate: string;
        endDate: string;
        participants: number;
    };
    selectedDay?: number;  // Optional: if provided, show only this day's schedule
    onClose: () => void;
    onSave?: (travel: {
        id: number;
        title: string;
        image: string;
        startDate: string;
        endDate: string;
        participants: number;
        destination: string;
        places: Place[];
    }) => void;
}

interface ScheduleItem extends Place {
    order: number;
    estimatedTime: string;
    duration: number;
    distanceFromPrevious?: number;
    estimatedCost?: number;
    travelTime?: number;
}

const CATEGORY_DURATIONS: { [key: string]: number } = {
    lodging: 0,
    restaurant: 90,
    tourist_attraction: 120,
    cafe: 60,
    shopping_mall: 90
};

const CATEGORY_COSTS: { [key: string]: number } = {
    lodging: 80000,
    restaurant: 15000,
    tourist_attraction: 10000,
    cafe: 6000,
    shopping_mall: 30000
};

function optimizeRoute(places: Place[], startLocation?: google.maps.LatLng): ScheduleItem[] {
    if (places.length === 0) return [];
    const unvisited = [...places];
    const optimized: ScheduleItem[] = [];
    let currentLocation = startLocation || places[0].geometry?.location;
    let currentTime = new Date();
    currentTime.setHours(9, 0, 0, 0);
    let order = 1;

    while (unvisited.length > 0) {
        let nearestIndex = 0;
        let minDistance = Infinity;
        unvisited.forEach((place, index) => {
            if (place.geometry?.location && currentLocation) {
                const distance = google.maps.geometry.spherical.computeDistanceBetween(
                    currentLocation,
                    place.geometry.location
                );
                if (distance < minDistance) {
                    minDistance = distance;
                    nearestIndex = index;
                }
            }
        });

        const nextPlace = unvisited[nearestIndex];
        const duration = CATEGORY_DURATIONS[nextPlace.category] || 60;
        const travelTime = Math.ceil(minDistance / 50);
        if (optimized.length > 0) {
            currentTime = new Date(currentTime.getTime() + travelTime * 60000);
        }
        const estimatedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
        optimized.push({
            ...nextPlace,
            order,
            estimatedTime,
            duration,
            distanceFromPrevious: optimized.length > 0 ? minDistance : undefined,
            estimatedCost: CATEGORY_COSTS[nextPlace.category] || 0,
            travelTime: optimized.length > 0 ? travelTime : undefined
        });
        currentTime = new Date(currentTime.getTime() + duration * 60000);
        currentLocation = nextPlace.geometry?.location;
        unvisited.splice(nearestIndex, 1);
        order++;
    }
    return optimized;
}

function calculateTripDays(startDate: string, endDate: string): number {
    try {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 1;
    } catch (error) {
        return 1;
    }
}

function distributePlacesByDays(places: Place[], days: number): Place[][] {
    if (days <= 1 || places.length === 0) return [places];
    const distributed: Place[][] = [];
    const totalPlaces = places.length;
    if (totalPlaces < days) {
        for (let i = 0; i < totalPlaces; i++) {
            distributed.push([places[i]]);
        }
    } else {
        const basePlacesPerDay = Math.floor(totalPlaces / days);
        const extraPlaces = totalPlaces % days;
        let currentIndex = 0;
        for (let i = 0; i < days; i++) {
            const placesForThisDay = basePlacesPerDay + (i < extraPlaces ? 1 : 0);
            const dayPlaces = places.slice(currentIndex, currentIndex + placesForThisDay);
            if (dayPlaces.length > 0) {
                distributed.push(dayPlaces);
            }
            currentIndex += placesForThisDay;
        }
    }
    return distributed;
}

export function OptimizedScheduleScreen({ places, tripData, selectedDay, onClose, onSave }: OptimizedScheduleScreenProps) {
    const tripDays = calculateTripDays(tripData.startDate, tripData.endDate);
    const dailySchedules = React.useMemo(() => {
        // If selectedDay is provided, show only one day's schedule
        if (selectedDay !== undefined) {
            return [optimizeRoute(places)];
        }
        // Otherwise, distribute places across all days
        const distributedPlaces = distributePlacesByDays(places, tripDays);
        return distributedPlaces.map(dayPlaces => optimizeRoute(dayPlaces));
    }, [places, tripDays, selectedDay]);

    const handleSave = () => {
        if (!onSave) return;
        let imageUrl = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        const firstPlace = places[0];
        if (firstPlace && (firstPlace as any).photos && (firstPlace as any).photos.length > 0) {
            try {
                const photoUrl = (firstPlace as any).photos[0].getUrl({ maxWidth: 400 });
                if (photoUrl) imageUrl = photoUrl;
            } catch (e) {
                console.error('Failed to get photo URL:', e);
            }
        }
        const travelData = {
            id: Date.now(),
            title: `${tripData.destination} 여행`,
            image: imageUrl,
            startDate: tripData.startDate,
            endDate: tripData.endDate,
            participants: tripData.participants,
            destination: tripData.destination,
            places: places
        };
        onSave(travelData);
        onClose();
    };

    const totalDistance = dailySchedules.flat().reduce((sum, item) => sum + (item.distanceFromPrevious || 0), 0);
    const totalCost = dailySchedules.flat().reduce((sum, item) => sum + (item.estimatedCost || 0), 0);
    const totalDuration = dailySchedules.flat().reduce((sum, item) => sum + item.duration + (item.travelTime || 0), 0);

    const categoryColors: { [key: string]: string } = {
        lodging: '#667eea',
        restaurant: '#f093fb',
        tourist_attraction: '#4facfe',
        cafe: '#43e97b',
        shopping_mall: '#fa709a'
    };

    const categoryLabels: { [key: string]: string } = {
        lodging: '숙소',
        restaurant: '맛집',
        tourist_attraction: '랜드마크',
        cafe: '카페',
        shopping_mall: '쇼핑'
    };

    return (
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
                zIndex: 4000,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px'
            }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    height: '100%',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <div style={{ padding: '16px 20px', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', zIndex: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={onClose} style={{ width: '40px', height: '40px', borderRadius: '50%', border: 'none', backgroundColor: '#f8f9fa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowLeft size={20} color="#666" />
                        </motion.button>
                        <div style={{ flex: 1 }}>
                            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#2D8B5F', margin: 0 }}>최적화된 일정</h2>
                            <p style={{ fontSize: '13px', color: '#999', margin: '4px 0 0 0' }}>
                                {tripData.destination} ·
                                {selectedDay !== undefined
                                    ? `Day ${selectedDay}`
                                    : `${tripData.startDate} ~ ${tripData.endDate} (${tripDays}일)`
                                }
                            </p>
                        </div>
                        <div style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: '#2D8B5F15', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={16} color="#2D8B5F" />
                            <span style={{ fontSize: '14px', fontWeight: '600', color: '#2D8B5F' }}>최적화 완료</span>
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '16px' }}>
                        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                            <Navigation size={20} color="#4facfe" style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '2px' }}>{totalDistance < 1000 ? `${Math.round(totalDistance)}m` : `${(totalDistance / 1000).toFixed(1)}km`}</div>
                            <div style={{ fontSize: '11px', color: '#999' }}>총 이동거리</div>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                            <Clock size={20} color="#f093fb" style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '2px' }}>{Math.floor(totalDuration / 60)}h {totalDuration % 60}m</div>
                            <div style={{ fontSize: '11px', color: '#999' }}>소요시간</div>
                        </div>
                        <div style={{ padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '12px', textAlign: 'center' }}>
                            <DollarSign size={20} color="#43e97b" style={{ margin: '0 auto 6px' }} />
                            <div style={{ fontSize: '16px', fontWeight: '700', color: '#333', marginBottom: '2px' }}>{(totalCost / 10000).toFixed(0)}만원</div>
                            <div style={{ fontSize: '11px', color: '#999' }}>예상 경비</div>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                    <AnimatePresence>
                        {dailySchedules.map((daySchedule, dayIndex) => (
                            <React.Fragment key={`day-${dayIndex}`}>
                                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.2 }} style={{ marginBottom: '16px', marginTop: dayIndex > 0 ? '32px' : '0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderLeft: '4px solid #2D8B5F' }}>
                                        <Calendar size={24} color="#2D8B5F" />
                                        <div>
                                            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#2D8B5F', margin: 0 }}>
                                                Day {selectedDay !== undefined ? selectedDay : dayIndex + 1}
                                            </h3>
                                            <p style={{ fontSize: '13px', color: '#999', margin: '2px 0 0 0' }}>{daySchedule.length}개 장소 방문 예정</p>
                                        </div>
                                    </div>
                                </motion.div>
                                {daySchedule.map((item, index) => (
                                    <React.Fragment key={item.place_id}>
                                        {item.travelTime && item.distanceFromPrevious && (
                                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.2 + index * 0.1 }} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 0', marginLeft: '32px' }}>
                                                <div style={{ width: '32px', height: '2px', backgroundColor: '#ddd', position: 'relative' }}>
                                                    <div style={{ position: 'absolute', right: '-4px', top: '-3px', width: '0', height: '0', borderLeft: '8px solid #ddd', borderTop: '4px solid transparent', borderBottom: '4px solid transparent' }} />
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#999' }}>도보 {item.travelTime}분 · {item.distanceFromPrevious < 1000 ? `${Math.round(item.distanceFromPrevious)}m` : `${(item.distanceFromPrevious / 1000).toFixed(1)}km`}</span>
                                            </motion.div>
                                        )}
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.2 + index * 0.1 + 0.05 }} style={{ backgroundColor: 'white', borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', borderLeft: `4px solid ${categoryColors[item.category]}`, position: 'relative' }}>
                                            <div style={{ position: 'absolute', top: '-8px', left: '-8px', width: '32px', height: '32px', borderRadius: '50%', backgroundColor: categoryColors[item.category], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '14px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)' }}>{item.order}</div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div style={{ minWidth: '60px', textAlign: 'center', paddingTop: '8px' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#2D8B5F', marginBottom: '4px' }}>{item.estimatedTime}</div>
                                                    <div style={{ fontSize: '11px', color: '#999' }}>{item.duration}분</div>
                                                </div>
                                                <div style={{ width: '1px', backgroundColor: '#eee', margin: '4px 0' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '12px', backgroundColor: `${categoryColors[item.category]}15`, fontSize: '11px', fontWeight: '600', color: categoryColors[item.category], marginBottom: '8px' }}>{categoryLabels[item.category]}</div>
                                                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 6px 0' }}>{item.name}</h3>
                                                    {item.vicinity && <p style={{ fontSize: '13px', color: '#666', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={12} />{item.vicinity}</p>}
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
                                                        {item.rating && <span style={{ color: '#fa709a' }}>⭐ {item.rating}</span>}
                                                        {item.estimatedCost && <span style={{ color: '#43e97b', fontWeight: '600' }}>약 {(item.estimatedCost / 1000).toFixed(0)}천원</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    </React.Fragment>
                                ))}
                            </React.Fragment>
                        ))}
                    </AnimatePresence>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: dailySchedules.length * 0.2 + 0.5 }} style={{ marginTop: '24px', padding: '20px', backgroundColor: 'white', borderRadius: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
                        <Calendar size={32} color="#2D8B5F" style={{ margin: '0 auto 12px' }} />
                        <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: '0 0 8px 0' }}>
                            {selectedDay !== undefined
                                ? `Day ${selectedDay}의 완벽한 일정이 준비되었습니다!`
                                : `${tripDays}일간의 완벽한 일정이 준비되었습니다!`
                            }
                        </h4>
                        <p style={{ fontSize: '13px', color: '#666', margin: '0 0 16px 0', lineHeight: '1.5' }}>
                            {selectedDay !== undefined
                                ? '동선을 최적화하여 이동 시간을 최소화했습니다.'
                                : '각 날짜별로 동선을 최적화하여 이동 시간을 최소화했습니다.'
                            }
                            <br />즐거운 여행 되세요! 🎉
                        </p>
                        {onSave && (
                            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleSave} style={{ width: '100%', padding: '16px', backgroundColor: '#2D8B5F', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <Save size={20} />
                                일정 저장하기
                            </motion.button>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </motion.div>
    );
}
