import { motion } from 'motion/react';
import { Target, CheckCircle2, Circle } from 'lucide-react';
import { useState } from 'react';

export function MissionsTab() {
  const [missions, setMissions] = useState([
    { id: 1, title: 'Watch sunrise from train window', completed: false },
    { id: 2, title: 'Collect a wildflower', completed: false },
    { id: 3, title: 'Meet a local and share stories', completed: false },
    { id: 4, title: 'Take a photo with the train', completed: true },
    { id: 5, title: 'Write a postcard to yourself', completed: false },
  ]);

  const toggleMission = (id: number) => {
    setMissions(missions =>
      missions.map(mission =>
        mission.id === id ? { ...mission, completed: !mission.completed } : mission
      )
    );
  };

  const completedCount = missions.filter(m => m.completed).length;
  const totalCount = missions.length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#95E1D3]/10 rounded-full">
          <Target className="w-6 h-6 text-[#95E1D3]" />
        </div>
        <div className="flex-1">
          <h2 className="text-[#8B4513]" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem' }}>
            Travel Missions
          </h2>
          <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
            {completedCount} of {totalCount} completed
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-3 bg-white/50 rounded-full overflow-hidden border border-[#8B4513]/10">
        <motion.div
          className="h-full bg-gradient-to-r from-[#95E1D3] to-[#4ECDC4]"
          initial={{ width: 0 }}
          animate={{ width: `${(completedCount / totalCount) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="space-y-3">
        {missions.map((mission, index) => (
          <motion.button
            key={mission.id}
            onClick={() => toggleMission(mission.id)}
            className="w-full text-left"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ x: 4 }}
          >
            <div className="flex items-start gap-3 p-4 bg-white/50 rounded-lg border-2 border-[#8B4513]/10 hover:border-[#95E1D3]/50 transition-colors">
              {mission.completed ? (
                <CheckCircle2 className="w-6 h-6 text-[#95E1D3] flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="w-6 h-6 text-gray-400 flex-shrink-0 mt-0.5" />
              )}
              
              <p
                className={`flex-1 transition-all ${
                  mission.completed
                    ? 'text-gray-400 line-through'
                    : 'text-[#8B4513]'
                }`}
              >
                {mission.title}
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <motion.button
        className="w-full mt-6 p-4 bg-[#95E1D3]/10 hover:bg-[#95E1D3]/20 rounded-lg border-2 border-dashed border-[#95E1D3]/50 text-[#8B4513] transition-colors"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        + Add custom mission
      </motion.button>

      {completedCount === totalCount && (
        <motion.div
          className="p-4 bg-gradient-to-br from-[#95E1D3]/20 to-[#4ECDC4]/20 rounded-lg border border-[#95E1D3]/50 text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
        >
          <p className="text-[#8B4513]">
            🎉 All missions completed! You're a true traveler!
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
