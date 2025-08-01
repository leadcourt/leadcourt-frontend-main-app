// import { ChevronRight, Plus } from 'lucide-react';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
 

// interface CollaboratorItemProps {
//   name: string;
//   email: string;
// }

export default function AddCollaborators( ) {

  const navigate = useNavigate()

  return (
    <div className=" ">
      <div className=" ">
        
        
        <div className="">
          <button onClick={()=>navigate('/collaborators')} className="flex items-center gap-3 w-full hover:bg-gray-50 rounded-lg p-2 transition-colors cursor-pointer">
            <div className="bg-gray-100 rounded-lg p-2">
              <Plus size={20} className="text-[#F35114]" />
            </div>
            <span className="text-[#F35114] font-medium">Send an invite to a friend</span>
          </button>

        </div>
      </div>
    </div>
  );
}

// function CollaboratorItem({ name, email }: CollaboratorItemProps) {
//   // Generate consistent avatar colors based on name
//   const getInitials = (name: string) => {
//     const parts = name?.split(' ');
//     return parts.length > 1 
//       ? `${parts[0][0]}${parts[1][0]}`.toUpperCase() 
//       : parts[0].substring(0, 2).toUpperCase();
//   };
  
//   // Get avatar background color based on name
//   const getAvatarColor = (name: string) => {
//     const colors = [
//       'bg-blue-100 text-blue-600',
//       'bg-purple-100 text-purple-600',
//       'bg-green-100 text-green-600',
//       'bg-pink-100 text-pink-600',
//       'bg-yellow-100 text-yellow-600'
//     ];
    
//     const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
//     return colors[hash % colors.length];
//   };

//   return (
//     <div className="flex items-center justify-between hover:bg-gray-50 p-2 rounded-lg cursor-pointer">
//       <div className="flex items-center gap-3">
//         {/* Avatar - either use this custom one or the User icon below */}
//         <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getAvatarColor(name)}`}>
//           {getInitials(name)}
//         </div>
//         {/* Alternative User icon avatar
//         <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
//           <User size={20} className="text-[#F35114]" />
//         </div>
//         */}
//         <div>
//           <p className="font-medium">{name}</p>
//           <p className="text-sm text-gray-500">{email}</p>
//         </div>
//       </div>
//       <ChevronRight size={20} className="text-gray-400" />
//     </div>
//   );
// }
