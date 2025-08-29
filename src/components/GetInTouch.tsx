import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown } from "@fortawesome/free-solid-svg-icons";

const GetInTouch: React.FC = () => {
  return (
    <div className="w-full">
      {/* Full-width band */}
      <div className="w-full bg-orange-600 py-4">
        <div className="container mx-auto px-4 md:px-8 text-center">
          <p className="text-xs md:text-sm text-white">
            For more information about our products or to request a quote.
          </p>
          <p className="text-lg md:text-xl font-bold text-white mt-2">
            Get in Touch Today!
          </p>
        </div>
      </div>

      {/* Bouncing Arrow — encostado no footer */}
      <div className="w-full flex justify-center mt-0 -mb-1">
        <FontAwesomeIcon
          icon={faChevronDown}
          className="text-orange-600 text-2xl animate-bounce"
        />
      </div>
    </div>
  );
};

export default GetInTouch;
