import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { toast } from "react-toastify";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";

import { exportList } from "../../utils/api/data";
import TextToCapitalize from "../../component/TextToCapital";

import hubspotLogo from "../../assets/integrations/hubspot/HubSpot.png";
import brevoLogo from "../../assets/integrations/Brevo.png";
import noDataImg from "../../assets/icons/nodataImage.jpg";

import {
  collaboration_checkHubspotConnection,
  collaboration_checkBrevoConnection,
  collaboration_exportToHubspotApi,
  collaboration_exportToBrevoApi,
} from "../../utils/api/collaborationIntegrations";
import {
  collaboration_getLinkedInUrl_api,
  collaboration_getSingleListDetail_api,
  collaboration_getAllList_api,
  collaboration_getListRevealEstimate_api,
  collaboration_revealAllFromList_api,
  collaboration_showPhoneAndEmail_api,
} from "../../utils/api/collaborationData";

import {
  collabCreditState,
  collabProjectState,
} from "../../utils/atom/collabAuthAtom";

interface Person {
  City: string;
  Country: string;
  Designation: string;
  Name: string;
  Organization: string;
  State: string;
  row_id: number;
  Email: any;
  Phone: any;
  ["Org Industry"]?: string;
  ["Org Size"]?: string;
  ["Organization Industry"]?: string;
  ["Organization Size"]?: string;
}

interface ListDetailPayload {
  page: number | undefined;
  listName: string | undefined;
}

const hasValue = (v: any) => {
  if (v === null || v === undefined) return false;
  const s = String(v).trim();
  if (!s) return false;
  if (s.toLowerCase() === "nil") return false;
  return true;
};

const isNil = (v: any) =>
  typeof v === "string" && v.trim().toLowerCase() === "nil";

const PHONE_REVEAL_CREDITS = 5;
const EMAIL_REVEAL_CREDITS = 1;

const PAGE_SIZE = 25;
const TABLE_SCROLL_HEIGHT = "clamp(320px, 68vh, 620px)";

