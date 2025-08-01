import { motion } from "framer-motion";
import ApperIcon from "@/components/ApperIcon";
import Card from "@/components/atoms/Card";

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend = null, 
  color = "primary",
  format = "number"
}) => {
  const formatValue = (val) => {
    if (format === "currency") {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(val);
    }
    if (format === "percentage") {
      return `${val}%`;
    }
    return val.toLocaleString();
  };

  const colorClasses = {
    primary: "text-primary bg-primary/10",
    secondary: "text-secondary bg-secondary/10",
    accent: "text-accent bg-accent/10",
    success: "text-success bg-success/10",
    warning: "text-warning bg-warning/10",
    error: "text-error bg-error/10",
    info: "text-info bg-info/10",
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <motion.p
            className="text-3xl font-bold text-gray-900"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {formatValue(value)}
          </motion.p>
          {trend && (
            <motion.div
              className="flex items-center mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <ApperIcon
                name={trend > 0 ? "TrendingUp" : "TrendingDown"}
                size={16}
                className={trend > 0 ? "text-success" : "text-error"}
              />
              <span
                className={`ml-1 text-sm font-medium ${
                  trend > 0 ? "text-success" : "text-error"
                }`}
              >
                {Math.abs(trend)}%
              </span>
            </motion.div>
          )}
        </div>
        <motion.div
          className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <ApperIcon name={icon} size={24} />
        </motion.div>
      </div>
    </Card>
  );
};

export default MetricCard;