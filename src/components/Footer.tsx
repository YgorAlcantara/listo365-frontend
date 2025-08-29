// src/components/Footer.tsx
import React from "react";
// ajuste o caminho do logo para o seu projeto
import logo from "@/assets/Icon/NBS/NbslistoIcon.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faLocationDot,
  faEnvelope,
  faPhone,
} from "@fortawesome/free-solid-svg-icons";
import { faInstagram } from "@fortawesome/free-brands-svg-icons";
import type { IconProp } from "@fortawesome/fontawesome-svg-core";

const Footer: React.FC = () => {
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 md:py-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* contato */}
          <div className="text-center md:text-left">
            <ul className="space-y-1.5 text-sm text-neutral-700">
              <li>
                <FontAwesomeIcon
                  className="mr-2 text-orange-600"
                  icon={faPhone}
                />
                Ed: 813-477-1887 / Michael: 813-601-2953
              </li>
              <li>
                <FontAwesomeIcon
                  className="mr-2 text-orange-600"
                  icon={faEnvelope}
                />
                <a
                  href="mailto:Katherine.nbs.team@gmail.com"
                  className="underline decoration-dotted underline-offset-2 hover:text-orange-700"
                >
                  Katherine.nbs.team@gmail.com
                </a>
              </li>
              <li className="flex items-center justify-center md:justify-start">
                <FontAwesomeIcon
                  className="mr-2 text-orange-600"
                  icon={faInstagram as IconProp}
                />
                <span>@nationwidebuildingsolutions</span>
              </li>
              <li>
                <FontAwesomeIcon
                  className="mr-2 text-orange-600"
                  icon={faLocationDot}
                />
                3330 West Cypress Street, Tampa, FL 33607
              </li>
            </ul>
          </div>

          {/* logo */}
          <div className="shrink-0">
            <img src={logo} alt="Logo" className="h-32 md:h-32 w-auto" />
          </div>
        </div>

        <div className="mt-6 border-t pt-3 text-center text-xs text-neutral-500">
          © {new Date().getFullYear()} Listo365. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
