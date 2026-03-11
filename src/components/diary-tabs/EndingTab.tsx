import { motion } from 'motion/react';
import { BookOpen, Sparkles } from 'lucide-react';

export function EndingTab() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#C7CEEA]/10 rounded-full">
          <BookOpen className="w-6 h-6 text-[#C7CEEA]" />
        </div>
        <h2 className="text-[#8B4513]" style={{ fontFamily: 'Georgia, serif', fontSize: '2rem' }}>
          Journey's End
        </h2>
      </div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Reflection section */}
        <div className="p-6 bg-gradient-to-br from-[#C7CEEA]/10 to-[#87CEEB]/10 rounded-lg border border-[#C7CEEA]/30">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#C7CEEA]" />
            <h3 className="text-[#8B4513]" style={{ fontSize: '1.25rem' }}>
              Travel Reflections
            </h3>
          </div>
          
          <textarea
            placeholder="What did this journey mean to you? Write your thoughts and feelings here..."
            className="w-full h-40 p-4 bg-white/50 rounded-lg border-2 border-[#8B4513]/10 focus:border-[#C7CEEA]/50 focus:outline-none resize-none text-gray-700 placeholder:text-gray-400 placeholder:italic"
            style={{
              fontSize: '0.875rem',
              lineHeight: '1.6',
              fontFamily: 'Georgia, serif',
            }}
          />
        </div>

        {/* Favorite moment */}
        <div className="p-5 bg-white/50 rounded-lg border-2 border-[#8B4513]/10">
          <h3 className="text-[#8B4513] mb-3" style={{ fontSize: '1.125rem' }}>
            Most Memorable Moment
          </h3>
          <input
            type="text"
            placeholder="Describe your favorite moment..."
            className="w-full p-3 bg-white/50 rounded-lg border border-[#8B4513]/20 focus:border-[#C7CEEA]/50 focus:outline-none text-gray-700 placeholder:text-gray-400 placeholder:italic"
            style={{ fontSize: '0.875rem' }}
          />
        </div>

        {/* Quote section */}
        <motion.div
          className="relative p-6 bg-gradient-to-br from-[#87CEEB]/5 to-[#90EE90]/5 rounded-lg overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="absolute top-0 left-0 text-[#C7CEEA]/20" style={{ fontSize: '4rem', lineHeight: '1' }}>
            "
          </div>
          <div className="absolute bottom-0 right-0 text-[#C7CEEA]/20" style={{ fontSize: '4rem', lineHeight: '1' }}>
            "
          </div>
          
          <p className="relative text-center text-[#8B4513] italic px-8" style={{ fontSize: '1.125rem', lineHeight: '1.8' }}>
            Every journey changes us in ways we cannot predict.
            <br />
            The memories we collect become the stories we share,
            <br />
            and the person we become.
          </p>
        </motion.div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Days', value: '7', color: '#FF6B6B' },
            { label: 'Stops', value: '12', color: '#4ECDC4' },
            { label: 'Memories', value: '∞', color: '#C7CEEA' },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              className="p-4 bg-white/50 rounded-lg border-2 border-[#8B4513]/10 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + index * 0.1 }}
            >
              <p className="mb-1" style={{ fontSize: '1.5rem', color: stat.color }}>
                {stat.value}
              </p>
              <p className="text-gray-600" style={{ fontSize: '0.875rem' }}>
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Completion message */}
        <motion.div
          className="mt-8 p-6 bg-gradient-to-r from-[#87CEEB]/20 via-[#90EE90]/20 to-[#FFE66D]/20 rounded-lg border-2 border-[#8B4513]/20 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <Sparkles className="w-8 h-8 text-[#C7CEEA] mx-auto mb-3" />
          <p className="text-[#8B4513] mb-2" style={{ fontSize: '1.25rem' }}>
            Thank you for traveling with us
          </p>
          <p className="text-gray-600 italic" style={{ fontSize: '0.875rem' }}>
            Until we meet again on another journey...
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
