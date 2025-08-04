import React, { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Filter,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import CollaboratorManager from "./CollaboratorManager";
import {
  getAcceptedInvitations,
  getAllInvitations,
  replyInvite,
} from "../../utils/api/collaborationAPI";
import { useSetRecoilState } from "recoil";
import { collabProjectState } from "../../utils/atom/collabAuthAtom";
import { toast } from "react-toastify";

// interface Project {
//   id: string;
//   name: string;
//   status: 'active' | 'completed' | 'on-hold' | 'review';
//   progress: number;
//   dueDate: string;
//   collaborators: number;
//   role: 'owner' | 'admin' | 'editor' | 'viewer';
//   lastActivity: string;
//   priority: 'high' | 'medium' | 'low';
// }

interface Activity {
  id: string;
  type: "comment" | "edit" | "share" | "complete" | "invite";
  user: string;
  project: string;
  description: string;
  timestamp: string;
  avatar: string;
}

interface Invitation {
  _id: string;
  owner: string;
  ownerName: string;
  collaborator: string;
  collaboratorName: string;
  collaboratorEmail: string;
  permission: string;
  status: string;
  invitedAt: string;
  __v: number;
}

interface Project {
  _id: string;
  owner: string;
  ownerName: string;
  collaborator: string;
  collaboratorName: string;
  collaboratorEmail: string;
  permission: string;
  status: string;
  invitedAt: string;
  __v: 0;
}

const CollaboratorDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [loadingResponse, setLoadingResponse] = useState("");
  const collabState = useSetRecoilState(collabProjectState);
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [activeTab, setActiveTab] = useState<"invites" | "team">("team");
  // const [timeFilter, setTimeFilter] = useState('7d');
  const [searchTerm, setSearchTerm] = useState("");

  // const projects: Project[] = [
  //   {
  //     id: '1',
  //     name: 'Marketing Campaign Q2',
  //     status: 'active',
  //     progress: 75,
  //     dueDate: '2025-07-15',
  //     collaborators: 8,
  //     role: 'admin',
  //     lastActivity: '2 hours ago',
  //     priority: 'high'
  //   },
  //   {
  //     id: '2',
  //     name: 'Website Redesign',
  //     status: 'review',
  //     progress: 90,
  //     dueDate: '2025-07-10',
  //     collaborators: 5,
  //     role: 'editor',
  //     lastActivity: '5 hours ago',
  //     priority: 'high'
  //   },
  //   {
  //     id: '3',
  //     name: 'Product Documentation',
  //     status: 'active',
  //     progress: 45,
  //     dueDate: '2025-07-20',
  //     collaborators: 3,
  //     role: 'editor',
  //     lastActivity: '1 day ago',
  //     priority: 'medium'
  //   },
  //   {
  //     id: '4',
  //     name: 'Brand Guidelines',
  //     status: 'completed',
  //     progress: 100,
  //     dueDate: '2025-06-30',
  //     collaborators: 4,
  //     role: 'viewer',
  //     lastActivity: '3 days ago',
  //     priority: 'low'
  //   }
  // ];

  // const activities: Activity[] = [
  //   {
  //     id: '1',
  //     type: 'comment',
  //     user: 'Kate Simpson',
  //     project: 'Marketing Campaign Q2',
  //     description: 'Added feedback on the landing page design',
  //     timestamp: '2 hours ago',
  //     avatar: 'KS'
  //   },
  //   {
  //     id: '2',
  //     type: 'edit',
  //     user: 'Andrew Smith',
  //     project: 'Website Redesign',
  //     description: 'Updated the navigation structure',
  //     timestamp: '4 hours ago',
  //     avatar: 'AS'
  //   },
  //   {
  //     id: '3',
  //     type: 'complete',
  //     user: 'You',
  //     project: 'Brand Guidelines',
  //     description: 'Completed the color palette section',
  //     timestamp: '6 hours ago',
  //     avatar: 'YO'
  //   },
  //   {
  //     id: '4',
  //     type: 'share',
  //     user: 'Sarah Johnson',
  //     project: 'Product Documentation',
  //     description: 'Shared project with external stakeholders',
  //     timestamp: '1 day ago',
  //     avatar: 'SJ'
  //   },
  //   {
  //     id: '5',
  //     type: 'invite',
  //     user: 'Kate Simpson',
  //     project: 'Marketing Campaign Q2',
  //     description: 'Invited 2 new collaborators to the project',
  //     timestamp: '2 days ago',
  //     avatar: 'KS'
  //   }
  // ];

  // const invites: Task[] = [
  //   {
  //     id: '1',
  //     title: 'Review homepage mockups',
  //     project: 'Website Redesign',
  //     assignee: 'You',
  //     dueDate: '2025-07-03',
  //     status: 'pending',
  //     priority: 'high'
  //   },
  //   {
  //     id: '2',
  //     title: 'Update campaign metrics',
  //     project: 'Marketing Campaign Q2',
  //     assignee: 'Kate Simpson',
  //     dueDate: '2025-07-02',
  //     status: 'overdue',
  //     priority: 'high'
  //   },
  //   {
  //     id: '3',
  //     title: 'Write API documentation',
  //     project: 'Product Documentation',
  //     assignee: 'Andrew Smith',
  //     dueDate: '2025-07-05',
  //     status: 'in-progress',
  //     priority: 'medium'
  //   },
  //   {
  //     id: '4',
  //     title: 'Finalize brand colors',
  //     project: 'Brand Guidelines',
  //     assignee: 'Sarah Johnson',
  //     dueDate: '2025-06-28',
  //     status: 'completed',
  //     priority: 'low'
  //   }
  // ];

  // const statusColors = {
  //   active: 'bg-green-100 text-green-800',
  //   completed: 'bg-blue-100 text-blue-800',
  //   'on-hold': 'bg-yellow-100 text-yellow-800',
  //   review: 'bg-purple-100 text-purple-800'
  // };

  // const priorityColors = {
  //   high: 'border-l-red-500',
  //   medium: 'border-l-yellow-500',
  //   low: 'border-l-green-500'
  // };

  // const taskStatusColors = {
  //   pending: 'bg-gray-100 text-gray-800',
  //   'in-progress': 'bg-blue-100 text-blue-800',
  //   completed: 'bg-green-100 text-green-800',
  //   overdue: 'bg-red-100 text-red-800'
  // };

  // const activityIcons = {
  //   comment: MessageSquare,
  //   edit: Edit3,
  //   share: Share2,
  //   complete: CheckCircle2,
  //   invite: Users
  // };

  // const ActivityIcon = ({ type }: { type: string }) => {
  //   const Icon = activityIcons[type as keyof typeof activityIcons];
  //   return Icon ? <Icon className="w-4 h-4" /> : <Activity className="w-4 h-4" />;
  // };

  // const getProgressColor = (progress: number) => {
  //   if (progress >= 80) return 'bg-green-500';
  //   if (progress >= 50) return 'bg-yellow-500';
  //   return 'bg-red-500';
  // };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case "Pending":
        return <AlertCircle className="w-4 h-4" />;
      case "Accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "Declined":
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800";
      case "In Review":
        return "bg-blue-100 text-blue-800";
      case "Planning":
        return "bg-yellow-100 text-yellow-800";
      case "Completed":
        return "bg-gray-100 text-gray-800";
      case "On Hold":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
 
  const renderProjects = () => (
    allProjects.length ? 
    <div className="space-y-6 max-w-6xl m-6 shadow rounded-xl p-3">
      {/* Header */}

      <h1 className="text-2xl font-bold text-gray-900 mb-2">My Projects</h1>
      <div className="flex items-center justify-between ">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allProjects.map((project) => (
          <div
            key={project?._id}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">
                  {project?.ownerName}
                </h3>
              </div>
              {/* <button className="p-1 hover:bg-gray-100 rounded">
                <MoreVertical className="w-4 h-4 text-gray-400" />
              </button> */}
            </div>

            <div className="flex items-center justify-between">
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigateToProject(project)}
                    className="p-2 py-1 hover:bg-gray-100 bg-gray-200 flex items-center gap-2 rounded-2xl "
                  >
                    <Eye className="w-4 h-4 text-gray-700" />
                    <span className="text-gray-700 text-sm">Open</span>
                  </button>
                  {/* <button className="p-1 hover:bg-gray-100 rounded">
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button> */}
                </div>
              </div>
              <span
                className={`px-2 py-1 mt-4 text-xs font-medium rounded-full ${getStatusColor(
                  "Active"
                )}`}
              >
                {/* {project.status} */}
                Active
              </span>
            </div>
          </div>
        ))}
      </div>
    </div> 
    : ''
  );

  const getInvitations = async () => {
    await getAllInvitations().then((res) => {
      console.log(res);

      if (res?.status === 200) {
        setInvitations(res?.data?.invites);
      } else {
        console.error("Failed to fetch invitations:", res);
      }
    });
  };
 

  const replyInvitation = async (collab: any, response: string) => {
    const payload = {
      _id: collab._id,
      action: response,
    };

    setLoadingResponse(response);

    await replyInvite(payload).then((res) => {
      console.log("REponse to invitation: ", res);

      if (res?.status === 200 && res?.data?.message === "Invite declined") {
        toast.success("Invitation Declined Successful");
      } else if (res?.status === 200) {
        toast.success("Invitation Accepted Successful");
      } else {
        toast.info("Please try again!");
      }
      setLoadingResponse("");
      
      collabProjects();
      getInvitations();
    });
  };

  const renderInvitations = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex gap-5 flex-col md:flex-row items-center md:justify-between">
        <div className="flex gap-5  flex-col md:flex-row items-center space-x-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search invites..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent">
            <option>All Status</option>
            <option>Pending</option>
            <option>Accepted</option>
            <option>Declined</option>
          </select>
        </div>
      </div>

      {/* Invitations Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invited By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invitations.map((invitation) => (
                <tr key={invitation._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {invitation.ownerName}
                    </div>
                    {/* <div className="text-sm text-gray-500">{invitation.email}</div> */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {invitation.permission}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(invitation.status)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          invitation.status
                        )}`}
                      >
                        {invitation.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invitation.invitedAt.split("T")[0]}{" "}
                    {/* Format date as needed */}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {invitation.status === "pending" ? (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            replyInvitation(invitation, "accepted")
                          }
                          className={`flex items-center gap-2 ${getStatusColor(
                            "Accepted"
                          )} hover:bg-green-200 hover:text-green-900 px-3 py-1 rounded-2xl cursor-pointer`}
                        >
                          {/* <MoreVertical className="w-4 h-4" /> */}
                          {loadingResponse === "accepted" ? (
                            <i className="pi pi-spinner pi-spin"></i>
                          ) : (
                            <>{getStatusIcon("Accepted")}</>
                          )}

                          <p className=""> Accept</p>
                        </button>
                        <button
                          onClick={() =>
                            replyInvitation(invitation, "declined")
                          }
                          className={`flex items-center gap-2 ${getStatusColor(
                            "Declined"
                          )} hover:bg-red-200 hover:text-red-900 px-3 py-1 rounded-2xl cursor-pointer`}
                        >
                          {/* <MoreVertical className="w-4 h-4" /> */}
                          {loadingResponse === "declined" ? (
                            <i className="pi pi-spinner pi-spin"></i>
                          ) : (
                            <>{getStatusIcon("Declined")}</>
                          )}
                          <p className=""> Decline</p>
                        </button>
                        {/* <p>Decline</p> */}
                      </div>
                    ) : (
                      <div className="">
                        <button
                          onClick={() =>
                            replyInvitation(invitation, "declined")
                          }
                          className={`flex items-center gap-2  bg-red-200 text-red-900 px-3 py-1 rounded-2xl cursor-not-allowed`}
                        >
                          {/* <MoreVertical className="w-4 h-4" /> */}
                          {getStatusIcon("Declined")}
                          <p className=""> Declined</p>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
 
    </div>
  );

  const navigateToProject = (project: Project) => {
    const state = {
      _id: project._id,
      ownerName: project?.ownerName,
      collaborator: project?.collaborator,
      collaboratorName: project?.collaboratorName,
      collaboratorEmail: project?.collaboratorEmail,
      permission: project?.permission,
    };
    collabState(state);

    navigate(`/collaboration/${project?._id}/dashboard`);
  };

  const collabProjects = async () => {
    await getAcceptedInvitations().then((res) => {
      console.log("Response: ", res);
      if (res?.status === 200) {
        setAllProjects(res?.data?.invites);
      } else {
        console.error("Failed to fetch collaborated projects:", res);
      }
      //         {
      //     "_id": "6876637a3f70c8b6a79b1f92",
      //     "owner": "k7MZWdxbWpWW5FUUnXbf63irMUi2",
      //     "ownerName": "Samuel Ladi",
      //     "collaborator": "8bsDq6UU6GcIGUJWTxXW2yKrS8Q2",
      //     "collaboratorName": "Samuel Ladi",
      //     "collaboratorEmail": "ladisamuel00@gmail.com",
      //     "permission": "viewer",
      //     "status": "accepted",
      //     "invitedAt": "2025-07-15T14:19:38.675Z",
      //     "__v": 0
      // }
      //         {
      //   id: 1,
      //   name: 'John Doe',
      //   description: 'john.doe@****',
      //   lastActivity: '2 hours ago',
      //   collaborators: ['John Doe', 'Jane Smith', 'Mike Johnson'],
      //   status: 'Active',
      //   progress: 75
      // },
    });
  };

  useEffect(() => {
    collabProjects();
    getInvitations();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Collaboration Dashboard
              </h1>
              <p className="text-gray-600">
                Track your projects and team activities
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-8 mt-6">
            {[
              { id: "team", label: "Team", icon: Activity },
              { id: "invites", label: "Invitations", icon: CheckCircle2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-1 py-2 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">

        {/* Invitations Tab */}
        {activeTab === "invites" && (
          <div className="space-y-6">{renderInvitations()}</div>
        )}

        {/* Activity Tab */}
        {activeTab === "team" && (
          <div className="">
            <div className="space-y-6">{renderProjects()}</div>
            <CollaboratorManager />
          </div>

          // <div className="space-y-6">
          //   <div className="flex justify-between items-center">
          //     <div className="flex items-center gap-4">
          //       <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500">
          //         <option>All Activities</option>
          //         <option>Comments</option>
          //         <option>Edits</option>
          //         <option>Shares</option>
          //         <option>Completions</option>
          //       </select>
          //       <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500">
          //         <option>All Projects</option>
          //         {projects.map(project => (
          //           <option key={project.id}>{project.name}</option>
          //         ))}
          //       </select>
          //     </div>
          //   </div>

          //   <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          //     <div className="p-6">
          //       <div className="space-y-6">
          //         {activities.map((team, index) => (
          //           <div key={team.id} className="flex items-start gap-4">
          //             <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-medium">
          //               {team.avatar}
          //             </div>
          //             <div className="flex-1">
          //               <div className="flex items-center gap-2 mb-1">
          //                 <ActivityIcon type={team.type} />
          //                 <span className="font-medium text-gray-900">{team.user}</span>
          //                 <span className="text-gray-500">{team.description}</span>
          //               </div>
          //               <div className="flex items-center gap-2 text-sm text-gray-500">
          //                 <span className="font-medium">{team.project}</span>
          //                 <span>•</span>
          //                 <span>{team.timestamp}</span>
          //               </div>
          //             </div>
          //             {index < activities.length - 1 && (
          //               <div className="absolute left-9 mt-12 w-0.5 h-6 bg-gray-200"></div>
          //             )}
          //           </div>
          //         ))}
          //       </div>
          //     </div>
          //   </div>
          // </div>
        )}
      </div>
    </div>
  );
};

export default CollaboratorDashboard;
