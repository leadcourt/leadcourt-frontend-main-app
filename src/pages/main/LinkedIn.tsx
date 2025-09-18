import React, { useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { creditState, userState } from "../../utils/atom/authAtom";
import { Dialog } from "primereact/dialog";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getCreditBalance } from "../../utils/api/creditApi";
import { showPhoneAndEmail } from "../../utils/api/getPhoneAndEmail";
import { searchLinkedInProfile } from "../../utils/api/data";
import TextToCapitalize from "../../component/TextToCapital";
import AddToListComponent from "../../component/AddToListComponent";

type Lead = {
  row_id: number;
  Name?: string | null;
  Designation?: string | null;
  Email?: string | null;
  Phone?: string | null;
  "LinkedIn URL"?: string | null;
  Organization?: string | null;
  City?: string | null;
  State?: string | null;
  Country?: string | null;
  "Org Size"?: string | null;
  "Org Industry"?: string | null;
};

const ORANGE = "#F35114";

export default function LinkedIn() {
  const user = useRecoilValue(userState);
  const setCreditInfo = useSetRecoilState(creditState);
  const creditInfoValue = useRecoilValue(creditState);
  const navigate = useNavigate();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [status, setStatus] = useState<"idle" | "success" | "fail">("idle");
  const [revealLoading, setRevealLoading] = useState<{ type?: "email" | "phone"; id?: number }>({});
  const [insufficientVisible, setInsufficientVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);

  // Helper to refresh header credits from /total
  const refreshCredits = async () => {
    try {
      const res = await getCreditBalance();
      setCreditInfo({
        id: user?.id ?? "",
        credits: res?.data?.credits || 0,
        subscriptionType: res?.data?.subscriptionType || "FREE",
        expiresAt: res?.data?.expiresAt,
        proRemainingDays: res?.data?.proRemainingDays,
        starterRemainingDays: res?.data?.starterRemainingDays,
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    (async () => {
      await refreshCredits();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setCreditInfo, user?.id]);

  const isFree = (creditInfoValue?.subscriptionType ?? "FREE") === "FREE";

  const peopleForList = lead
    ? [
        {
          row_id: lead.row_id,
          Name: lead.Name ?? "",
          Designation: lead.Designation ?? "",
          Email: lead.Email ?? "",
          Phone: lead.Phone ?? "",
          Organization: lead.Organization ?? "",
          City: lead.City ?? "",
          State: lead.State ?? "",
          Country: lead.Country ?? "",
          "Organization Size": lead["Org Size"] ?? "",
          "Organization Industry": lead["Org Industry"] ?? "",
        },
      ]
    : [];

  const openAddModal = () => {
    if (!lead) {
      toast.error("No profile to add");
      return;
    }
    setAddModalVisible(true);
  };

  const onCheck = async () => {
    const raw = (input || "").trim();
    if (!raw) {
      toast.error("Enter a LinkedIn profile URL");
      return;
    }

    setLoading(true);

    try {
      const res = await searchLinkedInProfile({ linkedinUrl: raw });
      const apiLead: Lead | undefined = res?.data?.lead;

      if (apiLead && typeof apiLead === "object") {
        setLead(apiLead);
        setStatus("success");

        // Immediately refresh header credits since /linkedin-search deducts 5 on success
        await refreshCredits();
      } else {
        setLead(null);
        setStatus("fail");
      }
    } catch (err: any) {
      const http = err?.response?.status;
      const msg = err?.response?.data?.error || "Unable to fetch LinkedIn profile.";

      if (http === 404) {
        setLead(null);
        setStatus("fail");
      } else if (http === 402) {
        // insufficient credits for the 5-credit charge
        setInsufficientVisible(true);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    setStatus("idle");
    setLead(null);
    setInput("");
  };

  const openOnLinkedIn = () => {
    if (!lead?.["LinkedIn URL"]) return;
    const href = lead["LinkedIn URL"].startsWith("http")
      ? lead["LinkedIn URL"]
      : `https://${lead["LinkedIn URL"]}`;
    window.open(href, "popupWindow", "width=900,height=700");
  };

  const handleReveal = async (type: "email" | "phone") => {
    if (!lead) return;
    setRevealLoading({ type, id: lead.row_id });

    try {
      const res = await showPhoneAndEmail(type, [lead.row_id], user);
      if (res?.data?.error) {
        setInsufficientVisible(true);
        return;
      }
      const revealed = res?.data?.results?.[0] || {};
      setLead((prev) => (prev ? { ...prev, ...revealed } : prev));

      // Update credits from response after reveal (API returns remainingCredits)
      setCreditInfo({
        id: user?.id ?? "",
        credits: res?.data?.remainingCredits || 0,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
        expiresAt: creditInfoValue?.expiresAt,
        proRemainingDays: creditInfoValue?.proRemainingDays,
        starterRemainingDays: creditInfoValue?.starterRemainingDays,
      });
    } catch {
      toast.error("Unable to reveal info right now.");
    } finally {
      setRevealLoading({});
    }
  };

  const safe = (v?: string | null) => (v && `${v}`.trim().length ? v : "—");
  const location = safe([lead?.City, lead?.State, lead?.Country].filter(Boolean).join(", ").trim());

  return (
    <div className="min-h-[90vh] px-4">
      <Dialog
        header="Insufficient Credit"
        visible={insufficientVisible}
        className="p-2 bg-white w-fit max-w-[400px] lg:w-1/2"
        onHide={() => insufficientVisible && setInsufficientVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className="pb-3 w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className="flex">
              <i className="pi pi-exclamation-triangle text-yellow-700 p-1 rounded" />
              <span className="text-sm">You have insufficient credits to view this profile.</span>
            </p>
          </div>
          <div className="mt-6 flex items-center pb-2">
            <div className="w-fit m-auto">
              <button
                onClick={() => navigate("/subscription")}
                className="bg-[#F35114] flex items-center gap-2 text-white text-md rounded-full px-6 py-2 cursor-pointer"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </Dialog>
      <Dialog
        header="Add Profiles to list"
        visible={addModalVisible}
        className="p-2 bg-white w-[90vw] lg:w-1/2"
        onHide={() => addModalVisible && setAddModalVisible(false)}
      >
        <AddToListComponent onClose={() => setAddModalVisible(false)} people={peopleForList} />
      </Dialog>

      <div className="max-w-6xl mx-auto">
        {status === "idle" ? (
          <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-700">LinkedIn Enrichment Tool</h1>
              <p className="text-gray-500 text-sm mt-2">
                Paste a LinkedIn profile URL and hit <span className="font-semibold">Check</span>.
              </p>

              <div className="mt-8 flex items-center gap-3 border border-gray-300 text-gray-500 rounded-lg p-3 w-full">
                <i className="pi pi-link" />
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter LinkedIn URL…"
                  className="border-none text-sm focus:outline-none w-full"
                />
              </div>

              <button
                onClick={onCheck}
                disabled={loading || !input.trim()}
                className={`mt-4 w-full flex items-center justify-center gap-2 rounded-md py-3 px-4 text-white font-medium ${
                  loading || !input.trim()
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#F35114] hover:opacity-95 cursor-pointer"
                }`}
              >
                {loading ? <i className="pi pi-spin pi-spinner" /> : <i className="pi pi-shield" />}
                <span>Check Profile</span>
              </button>

              {/* NEW: credit usage hint */}
              <div className="mt-2 text-left">
                <div className="text-xs text-gray-500">(This feature uses 6 credits)</div>
                <div className="mt-1 text-xs text-gray-500">
                  (Breakdown: 1 credit for email + 5 for phone number)
                </div>
              </div>
              <div className="mt-8 text-xs text-gray-400">
                Powered by <span className="font-semibold text-[#F35114]">LeadCourt</span>
              </div>
            </div>
          </div>
        ) : status === "fail" ? (
          <>
            <div className="pt-20 pb-3 flex items-center gap-2 text-gray-500">
              <i className="pi pi-arrow-left" />
              <button onClick={goBack} className="text-sm hover:underline cursor-pointer">
                Back to verification
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Verification Results</h2>
                </div>
              </div>

              <div className="mt-6 p-4 bg-red-50 rounded-lg flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                  Not Found
                </span>
                <span className="text-xs text-red-700">
                  We couldn’t find a profile for the provided URL. Check the URL and try again.
                </span>
              </div>

              <div className="mt-8 text-xs text-gray-400">
                Powered by <span className="font-semibold text-[#F35114]">LeadCourt</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="pt-20 pb-3 flex items-center gap-2 text-gray-500">
              <i className="pi pi-arrow-left" />
              <button onClick={goBack} className="text-sm hover:underline cursor-pointer">
                Back to verification
              </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-700">Verification Results</h2>
                  <div className="text-sm text-gray-500 mt-1 break-all">
                    {safe(lead?.["LinkedIn URL"])}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={openAddModal}
                    className="h-10 px-4 flex items-center gap-2 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <i className="pi pi-plus" />
                    Add to list
                  </button>

                  <button
                    onClick={openOnLinkedIn}
                    className="h-10 px-4 flex items-center gap-2 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <i className="pi pi-external-link" />
                    Open on LinkedIn
                  </button>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg flex flex-wrap items-center gap-3">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                  Found
                </span>
                <span className="text-xs text-gray-500">Profile located via LinkedIn URL</span>
              </div>

              <div className="grid grid-cols-12 gap-4 mt-6">
                <CheckCard ok label="Profile Found" icon="pi-user" />
                <CheckCard ok label="Org Parsed" icon="pi-building" />
                <CheckCard ok label="Location Parsed" icon="pi-map-marker" />
              </div>

              <div className="mt-6 grid grid-cols-12 gap-x-8 gap-y-5">
                <InfoItem
                  className="col-span-12 md:col-span-6"
                  label="Name"
                  value={TextToCapitalize(safe(lead?.Name as string))}
                />
                <InfoItem
                  className="col-span-12 md:col-span-6"
                  label="Designation"
                  value={TextToCapitalize(safe(lead?.Designation as string))}
                />

                <div className="col-span-12 md:col-span-6">
                  <Label label="Email" />
                  <div className="h-10 flex items-center">
                    {!lead?.Email ? (
                      <ActionBtn
                        label="Show Email"
                        icon="pi-inbox"
                        busy={revealLoading.type === "email" && revealLoading.id === lead?.row_id}
                        onClick={() => handleReveal("email")}
                      />
                    ) : (
                      <Value>{lead.Email}</Value>
                    )}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <Label label="Phone" />
                  <div className="h-10 flex items-center">
                    {!lead?.Phone ? (
                      <ActionBtn
                        label="Show Phone"
                        icon="pi-phone"
                        busy={revealLoading.type === "phone" && revealLoading.id === lead?.row_id}
                        onClick={() => handleReveal("phone")}
                      />
                    ) : (
                      <Value>{lead.Phone}</Value>
                    )}
                  </div>
                </div>

                <InfoItem
                  className="col-span-12 md:col-span-6"
                  label="Organization"
                  value={TextToCapitalize(safe(lead?.Organization as string))}
                />
                <InfoItem
                  className="col-span-12 md:col-span-6"
                  label="Location"
                  value={TextToCapitalize(location)}
                />

                <InfoItem
                  className={`col-span-12 md:col-span-6 ${isFree ? "opacity-60" : ""}`}
                  label="Organization Size"
                  value={
                    isFree
                      ? "Upgrade Account to see"
                      : TextToCapitalize(safe(lead?.["Org Size"] as string))
                  }
                />
                <InfoItem
                  className={`col-span-12 md:col-span-6 ${isFree ? "opacity-60" : ""}`}
                  label="Organization Industry"
                  value={
                    isFree
                      ? "Upgrade Account to see"
                      : TextToCapitalize(safe(lead?.["Org Industry"] as string))
                  }
                />
              </div>

              <div className="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-400">
                Powered by <span className="font-semibold text-[#F35114]">LeadCourt</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Label({ label }: { label: string }) {
  return <div className="text-xs text-gray-400 mb-1">{label}</div>;
}

function Value({ children }: { children: React.ReactNode }) {
  return <div className="text-sm font-medium text-gray-700 break-words">{children}</div>;
}

function InfoItem({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? ""}>
      <Label label={label} />
      <Value>{value ?? "—"}</Value>
    </div>
  );
}

function ActionBtn({
  label,
  icon,
  onClick,
  busy,
}: {
  label: string;
  icon: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!!busy}
      className={`h-10 px-4 rounded-lg flex items-center gap-2 text-white font-bold ${
        busy ? "opacity-70 cursor-not-allowed" : "hover:opacity-95 cursor-pointer"
      }`}
      style={{ backgroundColor: ORANGE }}
    >
      {busy ? <i className="pi pi-spin pi-spinner text-xs" /> : <i className={`pi ${icon} text-xs`} />}
      <span>{label}</span>
    </button>
  );
}

function CheckCard({ ok, label, icon }: { ok: boolean; label: string; icon: string }) {
  return (
    <div className="col-span-12 md:col-span-4">
      <div className={`w-full rounded-lg px-4 py-3 flex items-center gap-3 ${ok ? "bg-green-50" : "bg-red-50"}`}>
        <i className={`pi ${icon} text-sm ${ok ? "text-green-600" : "text-red-600"}`} />
        <span className={`text-sm ${ok ? "text-green-700" : "text-red-700"}`}>{label}</span>
        <span className={`ml-auto text-lg ${ok ? "text-green-600" : "text-red-600"}`}>{ok ? "✓" : "✕"}</span>
      </div>
    </div>
  );
}
