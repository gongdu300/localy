import { motion } from 'motion/react';
import { UtensilsCrossed, Heart } from 'lucide-react';
import { useState } from 'react';

export function FoodTab() {
  const [foodItems, setFoodItems] = useState([
    { id: 1, name: 'Station Bento Box', location: 'Tokyo Station', favorite: true },
    { id: 2, name: 'Fresh Summer Fruits', location: 'Local Market', favorite: true },
    { id: 3, name: 'Countryside Ramen', location: 'Valley Town', favorite: false },
  ]);

  const toggleFavorite = (id: number) => {
    setFoodItems(items =>
      items.map(item => (item.id === id ? { ...item, favorite: !item.favorite } : item))
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#FFE66D]/10 rounded-full">
          <UtensilsCrossed className="w-6 h-6 text-[#FFA500]" />
        </div>
        <h2 className="text-[#8B4513]" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem' }}>
          Food Journey
        </h2>
      </div>

      <div className="space-y-3">
        {foodItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center gap-4 p-4 bg-white/50 rounded-lg border-2 border-[#8B4513]/10 hover:border-[#FFE66D]/50 transition-colors group"
          >
            <button
              onClick={() => toggleFavorite(item.id)}
              className="flex-shrink-0"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  item.favorite
                    ? 'text-[#FF6B6B] fill-[#FF6B6B]'
                    : 'text-gray-400 group-hover:text-[#FF6B6B]'
                }`}
              />
            </button>
            
            <div className="flex-1">
              <p className="text-[#8B4513] mb-1">{item.name}</p>
              <p className="text-gray-500" style={{ fontSize: '0.875rem' }}>
                {item.location}
              </p>
            </div>
            
            <div className="w-16 h-16 bg-gradient-to-br from-[#FFE66D]/30 to-[#FFA500]/30 rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="w-6 h-6 text-[#FFA500]" />
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full mt-6 p-4 bg-[#FFE66D]/10 hover:bg-[#FFE66D]/20 rounded-lg border-2 border-dashed border-[#FFE66D]/50 text-[#8B4513] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        + Add food memory
      </motion.button>

      <motion.div
        className="mt-8 p-4 bg-gradient-to-br from-[#FFE66D]/5 to-[#FFA500]/5 rounded-lg border border-[#FFE66D]/30"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <p className="text-gray-600 italic text-center" style={{ fontSize: '0.875rem' }}>
          "Good food makes good memories"
        </p>
      </motion.div>
    </motion.div>
  );
}
