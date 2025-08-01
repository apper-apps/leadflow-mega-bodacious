import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

const Card = React.forwardRef(({ 
  children, 
  className = "", 
  hover = true,
  padding = "md",
  ...props 
}, ref) => {
  const baseStyles = "bg-white rounded-lg border border-gray-200 shadow-sm";
  const hoverStyles = hover ? "hover:shadow-md transition-shadow duration-200" : "";
  
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <motion.div
      ref={ref}
      className={cn(
        baseStyles,
        hoverStyles,
        paddings[padding],
        className
      )}
      whileHover={hover ? { y: -2 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = "Card";

export default Card;