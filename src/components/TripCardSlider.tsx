import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Pagination } from 'swiper/modules';
import { motion } from 'motion/react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

interface TripCardProps {
    id: number;
    title: string;
    destination: string;
    date: string;
    gradient: string;
    shadowColor?: string; // 유색 그림자용
    participants?: number;
    image?: string;
}

interface TripCardSliderProps {
    cards: TripCardProps[];
    onCardClick: (card: TripCardProps) => void;
}

export function TripCardSlider({ cards, onCardClick }: TripCardSliderProps) {
    return (
        <div className="w-full">
            <Swiper
                effect={'coverflow'}
                grabCursor={true}
                centeredSlides={true}
                slidesPerView={'auto'}
                initialSlide={1}
                coverflowEffect={{
                    rotate: 0,
                    stretch: 0,
                    depth: 100,
                    modifier: 2.5,
                    slideShadows: false,
                }}
                pagination={{ clickable: true }}
                modules={[EffectCoverflow, Pagination]}
                // [수정] 위쪽 여백(pt) 줄이고, 아래쪽 여백(pb) 확보
                className="mySwiper !pb-12 !pt-66"
            >
                {cards.map((card) => (
                    <SwiperSlide
                        key={card.id}
                        style={{
                            width: '280px', // [유지] 너비는 좁게 유지
                            height: '300px',
                        }}
                    >
                        {({ isActive }) => (
                            <motion.div
                                layout
                                onClick={() => onCardClick(card)}
                                className="flex flex-col items-center cursor-pointer group"
                                animate={{
                                    scale: isActive ? 1 : 0.9,
                                    opacity: isActive ? 1 : 0.6,
                                    y: isActive ? 0 : 30,
                                }}
                                transition={{ duration: 0.4 }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '320px',
                                        borderRadius: '32px',
                                        backgroundImage: (card.image && card.image.startsWith('url(')) ? card.image : card.gradient,
                                        backgroundSize: 'cover',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        boxShadow: `0 20px 40px -10px ${card.shadowColor || 'rgba(0, 0, 0, 0.15)'}`,
                                        border: isActive ? '4px solid white' : '4px solid transparent',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {/* 상단 하이라이트 */}
                                    <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/5 pointer-events-none" />

                                    {/* 텍스트 영역 (카드 내부 하단) - CGV 스타일 */}
                                    <div
                                        className="absolute bottom-0 left-0 right-0 p-6"
                                        style={{
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(255, 255, 255, 0.5) 70%, transparent 100%)',
                                            zIndex: 10
                                        }}
                                    >
                                        <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white', marginBottom: '0.5rem', textShadow: '2px 2px 4px rgba(0,0,0,0.9)' }}>
                                            {card.destination}
                                        </h3>
                                        <p style={{ fontSize: '1rem', fontWeight: '500', color: 'white', marginBottom: '0.5rem', textShadow: '1px 1px 3px rgba(0,0,0,0.9)' }}>
                                            {card.date}
                                        </p>
                                        {card.participants && (
                                            <p style={{ fontSize: '0.9rem', fontWeight: '400', color: 'rgba(255,255,255,0.9)', textShadow: '1px 1px 3px rgba(0,0,0,0.9)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <span>👥</span> {card.participants}명
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}