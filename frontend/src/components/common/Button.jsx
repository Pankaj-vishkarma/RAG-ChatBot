const Button = ({ children, onClick, type = "button", disabled, className }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-medium transition 
      ${disabled ? "opacity-50 cursor-not-allowed" : "hover:opacity-90"}
      bg-blue-600 text-white ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;