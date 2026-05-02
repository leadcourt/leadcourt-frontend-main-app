import React, { useEffect, useState, useMemo } from "react";
import {
  Users,
  UserPlus,
  Mail,
  AlertCircle,
  Settings,
  Crown,
  Eye,
  Edit3,
  Trash2,
  Search,
  X,
} from "lucide-react";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import { useFormik } from "formik";
import { toast } from "react-toastify";
import { useRecoilValue } from "recoil";
import { useNavigate } from "react-router-dom";
import { creditState } from "../../utils/atom/authAtom";
import { addCollaborationValidation } from "../../utils/validation/collabValidation";
import {
  getAllInvitations,
  getAllSentInvitations,
  inviteUser,
  removeCollaboration,
} from "../../utils/api/collaborationAPI";

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

const CollaboratorManager: React.FC = () => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    [],
  );
  const [loadingDeleteCollab, setLoadingDeleteCollab] = useState<{
    loading: boolean;
    collab: string;
  }>();

  const creditInfo = useRecoilValue(creditState);
  const navigate = useNavigate();

  // Premium UI Styles
  const roleColors: any = {
    owner: "bg-purple-100 text-purple-800 border-purple-200",
    admin: "bg-red-100 text-red-800 border-red-200",
    editor: "bg-blue-100 text-blue-800 border-blue-200",
    viewer: "bg-gray-100 text-gray-800 border-gray-200",
  };
  const statusColors: any = {
    accepted: "bg-emerald-100 text-emerald-800",
    pending: "bg-amber-100 text-amber-800",
    declined: "bg-rose-100 text-rose-800",
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
    const icons: any = {
      owner: Crown,
      admin: Settings,
      editor: Edit3,
      viewer: Eye,
    };
    const Icon = icons[role] || Eye;
    return <Icon size={14} />;
  };

  // API Logic
  const getInvitations = async () => {
    await getAllInvitations().then(() => {});
  };
  const getCollaborators = async () => {
    setLoading(true);
    await getAllSentInvitations().then((res) => {
      const invites = res?.data || [];
      const collaboratorsData = invites?.collaborators?.map((invite: any) => ({
        id: invite._id,
        name: invite.collaboratorName,
        email: invite?.collaboratorEmail || invite.collaboratorName,
        role:
          invite.permission === "viewer"
            ? "viewer"
            : invite.permission || "editor",
        status: invite.status,
        avatar: invite.collaboratorName.substring(0, 2).toUpperCase(),
        joinedDate: new Date(invite.invitedAt).toISOString().split("T")[0],
      }));
      setCollaborators(collaboratorsData);
    });
    setLoading(false);
  };

  useEffect(() => {
    getInvitations();
    getCollaborators();
  }, []);

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoadingDeleteCollab({ loading: true, collab: collaboratorId });
    await removeCollaboration(collaboratorId)
      .then((res) => {
        if (res.status === 204) {
          setCollaborators((prev) =>
            prev?.filter((collab) => collab.id !== collaboratorId),
          );
          toast.success("Collaborator removed!");
        }
      })
      .catch(() => toast.error("Unable to remove collaborator!"));
    setLoadingDeleteCollab({ loading: false, collab: "" });
  };

  const handleBulkAction = async (action: "remove" | "resend") => {
    if (action === "remove" && selectedCollaborators.length > 0) {
      const idsToDelete = [...selectedCollaborators];
      try {
        await Promise.all(
          idsToDelete.map(async (id) => {
            const res = await removeCollaboration(id);
            if (res.status === 204)
              setCollaborators((prev) => prev.filter((c) => c.id !== id));
          }),
        );
        setSelectedCollaborators([]);
        toast.success("Selected collaborators removed");
      } catch (err) {
        toast.error("Some collaborators could not be removed.");
      }
    }
  };

  const toggleSelectCollaborator = (id: string) => {
    setSelectedCollaborators((prev) =>
      prev.includes(id)
        ? prev.filter((prevId) => prevId !== id)
        : [...prev, id],
    );
  };

  const onSubmit = async (values: AddCollaboratorData) => {
    setLoading(true);
    try {
      const payload = { email: values.email, role_permission: values.role };
      const res = await inviteUser(payload);
      if (res?.status == 201) {
        toast.success("Invitation sent successfully!");
        setShowInviteModal(false);
        getInvitations();
        getCollaborators();
      } else {
        toast.info(res?.data?.message || "Failed to send invitation");
      }
    } catch (err) {
      toast.error("Error Occurred, try again!");
    }
    setLoading(false);
  };

  const {
    values,
    errors,
    isValid,
    isSubmitting,
    touched,
    handleBlur,
    handleChange,
    handleSubmit,
  } = useFormik({
    validateOnMount: true,
    initialValues: { email: "", role: "editor" },
    validationSchema: addCollaborationValidation,
    onSubmit,
  });

  const filteredCollaborators = useMemo(
    () =>
      collaborators?.filter(
        (c) =>
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          c.email.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [collaborators, searchTerm],
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-6 sm:px-10 py-8 font-sans">
      {/* ADD COLLABORATOR DIALOG */}
      <Dialog
        visible={showInviteModal}
        onHide={() => setShowInviteModal(false)}
        showHeader={false}
        style={{ width: "420px" }}
        contentStyle={{
          padding: "0",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        <div className="p-6 bg-white">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">
              Add Collaborator
            </h2>
            <button
              onClick={() => setShowInviteModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter email address"
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] outline-none focus:border-[#F35114] focus:ring-1 focus:ring-[#F35114] transition-all"
              />
              {errors.email && touched.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[14px] font-medium text-gray-700">
                Role
              </label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-[15px] bg-white outline-none focus:border-[#F35114]"
              >
                <option value="viewer">Viewer - Can view content</option>
                <option value="editor">Editor - Can edit content</option>
                <option value="admin">Admin - Full access</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="px-5 py-2.5 rounded-lg text-[14px] text-gray-600 hover:bg-gray-100 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="px-5 py-2.5 rounded-lg text-[14px] text-white bg-[#F35114] hover:bg-[#d84812] font-medium flex items-center gap-2 transition-colors shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <i className="pi pi-spinner pi-spin"></i>
                ) : (
                  <Mail size={16} />
                )}{" "}
                Send Invite
              </button>
            </div>
          </form>
        </div>
      </Dialog>

      <div className="max-w-7xl mx-auto">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-2xl bg-orange-50 text-[#F35114] flex items-center justify-center border border-orange-100">
              <Users size={24} />
            </div>
            <div>
              <h1 className="text-[28px] font-bold text-gray-900 tracking-tight leading-tight">
                Team Collaborators
              </h1>
              <p className="text-[15px] text-gray-500 mt-0.5">
                Manage team members and their permissions
              </p>
            </div>
          </div>
          <div>
            {creditInfo?.subscriptionType.toLowerCase() === "pro" ||
            creditInfo?.subscriptionType.toLowerCase() === "business" ? (
              <button
                onClick={() => setShowInviteModal(true)}
                className="cursor-pointer bg-[#F35114] hover:bg-[#d84812] shadow-sm text-white text-[14px] px-6 py-2.5 rounded-full flex items-center justify-center gap-2 font-medium"
              >
                <UserPlus size={16} /> Add Collaborator
              </button>
            ) : (
              <button
                onClick={() => navigate("/subscription")}
                className="bg-orange-600 hover:bg-orange-700 text-white text-[14px] px-6 py-2.5 rounded-full font-medium transition-colors"
              >
                Upgrade Account
              </button>
            )}
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Total Members</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">
              {collaborators?.length}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Active Members</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">
              {collaborators?.filter((c) => c.status === "accepted")?.length}
            </h3>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <p className="text-gray-500 text-sm font-medium">Pending Invites</p>
            <h3 className="text-2xl font-bold text-amber-500 mt-1">
              {collaborators?.filter((c) => c.status === "pending")?.length}
            </h3>
          </div>
        </div>

        {/* SEARCH & FILTERS */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:w-[320px]">
              <Search
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search collaborators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-white py-2 px-4 pl-10 text-[14px] outline-none focus:border-[#F35114] transition-all shadow-sm"
              />
            </div>
            {selectedCollaborators?.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("remove")}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-semibold px-4 py-2 rounded-xl text-[13px] transition-colors flex items-center gap-1.5 border border-red-100"
                >
                  <Trash2 size={14} /> Remove ({selectedCollaborators?.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* TABLE */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-white border-b border-gray-100">
                <tr>
                  <th className="w-[5%] py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedCollaborators?.length ===
                          collaborators?.length && collaborators?.length > 0
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollaborators(
                            collaborators?.map((c) => c.id),
                          );
                        } else {
                          setSelectedCollaborators([]);
                        }
                      }}
                      className="rounded border-gray-300 text-[#F35114] focus:ring-[#F35114]"
                    />
                  </th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">
                    Collaborator
                  </th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">
                    Role
                  </th>
                  <th className="text-left py-4 px-6 text-[13px] font-semibold text-gray-500">
                    Status
                  </th>
                  <th className="text-right py-4 px-6 text-[13px] font-semibold text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  [1, 2, 3].map((k) => (
                    <tr key={k}>
                      <td colSpan={5} className="py-6 px-6">
                        <Skeleton height="2rem" />
                      </td>
                    </tr>
                  ))
                ) : filteredCollaborators?.length ? (
                  filteredCollaborators?.map((collaborator, idx) => (
                    <tr
                      key={collaborator.id}
                      className="hover:bg-gray-50/60 transition-colors"
                    >
                      <td className="py-4 px-6">
                        {collaborator.role !== "owner" && (
                          <input
                            type="checkbox"
                            checked={selectedCollaborators.includes(
                              collaborator.id,
                            )}
                            onChange={() =>
                              toggleSelectCollaborator(collaborator.id)
                            }
                            className="rounded border-gray-300 text-[#F35114] focus:ring-[#F35114]"
                          />
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-[14px] shrink-0 ${getAvatarStyle(idx)}`}
                          >
                            {collaborator.avatar}
                          </div>
                          <div>
                            <div className="text-[15px] font-bold text-gray-900">
                              {collaborator.name}
                            </div>
                            <div className="text-[13px] text-gray-500 font-medium">
                              {collaborator.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-bold border ${roleColors[collaborator.role] || roleColors.viewer}`}
                        >
                          <RoleIcon role={collaborator.role} />
                          {collaborator.role.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[12px] font-bold ${statusColors[collaborator.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {collaborator.status === "pending" && (
                            <AlertCircle className="w-3 h-3 mr-1" />
                          )}
                          {collaborator.status.charAt(0).toUpperCase() +
                            collaborator.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {collaborator.role !== "owner" && (
                          <button
                            onClick={() =>
                              handleRemoveCollaborator(collaborator.id)
                            }
                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Remove collaborator"
                          >
                            {loadingDeleteCollab?.collab === collaborator.id ? (
                              <i className="pi pi-spinner pi-spin"></i>
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                          <Users size={24} className="text-gray-400" />
                        </div>
                        <p className="text-sm font-medium">
                          No collaborators found.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorManager;
