import { useState } from 'react';

const SwitchInputButton = ({disabled, renewHistory}:any) => {
  const [checked, setChecked] = useState(false);

  return (
    <div className="flex items-center space-x-3 bg-gray-50 cursor-pointer py-1 px-2 lg:min-w-[180px] rounded-full"
        onClick={() => setChecked(!checked)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={renewHistory ?? checked}
        disabled={disabled}
        
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          ${checked ? 'bg-orange-500' : 'bg-gray-200'}
        `}
      >
        <span className="sr-only">Use setting</span>
        <span
          aria-hidden="true"
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
        <span className={`text-sm font-medium ${checked? 'text-gray-700': 'text-gray-300'}`}>Auto Renew</span>
    </div>
  );
};

export default SwitchInputButton;