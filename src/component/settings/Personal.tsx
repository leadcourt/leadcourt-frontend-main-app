import React, { useEffect, useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { Dropdown } from 'primereact/dropdown';
import { useRecoilValue } from 'recoil';
import { userState } from '../../utils/atom/authAtom';
import { getPersonalInformation, setPersonalInformation } from '../../utils/api/settingsApi';
import { toast } from 'react-toastify';

// Top 100+ Country Codes
const countryCodes = [
  { label: "🇮🇳 +91 (India)", value: "+91" },
  { label: "🇺🇸 +1 (USA)", value: "+1" },
  { label: "🇬🇧 +44 (UK)", value: "+44" },
  { label: "🇦🇪 +971 (UAE)", value: "+971" },
  { label: "🇨🇦 +1 (Canada)", value: "+1" },
  { label: "🇦🇺 +61 (Australia)", value: "+61" },
  { label: "🇩🇪 +49 (Germany)", value: "+49" },
  { label: "🇫🇷 +33 (France)", value: "+33" },
  { label: "🇸🇬 +65 (Singapore)", value: "+65" },
  { label: "🇸🇦 +966 (Saudi Arabia)", value: "+966" },
  { label: "🇶🇦 +974 (Qatar)", value: "+974" },
  { label: "🇰🇼 +965 (Kuwait)", value: "+965" },
  { label: "🇴🇲 +968 (Oman)", value: "+968" },
  { label: "🇧🇭 +973 (Bahrain)", value: "+973" },
  { label: "🇿🇦 +27 (South Africa)", value: "+27" },
  { label: "🇳🇬 +234 (Nigeria)", value: "+234" },
  { label: "🇰🇪 +254 (Kenya)", value: "+254" },
  { label: "🇵🇰 +92 (Pakistan)", value: "+92" },
  { label: "🇧🇩 +880 (Bangladesh)", value: "+880" },
  { label: "🇱🇰 +94 (Sri Lanka)", value: "+94" },
  { label: "🇳🇵 +977 (Nepal)", value: "+977" },
  { label: "🇲🇾 +60 (Malaysia)", value: "+60" },
  { label: "🇮🇩 +62 (Indonesia)", value: "+62" },
  { label: "🇹🇭 +66 (Thailand)", value: "+66" },
  { label: "🇻🇳 +84 (Vietnam)", value: "+84" },
  { label: "🇵🇭 +63 (Philippines)", value: "+63" },
  { label: "🇯🇵 +81 (Japan)", value: "+81" },
  { label: "🇰🇷 +82 (South Korea)", value: "+82" },
  { label: "🇨🇳 +86 (China)", value: "+86" },
  { label: "🇧🇷 +55 (Brazil)", value: "+55" },
  { label: "🇲🇽 +52 (Mexico)", value: "+52" },
  { label: "🇪🇸 +34 (Spain)", value: "+34" },
  { label: "🇮🇹 +39 (Italy)", value: "+39" },
  { label: "🇷🇺 +7 (Russia)", value: "+7" },
  { label: "🇹🇷 +90 (Turkey)", value: "+90" },
  { label: "🇳🇱 +31 (Netherlands)", value: "+31" },
  { label: "🇨🇭 +41 (Switzerland)", value: "+41" },
  { label: "🇸🇪 +46 (Sweden)", value: "+46" },
  { label: "🇳🇴 +47 (Norway)", value: "+47" },
  { label: "🇩🇰 +45 (Denmark)", value: "+45" },
  { label: "🇮🇪 +353 (Ireland)", value: "+353" },
  { label: "🇳🇿 +64 (New Zealand)", value: "+64" },
  { label: "🇮🇱 +972 (Israel)", value: "+972" },
  { label: "🇪🇬 +20 (Egypt)", value: "+20" },
  { label: "🇦🇷 +54 (Argentina)", value: "+54" },
  { label: "🇨🇱 +56 (Chile)", value: "+56" },
  { label: "🇨🇴 +57 (Colombia)", value: "+57" },
  { label: "🇵🇪 +51 (Peru)", value: "+51" },
  { label: "🇻🇪 +58 (Venezuela)", value: "+58" },
  { label: "🇺🇾 +598 (Uruguay)", value: "+598" },
  { label: "🇵🇾 +595 (Paraguay)", value: "+595" },
  { label: "🇧🇴 +591 (Bolivia)", value: "+591" },
  { label: "🇪🇨 +593 (Ecuador)", value: "+593" },
  { label: "🇵🇦 +507 (Panama)", value: "+507" },
  { label: "🇨🇷 +506 (Costa Rica)", value: "+506" },
  { label: "🇬🇹 +502 (Guatemala)", value: "+502" },
  { label: "🇭🇳 +504 (Honduras)", value: "+504" },
  { label: "🇸🇻 +503 (El Salvador)", value: "+503" },
  { label: "🇳🇮 +505 (Nicaragua)", value: "+505" },
  { label: "🇨🇺 +53 (Cuba)", value: "+53" },
  { label: "🇯🇲 +1-876 (Jamaica)", value: "+1-876" },
  { label: "🇩🇴 +1-809 (Dominican Rep.)", value: "+1-809" },
  { label: "🇭🇹 +509 (Haiti)", value: "+509" },
  { label: "🇲🇦 +212 (Morocco)", value: "+212" },
  { label: "🇩🇿 +213 (Algeria)", value: "+213" },
  { label: "🇹🇳 +216 (Tunisia)", value: "+216" },
  { label: "🇱🇾 +218 (Libya)", value: "+218" },
  { label: "🇸🇩 +249 (Sudan)", value: "+249" },
  { label: "🇪🇹 +251 (Ethiopia)", value: "+251" },
  { label: "🇹🇿 +255 (Tanzania)", value: "+255" },
  { label: "🇺🇬 +256 (Uganda)", value: "+256" },
  { label: "🇷🇼 +250 (Rwanda)", value: "+250" },
  { label: "🇬🇭 +233 (Ghana)", value: "+233" },
  { label: "🇨🇮 +225 (Ivory Coast)", value: "+225" },
  { label: "🇸🇳 +221 (Senegal)", value: "+221" },
  { label: "🇨🇲 +237 (Cameroon)", value: "+237" },
  { label: "🇦🇴 +244 (Angola)", value: "+244" },
  { label: "🇿🇲 +260 (Zambia)", value: "+260" },
  { label: "🇿🇼 +263 (Zimbabwe)", value: "+263" },
  { label: "🇲🇿 +258 (Mozambique)", value: "+258" },
  { label: "🇲🇬 +261 (Madagascar)", value: "+261" },
  { label: "🇲🇺 +230 (Mauritius)", value: "+230" },
  { label: "🇦🇹 +43 (Austria)", value: "+43" },
  { label: "🇧🇪 +32 (Belgium)", value: "+32" },
  { label: "🇵🇹 +351 (Portugal)", value: "+351" },
  { label: "🇬🇷 +30 (Greece)", value: "+30" },
  { label: "🇨🇿 +420 (Czechia)", value: "+420" },
  { label: "🇭🇺 +36 (Hungary)", value: "+36" },
  { label: "🇵🇱 +48 (Poland)", value: "+48" },
  { label: "🇷🇴 +40 (Romania)", value: "+40" },
  { label: "🇧🇬 +359 (Bulgaria)", value: "+359" },
  { label: "🇷🇸 +381 (Serbia)", value: "+381" },
  { label: "🇭🇷 +385 (Croatia)", value: "+385" },
  { label: "🇸🇮 +386 (Slovenia)", value: "+386" },
  { label: "🇸🇰 +421 (Slovakia)", value: "+421" },
  { label: "🇺🇦 +380 (Ukraine)", value: "+380" },
  { label: "🇧🇾 +375 (Belarus)", value: "+375" },
  { label: "🇰🇿 +7 (Kazakhstan)", value: "+7" },
  { label: "🇺🇿 +998 (Uzbekistan)", value: "+998" },
  { label: "🇦🇫 +93 (Afghanistan)", value: "+93" },
  { label: "🇮🇷 +98 (Iran)", value: "+98" },
  { label: "🇮🇶 +964 (Iraq)", value: "+964" },
  { label: "🇸🇾 +963 (Syria)", value: "+963" },
  { label: "🇱🇧 +961 (Lebanon)", value: "+961" },
  { label: "🇯🇴 +962 (Jordan)", value: "+962" },
  { label: "🇾🇪 +967 (Yemen)", value: "+967" },
  { label: "🇲🇲 +95 (Myanmar)", value: "+95" },
  { label: "🇰🇭 +855 (Cambodia)", value: "+855" },
  { label: "🇱🇦 +856 (Laos)", value: "+856" },
  { label: "🇲🇳 +976 (Mongolia)", value: "+976" }
].sort((a, b) => a.label.localeCompare(b.label));

interface ProfileDetailItemProps {
  icon: React.ReactNode;
  iconColor: string;
  label: string;
  value: string;
}

interface PayloadData {
  id: string | undefined;
  full_name?: string;
  phone_number?: string; 
}

const PersonalInformationPage: React.FC = () => {
  const user = useRecoilValue(userState)

  const [userData, setUserData] = useState<any>({})
  const [data, setData] = useState<any>({})
  const [editInfo, setEditInfo] = useState('')
  const [submitLoading, setSubmitLoading] = useState(false)
  const [countryCode, setCountryCode] = useState('+91');

  const handleDataChange = (keyItem: any, value: any) => {
    setData((prevState: any) => ({
      ...prevState,
      [keyItem]: value,
    }));
  };

  const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ icon, iconColor, label, value }) => {
    return (
      <div className="flex items-start space-x-4 py-4">
        <div className={`${iconColor} p-2 rounded-md`}>
          <div >
            {icon}
          </div>
        </div>
  
        <div className="flex-1">
          <p className="text-xs uppercase font-medium text-gray-500">{label}</p>
          {editInfo === label ? 
            (label === 'Phone number' ? (
              <div className="flex items-center gap-2 mt-1">
                <Dropdown 
                  value={countryCode} 
                  options={countryCodes} 
                  onChange={(e) => setCountryCode(e.value)} 
                  filter 
                  placeholder="Code"
                  className="w-[140px] shadow border border-gray-200 outline-none rounded py-0 px-2 flex items-center h-[34px]"
                />
                <input 
                  value={data[label] || ''} 
                  onChange={(e)=>handleDataChange(label, e.target.value)} 
                  type="text" 
                  autoFocus 
                  placeholder="Mobile Number"
                  className='outline-gray-200 outline-1 rounded shadow py-1 px-2 h-[34px] flex-grow'
                />
              </div>
            ) : (
              <input 
                value={data[label] || ''} 
                onChange={(e)=>handleDataChange(label, e.target.value)} 
                type="text" 
                autoFocus 
                className='outline-gray-200 outline-1 rounded shadow my-1 py-1 px-2 w-full'
              />
            ))
          :
            <p className="text-gray-700">{data[label] ?? value}</p>
          }
        </div>
      </div>
    );
  };

  // submit form
  const onSubmit = async () => {
    setSubmitLoading(true)
    const payload: PayloadData = {
      id : user?.id,  
    }

    if (data['Full name']){
      payload.full_name = data['Full name']
    }

    if (data['Phone number']){
      // Attach the country code to the final phone number before sending to backend
      const phoneValue = data['Phone number'];
      if (!phoneValue.startsWith('+')) {
        payload.phone_number = `${countryCode} ${phoneValue}`.trim();
      } else {
        payload.phone_number = phoneValue;
      }
    }

    await setPersonalInformation(payload).then(()=> {
      toast.success('Information updated successfully')
    }).catch((_err)=> {
      // Fixed Vercel TypeScript issue by prefixing with underscore
      toast.error('Failed to update information');
    })

    setSubmitLoading(false)
  }

  const changeEdit = (info: string) => {
    if (editInfo == info) {
      setEditInfo('')
    } else {
      setEditInfo(info)
    }
  }

  const getInfo = async (payload:any) => {
    await getPersonalInformation(payload.id).then((res)=>{
      setUserData({
        FullName: res.full_name ?? user?.email,
        email: user?.email ,
        phone: res?.phone_number ?? ''
      })
      
      setData({
        "Full name": res?.full_name ?? user?.name,
        'Phone number': res?.phone_number ?? ''
      })

    }).catch((_err)=>{
      // Fixed Vercel TypeScript issue
      console.log("Failed to fetch user data");
    })
  }

  useEffect(()=>{
    if(user?.id) {
       getInfo(user);
    }
  }, [user])
 
  return (
    <div className="mx-auto"> 
      <div className=""> 
        
        {/* PROFILE IMAGE COMPONENT REMOVED FROM HERE */}
        
        <div className="mt-6">
          <h3 className="text-gray-600 mb-2">Profile details</h3>
          
          <div className="flex items-center justify-between">
            <ProfileDetailItem 
              icon={<User size={20} />}
              iconColor='bg-blue-100 text-blue-600'
              label="Full name"
              value={userData.FullName}
            />
            <i 
              onClick={() => changeEdit("Full name")}
              className={`pi ${editInfo == 'Full name' ? 'pi-check text-green-500' : 'pi-pencil'} cursor-pointer p-3 rounded-2xl text-lg bg-gray-100 ${editInfo == 'Full name' ? 'bg-green-50' : 'text-gray-400'}`}>
            </i>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100">
            <ProfileDetailItem 
              icon={<Mail size={20} />}
              iconColor='bg-red-100 text-red-600'
              label="Email address"
              value={userData.email}
            />
          </div>
          
          <div className="flex items-center justify-between border-t border-gray-100">
            <ProfileDetailItem 
              icon={<Phone size={20} />}
              iconColor='bg-yellow-100 text-yellow-600'
              label="Phone number"
              value={userData?.phone ? userData?.phone : 'None'}
            />
            <i 
              onClick={() => changeEdit("Phone number")}
              className={`pi ${editInfo == 'Phone number' ? 'pi-check text-green-500' : 'pi-pencil'} cursor-pointer p-3 rounded-2xl text-lg bg-gray-100 ${editInfo == 'Phone number' ? 'bg-green-50' : 'text-gray-400'}`}>
            </i>
          </div>
        </div>
        
        <div className="mt-6">
          {submitLoading ? 
            <button disabled className="bg-[#f34f146c] w-full text-white py-3 px-4 rounded-md flex items-center justify-center gap-2">
              <i className='pi pi-spin pi-spinner'></i> <span>Update profile</span>
            </button>
          :
            <button onClick={onSubmit} className="bg-[#F35114] w-full hover:bg-red-500 hover:cursor-pointer text-white py-3 px-4 rounded-md">
              <span>Update profile</span>
            </button>
          }
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationPage;