import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { toast } from "react-toastify";

import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";

import {
  exportList,
  getLinkedInUrl,
  getSingleListDetail,
  getAllList,
  getListRevealEstimate,
} from "../../utils/api/data";
import { getCreditBalance } from "../../utils/api/creditApi";
import { showPhoneAndEmail } from "../../utils/api/getPhoneAndEmail";
import { creditState, userState } from "../../utils/atom/authAtom";
import TextToCapitalize from "../../component/TextToCapital";

import hubspotLogo from "../../assets/integrations/hubspot/HubSpot.png";
import brevoLogo from "../../assets/integrations/Brevo.png";
import noDataImg from "../../assets/icons/nodataImage.jpg";

import {
  checkHubspotConnection,
  exportToHubspotApi,
} from "../../utils/api/crmIntegrations";
import {
  checkBrevoConnection,
  exportToBrevoApi,
} from "../../utils/api/brevoIntegrations";

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
  userId: string | undefined;
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

const PAGE_SIZE = 50;
const TABLE_SCROLL_HEIGHT = "clamp(320px, 68vh, 620px)";

export default function ListDetailPage() {
  const params = useParams();
  const navigate = useNavigate();

  const user = useRecoilValue(userState);
  const setCreditInfo = useSetRecoilState(creditState);
  const creditInfoValue = useRecoilValue(creditState);

  const listName = params?.listName;

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

  const [revealProgress, setRevealProgress] = useState({
    visible: false,
    current: 0,
    total: 0,
    type: "",
  });

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

  // 1. CALCULATE EXACT SCREEN COUNTS FIRST
  const counts = useMemo(() => {
    const allUnrevealedPhone = entries.filter((e) => !hasValue(e.Phone) && !isNil(e.Phone)).length;
    const allUnrevealedEmail = entries.filter((e) => !hasValue(e.Email) && !isNil(e.Email)).length;
    const selUnrevealedPhone = selectedProfile.filter((e) => !hasValue(e.Phone) && !isNil(e.Phone)).length;
    const selUnrevealedEmail = selectedProfile.filter((e) => !hasValue(e.Email) && !isNil(e.Email)).length;
    const useSelected = selectedProfile.length > 0;

    return {
      useSelected,
      allUnrevealedPhone,
      allUnrevealedEmail,
      selUnrevealedPhone,
      selUnrevealedEmail,
      phoneCost: (useSelected ? selUnrevealedPhone : allUnrevealedPhone) * PHONE_REVEAL_CREDITS,
      emailCost: (useSelected ? selUnrevealedEmail : allUnrevealedEmail) * EMAIL_REVEAL_CREDITS,
    };
  }, [entries, selectedProfile]);

  // 2. FRONTEND SAFETY OVERRIDE (Fixes the 0 Credits bug)
  const safePhoneCount = Math.max(listEstimate.phoneCount, counts.allUnrevealedPhone);
  const safeEmailCount = Math.max(listEstimate.emailCount, counts.allUnrevealedEmail);
  const safePhoneCredits = Math.max(listEstimate.phoneCredits, counts.allUnrevealedPhone * PHONE_REVEAL_CREDITS);
  const safeEmailCredits = Math.max(listEstimate.emailCredits, counts.allUnrevealedEmail * EMAIL_REVEAL_CREDITS);

  // 3. UPGRADED EXPORT STATS CALCULATOR (4-Column Ready)
  const exportStats = useMemo(() => {
    const totalSelected = selectedProfile.length;
    const selPhones = selectedProfile.filter((p) => hasValue(p.Phone)).length;
    const selEmails = selectedProfile.filter((p) => hasValue(p.Email)).length;

    return {
      all: {
        total: totalRows,
        revealedPhones: Math.max(0, totalRows - safePhoneCount),
        revealedEmails: Math.max(0, totalRows - safeEmailCount),
        unrevealedPhones: safePhoneCount,
        unrevealedEmails: safeEmailCount,
      },
      selected: {
        total: totalSelected,
        revealedPhones: selPhones,
        revealedEmails: selEmails,
        unrevealedPhones: totalSelected - selPhones,
        unrevealedEmails: totalSelected - selEmails,
      },
      isSelectionActive: totalSelected > 0
    };
  }, [selectedProfile, totalRows, safePhoneCount, safeEmailCount]);

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

  const userCredits = useMemo(
    () => Number(creditInfoValue?.credits || 0),
    [creditInfoValue?.credits]
  );

  const parseEstimate = (raw: any) => {
    const d = raw?.data ?? raw ?? {};
    const phoneCredits = Number(
      d?.phoneCredits ?? d?.phoneCost ?? d?.creditsPhone ?? d?.phone?.credits ?? d?.phone?.cost ?? d?.estimate?.phoneCredits ?? d?.estimate?.phoneCost ?? 0
    );
    const emailCredits = Number(
      d?.emailCredits ?? d?.emailCost ?? d?.creditsEmail ?? d?.email?.credits ?? d?.email?.cost ?? d?.estimate?.emailCredits ?? d?.estimate?.emailCost ?? 0
    );
    const phoneCount = Number(
      d?.phoneCount ?? d?.unrevealedPhone ?? d?.phoneUnrevealed ?? d?.phone?.count ?? d?.estimate?.phoneCount ?? 0
    );
    const emailCount = Number(
      d?.emailCount ?? d?.unrevealedEmail ?? d?.emailUnrevealed ?? d?.email?.count ?? d?.estimate?.emailCount ?? 0
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

  const fetchCredits = useCallback(async () => {
    try {
      const res: any = await getCreditBalance();
      setCreditInfo({
        id: user?.id ?? "",
        credits: res?.data?.credits ?? 0,
        subscriptionType: res?.data?.subscriptionType ?? "FREE",
      });
    } catch (e) {}
  }, [setCreditInfo, user?.id]);

  const fetchTotalRows = useCallback(async () => {
    if (!user?.id) return;

    setLoadingTotal(true);
    try {
      const payload = { userId: user?.id };
      const res: any = await getAllList(payload);

      const lists: any[] = res?.data || [];
      const match = lists.find((l) => l?.name === listName);

      const t = Number(match?.total || 0);
      setTotalRows(Number.isFinite(t) ? t : 0);
    } catch (e) {
      setTotalRows(0);
    } finally {
      setLoadingTotal(false);
    }
  }, [user?.id, listName]);

  const fetchRevealEstimate = useCallback(async () => {
    if (!listName) return;
    setEstimateLoading(true);
    try {
      // Handled primarily on the frontend now to avoid 404s, but left intact if V1 estimate route is ever restored.
      const res: any = await getListRevealEstimate();
      setListEstimate(parseEstimate(res));
    } catch (e) {
      setListEstimate({ phoneCredits: 0, emailCredits: 0, phoneCount: 0, emailCount: 0 });
    } finally {
      setEstimateLoading(false);
    }
  }, [listName, user?.id]);

  const listDetail = useCallback(
    async (pageNum: number) => {
      setLoading(true);

      const payload: ListDetailPayload = {
        userId: user?.id,
        page: pageNum,
        listName: listName,
      };

      try {
        const res: any = await getSingleListDetail(payload);
        const data: Person[] =
          res?.data?.sort((a: Person, b: Person) =>
            (a?.Name || "").localeCompare(b?.Name || "")
          ) || [];
        setEntries(data);
        // REMOVED: setSelectedProfile([]) to persist selections across pages
      } catch (e) {
        setEntries([]);
      } finally {
        setLoading(false);
      }
    },
    [user?.id, listName]
  );

  const openLinkedInPopup = async (id: any) => {
    setLoadRow({ type: "linkedIn", row_id: id });
    try {
      const res: any = await getLinkedInUrl({ row_id: id });
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
      const res: any = await showPhoneAndEmail(type, [id], user);

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
        id: user?.id ?? "",
        credits: res?.data?.remainingCredits || 0,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
      });

      fetchRevealEstimate();
    } catch (e) {
    } finally {
      setLoadRow({});
    }
  };

  // --- REPLACES THE BROKEN REVEAL ALL ROUTE WITH FRONTEND CHUNKING ---
  const bulkReveal = async (type: "phone" | "email") => {
    const useSelected = counts.useSelected;
    const source = useSelected ? selectedProfile : entries;

    const idsToReveal = source
      .filter((p: Person) => {
        const v = type === "phone" ? p.Phone : p.Email;
        return !isNil(v) && !hasValue(v);
      })
      .map((p: Person) => p.row_id)
      .filter(Boolean);

    if (!idsToReveal.length) {
      toast.info(`No unrevealed ${type}s found.`);
      return;
    }

    setRevealProgress({ visible: true, current: 0, total: idsToReveal.length, type });

    const CHUNK_SIZE = 25;
    let updatedEntries = [...entries];
    let updatedSelected = [...selectedProfile];
    let finalCredits = creditInfoValue?.credits;
    let successCount = 0;

    for (let i = 0; i < idsToReveal.length; i += CHUNK_SIZE) {
      const chunkIds = idsToReveal.slice(i, i + CHUNK_SIZE);

      try {
        const res: any = await showPhoneAndEmail(type, chunkIds, user);

        if (res?.data?.error) {
          setInsufficientVisible(true);
          break;
        }

        const resMap = new Map((res?.data?.results || []).map((r: any) => [r.row_id, r]));

        updatedEntries = updatedEntries.map((entry: any) => {
          const match: any = resMap.get(entry.row_id);
          return match ? { ...entry, ...match } : entry;
        });

        updatedSelected = updatedSelected.map((entry: any) => {
          const match: any = resMap.get(entry.row_id);
          return match ? { ...entry, ...match } : entry;
        });

        finalCredits = res?.data?.remainingCredits;
        successCount += resMap.size;

        setEntries(updatedEntries);
        setSelectedProfile(updatedSelected);
        setRevealProgress((prev) => ({
          ...prev,
          current: Math.min(prev.total, i + CHUNK_SIZE),
        }));
      } catch (e) {
        toast.error("An error occurred during bulk reveal. Process paused.");
        break;
      }
    }

    if (finalCredits !== undefined) {
      setCreditInfo({
        id: user?.id ?? "",
        credits: finalCredits,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
      });
    }

    fetchRevealEstimate();
    setTimeout(() => {
      setRevealProgress({ visible: false, current: 0, total: 0, type: "" });
      if (successCount > 0) {
        toast.success(`Successfully revealed ${successCount} ${type}(s)!`);
      }
    }, 600);
  };

  const refreshConnections = async () => {
    setCheckingConnections(true);
    setHubspotConnected(null);
    setBrevoConnected(null);

    const [hs, br] = await Promise.allSettled([
      checkHubspotConnection(),
      checkBrevoConnection(false),
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

    const payload: any = { listName: listName };

    // Support exporting only selected IDs
    if (selectedProfile.length > 0) {
      payload.rowIds = selectedProfile.map(p => p.row_id);
    }

    try {
      if (target === "hubspot") {
        const res: any = await exportToHubspotApi(payload);
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
        const res: any = await exportToBrevoApi(payload);
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
        payload.email = user?.email;
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

  const skeletonLoad = () => (
    <Skeleton height="1.2rem" className="bg-gray-200 rounded-md" />
  );

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
    <div className="text-sm text-gray-600">
      {TextToCapitalize(rowData?.Designation || "")}
    </div>
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
          className={`pi ${
            loadingThis ? "pi-spin pi-spinner" : "pi-linkedin"
          } text-blue-600`}
        />
      </button>
    );
  };

  const showOrganization = (rowData: any) => (
    <div className="text-sm text-gray-600">
      {TextToCapitalize(rowData?.Organization || "")}
    </div>
  );

  const showOrgIndustry = (rowData: any) => {
    const v =
      rowData?.["Org Industry"] ?? rowData?.["Organization Industry"] ?? "";
    return <div className="text-sm text-gray-600">{TextToCapitalize(v)}</div>;
  };

  const showOrgSize = (rowData: any) => {
    const v = rowData?.["Org Size"] ?? rowData?.["Organization Size"] ?? "";
    return <div className="text-sm text-gray-600">{TextToCapitalize(v)}</div>;
  };

  const showCity = (rowData: any) => (
    <div className="text-sm text-gray-600">
      {TextToCapitalize(rowData?.City || "")}
    </div>
  );
  const showState = (rowData: any) => (
    <div className="text-sm text-gray-600">
      {TextToCapitalize(rowData?.State || "")}
    </div>
  );
  const showCountry = (rowData: any) => (
    <div className="text-sm text-gray-600">
      {TextToCapitalize(rowData?.Country || "")}
    </div>
  );

  const goToPage = useCallback(
    (next: number) => {
      const clamped = Math.min(Math.max(1, next), totalPages);
      setPageNumber(clamped);
      listDetail(clamped);
    },
    [listDetail, totalPages]
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

  const phoneCostToShow = counts.useSelected ? counts.phoneCost : safePhoneCredits;
  const emailCostToShow = counts.useSelected ? counts.emailCost : safeEmailCredits;

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
    if (!user?.id || !listName) return;
    fetchCredits();
    fetchTotalRows();
    fetchRevealEstimate();
    listDetail(1);
    setPageNumber(1);
  }, [fetchCredits, fetchRevealEstimate, fetchTotalRows, listDetail, listName, user?.id]);

  useEffect(() => {
    if (!listName) return;
    if (pageNumber > totalPages) {
      setPageNumber(totalPages);
      listDetail(totalPages);
    }
  }, [listDetail, listName, pageNumber, totalPages]);

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-gray-50">
      
      {/* 1. REVEALING PROGRESS DIALOG */}
      <Dialog
        header="Revealing Contacts"
        visible={revealProgress.visible}
        className="p-2 bg-white w-[90vw] max-w-[420px] rounded-xl"
        closable={false}
        draggable={false}
        resizable={false}
        onHide={() => {}}
      >
        <div className="flex flex-col items-center justify-center p-4">
          <i className="pi pi-spin pi-spinner text-4xl text-orange-500 mb-4"></i>
          <div className="text-lg font-semibold text-gray-900 mb-1">
            Revealing {revealProgress.type === "phone" ? "Phone Numbers" : "Emails"}...
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 mt-4 mb-2 overflow-hidden">
            <div
              className="bg-orange-500 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${revealProgress.total > 0 ? Math.round((revealProgress.current / revealProgress.total) * 100) : 0}%` }}
            ></div>
          </div>
          <div className="w-full flex justify-between text-xs font-semibold text-gray-600">
            <span>{revealProgress.current} / {revealProgress.total}</span>
            <span>{revealProgress.total > 0 ? Math.round((revealProgress.current / revealProgress.total) * 100) : 0}%</span>
          </div>
        </div>
      </Dialog>

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
                  navigate("/integrations");
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
              <span className="text-sm">
                You have insufficient credits to view this profile(s).
              </span>
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

      {/* 2. UPGRADED EXPORT MODAL */}
      <Dialog
        header="Export Options"
        visible={exportModalVisible}
        className="p-2 bg-white w-[95vw] max-w-[700px] rounded-xl shadow-2xl"
        onHide={() => {
          if (!exportModalVisible) return;
          setExportModalVisible(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className="mb-6 grid grid-cols-4 gap-3 text-center">
          
          {/* TOTAL CARD */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col items-center justify-center">
            <div className="text-3xl font-black text-gray-900">{exportStats.all.total}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Entire List</div>
          </div>

          {/* SELECTED CARD */}
          <div className={`rounded-xl p-4 border flex flex-col items-center justify-center transition-all ${exportStats.isSelectionActive ? "bg-orange-50 border-orange-200 shadow-sm" : "bg-gray-50 border-gray-100 opacity-40"}`}>
            <div className={`text-3xl font-black ${exportStats.isSelectionActive ? "text-orange-600" : "text-gray-300"}`}>{exportStats.selected.total}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Selected</div>
          </div>

          {/* PHONE CARD */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <i className="pi pi-phone text-orange-600 text-sm" />
              <span className="text-2xl font-black text-gray-900">{exportStats.isSelectionActive ? exportStats.selected.revealedPhones : exportStats.all.revealedPhones}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2">
              Revealed Phones
            </div>
            
            <button
              disabled={exportStats.isSelectionActive ? exportStats.selected.unrevealedPhones === 0 : counts.allUnrevealedPhone === 0}
              onClick={() => bulkReveal("phone")}
              className="w-full py-1.5 rounded text-[10px] font-bold transition-all bg-[#F35114] hover:bg-orange-600 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Reveal on Page
            </button>
          </div>

          {/* EMAIL CARD */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1.5">
              <i className="pi pi-envelope text-blue-600 text-sm" />
              <span className="text-2xl font-black text-gray-900">{exportStats.isSelectionActive ? exportStats.selected.revealedEmails : exportStats.all.revealedEmails}</span>
            </div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-2">
              Revealed Emails
            </div>

            <button
              disabled={exportStats.isSelectionActive ? exportStats.selected.unrevealedEmails === 0 : counts.allUnrevealedEmail === 0}
              onClick={() => bulkReveal("email")}
              className="w-full py-1.5 rounded text-[10px] font-bold transition-all bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Reveal on Page
            </button>
          </div>
        </div>

        <div className="flex items-start gap-3 text-sm text-gray-700 bg-orange-50 border border-orange-200 rounded-lg p-4">
          <i className="pi pi-info-circle text-orange-600 mt-0.5 text-lg" />
          <div className="leading-relaxed">
            Only the <b>{Math.max(exportStats.isSelectionActive ? exportStats.selected.revealedPhones : exportStats.all.revealedPhones, exportStats.isSelectionActive ? exportStats.selected.revealedEmails : exportStats.all.revealedEmails)}</b> contacts with revealed emails or phone numbers will be included in your export.
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-4">
              <img src={hubspotLogo} className="w-10 h-10 bg-white rounded border border-gray-100 p-1" alt="HubSpot" />
              <div>
                <div className="font-bold text-gray-900 text-base">HubSpot</div>
                <div className="text-xs font-medium text-gray-500">
                  {hubspotConnected === null ? "Checking connection..." : hubspotConnected ? "Connected" : "Not connected"}
                </div>
              </div>
            </div>
            <button
              disabled={checkingConnections || exportingTarget === "hubspot" || (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))}
              onClick={() => {
                if (hubspotConnected) exportCurrentList("hubspot");
                else openConnectDialog("hubspot");
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : hubspotConnected
                  ? "bg-[#F35114] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {exportingTarget === "hubspot" ? (
                <span className="inline-flex items-center gap-2"><i className="pi pi-spin pi-spinner text-xs" /> Exporting</span>
              ) : hubspotConnected ? ("Export") : ("Connect")}
            </button>
          </div>

          <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-4">
              <img src={brevoLogo} className="w-10 h-10 bg-white rounded border border-gray-100 p-1" alt="Brevo" />
              <div>
                <div className="font-bold text-gray-900 text-base">Brevo</div>
                <div className="text-xs font-medium text-gray-500">
                  {brevoConnected === null ? "Checking connection..." : brevoConnected ? "Connected" : "Not connected"}
                </div>
              </div>
            </div>
            <button
              disabled={checkingConnections || exportingTarget === "brevo" || (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))}
              onClick={() => {
                if (brevoConnected) exportCurrentList("brevo");
                else openConnectDialog("brevo");
              }}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : brevoConnected
                  ? "bg-[#F35114] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {exportingTarget === "brevo" ? (
                <span className="inline-flex items-center gap-2"><i className="pi pi-spin pi-spinner text-xs" /> Exporting</span>
              ) : brevoConnected ? ("Export") : ("Connect")}
            </button>
          </div>

          <div className="flex items-center justify-between border border-gray-200 rounded-xl p-4 hover:border-gray-300 transition-colors">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600 font-bold text-xl">
                @
              </div>
              <div>
                <div className="font-bold text-gray-900 text-base">Email</div>
                <div className="text-xs font-medium text-gray-500">
                  Sends export to {user?.email || "your email"}
                </div>
              </div>
            </div>
            <button
              disabled={exportingTarget === "email" || (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))}
              onClick={() => exportCurrentList("email")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                (exportStats.isSelectionActive ? (exportStats.selected.revealedPhones === 0 && exportStats.selected.revealedEmails === 0) : (exportStats.all.revealedPhones === 0 && exportStats.all.revealedEmails === 0))
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-[#F35114] hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20"
              }`}
            >
              {exportingTarget === "email" ? (
                <span className="inline-flex items-center gap-2">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  Exporting
                </span>
              ) : (
                "Export"
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

          <div className="flex items-center gap-4">
            {selectedProfile.length > 0 && (
              <button onClick={() => setSelectedProfile([])} className="text-xs font-bold text-orange-600 hover:underline">
                Clear Selection ({selectedProfile.length})
              </button>
            )}
            <button
              onClick={() => navigate("/list")}
              className="text-sm font-medium text-gray-600 hover:text-orange-600 shrink-0"
            >
              Back to Lists
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              disabled={phoneDisabled}
              title={phoneDisabledReason || ""}
              onClick={() => bulkReveal("phone")}
              className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-semibold flex items-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="inline-flex items-center gap-2">
                  {phoneBusy ? <i className="pi pi-spin pi-spinner text-xs" /> : null}
                  <span>Show {counts.useSelected ? "selected" : "page"} phone</span>
                </span>

                <span className="mt-1 inline-flex items-center gap-1 text-orange-600 font-semibold text-xs">
                  <i className="pi pi-wallet" />
                  <span>
                    {phoneCostToShow} credits
                  </span>
                </span>
              </span>
            </button>

            <button
              disabled={emailDisabled}
              title={emailDisabledReason || ""}
              onClick={() => bulkReveal("email")}
              className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-semibold flex items-center hover:bg-orange-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex flex-col items-start leading-tight">
                <span className="inline-flex items-center gap-2">
                  {emailBusy ? <i className="pi pi-spin pi-spinner text-xs" /> : null}
                  <span>Show {counts.useSelected ? "selected" : "page"} email</span>
                </span>

                <span className="mt-1 inline-flex items-center gap-1 text-orange-600 font-semibold text-xs">
                  <i className="pi pi-wallet" />
                  <span>
                    {emailCostToShow} credits
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