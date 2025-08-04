import React, { useState, Dispatch, SetStateAction } from 'react';

interface PreferenceOptionProps {
  label: string;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

const PreferenceOption: React.FC<PreferenceOptionProps> = ({ label, checked, disabled, onChange }) => {
  return (
    <label className="flex items-center py-4 cursor-pointer">
      <div className="flex items-center justify-center mr-4">
        <input
          type="checkbox"
          className={`hidden `} 
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-5 h-5 rounded border flex items-center justify-center ${checked ? 'bg-[#F35114] border-[#F35114]' : 'border-gray-300'}`}>
          {checked && (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
      </div>
      <span className={`${disabled ? 'cursor-not-allowed text-gray-300': 'text-gray-800'} `}>{label}</span>
    </label>
  );
};


type MarketingPreferencesPageProps = {
  changeVisibility: Dispatch<SetStateAction<boolean>>;
};

const MarketingPreferencesPage: React.FC<MarketingPreferencesPageProps> = ({changeVisibility}:any) => {
  // State for preferences
  const [preferences, setPreferences] = useState({
    promotionalEmails: true,
    monthlyNewsletter: false,
    feedbackCollection: false,
    discountsOffers: false,
  });

  const handlePreferenceChange = (preference: keyof typeof preferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [preference]: value
    }));
  };
 
  return (
    <div className="  mx-auto"> 
      <div className=" mt-5">
         
        <div>
          <PreferenceOption
            label="Promotional emails"
            checked={preferences.promotionalEmails}
              disabled={false}
            onChange={(checked) => handlePreferenceChange('promotionalEmails', checked)}
          />
          
          <div className="border-t border-gray-100">
            <PreferenceOption
              label="Monthly newsletter"
              checked={preferences.monthlyNewsletter}
              disabled={true}
              onChange={(checked) => handlePreferenceChange('monthlyNewsletter', checked)}
            />
          </div>
          
          <div className="border-t border-gray-100">
            <PreferenceOption
              label="Feedback collection"
              checked={preferences.feedbackCollection}
              disabled={true}
              onChange={(checked) => handlePreferenceChange('feedbackCollection', checked)}
            />
          </div>
          
          <div className="border-t border-gray-100">
            <PreferenceOption
              label="Discounts & offers"
              checked={preferences.discountsOffers}
              disabled={true}
              onChange={(checked) => handlePreferenceChange('discountsOffers', checked)}
            />
          </div>
        </div>
        
        <div onClick={()=>changeVisibility(false)} className="mt-6">
          <button  className="w-full bg-[#F35114] hover:bg-indigo-800 text-white py-3 px-4 rounded-md">
            Update preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingPreferencesPage;