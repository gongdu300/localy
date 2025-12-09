import { motion } from 'motion/react';
import { Clock, MapPin, Train } from 'lucide-react';
import { useState } from 'react';

export function ScheduleTab() {
  const [scheduleItems, setScheduleItems] = useState([
    { id: 1, time: '09:00', location: 'Tokyo Station', activity: 'Departure', done: false },
    { id: 2, time: '12:30', location: 'Countryside Valley', activity: 'Scenic stop', done: false },
    { id: 3, time: '15:00', location: 'Mountain View Station', activity: 'Photo opportunity', done: false },
  ]);

  const toggleDone = (id: number) => {
    setScheduleItems(items =>
      items.map(item => (item.id === id ? { ...item, done: !item.done } : item))
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
        <div className="p-3 bg-[#FF6B6B]/10 rounded-full">
          <Clock className="w-6 h-6 text-[#FF6B6B]" />
        </div>
        <h2 className="text-[#8B4513]" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem' }}>
          Journey Schedule
        </h2>
      </div>

      <div className="space-y-4">
        {scheduleItems.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div className="flex gap-4 p-4 bg-white/50 rounded-lg border-2 border-[#8B4513]/10 hover:border-[#FF6B6B]/30 transition-colors">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleDone(item.id)}
                className="mt-1 w-5 h-5 rounded border-2 border-[#8B4513]/30 text-[#FF6B6B] focus:ring-[#FF6B6B] cursor-pointer"
              />
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Train className="w-4 h-4 text-[#FF6B6B]" />
                  <span className={`text-[#8B4513] ${item.done ? 'line-through opacity-50' : ''}`}>
                    {item.time}
                  </span>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#87CEEB] mt-1 flex-shrink-0" />
                  <div>
                    <p className={`text-gray-700 ${item.done ? 'line-through opacity-50' : ''}`}>
                      {item.location}
                    </p>
                    <p className={`text-gray-500 ${item.done ? 'line-through opacity-50' : ''}`} style={{ fontSize: '0.875rem' }}>
                      {item.activity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {index < scheduleItems.length - 1 && (
              <div className="ml-6 h-6 w-0.5 bg-[#8B4513]/20 my-1" />
            )}
          </motion.div>
        ))}
      </div>

      <motion.button
        className="w-full mt-6 p-4 bg-[#FF6B6B]/10 hover:bg-[#FF6B6B]/20 rounded-lg border-2 border-dashed border-[#FF6B6B]/30 text-[#8B4513] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        + Add new stop
      </motion.button>
    </motion.div>
  );
}
