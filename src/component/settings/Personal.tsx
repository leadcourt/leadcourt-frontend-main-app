import React, { useEffect, useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import { useRecoilValue } from 'recoil';
import { userState } from '../../utils/atom/authAtom';
import { getPersonalInformation, setPersonalInformation } from '../../utils/api/settingsApi';
import { toast } from 'react-toastify';

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

  const handleDataChange = (keyItem: any, value: any) => {
    setData((prevState: any) => ({
      ...prevState,
      [keyItem]: value,
    }));
  };

  const ProfileDetailItem: React.FC<ProfileDetailItemProps> = ({ icon, iconColor, label, value }) => {
    return (
      <div className="flex items-center space-x-4 py-4 flex-1">
        <div className={`${iconColor} p-2 rounded-md`}>
          <div>
            {icon}
          </div>
        </div>
  
        <div className="flex-1">
          <p className="text-xs uppercase font-medium text-gray-500">{label}</p>
          
          {editInfo === label ? (
            label === 'Phone number' ? (
              // Custom Edit Mode UI for Phone Number
              <div className="flex gap-2 items-center mt-1 bg-white outline-gray-200 outline-1 rounded shadow p-1">
                <select 
                  value={data['countryCode'] || '+91'} 
                  onChange={(e) => handleDataChange('countryCode', e.target.value)}
                  className="bg-transparent border-none outline-none text-sm cursor-pointer pl-1 text-gray-700"
                >
                  <option value="+91">🇮🇳 +91</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+971">🇦🇪 +971</option>
                </select>
                
                <div className="h-5 w-[1px] bg-gray-300"></div>
                
                <input 
                  value={data[label] || ''} 
                  onChange={(e)=>handleDataChange(label, e.target.value)} 
                  type="text" 
                  autoFocus 
                  placeholder="Mobile Number"
                  className='border-none outline-none flex-1 px-2 py-1 text-gray-700'
                />
              </div>
            ) : (
              // Default Edit Mode UI for Full Name, etc.
              <input 
                value={data[label] || ''} 
                onChange={(e)=>handleDataChange(label, e.target.value)} 
                type="text" 
                autoFocus 
                className='outline-gray-200 outline-1 rounded shadow my-1 py-1 px-2 w-full text-gray-700'
              />
            )
          ) : (
            // Non-Edit Mode Display
            <p className="text-gray-700 mt-1 font-medium">
              {data[label] 
                ? (label === 'Phone number' ? `${data['countryCode'] || '+91'} ${data[label]}` : data[label]) 
                : value}
            </p>
          )}
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
      // Combine country code and number for the database
      payload.phone_number = `${data['countryCode'] || '+91'} ${data['Phone number']}`.trim();
    }
    
    await setPersonalInformation(payload).then(()=> {
      toast.success('Information updated successfully')
      setEditInfo('') // Close edit mode after saving automatically
    }).catch(( )=> {
      // console.error("error occured", err);
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
      let phoneData = res?.phone_number ?? '';
      let cCode = '+91';
      let pNum = phoneData;
      
      // Auto-extract country code if API returns "+91 9876543210" format
      if(phoneData.startsWith('+') && phoneData.includes(' ')) {
          const parts = phoneData.split(' ');
          cCode = parts[0];
          pNum = parts.slice(1).join(' ');
      }

      setUserData({
        FullName: res.full_name ?? user?.email,
        email: user?.email ,
        phone: phoneData
      })
      
      setData({
        "Full name": res?.full_name ?? user?.name,
        'Phone number': pNum,
        'countryCode': cCode
      })

    }).catch((err)=>{
      
    })
  }

  useEffect(()=>{
    if(user?.id) {
      getInfo(user)
    }
  }, [user])
 
  return (
    <div className="mx-auto"> 
      <div className="">         
        <div className="mt-2">
          <h3 className="text-gray-600 mb-2 font-semibold">Profile details</h3>
          
          <div className="flex items-center justify-between">
            <ProfileDetailItem 
              icon={<User size={20} />}
              iconColor='bg-blue-100 text-blue-600'
              label="Full name"
              value={userData.FullName || 'None'}
            />
            <i 
              onClick={() => changeEdit("Full name")}
              className={`pi ${editInfo == 'Full name' ? 'pi-check text-green-500' : 'pi-pencil'} cursor-pointer p-3 rounded-full shadow-sm text-lg bg-gray-50 text-gray-400 hover:bg-gray-100 ml-4`}
            ></i>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100">
            <ProfileDetailItem 
              icon={<Mail size={20} />}
              iconColor='bg-red-100 text-red-600'
              label="Email address"
              value={userData.email || 'None'}
            />
            {/* Empty block to keep UI spacing perfectly aligned even without an edit button on Email */}
            <div className="w-[52px] ml-4"></div>
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
              className={`pi ${editInfo == 'Phone number' ? 'pi-check text-green-500' : 'pi-pencil'} cursor-pointer p-3 rounded-full shadow-sm text-lg bg-gray-50 text-gray-400 hover:bg-gray-100 ml-4`}
            ></i>
          </div>
        </div>
        
        <div className="mt-6">
          {submitLoading ? 
            <button disabled className="bg-[#f34f146c] w-full text-white py-3 px-4 rounded-md flex justify-center items-center gap-2">
              <i className='pi pi-spin pi-spinner'></i> <span>Update profile</span>
            </button>
          :
            <button onClick={onSubmit} className="bg-[#F35114] w-full hover:bg-[#de450f] transition-all hover:cursor-pointer text-white py-3 px-4 rounded-md font-medium">
              <span>Update profile</span>
            </button>
          }
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationPage;