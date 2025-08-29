// src/components/ui/AccentBar.tsx
import React from "react";

const AccentBar: React.FC = () => {
  return (
    <>
      <style>
        {`
          @keyframes listoGradientShift {
            0%   { background-position: 0% 50%; }
            50%  { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      <div
        className="w-full h-[3px]"
        style={{
          // laranja vivo → vermelho quente → laranja
          background:
            "linear-gradient(90deg, #ff7a00, #ff3b00, #ff7a00, #ff1f00)",
          backgroundSize: "300% 300%",
          animation: "listoGradientShift 5.5s ease-in-out infinite",
        }}
      />
    </>
  );
};

export default AccentBar;
