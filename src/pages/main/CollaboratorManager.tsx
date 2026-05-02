import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Mail,
  Check,
  AlertCircle,
  Settings,
  Crown,
  Eye,
  Edit3,
  Trash2,
  Search,
  X
} from "lucide-react";
import { Dialog } from "primereact/dialog";
import {
  getAllInvitations,
  getAllSentInvitations,
  inviteUser,
  removeCollaboration,
} from "../../utils/api/collaborationAPI";
import { useFormik } from "formik";
import { addCollaborationValidation } from "../../utils/validation/collabValidation";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { creditState } from "../../utils/atom/authAtom";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "primereact/skeleton";

interface AddCollaboratorData {
  email: string;
  role: string;
}

interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: "owner" | "admin" | "editor" | "viewer";
  status: "accepted" | "pending" | "declined";
  avatar?: string;
  joinedDate: string;
  lastActive: string;
}

interface deleteData {
  loading: boolean;
  collab: string;
}

const CollaboratorManager: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>([]);
  const [loadingDeleteCollab, setLoadingDeleteCollab] = useState<deleteData>();

  const creditInfo = useRecoilValue(creditState);
  const navigate = useNavigate();

  // CSS Logic matching your ListPage
  const roleStyles = {
    owner: "bg-purple-100 text-purple-600 border-purple-100",
    admin: "bg-red-100 text-red-600 border-red-100",
    editor: "bg-blue-100 text-blue-600 border-blue-100",
    viewer: "bg-gray-100 text-gray-600 border-gray-100",
  };

  const statusStyles = {
    accepted: "bg-emerald-100 text-emerald-700",
    pending: "bg-amber-100 text-amber-700",
    declined: "bg-rose-100 text-rose-700",
  };

  const getAvatarStyle = (index: number) => {
    const styles = [
      "bg-purple-100 text-purple-600",
      "bg-emerald-100 text-emerald-600",
      "bg-blue-100 text-blue-600",
      "bg-amber-100 text-amber-600",
      "bg-rose-100 text-rose-600",
    ];
    return styles[index % styles.length];
  };

  const RoleIcon = ({ role }: { role: string }) => {
    const icons: any = { owner: Crown, admin: Settings, editor: Edit3, viewer: Eye };
    const Icon = icons[role] || Eye;
    return <Icon size={12} />;
  };

  // API Logic (Unchanged from your file)
  const getCollaborators = async () => {
    setLoading(true);
    await getAllSentInvitations().then((res) => {
      const invites = res?.data || [];
      const collaboratorsData = invites?.collaborators?.map((invite: any, index: number) => ({
        id: invite._id,
        name: invite.collaboratorName,
        email: invite?.collaboratorEmail || invite.collaboratorName,
        role: invite.permission === "viewer" ? "viewer" : (invite.permission || "editor"),
        status: invite.status,
        avatar: invite.collaboratorName.substring(0, 2).toUpperCase(),
        joinedDate: new Date(invite.invitedAt).toISOString().split("T")[0],
      }));
      setCollaborators(collaboratorsData);
    }).finally(() => setLoading(false));
  };

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoadingDeleteCollab({ loading: true, collab: collaboratorId });
    await removeCollaboration(collaboratorId)
      .then((res) => {
        if (res.status === 204) {
          setCollaborators((prev) => prev?.filter((collab) => collab.id !== collaboratorId));
          toast.success("Collaborator removed!");
        }
      })
      .catch(() => toast.error("Unable to remove collaborator!"))
      .finally(() => setLoadingDeleteCollab({ loading: false, collab: "" }));
  };

  const onSubmit = async (values: AddCollaboratorData) => {
    try {
      const payload = { email: values.email, role_permission: values.role };
      const res = await inviteUser(payload);
      if (res?.status === 201) {
        toast.success("Invitation sent!");
        setShowInviteModal(false);
        getCollaborators();
      } else {
        toast.info(res?.data?.message || "Invitation failed");
      }
    } catch (err) {
      toast.error("Error sending invite");
    }
  };

  const { values, errors, isValid, isSubmitting, touched, handleBlur, handleChange, handleSubmit } = useFormik({
    initialValues: { email: "", role: "editor" },
    validationSchema: addCollaborationValidation,
    onSubmit,
  });

  useEffect(() => { getCollaborators(); }, []);

  const filteredCollaborators = useMemo(() => {
    return collaborators?.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [collaborators, searchTerm]);

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-6 sm:px-10 py-8 font-sans">
      
      {/* ADD COLLABORATOR DIALOG */}
      <Dialog
        visible={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        showHeader={false}
        style={{ width: "420px" }}
        contentStyle={{ padding: "0", borderRadius: "16px", overflow: "hidden" }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Add Collaborator</h2>
            <button onClick={() => setShowInviteModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Email Address</label>
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="collaborator@example.com"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114] transition-all"
              />
              {errors.email && touched.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] bg-white outline-none focus:border-[#F35114]"
              >
                <option value="viewer">Viewer - Can only view content</option>
                <option value="editor">Editor - Can edit content</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <button type="button" onClick={() => setShowInviteModal(false)} className="px-5 py-2.5 rounded-lg text-[14px] text-gray-600 hover:bg-gray-100 font-medium transition-colors">Cancel</button>
              <button 
                type="submit" 
                disabled={!isValid || isSubmitting} 
                className="px-5 py-2.5 rounded-lg text-[14px] text-white bg-[#F35114] hover:bg-[#d84812] font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? <i className="pi pi-spinner pi-spin" /> : <Mail size={16} />}
                Send Invitation
              </button>
            </div>
          </form>
        </div>
      </Dialog>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-[52px] h-[52px] rounded-2xl bg-orange-50 text-[#F35114] flex items-center justify-center border border-orange-100">
            <Users size={24} />
          </div>
          <div>
            <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">Team Collaborators</h1>
            <p className="text-[15px] text-gray-500 mt-0.5">Manage team permissions and track member activity</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search team..."
              className="w-full rounded-full border border-gray-200 bg-white py-2.5 px-4 pl-10 text-[14px] outline-none focus:border-[#F35114] transition-all shadow-sm"
            />
          </div>

          {creditInfo?.subscriptionType.toLowerCase() === "pro" || creditInfo?.subscriptionType.toLowerCase() === "business" ? (
            <button onClick={() => setShowInviteModal(true)} className="cursor-pointer bg-[#F35114] hover:bg-[#d84812] shadow-sm text-white text-[14px] px-6 py-2.5 rounded-full flex items-center justify-center gap-2 font-medium">
              <UserPlus size={16} /> Add Collaborator
            </button>
          ) : (
            <button onClick={() => navigate("/subscription")} className="bg-orange-600 text-white text-[14px] px-6 py-2.5 rounded-full font-medium hover:bg-orange-700">
              Upgrade to Add Team
            </button>
          )}
        </div>
      </div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">Total Members</p>
           <h3 className="text-2xl font-bold text-gray-900 mt-1">{collaborators?.length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">Active Members</p>
           <h3 className="text-2xl font-bold text-emerald-600 mt-1">{collaborators?.filter(c => c.status === "accepted").length}</h3>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
           <p className="text-gray-500 text-sm font-medium">Pending Invites</p>
           <h3 className="text-2xl font-bold text-amber-500 mt-1">{collaborators?.filter(c => c.status === "pending").length}</h3>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">Collaborator</th>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">Role</th>
                <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">Status</th>
                <th className="text-right py-4 px-6 text-[13px] font-semibold text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                 [1,2,3].map(k => (
                   <tr key={k}><td colSpan={4} className="p-6"><Skeleton height="2rem" /></td></tr>
                 ))
              ) : filteredCollaborators?.length ? (
                filteredCollaborators.map((collab, idx) => (
                  <tr key={collab.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-5 px-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm ${getAvatarStyle(idx)}`}>
                          {collab.avatar}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-gray-900">{collab.name}</div>
                          <div className="text-[13px] text-gray-500">{collab.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${roleStyles[collab.role] || roleStyles.viewer}`}>
                        <RoleIcon role={collab.role} />
                        {collab.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`px-3 py-1 rounded-full text-[12px] font-bold ${statusStyles[collab.status] || 'bg-gray-100 text-gray-600'}`}>
                        {collab.status.charAt(0).toUpperCase() + collab.status.slice(1)}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      {collab.role !== "owner" && (
                        <button
                          onClick={() => handleRemoveCollaborator(collab.id)}
                          className="p-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                          title="Remove Member"
                        >
                          {loadingDeleteCollab?.collab === collab.id ? <i className="pi pi-spinner pi-spin" /> : <Trash2 size={18} />}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center text-gray-400">
                      <Users size={48} strokeWidth={1} className="mb-3 opacity-20" />
                      <p className="font-medium">No team members found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorManager;