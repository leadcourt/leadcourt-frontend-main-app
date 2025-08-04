import { ChevronRight } from "lucide-react";

 
const SettingsOption = ({ icon, title, onClick }: any) => {
  return (
    <div 
      className="flex items-center justify-between py-4 cursor-pointer hover:bg-gray-50"
      onClick={()=>onClick(title)}
    >
      <div className="flex items-center space-x-4">
        <div className=""><i className={`pi ${icon}`}></i>
          {/* {icon} */}
        </div>
        <span className="text-gray-800 font-medium">{title}</span>
      </div>
      {title === 'Referral Program' ? 
      <span className="text-gray-400 text-xs uppercase">coming soon</span>: 
      <ChevronRight className="text-gray-400" size={20} />
      }
    </div>
  );
};

export default SettingsOption;