import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Hotel, UtensilsCrossed, Landmark, Coffee, ShoppingBag, Map as MapIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { OptimizedScheduleScreen } from './OptimizedScheduleScreen';

interface MapScreenProps {
    tripData: {
        destination: string;
        participants: number;
        startDate: string;
        endDate: string;
    };
    onClose: () => void;
    onBack?: () => void;
    initialLocation?: { lat: number; lng: number; name: string } | null;
    onScheduleSave?: (travel: any) => void;
    onSelect?: (location: any) => void;
    selectedDay?: number;  // Add this line
}

type CategoryType = 'lodging' | 'restaurant' | 'tourist_attraction' | 'cafe' | 'shopping_mall';

interface Category {
    id: CategoryType;
    label: string;
    icon: any;
    color: string;
}

const categories: Category[] = [
    { id: 'lodging', label: '숙소', icon: Hotel, color: '#667eea' },
    { id: 'restaurant', label: '맛집', icon: UtensilsCrossed, color: '#f093fb' },
    { id: 'tourist_attraction', label: '랜드마크', icon: Landmark, color: '#4facfe' },
    { id: 'cafe', label: '카페', icon: Coffee, color: '#43e97b' },
    { id: 'shopping_mall', label: '쇼핑', icon: ShoppingBag, color: '#fa709a' }
];

