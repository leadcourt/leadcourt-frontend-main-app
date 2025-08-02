import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Mail,
  MoreHorizontal,
  Check,
  AlertCircle,
  Settings,
  Crown,
  Eye,
  Edit3,
  Trash2,
  Search,
} from "lucide-react";
import { Dialog } from "primereact/dialog";
import {
  getAllInvitations,
  getAllSentInvitations,
  inviteUser,
} from "../../utils/api/collaborationAPI";
import { useFormik } from "formik";
import { addCollaborationValidation } from "../../utils/validation/collabValidation";
import { toast } from "react-toastify";
// import { useRecoilValue } from 'recoil';
// import { userState } from '../../utils/atom/authAtom';
// import formik

interface AddCollaboratorData {
  email: string;
  role: string;
  // message: string;
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
  const [loading, setLoading] = useState(false)
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    []
  );
  const [editingRole, setEditingRole] = useState<string | null>(null);

  // const user = useRecoilValue(userState)

  const roleColors = {
    owner: "bg-purple-100 text-purple-800 border-purple-200",
    admin: "bg-red-100 text-red-800 border-red-200",
    editor: "bg-blue-100 text-blue-800 border-blue-200",
    viewer: "bg-gray-100 text-gray-800 border-gray-200",
  };

  const roleIcons = {
    owner: Crown,
    admin: Settings,
    editor: Edit3,
    viewer: Eye,
  };

  const statusColors = {
    accepted: "bg-green-100 text-green-800",
    pending: "bg-yellow-100 text-yellow-800",
    declined: "bg-red-100 text-red-800",
  };

  const filteredCollaborators = collaborators?.filter(
    (collaborator) =>
      collaborator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      collaborator.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = (
    collaboratorId: string,
    newRole: "admin" | "editor" | "viewer"
  ) => {
    setCollaborators(
      collaborators?.map((collab) =>
        collab.id === collaboratorId ? { ...collab, role: newRole } : collab
      )
    );
    setEditingRole(null);
  };

  const handleRemoveCollaborator = (collaboratorId: string) => {
    setCollaborators(
      collaborators?.filter((collab) => collab.id !== collaboratorId)
    );
  };

  const handleBulkAction = (action: "remove" | "resend") => {
    if (action === "remove") {
      setCollaborators(
        collaborators?.filter(
          (collab) => !selectedCollaborators.includes(collab.id)
        )
      );
      setSelectedCollaborators([]);
    }
  };

  const toggleSelectCollaborator = (collaboratorId: string) => {
    setSelectedCollaborators((prev) =>
      prev.includes(collaboratorId)
        ? prev.filter((id) => id !== collaboratorId)
        : [...prev, collaboratorId]
    );
  };

  const RoleIcon = ({ role }: { role: string }) => {
    const Icon = roleIcons[role as keyof typeof roleIcons];
    return Icon ? <Icon className="w-3 h-3" /> : null;
  };

  const getInvitations = async () => {
    await getAllInvitations().then((res) => {
      console.log("There is response:", res?.data);
    });
  };

  const getCollaborators = async () => {
    await getAllSentInvitations().then((res) => {
      console.log("Sent Invites:", res?.data);
      const invites = res?.data || [];

      const collaboratorsData = invites?.collaborators?.map((invite: any) => ({
        id: invite._id,
        name: invite.collaboratorName,
        email: invite?.collaboratorEmail || invite.collaboratorName,
        role: invite.permission,
        status: invite.status,
        avatar: invite.collaboratorName.substring(0, 2).toUpperCase(),
        joinedDate: new Date(invite.invitedAt).toISOString().split("T")[0],
      }));
      setCollaborators(collaboratorsData); // Assuming the response contains the list of collaborators
    });
  };

  const onSubmit = async (values: AddCollaboratorData) => {
    setLoading(true)
    console.log('values', values);
    
    try {
      const payload = {
        email: values.email,
        role_permission: values.role, // for defaulting
        // message: values.message,
      };

      console.log("payload", payload);

      await inviteUser(payload).then((res) => {
        console.log(res);
        if (res?.status == 201) {
          toast.success("Invitation sent successfully!");
          setShowInviteModal(false);
          getInvitations();
          getCollaborators();
        } else if (
          res?.status == 200 &&
          res?.data?.message === "Invite already sent"
        ) {
          toast.info("Invitation already sent to this email.");
        } else if (
          res?.status == 200 &&
          res?.data?.message === "User is already a collaborator"
        ) {
          toast.info("User is already a collaborator.");
        } else if (
          res?.status == 200 &&
          res?.data?.message === "Invite re-sent successfully"
        ) {
          toast.info(
            "Invite re-sent successfully."
          );
        } else if (res?.status == 400) {
          toast.error(
            "Invitation failed! User not found. Please check the email address."
          );
        } else {
          toast.error(
            "Failed to send invitation. Confirm email and Please try again."
          );
        }

        console.log("Response:", res);
      });
      // setInviteData({ email: '', role: 'viewer', message: '' });
      // setShowInviteModal(false);

      // const res: any = await inviteUser(values.email, values.password)

    setLoading(false)

    } catch (err) {
      toast.error("Error Occurred, try again!");
    }
  };

  const initialValues: AddCollaboratorData = {
    email: "",
    role: "",
    // message: "",
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
    initialValues: initialValues,
    validationSchema: addCollaborationValidation,
    onSubmit,
  });

  useEffect(() => {
    getInvitations();
    getCollaborators();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Dialog
        header="Add Collaborator"
        visible={showInviteModal}
        style={{ width: "400px", padding: "1.5rem", backgroundColor: "white" }}
        onHide={() => {
          if (!showInviteModal) return;
          setShowInviteModal(false);
        }}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 mt-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                name="email"
                type="email"
                value={values.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Enter email address"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />

              {errors.email && touched.email && (
                <p className="error text-sm text-red-400">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                name="role"
                value={values.role}
                onChange={handleChange}
                onBlur={handleBlur}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              >
                <option value="viewer" disabled>Viewer - Can view content</option>
                <option value="editor" selected>Editor - Can edit content</option>
              </select>
            </div>

            {/* <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Personal Message (Optional)
              </label>
              <textarea
                name="message"
                value={values.message}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="Add a personal message to the invitation"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              />
            </div> */}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => setShowInviteModal(false)}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              // onClick={handleInvite}
              disabled={!isValid || isSubmitting}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {
                loading ? 
                <i className="pi pi-spinner pi-spin"></i>
                :
              <Mail className="w-4 h-4" />
              }
              Send Invite
            </button>
          </div>
        </form>
      </Dialog>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-wrap justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Team Collaborators
              </h1>
              <p className="text-gray-600">
                Manage team members and their permissions
              </p>
            </div>
            <button
              onClick={() => setShowInviteModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Add Collaborator
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search collaborators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            {selectedCollaborators?.length > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction("resend")}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Resend Invites ({selectedCollaborators?.length})
                </button>
                <button
                  onClick={() => handleBulkAction("remove")}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  Remove ({selectedCollaborators?.length})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Collaborators List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    <input
                      type="checkbox"
                      checked={
                        selectedCollaborators?.length === collaborators?.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCollaborators(
                            collaborators?.map((c) => c.id)
                          );
                        } else {
                          setSelectedCollaborators([]);
                        }
                      }}
                      className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Collaborator
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Role
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Status
                  </th> 
                  <th className="text-left py-3 px-4 font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCollaborators?.map((collaborator) => (
                  <tr key={collaborator.id} className="hover:bg-gray-50">
                    <td className="py-4 px-4">
                      {collaborator.role !== "owner" && (
                        <input
                          type="checkbox"
                          checked={selectedCollaborators.includes(
                            collaborator.id
                          )}
                          onChange={() =>
                            toggleSelectCollaborator(collaborator.id)
                          }
                          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                        />
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-sm font-medium text-gray-700">
                          {collaborator.avatar}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {collaborator.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {collaborator.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {editingRole === collaborator.id &&
                      collaborator.role !== "owner" ? (
                        <select
                          value={collaborator.role}
                          onChange={(e) =>
                            handleRoleChange(
                              collaborator.id,
                              e.target.value as any
                            )
                          }
                          onBlur={() => setEditingRole(null)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-orange-500"
                          autoFocus
                        >
                          <option disabled value="admin">Admin</option>
                          <option disabled value="editor">Editor</option>
                          <option disabled value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                            roleColors[collaborator.role]
                          } ${
                            collaborator.role !== "owner"
                              ? "cursor-pointer hover:opacity-80"
                              : ""
                          }`}
                          onClick={() =>
                            collaborator.role !== "owner" &&
                            setEditingRole(collaborator.id)
                          }
                        >
                          <RoleIcon role={collaborator.role} />
                          {collaborator.role.charAt(0).toUpperCase() +
                            collaborator.role.slice(1)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          statusColors[collaborator.status]
                        }`}
                      >
                        {collaborator.status === "pending" && (
                          <AlertCircle className="w-3 h-3 mr-1" />
                        )}
                        {collaborator.status.charAt(0).toUpperCase() +
                          collaborator.status.slice(1)}
                      </span>
                    </td>
                    {/* <td className="py-4 px-4 text-sm text-gray-500">
                      {collaborator.lastActive || "Never"}
                    </td> */}
                    <td className="py-4 px-4">
                      {collaborator.role !== "owner" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleRemoveCollaborator(collaborator.id)
                            }
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Remove collaborator"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                            <MoreHorizontal className="w-4 h-4" />
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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                Total Members
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {collaborators?.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Active</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {collaborators?.filter((c) => c.status === "accepted")?.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Pending</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {collaborators?.filter((c) => c.status === "pending")?.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Admins</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {
                collaborators?.filter(
                  (c) => c.role === "admin" || c.role === "owner"
                )?.length
              }
            </div>
          </div>
        </div>
      </div>
 
    </div>
  );
};

export default CollaboratorManager;
