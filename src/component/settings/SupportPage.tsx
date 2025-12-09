import React from "react";
import { ChevronRight, FileText, Mail } from "lucide-react";
import { Link } from "react-router-dom";

interface SupportOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick?: () => void;
}

const SupportOption: React.FC<SupportOptionProps> = ({
  icon,
  title,
  description,
  onClick,
}) => {
  return (
    <div
      className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50"
      onClick={onClick}
    >
      <div className="flex items-center space-x-4">
        <div className="bg-red-100 p-2 rounded-md text-red-500">{icon}</div>
        <div>
          <h3 className="text-gray-800 font-medium">{title}</h3>
          <p className="text-gray-500 text-sm">{description}</p>
        </div>
      </div>
      <ChevronRight className="text-gray-400" size={20} />
    </div>
  );
};

const SupportPage:any = ({faq}:any) => {
    
  return (
    <div className=" mx-auto">
      <div className=" ">
        <div>
          {faq && 
            <Link to={'https://www.leadcourt.com/#FAQ'}>

            <SupportOption
              icon={<i className="pi pi-question"></i>}
              title="FAQ"
              description=""
            />
            </Link>
          }

          <div className="border-t border-gray-100">
            <Link to={"mailto:help@leadcourt.com"}>
              <SupportOption
                icon={<Mail size={20} />}
                title="EMAIL"
                description="help@leadcourt.com"
              />
            </Link>
          </div>

          <div className="border-t border-gray-100">
            <Link to={"https://www.leadcourt.com/termsandcondition.html"}>
              <SupportOption
                icon={<FileText size={20} />}
                title="Terms and Conditions"
                description=""
              />
            </Link>
          </div>

          <div className="border-t border-gray-100">
            <Link to={"https://www.leadcourt.com/privacyandpolicy.html"}>
              <SupportOption
                icon={<i className="pi pi-shield"></i>}
                title="Privacy Policy"
                description=""
              />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