export function MapScreen({ tripData, onClose, onBack, initialLocation, onScheduleSave, onSelect, selectedDay }: MapScreenProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<google.maps.Map | null>(null);
    const streetViewRef = useRef<HTMLDivElement>(null);
    const streetViewInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);
    const markersRef = useRef<google.maps.Marker[]>([]);
    const streetViewMarkersRef = useRef<google.maps.Marker[]>([]);
    const isSelectingLocationRef = useRef(false);
    const isSelectingPinRef = useRef(false);
    const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
    const [isSelectingLocation, setIsSelectingLocation] = useState(false);
    const [selectedStreetViewLocation, setSelectedStreetViewLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isSelectingPin, setIsSelectingPin] = useState(false);
    const [selectedPlaces, setSelectedPlaces] = useState<any[]>([]);
    const [showSelectedPanel, setShowSelectedPanel] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<any>(null);
    const [showPlaceDetail, setShowPlaceDetail] = useState(false);
    const [placeDetails, setPlaceDetails] = useState<any>(null);
    const [placeDistance, setPlaceDistance] = useState<number | null>(null);
    const [showOptimizedSchedule, setShowOptimizedSchedule] = useState(false);

    // ref 동기화
    useEffect(() => {
        isSelectingLocationRef.current = isSelectingLocation;
        isSelectingPinRef.current = isSelectingPin;
    }, [isSelectingLocation, isSelectingPin]);

    // 지도 초기화 및 위치 설정
    useEffect(() => {
        const initMap = async () => {
            if (!mapRef.current) return;

            // Google Maps API가 로드될 때까지 대기
            if (typeof google === 'undefined' || !google.maps) {
                console.log('Google Maps API가 아직 로드되지 않았습니다. 대기 중...');
                setTimeout(initMap, 100);
                return;
            }

            let center = { lat: 37.5665, lng: 126.9780 }; // 기본값: 서울

            if (initialLocation) {
                center = { lat: initialLocation.lat, lng: initialLocation.lng };
                setUserLocation(center);
            } else if (navigator.geolocation) {
                try {
                    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                        navigator.geolocation.getCurrentPosition(resolve, reject);
                    });
                    center = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    setUserLocation(center);
                } catch (error) {
                    console.error('위치 정보를 가져올 수 없습니다.', error);
                }
            }

            const map = new google.maps.Map(mapRef.current, {
                center: center,
                zoom: 15,
                disableDefaultUI: false,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });

            mapInstanceRef.current = map;

            // 현재 위치/선택된 위치 마커 - initialLocation이 있을 때는 마커 생성 안 함
            if (!initialLocation) {
                new google.maps.Marker({
                    position: center,
                    map: map,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2D8B5F" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10"/>
                                <circle cx="12" cy="12" r="3" fill="#2D8B5F"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(32, 32),
                        anchor: new google.maps.Point(16, 16)
                    },
                    title: '현재 위치'
                });
            }

            // 지도 클릭 이벤트 (로드뷰 등)
            map.addListener('click', (event: google.maps.MapMouseEvent) => {
                if (isSelectingLocationRef.current && event.latLng) {
                    const location = {
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng()
                    };

                    const marker = new google.maps.Marker({
                        position: location,
                        map: map,
                        icon: {
                            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%23E84A5F" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                    <circle cx="12" cy="10" r="3" fill="white" stroke="%23E84A5F"></circle>
                                </svg>
                            `),
                            scaledSize: new google.maps.Size(40, 40),
                            anchor: new google.maps.Point(20, 40)
                        },
                        title: '로드뷰 위치',
                        animation: google.maps.Animation.DROP
                    });

                    marker.addListener('click', () => {
                        setSelectedStreetViewLocation(location);
                        setIsStreetViewOpen(true);
                    });

                    streetViewMarkersRef.current.push(marker);
                    setIsSelectingLocation(false);
                }
            });

            setIsLoading(false);
        };

        initMap();
    }, [initialLocation]);

    // 카테고리별 장소 검색
    useEffect(() => {
        if (!mapInstanceRef.current || !userLocation) return;

        // 기존 마커 제거
        markersRef.current.forEach(marker => marker.setMap(null));
        markersRef.current = [];

        // 카테고리가 선택되지 않았으면 여기서 종료 (핀 제거만 하고 끝)
        if (!selectedCategory) return;

        const service = new google.maps.places.PlacesService(mapInstanceRef.current);

        const request: google.maps.places.PlaceSearchRequest = {
            location: userLocation,
            radius: 500,
            type: selectedCategory
        };

        service.nearbySearch(request, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                const category = categories.find(c => c.id === selectedCategory);

                results.forEach((place) => {
                    if (place.geometry?.location) {
                        const isSelected = selectedPlaces.some(p => p.place_id === place.place_id);
                        const marker = new google.maps.Marker({
                            position: place.geometry.location,
                            map: mapInstanceRef.current,
                            title: place.name,
                            icon: {
                                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                                    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${isSelected ? '#2D8B5F' : (category?.color || '#667eea')}" stroke="white" stroke-width="${isSelected ? '3' : '2'}" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                        <circle cx="12" cy="10" r="3" fill="white" stroke="${isSelected ? '#2D8B5F' : (category?.color || '#667eea')}"></circle>
                                    </svg>
                                `),
                                scaledSize: new google.maps.Size(isSelected ? 48 : 40, isSelected ? 48 : 40),
                                anchor: new google.maps.Point(isSelected ? 24 : 20, isSelected ? 48 : 40)
                            }
                        });

                        // 마커 클릭 이벤트
                        marker.addListener('click', () => {
                            if (isSelectingPinRef.current) {
                                // 핀 선택 모드: 선택/선택 취소 토글
                                setSelectedPlaces(prev => {
                                    const exists = prev.some(p => p.place_id === place.place_id);
                                    if (exists) {
                                        // 이미 선택된 장소는 선택 해제
                                        return prev.filter(p => p.place_id !== place.place_id);
                                    } else {
                                        // 새로 선택하는 장소가 숙소인 경우 제한 확인
                                        if (selectedCategory === 'lodging') {
                                            const hasLodging = prev.some(p => p.category === 'lodging');
                                            if (hasLodging) {
                                                alert('숙소는 한 개만 선택할 수 있습니다.');
                                                return prev; // 선택하지 않고 기존 상태 유지
                                            }
                                        }
                                        return [...prev, { ...place, category: selectedCategory }];
                                    }
                                });
                            } else {
                                // 일반 모드: 하단 패널에 상세 정보 표시
                                setSelectedPlace({ ...place, category: selectedCategory });
                                setShowPlaceDetail(true);
                                setShowSelectedPanel(false);

                                // Place Details API 호출
                                if (place.place_id && mapInstanceRef.current) {
                                    const service = new google.maps.places.PlacesService(mapInstanceRef.current);
                                    service.getDetails(
                                        {
                                            placeId: place.place_id,
                                            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'photos', 'rating', 'user_ratings_total', 'geometry', 'types', 'business_status']
                                        },
                                        (details: google.maps.places.PlaceResult | null, status: google.maps.places.PlacesServiceStatus) => {
                                            if (status === google.maps.places.PlacesServiceStatus.OK && details) {
                                                setPlaceDetails(details);

                                                // 거리 계산
                                                if (details.geometry?.location && userLocation) {
                                                    const distance = google.maps.geometry.spherical.computeDistanceBetween(
                                                        new google.maps.LatLng(userLocation.lat, userLocation.lng),
                                                        details.geometry.location
                                                    );
                                                    setPlaceDistance(Math.round(distance));
                                                }
                                            }
                                        }
                                    );
                                }
                            }
                        });

                        markersRef.current.push(marker);
                    }
                });
            }
        });
    }, [selectedCategory, userLocation, selectedPlaces]);

    // 로드뷰 초기화
    useEffect(() => {
        if (isStreetViewOpen && streetViewRef.current && selectedStreetViewLocation) {
            const panorama = new google.maps.StreetViewPanorama(streetViewRef.current, {
                position: selectedStreetViewLocation,
                pov: {
                    heading: 34,
                    pitch: 10,
                },
                zoom: 1,
                enableCloseButton: false,
            });
            streetViewInstanceRef.current = panorama;
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setStreetView(panorama);
            }
        }
    }, [isStreetViewOpen, selectedStreetViewLocation]);

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
                zIndex: 3000,
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
                style={{
                    width: '100%',
                    maxWidth: '480px',
                    height: '100%',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    position: 'relative'
                }}
            >
                <div style={{
                    padding: '16px 20px',
                    backgroundColor: 'white',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                    zIndex: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onBack || onClose}
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
                    <div>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#2D8B5F',
                            margin: 0
                        }}>
                            {tripData.destination || '여행 지도'}
                        </h2>
                        <p style={{
                            fontSize: '12px',
                            color: '#999',
                            margin: '4px 0 0 0'
                        }}>
                            {tripData.startDate} ~ {tripData.endDate} · 반경 500m
                        </p>
                    </div>
                </div>

                <div style={{
                    padding: '12px 16px',
                    backgroundColor: 'white',
                    borderBottom: '1px solid #eee',
                    overflowX: 'auto',
                    display: 'flex',
                    gap: '8px',
                    zIndex: 10
                }}>
                    {categories.map((category) => {
                        const Icon = category.icon;
                        const isSelected = selectedCategory === category.id;
                        return (
                            <motion.button
                                key={category.id}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    // 탭 토글: 선택된 탭 재선택 시 미선택 상태로
                                    setSelectedCategory(isSelected ? null : category.id);
                                }}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '20px',
                                    border: isSelected ? `2px solid ${category.color}` : '2px solid #e0e0e0',
                                    backgroundColor: isSelected ? `${category.color}15` : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '14px',
                                    fontWeight: isSelected ? '600' : '500',
                                    color: isSelected ? category.color : '#666',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.3s'
                                }}
                            >
                                <Icon size={16} />
                                {category.label}
                            </motion.button>
                        );
                    })}
                </div>

                <div style={{ flex: 1, position: 'relative' }}>
                    {isLoading && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10,
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '50px',
                                height: '50px',
                                border: '4px solid #f3f3f3',
                                borderTop: '4px solid #2D8B5F',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite',
                                margin: '0 auto 12px'
                            }} />
                            <p style={{ color: '#666', fontSize: '14px' }}>지도를 불러오는 중...</p>
                        </div>
                    )}
                    <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

                    {/* 선택 모드 버튼 */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setIsSelectingPin(!isSelectingPin);
                            setShowSelectedPanel(!isSelectingPin);
                        }}
                        style={{
                            position: 'absolute',
                            top: '20px',
                            right: '10px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: isSelectingPin ? '#2D8B5F' : 'white',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 100
                        }}
                        title="장소 선택"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={isSelectingPin ? 'white' : '#666'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </motion.button>

                    {/* 로드뷰 버튼 */}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsSelectingLocation(true)}
                        style={{
                            position: 'absolute',
                            top: '80px',
                            right: '10px',
                            width: '40px',
                            height: '40px',
                            borderRadius: '4px',
                            border: 'none',
                            backgroundColor: isSelectingLocation ? '#2D8B5F' : 'white',
                            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 100
                        }}
                        title="로드뷰 위치 선택"
                    >
                        <MapIcon size={20} color={isSelectingLocation ? 'white' : '#666'} />
                    </motion.button>

                    {isSelectingLocation && (
                        <div style={{
                            position: 'absolute',
                            top: '130px',
                            right: '10px',
                            padding: '10px 16px',
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            borderRadius: '8px',
                            color: 'white',
                            fontSize: '13px',
                            zIndex: 100,
                            maxWidth: '180px',
                            textAlign: 'center'
                        }}>
                            지도에서 보고 싶은 위치를 클릭하세요
                        </div>
                    )}

                    <AnimatePresence>
                        {isStreetViewOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: '100%' }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    zIndex: 200,
                                    backgroundColor: '#f0f0f0'
                                }}
                            >
                                <div ref={streetViewRef} style={{ width: '100%', height: '100%' }} />

                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setIsStreetViewOpen(false);
                                        setSelectedStreetViewLocation(null);
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '80px',
                                        right: '10px',
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '4px',
                                        border: 'none',
                                        backgroundColor: 'white',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 300
                                    }}
                                >
                                    <X size={24} color="#333" />
                                </motion.button>

                                <div style={{
                                    position: 'absolute',
                                    bottom: '24px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    padding: '8px 16px',
                                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                    borderRadius: '20px',
                                    color: 'white',
                                    fontSize: '14px',
                                    zIndex: 300,
                                    pointerEvents: 'none'
                                }}>
                                    주변을 둘러보세요
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 선택된 핀 목록 패널 */}
                    <AnimatePresence>
                        {showSelectedPanel && selectedPlaces.length > 0 && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    maxHeight: '50%',
                                    backgroundColor: 'white',
                                    borderTopLeftRadius: '16px',
                                    borderTopRightRadius: '16px',
                                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
                                    zIndex: 150,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#333' }}>
                                        선택된 장소 ({selectedPlaces.length})
                                    </h3>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setSelectedPlaces([])}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0',
                                                backgroundColor: 'white',
                                                cursor: 'pointer',
                                                fontSize: '13px',
                                                color: '#666'
                                            }}
                                        >
                                            전체 삭제
                                        </motion.button>
                                        {selectedPlaces.length >= 2 && (
                                            <motion.button
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => {
                                                    setShowOptimizedSchedule(true);
                                                    setShowSelectedPanel(false);
                                                }}
                                                style={{
                                                    padding: '6px 16px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    backgroundColor: '#2D8B5F',
                                                    cursor: 'pointer',
                                                    fontSize: '13px',
                                                    fontWeight: '600',
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                                                </svg>
                                                일정 최적화
                                            </motion.button>
                                        )}
                                    </div>
                                </div>

                                {/* 카테고리별 그룹화된 목록 */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '12px'
                                }}>
                                    {categories.map((category) => {
                                        const categoryPlaces = selectedPlaces.filter(p => p.category === category.id);
                                        if (categoryPlaces.length === 0) return null;

                                        const Icon = category.icon;
                                        return (
                                            <div key={category.id} style={{ marginBottom: '20px' }}>
                                                {/* 카테고리 헤더 */}
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '12px',
                                                    paddingBottom: '8px',
                                                    borderBottom: `2px solid ${category.color}`
                                                }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '8px',
                                                        backgroundColor: category.color,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <Icon size={16} color="white" />
                                                    </div>
                                                    <span style={{
                                                        fontSize: '15px',
                                                        fontWeight: '600',
                                                        color: category.color
                                                    }}>
                                                        {category.label}
                                                    </span>
                                                    <span style={{
                                                        fontSize: '13px',
                                                        color: '#999',
                                                        marginLeft: 'auto'
                                                    }}>
                                                        {categoryPlaces.length}개
                                                    </span>
                                                </div>

                                                {/* 카테고리 내 장소들 */}
                                                {categoryPlaces.map((place, index) => (
                                                    <motion.div
                                                        key={place.place_id || index}
                                                        initial={{ opacity: 0, x: -20 }}
                                                        animate={{ opacity: 1, x: 0 }}
                                                        exit={{ opacity: 0, x: 20 }}
                                                        style={{
                                                            marginBottom: '8px',
                                                            padding: '12px',
                                                            backgroundColor: '#f8f9fa',
                                                            borderRadius: '12px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '12px',
                                                            borderLeft: `3px solid ${category.color}`
                                                        }}
                                                    >
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <div style={{ fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '2px' }}>
                                                                {place.name}
                                                            </div>
                                                            <div style={{ fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {place.vicinity || ''}
                                                            </div>
                                                            {place.rating && (
                                                                <div style={{ fontSize: '12px', color: '#fa709a', marginTop: '4px' }}>
                                                                    ⭐ {place.rating}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <motion.button
                                                            whileHover={{ scale: 1.1 }}
                                                            whileTap={{ scale: 0.9 }}
                                                            onClick={() => {
                                                                setSelectedPlaces(prev => prev.filter(p => p.place_id !== place.place_id));
                                                            }}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '50%',
                                                                border: 'none',
                                                                backgroundColor: '#e0e0e0',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                flexShrink: 0
                                                            }}
                                                        >
                                                            <X size={14} color="#666" />
                                                        </motion.button>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* 장소 상세 정보 패널 */}
                    <AnimatePresence>
                        {showPlaceDetail && selectedPlace && (
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: 0 }}
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    maxHeight: '60%',
                                    backgroundColor: 'white',
                                    borderTopLeftRadius: '16px',
                                    borderTopRightRadius: '16px',
                                    boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
                                    zIndex: 150,
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                            >
                                {/* 헤더 */}
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #eee',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#333' }}>
                                        {selectedPlace.name}
                                    </h3>
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        onClick={() => {
                                            setShowPlaceDetail(false);
                                            setSelectedPlace(null);
                                            setPlaceDetails(null);
                                            setPlaceDistance(null);
                                        }}
                                        style={{
                                            width: '28px',
                                            height: '28px',
                                            borderRadius: '50%',
                                            border: 'none',
                                            backgroundColor: '#f0f0f0',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <X size={16} color="#666" />
                                    </motion.button>
                                </div>

                                {/* 내용 */}
                                <div style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px 20px'
                                }}>
                                    {/* 카테고리 배지 */}
                                    {selectedPlace.category && (
                                        <div style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '6px 12px',
                                            borderRadius: '20px',
                                            backgroundColor: `${categories.find(c => c.id === selectedPlace.category)?.color}15`,
                                            marginBottom: '12px'
                                        }}>
                                            {React.createElement(categories.find(c => c.id === selectedPlace.category)?.icon, {
                                                size: 14,
                                                color: categories.find(c => c.id === selectedPlace.category)?.color
                                            })}
                                            <span style={{
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: categories.find(c => c.id === selectedPlace.category)?.color
                                            }}>
                                                {categories.find(c => c.id === selectedPlace.category)?.label}
                                            </span>
                                        </div>
                                    )}

                                    {/* 평점 */}
                                    {selectedPlace.rating && (
                                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '20px' }}>⭐</span>
                                            <span style={{ fontSize: '16px', fontWeight: '600', color: '#333' }}>
                                                {selectedPlace.rating}
                                            </span>
                                            {selectedPlace.user_ratings_total && (
                                                <span style={{ fontSize: '14px', color: '#999' }}>({selectedPlace.user_ratings_total})</span>
                                            )}
                                        </div>
                                    )}

                                    {/* 거리 정보 */}
                                    {placeDistance && (
                                        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ fontSize: '14px', color: '#666' }}>
                                                현재 위치에서 {placeDistance < 1000 ? `${placeDistance}m` : `${(placeDistance / 1000).toFixed(1)}km`}
                                            </span>
                                        </div>
                                    )}

                                    {/* 주소 */}
                                    {(placeDetails?.formatted_address || selectedPlace.vicinity) && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>주소</div>
                                            <div style={{ fontSize: '14px', color: '#333', lineHeight: '1.5' }}>
                                                {placeDetails?.formatted_address || selectedPlace.vicinity}
                                            </div>
                                        </div>
                                    )}

                                    {/* 전화번호 */}
                                    {placeDetails?.formatted_phone_number && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>전화번호</div>
                                            <a href={`tel:${placeDetails.formatted_phone_number}`} style={{ fontSize: '14px', color: '#4A90E2', textDecoration: 'none' }}>
                                                {placeDetails.formatted_phone_number}
                                            </a>
                                        </div>
                                    )}

                                    {/* 웹사이트 */}
                                    {placeDetails?.website && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>웹사이트</div>
                                            <a href={placeDetails.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: '14px', color: '#4A90E2', textDecoration: 'none' }}>
                                                방문하기 →
                                            </a>
                                        </div>
                                    )}

                                    {/* 사진 */}
                                    {(placeDetails?.photos || selectedPlace.photos) && (placeDetails?.photos?.length > 0 || selectedPlace.photos?.length > 0) && (
                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '8px' }}>사진</div>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(3, 1fr)',
                                                gap: '8px'
                                            }}>
                                                {(placeDetails?.photos || selectedPlace.photos).slice(0, 9).map((photo: any, index: number) => (
                                                    <div
                                                        key={index}
                                                        style={{
                                                            width: '100%',
                                                            paddingBottom: '100%',
                                                            position: 'relative',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                            backgroundColor: '#f0f0f0',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => {
                                                            window.open(photo.getUrl({ maxWidth: 1200, maxHeight: 1200 }), '_blank');
                                                        }}
                                                    >
                                                        <img
                                                            src={photo.getUrl({ maxWidth: 300, maxHeight: 300 })}
                                                            alt={`${selectedPlace.name} ${index + 1}`}
                                                            style={{
                                                                position: 'absolute',
                                                                top: 0,
                                                                left: 0,
                                                                width: '100%',
                                                                height: '100%',
                                                                objectFit: 'cover'
                                                            }}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 영업 시간 */}
                                    {placeDetails?.opening_hours && (
                                        <div style={{ marginTop: '16px' }}>
                                            <div style={{ fontSize: '13px', color: '#999', marginBottom: '4px' }}>영업시간</div>
                                            <div style={{
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                color: placeDetails.opening_hours.open_now ? '#2D8B5F' : '#E84A5F',
                                                marginBottom: '8px'
                                            }}>
                                                {placeDetails.opening_hours.open_now ? '영업 중' : '영업 종료'}
                                            </div>
                                            {placeDetails.opening_hours.weekday_text && (
                                                <details style={{ cursor: 'pointer' }}>
                                                    <summary style={{ fontSize: '13px', color: '#666', fontWeight: '600' }}>
                                                        영업시간 상세보기
                                                    </summary>
                                                    <div style={{ marginTop: '8px', paddingLeft: '8px' }}>
                                                        {placeDetails.opening_hours.weekday_text.map((day: string, index: number) => (
                                                            <div key={index} style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                                                {day}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </details>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>

                {/* 최적화된 일정 화면 */}
                <AnimatePresence>
                    {showOptimizedSchedule && (
                        <OptimizedScheduleScreen
                            places={selectedPlaces}
                            tripData={tripData}
                            selectedDay={selectedDay}
                            onClose={() => {
                                setShowOptimizedSchedule(false);
                                setShowSelectedPanel(true);
                            }}
                            onSave={onScheduleSave}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </motion.div>
    );
}

declare global {
    interface Window {
        google: typeof google;
    }
}
