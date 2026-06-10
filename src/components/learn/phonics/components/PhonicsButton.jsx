import { memo } from "react";
import { motion } from "framer-motion";

const PhonicsButton = memo(function PhonicsButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  disabled = false,
  className = ""
}) {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.98, y: 4 }}
      onClick={onClick}
      disabled={disabled}
      className={`phonics-button phonics-button-${variant} phonics-button-${size} ${className}`}
      type="button"
    >
      {children}
    </motion.button>
  );
});

export default PhonicsButton;
