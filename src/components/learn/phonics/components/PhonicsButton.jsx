import { memo } from "react";
import ActivityButton from "../../../ActivityButton.jsx";

const PhonicsButton = memo(function PhonicsButton({
  children,
  onClick,
  variant = "primary",
  size = "default",
  disabled = false,
  className = ""
}) {
  return (
    <ActivityButton
      onClick={onClick}
      disabled={disabled}
      className={`phonics-button phonics-button-${variant} phonics-button-${size} ${className}`}
      type="button"
    >
      {children}
    </ActivityButton>
  );
});

export default PhonicsButton;
