import React, { useEffect, useState } from 'react';
import { User, Mail, Phone } from 'lucide-react';
import profileAvatar from '../../assets/profileAvatar.jpg'
import { useRecoilValue } from 'recoil';
import { userState } from '../../utils/atom/authAtom';
import { getPersonalInformation, setPersonalInformation } from '../../utils/api/settingsApi';
import { toast } from 'react-toastify';
// interface ProfileImageProps {
//   imageUrl?: string;
// }

  const ProfileImage = ({ imageUrl }:any) => {
  return (
    <div className="items-center  mt-6">
      <h3 className="text-gray-600 mb-2">Profile image</h3>
      <div className="  flex items-center gap-5">
        <div className="w-15 h-15 rounded-full overflow-hidden bg-orange-100">
          {imageUrl ? (
            <img 
              src={profileAvatar} 
              alt="Profile" 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-orange-100 text-orange-500">
              <User size={32} />
            </div>
          )}
        </div>
        <div className="flex space-x-2 justify-center">
          <button className="bg-[#F35114] text-white px-7 py-2 rounded-md text-sm">
            Upload
          </button>
          <button className="text-gray-700 bg-gray-100 px-7 py-2 rounded-md text-sm">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

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
      <div className="flex items-start space-x-4 py-4">
        <div className={`${iconColor} p-2 rounded-md`}>
          <div >
            {icon}
          </div>
        </div>
  
        <div className="flex-1">
          <p className="text-xs uppercase font-medium text-gray-500">{label}</p>
          {editInfo === label ? 
          <input value={data[label]} onChange={(e)=>handleDataChange(label, e.target.value)} type="text" autoFocus className='outline-gray-200 outline-1 rounded shadow my-1 py-1 px-2'/>
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
      payload.phone_number = data['Phone number']
    }

    
    await setPersonalInformation(payload).then(()=> {
      toast.success('Information updated successfully')
      
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
      
      setUserData({
        profileImage: '/api/placeholder/80/80', // Placeholder image
        FullName: res.full_name ?? user?.email,
        email: user?.email ,
        phone: res?.phone_number ?? ''
      })

      console.log(res);
      
      
      setData({
        "Full name": res?.full_name ?? user?.name,
        'Phone number': res?.phone_number ?? ''
      })

     

    // }).catch((err)=>{
      
    })
  }

  useEffect(()=>{
    getInfo(user)
  }, [])
 
  return (
    <div className=" mx-auto"> 
      
      <div className=""> 
        
        <ProfileImage imageUrl={userData.profileImage} />
        
        <div className="mt-6">
          <h3 className="text-gray-600 mb-2">Profile details</h3>
          
          <div className="flex items-center justify-between  ">
          <ProfileDetailItem 
            icon={<User size={20} />}
            iconColor='bg-blue-100 text-blue-600'
            label="Full name"
            value={userData.fullName}
          />
          <i 
            onClick={() => changeEdit("Full name")}
             className={`pi ${editInfo == 'Full name' ? 'pi-check' : 'pi-pencil'} cursor-pointer p-3 rounded-2xl textlg bg-gray-100 text-gray-400`}></i>
          </div>
          <div className="flex items-center justify-between border-t border-gray-100">
            <ProfileDetailItem 
              icon={<Mail size={20} />}
            iconColor='bg-red-100 text-red-600'
              label="Email address"
              value={userData.email}
            />
            </div>
          
          <div className="flex items-center justify-between border-t  border-gray-100">
            <ProfileDetailItem 
              icon={<Phone size={20} />}
            iconColor='bg-yellow-100 text-yellow-600'
              label="Phone number"
              value={userData?.phone ? userData?.phone : 'None'}

            />
            <i 
            onClick={() => changeEdit("Phone number")}
             className={`pi ${editInfo == 'Phone number' ? 'pi-check' : 'pi-pencil'} cursor-pointer p-3 rounded-2xl textlg bg-gray-100 text-gray-400`}></i>
          </div>
        </div>
        
        <div className="mt-6">
    {submitLoading ? 

          <button onClick={onSubmit} className="bg-[#f34f146c] w-full text-white py-3 px-4 rounded-md">
            <i className='pi pi-spin pi-spinner'></i> <span>Update profile</span>
          </button>
    :
        <button onClick={onSubmit} className="bg-[#F35114] w-full  hover:bg-red-500 hover:cursor-pointer text-white py-3 px-4 rounded-md">
              <span>Update profile</span>
          </button>
        }
        </div>
      </div>
    </div>
  );
};

export default PersonalInformationPage;