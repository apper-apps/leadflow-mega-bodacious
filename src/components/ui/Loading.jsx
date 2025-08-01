import { motion } from "framer-motion";

const Loading = ({ className = "", type = "default" }) => {
  if (type === "table") {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Table header skeleton */}
        <div className="bg-white rounded-lg border">
          <div className="grid grid-cols-6 gap-4 p-4 border-b">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
          {/* Table rows skeleton */}
          {[...Array(8)].map((_, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
              {[...Array(6)].map((_, colIndex) => (
                <div key={colIndex} className="h-4 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === "kanban") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 ${className}`}>
        {[...Array(5)].map((_, stageIndex) => (
          <div key={stageIndex} className="bg-gray-50 rounded-lg p-4">
            <div className="h-6 bg-gray-200 rounded mb-4 animate-pulse" />
            <div className="space-y-3">
              {[...Array(3)].map((_, cardIndex) => (
                <div key={cardIndex} className="bg-white rounded-lg p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4" />
                  <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
        {[...Array(6)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
              <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-12 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center min-h-[200px] ${className}`}>
      <motion.div
        className="flex space-x-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {[...Array(3)].map((_, index) => (
          <motion.div
            key={index}
            className="w-3 h-3 bg-primary rounded-full"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: index * 0.2,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
};

export default Loading;