export default function Collab_ListDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = useRecoilValue(collabProjectState);
  const setCreditInfo = useSetRecoilState(collabCreditState);
  const creditInfoValue = useRecoilValue(collabCreditState);

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<Person[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Person[]>([]);
  const [loadRow, setLoadRow] = useState<any>({});
  const [insufficientVisible, setInsufficientVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [hubspotConnected, setHubspotConnected] = useState<boolean | null>(null);
  const [brevoConnected, setBrevoConnected] = useState<boolean | null>(null);
  const [checkingConnections, setCheckingConnections] = useState(false);
  const [exportingTarget, setExportingTarget] = useState<
    "hubspot" | "brevo" | "email" | ""
  >("");
  const [connectVisible, setConnectVisible] = useState(false);
  const [connectTarget, setConnectTarget] = useState<"hubspot" | "brevo" | "">(
    ""
  );
  const [totalRows, setTotalRows] = useState<number>(0);
  const [loadingTotal, setLoadingTotal] = useState<boolean>(false);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [listEstimate, setListEstimate] = useState<{
    phoneCredits: number;
    emailCredits: number;
    phoneCount: number;
    emailCount: number;
  }>({ phoneCredits: 0, emailCredits: 0, phoneCount: 0, emailCount: 0 });

  const listName = params?.listName;
  const listNamePretty = useMemo(
    () => (listName || "").replace(/-/g, " "),
    [listName]
  );

  const columns = useMemo(
    () => [
      { field: "Name", header: "NAME" },
      { field: "Designation", header: "DESIGNATION" },
      { field: "Phone", header: "PHONE" },
      { field: "Email", header: "EMAIL" },
      { field: "LinkedIn", header: "LINKEDIN" },
      { field: "Organization", header: "ORGANIZATION" },
      { field: "Org Industry", header: "ORG INDUSTRY" },
      { field: "Org Size", header: "ORG SIZE" },
      { field: "City", header: "CITY" },
      { field: "State", header: "STATE" },
      { field: "Country", header: "COUNTRY" },
    ],
    []
  );

  const headerCellClass =
    "bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider px-6 py-4";
  const bodyCellClass =
    "px-6 py-4 text-sm text-gray-600 border-b border-gray-100";

  const loadingRows = useMemo(() => {
    const base: any = { row_id: "" };
    for (const c of columns) base[c.field] = "";
    return Array.from({ length: 10 }, (_, i) => ({
      ...base,
      row_id: `__sk_${i}`,
    }));
  }, [columns]);

  const totalPages = useMemo(() => {
    const pages = Math.ceil((Number(totalRows) || 0) / PAGE_SIZE);
    return Math.max(1, pages);
  }, [totalRows]);

  const canGoPrev = pageNumber > 1;
  const canGoNext = pageNumber < totalPages;

  const counts = useMemo(() => {
    const allUnrevealedPhone = entries.filter(
      (e) => !hasValue(e.Phone) && !isNil(e.Phone)
    ).length;
    const allUnrevealedEmail = entries.filter(
      (e) => !hasValue(e.Email) && !isNil(e.Email)
    ).length;
    const selUnrevealedPhone = selectedProfile.filter(
      (e) => !hasValue(e.Phone) && !isNil(e.Phone)
    ).length;
    const selUnrevealedEmail = selectedProfile.filter(
      (e) => !hasValue(e.Email) && !isNil(e.Email)
    ).length;
    const useSelected = selectedProfile.length > 0;
    return {
      useSelected,
      phoneCost:
        (useSelected ? selUnrevealedPhone : allUnrevealedPhone) *
        PHONE_REVEAL_CREDITS,
      emailCost:
        (useSelected ? selUnrevealedEmail : allUnrevealedEmail) *
        EMAIL_REVEAL_CREDITS,
    };
  }, [entries, selectedProfile]);

  const userCredits = useMemo(
    () => Number(creditInfoValue?.credits || 0),
    [creditInfoValue?.credits]
  );

  const parseEstimate = (raw: any) => {
    const d = raw?.data ?? raw ?? {};
    const phoneCredits = Number(
      d?.phoneCredits ??
        d?.phoneCost ??
        d?.creditsPhone ??
        d?.phone?.credits ??
        d?.phone?.cost ??
        d?.estimate?.phoneCredits ??
        d?.estimate?.phoneCost ??
        0
    );
    const emailCredits = Number(
      d?.emailCredits ??
        d?.emailCost ??
        d?.creditsEmail ??
        d?.email?.credits ??
        d?.email?.cost ??
        d?.estimate?.emailCredits ??
        d?.estimate?.emailCost ??
        0
    );
    const phoneCount = Number(
      d?.phoneCount ??
        d?.unrevealedPhone ??
        d?.phoneUnrevealed ??
        d?.phone?.count ??
        d?.estimate?.phoneCount ??
        0
    );
    const emailCount = Number(
      d?.emailCount ??
        d?.unrevealedEmail ??
        d?.emailUnrevealed ??
        d?.email?.count ??
        d?.estimate?.emailCount ??
        0
    );
    return {
      phoneCredits: Number.isFinite(phoneCredits) ? phoneCredits : 0,
      emailCredits: Number.isFinite(emailCredits) ? emailCredits : 0,
      phoneCount: Number.isFinite(phoneCount) ? phoneCount : 0,
      emailCount: Number.isFinite(emailCount) ? emailCount : 0,
    };
  };

  const initials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
  };

  const listDetail = async (pageNum: number) => {
    setLoading(true);
    const payload: ListDetailPayload = {
      page: pageNum,
      listName: listName,
    };
    try {
      const res: any = await collaboration_getSingleListDetail_api(payload);
      const data: Person[] =
        res?.data?.sort((a: Person, b: Person) =>
          (a?.Name || "").localeCompare(b?.Name || "")
        ) || [];
      setEntries(data);
      setSelectedProfile([]);
    } catch (e) {
      setEntries([]);
      setSelectedProfile([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRows = async () => {
    if (!user?._id) return;
    setLoadingTotal(true);
    try {
      const res: any = await collaboration_getAllList_api({
        projectId: user?._id,
      });
      const lists: any[] = res?.data || [];
      const match = lists.find((l) => l?.name === listName);
      const t = Number(match?.total || 0);
      setTotalRows(Number.isFinite(t) ? t : 0);
    } catch (e) {
      setTotalRows(0);
    } finally {
      setLoadingTotal(false);
    }
  };

  const fetchRevealEstimate = useCallback(async () => {
    if (!listName) return;
    setEstimateLoading(true);
    try {
      const res: any = await collaboration_getListRevealEstimate_api({ listName, userId: user?._id });
      setListEstimate(parseEstimate(res));
    } catch (e) {
      setListEstimate({ phoneCredits: 0, emailCredits: 0, phoneCount: 0, emailCount: 0 });
    } finally {
      setEstimateLoading(false);
    }
  }, [listName, user?._id]);

  const goToPage = (next: number) => {
    const clamped = Math.min(Math.max(1, next), totalPages);
    setPageNumber(clamped);
    listDetail(clamped);
  };

  const openLinkedInPopup = async (id: any) => {
    setLoadRow({ type: "linkedIn", row_id: id });
    try {
      const res: any = await collaboration_getLinkedInUrl_api({ row_id: id });
      if (res?.data?.linkedin_url) {
        window.open(
          `https://${res.data.linkedin_url}`,
          "popupWindow",
          "width=600,height=600"
        );
      }
    } finally {
      setLoadRow({});
    }
  };

  const handleShowPhoneOrEmail = async (type: "phone" | "email", id: any) => {
    setLoadRow({ type, row_id: id });
    try {
      const res: any = await collaboration_showPhoneAndEmail_api(type, [id], user);
      if (res?.data?.error) {
        setInsufficientVisible(true);
        return;
      }
      const patch = res?.data?.results?.[0] || {};
      const updatedEntries = entries.map((entry: any) =>
        entry.row_id === id ? { ...entry, ...patch } : entry
      );
      setEntries(updatedEntries);
      const updatedSelected = selectedProfile.map((entry: any) =>
        entry.row_id === id ? { ...entry, ...patch } : entry
      );
      setSelectedProfile(updatedSelected);
      setCreditInfo({
        id: user?._id ?? "",
        credits: res?.data?.remainingCredits || 0,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
      });
      fetchRevealEstimate();
    } catch (e) {
    } finally {
      setLoadRow({});
    }
  };

  const bulkReveal = async (type: "phone" | "email") => {
    const useSelected = selectedProfile.length > 0;
    const source = useSelected ? selectedProfile : entries;
    const ids = source
      .filter((p: Person) => {
        const v = type === "phone" ? p.Phone : p.Email;
        return !isNil(v) && !hasValue(v);
      })
      .map((p: Person) => p.row_id)
      .filter(Boolean);
    if (!ids.length) return;
    const spinnerKey =
      (useSelected ? "selected" : "page") + (type === "phone" ? "Phone" : "Email");
    setLoadRow({ type: spinnerKey });
    try {
      const res: any = await collaboration_showPhoneAndEmail_api(type, ids, user);
      if (res?.data?.error) {
        setInsufficientVisible(true);
        return;
      }
      const resMap = new Map(
        (res?.data?.results || []).map((r: any) => [r.row_id, r])
      );
      const updatedEntries = entries.map((entry: any) => {
        const match: any = resMap.get(entry.row_id);
        return match ? { ...entry, ...match } : entry;
      });
      setEntries(updatedEntries);
      const updatedSelected = selectedProfile.map((entry: any) => {
        const match: any = resMap.get(entry.row_id);
        return match ? { ...entry, ...match } : entry;
      });
      setSelectedProfile(updatedSelected);
      setCreditInfo({
        id: user?._id ?? "",
        credits: res?.data?.remainingCredits || 0,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
      });
      fetchRevealEstimate();
    } catch (e) {
    } finally {
      setLoadRow({});
    }
  };

  const revealAll = async (type: "phone" | "email") => {
    const spinnerKey = type === "phone" ? "revealAllPhone" : "revealAllEmail";
    setLoadRow({ type: spinnerKey });
    try {
      const res: any = await collaboration_revealAllFromList_api({
        listName,
        type,
        userId: user?._id,
      });
      if (res?.data?.error) {
        setInsufficientVisible(true);
        return;
      }
      if (res?.data?.stoppedDueToCredits) {
        setInsufficientVisible(true);
        toast.warning("Partially revealed — ran out of credits");
      } else if (res?.data?.success || res?.data?.ok || res?.data?.revealed || res?.data?.done) {
        toast.success(
          type === "phone" ? "Revealed all phones" : "Revealed all emails"
        );
      } else {
        toast.success("Reveal queued");
      }
      if (typeof res?.data?.remainingCredits !== "undefined") {
        setCreditInfo({
          id: user?._id ?? "",
          credits: res?.data?.remainingCredits || 0,
          subscriptionType: creditInfoValue?.subscriptionType || "FREE",
        });
      }
      await fetchRevealEstimate();
      await listDetail(pageNumber);
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoadRow({});
    }
  };

  const refreshConnections = async () => {
    setCheckingConnections(true);
    setHubspotConnected(null);
    setBrevoConnected(null);
    const [hs, br] = await Promise.allSettled([
      collaboration_checkHubspotConnection(),
      collaboration_checkBrevoConnection(false),
    ]);
    setHubspotConnected(
      hs.status === "fulfilled" ? !!(hs.value as any)?.data?.connected : false
    );
    setBrevoConnected(
      br.status === "fulfilled" ? !!(br.value as any)?.data?.connected : false
    );
    setCheckingConnections(false);
  };

  const openExportModal = async () => {
    setExportModalVisible(true);
    await refreshConnections();
  };

  const openConnectDialog = (target: "hubspot" | "brevo") => {
    setConnectTarget(target);
    setConnectVisible(true);
  };

  const exportCurrentList = async (target: "hubspot" | "brevo" | "email") => {
    setExportingTarget(target);
    const payload: any = { listName };
    try {
      if (target === "hubspot") {
        const res: any = await collaboration_exportToHubspotApi(payload);
        if (res?.data?.success) {
          toast.success("Exported to Hubspot successfully");
          if (res?.data?.portalId) {
            window.open(
              `https://app-na2.hubspot.com/import/${res?.data?.portalId}`,
              "_blank",
              "noopener,noreferrer"
            );
          }
          setExportModalVisible(false);
        } else {
          toast.error("Unable to export to Hubspot");
        }
      }
      if (target === "brevo") {
        const res: any = await collaboration_exportToBrevoApi(payload);
        if (res?.data?.queued) {
          const name = res?.data?.targetBrevoListName
            ? ` (${res?.data?.targetBrevoListName})`
            : "";
          toast.success(`Queued export to Brevo${name}`);
          setExportModalVisible(false);
        } else if (res?.data?.success) {
          toast.success("Queued export to Brevo");
          setExportModalVisible(false);
        } else {
          toast.error("Unable to export to Brevo");
        }
      }
      if (target === "email") {
        payload.email = user?.collaboratorEmail;
        await exportList(payload);
        toast.success("You will receive a mail shortly");
        setExportModalVisible(false);
      }
    } catch (e) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setExportingTarget("");
    }
  };

  const skeletonLoad = () => <Skeleton height="1.2rem" className="bg-gray-200 rounded-md" />;

  const emptyMessageTemplate = () => (
    <div className="h-[60vh] w-full flex items-center justify-center">
      <img src={noDataImg} className="max-h-[60vh]" alt="" />
    </div>
  );

  const showName = (rowData: any) => {
    const name = TextToCapitalize(rowData?.Name || "");
    return (
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-semibold shadow-md shadow-orange-500/20">
          {initials(name)}
        </div>
        <div className="font-medium text-gray-900">{name}</div>
      </div>
    );
  };

  const showDesignation = (rowData: any) => (
    <div className="text-sm text-gray-600">{TextToCapitalize(rowData?.Designation || "")}</div>
  );

  const showPhone = (rowData: any) => {
    const v = rowData?.Phone;
    if (isNil(v)) return <span className="text-sm text-gray-900"></span>;
    if (!hasValue(v)) {
      return (
        <button
          onClick={() => handleShowPhoneOrEmail("phone", rowData.row_id)}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-md inline-flex items-center gap-2"
        >
          {loadRow?.type === "phone" && loadRow.row_id === rowData.row_id ? (
            <i className="pi pi-spin pi-spinner text-xs" />
          ) : (
            <i className="pi pi-phone text-xs" />
          )}
          Reveal
        </button>
      );
    }
    return <span className="text-sm text-gray-900">{v}</span>;
  };

  const showEmail = (rowData: any) => {
    const v = rowData?.Email;
    if (isNil(v)) return <span className="text-sm text-gray-900"></span>;
    if (!hasValue(v)) {
      return (
        <button
          onClick={() => handleShowPhoneOrEmail("email", rowData.row_id)}
          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-md inline-flex items-center gap-2"
        >
          {loadRow?.type === "email" && loadRow.row_id === rowData.row_id ? (
            <i className="pi pi-spin pi-spinner text-xs" />
          ) : (
            <i className="pi pi-inbox text-xs" />
          )}
          Reveal
        </button>
      );
    }
    return <span className="text-sm text-gray-900">{v}</span>;
  };

  const showLinkedIn = (rowData: any) => {
    const loadingThis =
      loadRow?.type === "linkedIn" && loadRow.row_id === rowData.row_id;
    return (
      <button
        onClick={() => openLinkedInPopup(rowData.row_id)}
        className="inline-flex items-center justify-center w-9 h-9 bg-blue-50 hover:bg-blue-100 rounded-lg"
        title="Open LinkedIn"
      >
        <i
          className={`pi ${loadingThis ? "pi-spin pi-spinner" : "pi-linkedin"} text-blue-600`}
        />
      </button>
    );
  };

  const showOrganization = (rowData: any) => (
    <div className="text-sm text-gray-600">{TextToCapitalize(rowData?.Organization || "")}</div>
  );

  const showOrgIndustry = (rowData: any) => {
    const v = rowData?.["Org Industry"] ?? rowData?.["Organization Industry"] ?? "";
    return <div className="text-sm text-gray-600">{TextToCapitalize(v)}</div>;
  };

  const showOrgSize = (rowData: any) => {
    const v = rowData?.["Org Size"] ?? rowData?.["Organization Size"] ?? "";
    return <div className="text-sm text-gray-600">{TextToCapitalize(v)}</div>;
  };

  const showCity = (rowData: any) => (
    <div className="text-sm text-gray-600">{TextToCapitalize(rowData?.City || "")}</div>
  );

  const showState = (rowData: any) => (
    <div className="text-sm text-gray-600">{TextToCapitalize(rowData?.State || "")}</div>
  );

  const showCountry = (rowData: any) => (
    <div className="text-sm text-gray-600">{TextToCapitalize(rowData?.Country || "")}</div>
  );

  const handleChangePageNumber = (e: any) => {
    e.preventDefault();
    const next = Number(e.target.value || 1);
    goToPage(next);
  };

  const handleChangePageNumber2 = (chk: "increase" | "decrease") => {
    if (chk === "increase") {
      if (!canGoNext) return;
      goToPage(pageNumber + 1);
    } else {
      if (!canGoPrev) return;
      goToPage(pageNumber - 1);
    }
  };

  const phoneCostToShow = counts.useSelected ? counts.phoneCost : listEstimate.phoneCredits;
  const emailCostToShow = counts.useSelected ? counts.emailCost : listEstimate.emailCredits;
  const phoneSpinnerKey = counts.useSelected ? "selectedPhone" : "revealAllPhone";
  const emailSpinnerKey = counts.useSelected ? "selectedEmail" : "revealAllEmail";
  const phoneBusy = loadRow?.type === phoneSpinnerKey || loadRow?.type === "pagePhone";
  const emailBusy = loadRow?.type === emailSpinnerKey || loadRow?.type === "pageEmail";

  const phoneDisabledReason = useMemo(() => {
    if (!listName) return "No list";
    if (estimateLoading && !counts.useSelected) return "Calculating cost...";
    if ((counts.useSelected ? entries.length === 0 : totalRows === 0)) return "No contacts";
    if (phoneCostToShow <= 0) return "Nothing to reveal";
    if (userCredits < phoneCostToShow)
      return `Insufficient credits (need ${phoneCostToShow}, you have ${userCredits})`;
    return "";
  }, [counts.useSelected, entries.length, estimateLoading, listName, phoneCostToShow, totalRows, userCredits]);

  const emailDisabledReason = useMemo(() => {
    if (!listName) return "No list";
    if (estimateLoading && !counts.useSelected) return "Calculating cost...";
    if ((counts.useSelected ? entries.length === 0 : totalRows === 0)) return "No contacts";
    if (emailCostToShow <= 0) return "Nothing to reveal";
    if (userCredits < emailCostToShow)
      return `Insufficient credits (need ${emailCostToShow}, you have ${userCredits})`;
    return "";
  }, [counts.useSelected, entries.length, estimateLoading, listName, emailCostToShow, totalRows, userCredits]);

  const phoneDisabled = !!phoneDisabledReason || phoneBusy;
  const emailDisabled = !!emailDisabledReason || emailBusy;

  useEffect(() => {
    if (!user?._id || !listName) return;
    fetchTotalRows();
    fetchRevealEstimate();
    listDetail(1);
    setPageNumber(1);
  }, [user?._id, listName]);

  useEffect(() => {
    if (!listName) return;
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
      listDetail(totalPages);
    }
  }, [pageNumber, totalPages, listName]);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-gray-50">
      <Dialog
        header={`Connect to ${TextToCapitalize(connectTarget)}`}
        visible={connectVisible && connectTarget.length > 0}
        className="p-2 bg-white w-fit max-w-[420px] lg:w-1/2 rounded-xl"
        onHide={() => {
          if (!connectVisible) return;
          setConnectVisible(false);
          setConnectTarget("");
        }}
        draggable={false}
        resizable={false}
      >
        <div className="w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className="flex">
              <i className="pi pi-exclamation-triangle text-yellow-700 p-1 rounded"></i>
              <span className="text-sm">
                You haven’t connected {TextToCapitalize(connectTarget)} yet.
                Connect it from the Integrations page first.
              </span>
            </p>
          </div>
          <div className="mt-6 flex mb-3">
            <div className="cursor-pointer w-fit m-auto">
              <button
                onClick={() => {
                  setConnectVisible(false);
                  setConnectTarget("");
                }}
                className="bg-gray-500 cursor-pointer text-white text-md rounded-lg px-6 py-2"
              >
                Cancel
              </button>
            </div>
            <div className="cursor-pointer w-fit m-auto">
              <button
                onClick={() => {
                  setConnectVisible(false);
                  setConnectTarget("");
                  navigate(`/collaboration/${user?._id}/integrations`);
                }}
                className="bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-2 cursor-pointer text-white text-md rounded-lg px-6 py-2 shadow-lg shadow-orange-500/20"
              >
                Go to Integrations
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Insufficient Credit"
        visible={insufficientVisible}
        className="p-2 bg-white w-fit max-w-[420px] lg:w-1/2 rounded-xl"
        onHide={() => {
          if (!insufficientVisible) return;
          setInsufficientVisible(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="pb-3 w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className="flex">
              <i className="pi pi-exclamation-triangle text-yellow-700 p-1 rounded"></i>
              <span className="text-sm">You have insufficient credits to view this profile(s).</span>
            </p>
          </div>
          <div className="mt-6 flex items-center pb-2">
            <div className="cursor-pointer w-fit m-auto">
              <button
                onClick={() => navigate("/subscription")}
                className="bg-orange-500 hover:bg-orange-600 transition-colors flex items-center gap-2 cursor-pointer text-white text-md rounded-lg px-6 py-2 shadow-lg shadow-orange-500/20"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Export"
        visible={exportModalVisible}
        className="p-2 bg-white w-[92vw] max-w-[520px] rounded-xl"
        onHide={() => {
          if (!exportModalVisible) return;
          setExportModalVisible(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="flex items-start gap-2 text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-3">
          <i className="pi pi-exclamation-triangle text-yellow-700 mt-0.5" />
          <span>
            Note: Only the rows with revealed email or phone number will be
            included in your export.
          </span>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <img
                src={hubspotLogo}
                className="w-10 h-10 bg-white rounded"
                alt=""
              />
              <div>
                <div className="font-semibold text-gray-900">HubSpot</div>
                <div className="text-xs text-gray-500">
                  {hubspotConnected === null
                    ? "Checking..."
                    : hubspotConnected
                    ? "Connected"
                    : "Not connected"}
                </div>
              </div>
            </div>
            <button
              disabled={checkingConnections || exportingTarget === "hubspot"}
              onClick={() => {
                if (hubspotConnected) exportCurrentList("hubspot");
                else openConnectDialog("hubspot");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                hubspotConnected
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {exportingTarget === "hubspot" ? (
                <span className="inline-flex items-center gap-2">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  Exporting
                </span>
              ) : hubspotConnected ? (
                "Export"
              ) : (
                "Not connected"
              )}
            </button>
          </div>
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <img
                src={brevoLogo}
                className="w-10 h-10 bg-white rounded"
                alt=""
              />
              <div>
                <div className="font-semibold text-gray-900">Brevo</div>
                <div className="text-xs text-gray-500">
                  {brevoConnected === null
                    ? "Checking..."
                    : brevoConnected
                    ? "Connected"
                    : "Not connected"}
                </div>
              </div>
            </div>
            <button
              disabled={checkingConnections || exportingTarget === "brevo"}
              onClick={() => {
                if (brevoConnected) exportCurrentList("brevo");
                else openConnectDialog("brevo");
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                brevoConnected
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {exportingTarget === "brevo" ? (
                <span className="inline-flex items-center gap-2">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  Exporting
                </span>
              ) : brevoConnected ? (
                "Export"
              ) : (
                "Not connected"
              )}
            </button>
          </div>
        </div>
      </Dialog>

      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xl font-semibold text-gray-900 truncate">
              {listNamePretty || "List"}
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {loadingTotal ? (
                <span className="inline-flex items-center gap-2">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  Loading contacts...
                </span>
              ) : (
                <>
                  Total Contacts:{" "}
                  <span className="font-semibold">{totalRows}</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate(`/collaboration/${user?._id}/list`)}
            className="text-sm font-medium text-gray-600 hover:text-orange-600 shrink-0"
          >
            Back to Lists
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={phoneDisabled}
              title={phoneDisabledReason || ""}
              onClick={() => {
                if (counts.useSelected) bulkReveal("phone");
                else revealAll("phone");
              }}
              className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-semibold flex items-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="inline-flex items-center gap-2">
                  {phoneBusy ? <i className="pi pi-spin pi-spinner text-xs" /> : null}
                  <span>Show {counts.useSelected ? "selected" : "all"} phone</span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-orange-600 font-semibold text-xs">
                  <i className="pi pi-wallet" />
                  <span>
                    {estimateLoading && !counts.useSelected ? "..." : phoneCostToShow} credits
                  </span>
                </span>
              </span>
            </button>
            <button
              disabled={emailDisabled}
              title={emailDisabledReason || ""}
              onClick={() => {
                if (counts.useSelected) bulkReveal("email");
                else revealAll("email");
              }}
              className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-semibold flex items-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="inline-flex items-center gap-2">
                  {emailBusy ? <i className="pi pi-spin pi-spinner text-xs" /> : null}
                  <span>Show {counts.useSelected ? "selected" : "all"} email</span>
                </span>
                <span className="mt-1 inline-flex items-center gap-1 text-orange-600 font-semibold text-xs">
                  <i className="pi pi-wallet" />
                  <span>
                    {estimateLoading && !counts.useSelected ? "..." : emailCostToShow} credits
                  </span>
                </span>
              </span>
            </button>
          </div>
          <button
            onClick={openExportModal}
            className="w-fit flex items-center justify-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-orange-500/20 transition-all"
          >
            Export
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4 lg:p-6">
        <style>{`
          .lc-table .p-checkbox .p-checkbox-box {
            border: 1.5px solid #9ca3af !important;
            border-radius: 6px !important;
            background: #fff !important;
          }
          .lc-table .p-checkbox .p-checkbox-box.p-highlight,
          .lc-table .p-checkbox.p-highlight .p-checkbox-box {
            background: #F35114 !important;
            border-color: #F35114 !important;
          }
          .lc-table .p-checkbox .p-checkbox-box.p-highlight .p-checkbox-icon,
          .lc-table .p-checkbox .p-checkbox-box.p-highlight .p-icon,
          .lc-table .p-checkbox.p-highlight .p-checkbox-icon,
          .lc-table .p-checkbox.p-highlight .p-icon {
            color: #fff !important;
          }
        `}</style>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="w-full overflow-x-auto overflow-y-hidden lc-table">
            {loading ? (
              <DataTable
                key="dt-loading"
                value={loadingRows}
                tableStyle={{ minWidth: "100%" }}
                dataKey="row_id"
                scrollable
                scrollHeight={TABLE_SCROLL_HEIGHT}
                className="text-sm"
                rows={PAGE_SIZE}
                selectionMode="checkbox"
                selection={selectedProfile}
                onSelectionChange={(e: any) => setSelectedProfile(e.value)}
              >
                <Column
                  selectionMode="multiple"
                  headerClassName={headerCellClass}
                  className={bodyCellClass}
                  headerStyle={{ width: "3.25rem" }}
                />
                {columns.map((col) => (
                  <Column
                    key={col.field}
                    field={col.field === "LinkedIn" ? "" : col.field}
                    header={col.header}
                    headerClassName={headerCellClass}
                    className={bodyCellClass}
                    body={() => skeletonLoad()}
                  />
                ))}
              </DataTable>
            ) : (
              <DataTable
                key="dt-data"
                value={entries}
                tableStyle={{ minWidth: "100%" }}
                dataKey="row_id"
                emptyMessage={emptyMessageTemplate}
                scrollable
                scrollHeight={TABLE_SCROLL_HEIGHT}
                className="text-sm"
                rows={PAGE_SIZE}
                selectionMode="checkbox"
                selection={selectedProfile}
                onSelectionChange={(e: any) => setSelectedProfile(e.value)}
              >
                <Column
                  selectionMode="multiple"
                  headerClassName={headerCellClass}
                  className={bodyCellClass}
                  headerStyle={{ width: "3.25rem" }}
                />
                {columns.map((col) => (
                  <Column
                    key={col.field}
                    field={col.field === "LinkedIn" ? "" : col.field}
                    header={col.header}
                    headerClassName={headerCellClass}
                    className={bodyCellClass}
                    body={
                      col.field === "Name"
                        ? showName
                        : col.field === "Designation"
                        ? showDesignation
                        : col.field === "Phone"
                        ? showPhone
                        : col.field === "Email"
                        ? showEmail
                        : col.field === "LinkedIn"
                        ? showLinkedIn
                        : col.field === "Organization"
                        ? showOrganization
                        : col.field === "Org Industry"
                        ? showOrgIndustry
                        : col.field === "Org Size"
                        ? showOrgSize
                        : col.field === "City"
                        ? showCity
                        : col.field === "State"
                        ? showState
                        : col.field === "Country"
                        ? showCountry
                        : undefined
                    }
                  />
                ))}
              </DataTable>
            )}
          </div>
        </div>
        <div className="px-2 sm:px-6 py-3 flex items-center m-auto">
          <div className="text-xs w-full m-auto flex items-center justify-center gap-5">
            <div className="text-gray-500">Rows {PAGE_SIZE}</div>
            <i
              className={`pi pi-angle-left text-2xl p-3 ${
                canGoPrev
                  ? "text-gray-500 cursor-pointer hover:text-orange-600"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={() => handleChangePageNumber2("decrease")}
            ></i>
            <input
              type="number"
              value={pageNumber}
              min={1}
              max={totalPages}
              disabled
              className="w-fit text-center border border-gray-300 rounded px-3 py-1 bg-white"
              onChange={(e) => handleChangePageNumber(e)}
            />
            <div className="text-gray-400">/ {totalPages}</div>
            <i
              className={`pi pi-angle-right text-2xl p-3 ${
                canGoNext
                  ? "text-gray-500 cursor-pointer hover:text-orange-600"
                  : "text-gray-300 cursor-not-allowed"
              }`}
              onClick={() => handleChangePageNumber2("increase")}
            ></i>
          </div>
        </div>
      </div>
    </div>
  );
}