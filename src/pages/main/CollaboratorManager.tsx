import React, { useEffect, useState } from "react";
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
  const [selectedCollaborators, setSelectedCollaborators] = useState<string[]>(
    []
  );
  const [loadingDeleteCollab, setLoadingDeleteCollab] =
    useState<deleteData>();

  const creditInfo = useRecoilValue(creditState);
  const navigate = useNavigate();

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

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    setLoadingDeleteCollab({
      loading: true,
      collab: collaboratorId,
    });

    await removeCollaboration(collaboratorId)
      .then((res) => {
        if (res.status === 204) {
          setCollaborators((prev) =>
            prev?.filter((collab) => collab.id !== collaboratorId)
          );
          toast.info("Collaborator removed!");
        }
      })
      .catch(() => {
        toast.info("Unable to removed collaborator!");
      });

    setLoadingDeleteCollab({
      loading: false,
      collab: "",
    });
  };

  const handleBulkAction = async (action: "remove" | "resend") => {
    if (action === "remove") {
      if (!selectedCollaborators.length) return;

      const idsToDelete = [...selectedCollaborators];

      try {
        await Promise.all(
          idsToDelete.map(async (id) => {
            try {
              const res = await removeCollaboration(id);
              if (res.status === 204) {
                setCollaborators((prev) =>
                  prev.filter((collab) => collab.id !== id)
                );
              } else {
                console.error("Failed to remove collaborator", id, res.status);
              }
            } catch (err) {
              console.error("Error removing collaborator", id, err);
            }
          })
        );

        setSelectedCollaborators([]);
        toast.info("Selected collaborators removed");
      } catch (err) {
        toast.error(
          "Some collaborators could not be removed. Please try again."
        );
      }
    }

    if (action === "resend") {
      // no-op for now
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
    await getAllInvitations().then(() => {});
  };

  const getCollaborators = async () => {
    await getAllSentInvitations().then((res) => {
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
      setCollaborators(collaboratorsData);
    });
  };

  const onSubmit = async (values: AddCollaboratorData) => {
    setLoading(true);

    try {
      const payload = {
        email: values.email,
        role_permission: values.role,
      };

      await inviteUser(payload).then((res) => {
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
          toast.info("Invite re-sent successfully.");
        } else if (res?.status == 400) {
          toast.error(
            "Invitation failed! User not found. Please check the email address."
          );
        } else {
          toast.error(
            "Failed to send invitation. Confirm email and Please try again."
          );
        }
      });
      setLoading(false);
    } catch (err) {
      toast.error("Error Occurred, try again!");
    }
  };

  const initialValues: AddCollaboratorData = {
    email: "",
    role: "",
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
                <option value="viewer" disabled>
                  Viewer - Can view content
                </option>
                <option value="editor" selected>
                  Editor - Can edit content
                </option>
              </select>
            </div>
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
              disabled={!isValid || isSubmitting}
              className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <i className="pi pi-spinner pi-spin"></i>
              ) : (
                <Mail className="w-4 h-4" />
              )}
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
            {creditInfo?.subscriptionType.toLowerCase() === "pro" ||
            creditInfo?.subscriptionType.toLowerCase() === "business" ? (
              <button
                onClick={() => setShowInviteModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                Add Collaborator
              </button>
            ) : (
              <button
                onClick={() => navigate("/subscription")}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <i className=" ">Upgrade Account</i>
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${
                          roleColors[collaborator.role]
                        } ${
                          collaborator.role !== "owner"
                            ? "cursor-pointer hover:opacity-80"
                            : ""
                        }`}
                      >
                        <RoleIcon role={collaborator.role} />
                        {collaborator.role.charAt(0).toUpperCase() +
                          collaborator.role.slice(1)}
                      </span>
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

                    <td className="py-4 px-4">
                      {collaborator.role !== "owner" && (
                        <div className="flex items-center gap-2">
                          <button
                            title="Remove collaborator"
                            onClick={() =>
                              handleRemoveCollaborator(collaborator.id)
                            }
                            className="cursor-pointer hover:text-red-400 text-gray-400 p-2 rounded transition-colors"
                          >
                            {loadingDeleteCollab &&
                            loadingDeleteCollab.collab ===
                              collaborator.id ? (
                              <i className="pi pi-spinner pi-spin text-red-400"></i>
                            ) : (
                              <Trash2 className="w-4 h-4 " />
                            )}
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
    </div>
  );
};

export default CollaboratorManager;
