import { motion } from "motion/react";
import { Train } from "lucide-react";


export function Navbar() {
    return (
        <nav style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 50,
            padding: '20px 40px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxSizing: 'border-box'
        }}>
            {/* 로고 영역 */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: 'white',
                    fontSize: '1.2rem',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                <Train size={24} />
                감성 기차 여행
            </motion.div>
        </nav>
    );
}