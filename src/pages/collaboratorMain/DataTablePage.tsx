import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { FilterMatchMode } from "primereact/api";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import { MultiSelect } from "primereact/multiselect";
import { debounce } from "lodash";
import { useNavigate } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { toast } from "react-toastify";
import {
  Building2,
  Briefcase,
  Filter as FilterIcon,
  Globe,
  Layers,
  MapPin,
  Search,
  List,
  Users,
} from "lucide-react";

import { searchOption, searchOptionDesignation } from "../../utils/api/data";
import { getCollabCreditBalance } from "../../utils/api/collaborationAPI";
import {
  collaboration_getAllData_api,
  collaboration_getLinkedInUrl_api,
  collaboration_showPhoneAndEmail_api,
} from "../../utils/api/collaborationData";

import { collabCreditState, collabProjectState } from "../../utils/atom/collabAuthAtom";
import CollaboratorAddToListComponent from "../../component/collaborator/CollaboratorAddToListComponent";
import TextToCapitalize from "../../component/TextToCapital";
import noDataImg from "../../assets/icons/nodataImage.jpg";

import { countries_data } from "../../utils/data/countries";
import { cities_data } from "../../utils/data/city";
import { state_data } from "../../utils/data/states";
import { designation_groups_data } from "../../utils/data/designation_groups";
import { org_industry } from "../../utils/data/org_industry";
import { org_size } from "../../utils/data/org_size";

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
  ["Organization Industry"]?: string;
  ["Organization Size"]?: string;
  ["Org Industry"]?: string;
  ["Org Size"]?: string;
}

interface LoadDataOptions {
  filter?: any;
}

type Mode = "selected" | "bulk";
type BulkConfig = {
  filters: any;
  take: number;
  startRowId: number;
};

const dedupe = (arr: string[]) => Array.from(new Set(arr));

export default function Collab_DataTablePage() {
  const PAGE_SIZE = 25;

  const setCreditInfo = useSetRecoilState(collabCreditState);
  const creditInfoValue = useRecoilValue(collabCreditState);
  const user = useRecoilValue(collabProjectState);
  const navigate = useNavigate();

  const subscriptionType = creditInfoValue?.subscriptionType || "FREE";
  const isFree = subscriptionType === "FREE";

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<any[]>([]);
  const [rowClick, setRowClick] = useState(false);

  const [filters, setFilters] = useState({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const [globalFilterValue, setGlobalFilterValue] = useState("");

  const [totalDataCount, setTotalDataCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [addMode, setAddMode] = useState<Mode>("selected");
  const [bulkConfigVisible, setBulkConfigVisible] = useState(false);
  const [bulkRows, setBulkRows] = useState<number>(PAGE_SIZE);
  const [bulkPages, setBulkPages] = useState<number>(1);
  const [bulkStartRowId, setBulkStartRowId] = useState<number>(0);
  const [bulkConfig, setBulkConfig] = useState<BulkConfig | null>(null);
  const [addResultVisible, setAddResultVisible] = useState(false);
  const [addResult, setAddResult] = useState<any>(null);

  const [loadRow, setLoadRow] = useState<any>({});
  const [visible, setVisible] = useState<boolean>(false);

  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [draftFilters, setDraftFilters] = useState<any>({});
  const [isDirtyFilters, setIsDirtyFilters] = useState(false);

  const [selectedFilterValue, setSelectedFilterValue] = useState<any>({});
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingDataKey, setLoadingDataKey] = useState<string>("");

  const [selectAllDesignation, setSelectAllDesignation] = useState(false);

  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [organizationOptions, setOrganizationOptions] = useState<string[]>([]);
  const [orgSizeOptions, setOrgSizeOptions] = useState<string[]>([]);
  const [orgIndustryOptions, setOrgIndustryOptions] = useState<string[]>([]);

  const baseRef = useRef<any>({
    Country: [],
    State: [],
    City: [],
    Designation: [],
    Organization: [],
    orgSize: [],
    orgIndustry: [],
  });

  const columns = [
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
  ];

  const fields = columns.map((c) => c.field);

  const totalPages = useMemo(() => {
    const total = Math.ceil((totalDataCount || 0) / PAGE_SIZE);
    return Math.max(total, 1);
  }, [totalDataCount]);

  const showingRange = useMemo(() => {
    const start = Math.max(1, (pageNumber - 1) * PAGE_SIZE + 1);
    const end = Math.min(pageNumber * PAGE_SIZE, totalDataCount || 0);
    return { start, end };
  }, [pageNumber, totalDataCount]);

  const loadingRow = useMemo(() => {
    const base: any = { row_id: "" };
    for (const c of columns) base[c.field] = "";
    return base;
  }, []);

  const loadingRows = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      ...loadingRow,
      row_id: `__sk_${i}`,
    }));
  }, [loadingRow]);

  const buildFilterPayload = (raw: any) => {
    const payload = { ...(raw || {}) };
    const designationData = payload["Designation"]?.map((item: any) => {
      if (typeof item === "string" && item.includes(" - ")) return item.split(" - ", 2)[1];
      return item;
    });
    if (designationData) payload["Designation"] = designationData;
    payload.selectAll = selectedFilterValue["Designation"]?.length ? selectAllDesignation : false;
    if (selectAllDesignation) {
      payload.searchQuery = selectedFilterValue["Designation"] ?? "";
    }
    return payload;
  };

  const fetchIdRef = useRef(0);

  const loadData = useCallback(
    async (pageNo: number, { filter }: LoadDataOptions = {}) => {
      const fetchId = ++fetchIdRef.current;
      setLoading(true);
      try {
        const payload = {
          filters: buildFilterPayload(filter ?? selectedFilters),
          page: pageNo,
          userId: user?._id,
          limit: PAGE_SIZE,
        };
        const res = await collaboration_getAllData_api(payload);
        if (fetchId !== fetchIdRef.current) return;
        const data =
          res?.data?.cleaned?.sort((a: Person, b: Person) =>
            (a?.Name || "").localeCompare(b?.Name || "")
          ) || [];
        setTotalDataCount(res?.data?.count || 0);
        setEntries(data);
      } catch (err) {
        if (fetchId !== fetchIdRef.current) return;
        setEntries([]);
        setTotalDataCount(0);
      } finally {
        if (fetchId === fetchIdRef.current) setLoading(false);
      }
    },
    [selectedFilters, selectAllDesignation, selectedFilterValue, user?._id]
  );

  const selectedFiltersRef = useRef<any>(selectedFilters);
  const loadDataRef = useRef(loadData);

  useEffect(() => {
    selectedFiltersRef.current = selectedFilters;
  }, [selectedFilters]);

  useEffect(() => {
    loadDataRef.current = loadData;
  }, [loadData]);

  const debouncedGoToPage = useRef(
    debounce((num: number) => {
      loadDataRef.current(num, { filter: selectedFiltersRef.current });
    }, 600)
  ).current;

  useEffect(() => {
    return () => {
      debouncedGoToPage.cancel();
    };
  }, [debouncedGoToPage]);

  const updateDraft = (key: string, value: any) => {
    setDraftFilters((prev: any) => ({ ...prev, [key]: value }));
    setIsDirtyFilters(true);
    if (key !== "Designation" && selectAllDesignation) setSelectAllDesignation(false);
  };

  const runSearch = () => {
    debouncedGoToPage.cancel();
    const payload = buildFilterPayload(draftFilters);
    setSelectedFilters(payload);
    setIsDirtyFilters(false);
    setPageNumber(1);
    loadData(1, { filter: payload });
  };

  const clearAllFilters = () => {
    debouncedGoToPage.cancel();
    setDraftFilters({});
    setSelectedFilters({});
    setIsDirtyFilters(false);
    setSelectAllDesignation(false);
    setSelectedFilterValue((prev: any) => ({ ...prev, Designation: "" }));
    setCountryOptions(baseRef.current.Country);
    setStateOptions(baseRef.current.State);
    setCityOptions(baseRef.current.City);
    setDesignationOptions(baseRef.current.Designation);
    setOrganizationOptions(baseRef.current.Organization);
    setOrgSizeOptions(baseRef.current.orgSize);
    setOrgIndustryOptions(baseRef.current.orgIndustry);
    setPageNumber(1);
    loadData(1, { filter: {} });
  };

  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    const _filters: any = { ...filters };
    _filters["global"].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const handleChangePageNumber = (e: any) => {
    const raw = parseInt(e.target.value || "1", 10);
    const num = Math.min(Math.max(raw, 1), totalPages);
    setPageNumber(num);
    debouncedGoToPage(num);
  };

  const handleChangePageNumber2 = (dir: "increase" | "decrease") => {
    debouncedGoToPage.cancel();
    setPageNumber((prev) => {
      const next = dir === "increase" ? prev + 1 : prev - 1;
      const clamped = Math.min(Math.max(next, 1), totalPages);
      if (clamped !== prev) loadData(clamped, { filter: selectedFilters });
      return clamped;
    });
  };

  const getCredit = async () => {
    try {
      const res = await getCollabCreditBalance();
      setCreditInfo({
        id: user?._id ?? "",
        credits: res?.data?.credits,
        subscriptionType: res?.data?.subscriptionType,
      });
    } catch (e) {}
  };

  const handleShowPhoneOrEmail = async (type: string, id: any) => {
    setLoadRow({ type, row_id: id });
    try {
      const res: any = await collaboration_showPhoneAndEmail_api(type, [id], user);
      if (res?.data?.error) setVisible(true);
      const updated = entries.map((entry: any) =>
        entry.row_id === id ? { ...entry, ...(res?.data?.results?.[0] || {}) } : entry
      );
      setCreditInfo({
        id: user?._id ?? "",
        credits: res?.data?.remainingCredits || 0,
        subscriptionType: creditInfoValue?.subscriptionType || "FREE",
      });
      setEntries(updated);
    } catch (err) {
      setLoadRow({});
    } finally {
      setLoadRow({});
    }
  };

  const openLinkedInPopup = async (id: any) => {
    setLoadRow({ type: "linkedIn", row_id: id });
    try {
      const res: any = await collaboration_getLinkedInUrl_api({ row_id: id });
      if (res?.data?.linkedin_url) {
        window.open(`https://${res.data.linkedin_url}`, "popupWindow", "width=600,height=600");
      }
    } finally {
      setLoadRow({});
    }
  };

  const initials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("") || "U";
  };

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

  const showPhone = (rowData: any) => (
    <div>
      {!rowData?.Phone ? (
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
      ) : (
        <span className="text-sm text-gray-900">{rowData.Phone}</span>
      )}
    </div>
  );

  const showEmail = (rowData: any) => (
    <div>
      {!rowData?.Email ? (
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
      ) : (
        <span className="text-sm text-gray-900">{rowData.Email}</span>
      )}
    </div>
  );

  const showLinkedIn = (rowData: any) => {
    const loadingThis = loadRow?.type === "linkedIn" && loadRow.row_id === rowData.row_id;
    return (
      <button
        onClick={() => openLinkedInPopup(rowData.row_id)}
        className="inline-flex items-center justify-center w-9 h-9 bg-blue-50 hover:bg-blue-100 rounded-lg"
        title="Open LinkedIn"
      >
        <i className={`pi ${loadingThis ? "pi-spin pi-spinner" : "pi-linkedin"} text-blue-600`} />
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

  const skeletonLoad = () => <Skeleton height="1.2rem" className="bg-gray-200 rounded-md" />;

  const emptyMessageTemplate = () => (
    <div className="h-[60vh] w-full flex items-center justify-center">
      <img src={noDataImg} className="max-h-[60vh]" alt="" />
    </div>
  );

  const debouncedFetchOptions = useRef(
    debounce(async (field: string, query: string) => {
      try {
        const payload = {
          field: field === "Designation" ? "designation" : field,
          query,
        };
        if (query.length >= 3 && field !== "Designation") {
          const res: any = await searchOption(payload);
          const dataInfo = res?.data?.map((item: string) => TextToCapitalize(item));
          if (!dataInfo) return;
          if (field === "Country") {
            const unique = dedupe([...(baseRef.current.Country || []), ...dataInfo]);
            baseRef.current.Country = unique;
            setCountryOptions(unique);
          } else if (field === "State") {
            const unique = dedupe([...(baseRef.current.State || []), ...dataInfo]);
            baseRef.current.State = unique;
            setStateOptions(unique);
          } else if (field === "City") {
            const unique = dedupe([...(baseRef.current.City || []), ...dataInfo]);
            baseRef.current.City = unique;
            setCityOptions(unique);
          } else if (field === "Organization") {
            const unique = dedupe([...(baseRef.current.Organization || []), ...dataInfo]);
            baseRef.current.Organization = unique;
            setOrganizationOptions(unique);
          } else if (field === "orgSize") {
            const unique = dedupe([...(baseRef.current.orgSize || []), ...dataInfo]);
            baseRef.current.orgSize = unique;
            setOrgSizeOptions(unique);
          } else if (field === "orgIndustry") {
            const unique = dedupe([...(baseRef.current.orgIndustry || []), ...dataInfo]);
            baseRef.current.orgIndustry = unique;
            setOrgIndustryOptions(unique);
          }
        } else if (query.length >= 3 && field === "Designation") {
          const res: any = await searchOptionDesignation(payload);
          const dataInfo: any = res?.data?.map((item: string) => TextToCapitalize(item)) || [];
          const unique = dedupe([...(baseRef.current.Designation || []), ...dataInfo]);
          baseRef.current.Designation = unique;
          setDesignationOptions(unique);
        }
      } catch (e) {
        toast.info("Try again..");
      } finally {
        setLoadingDataKey("");
        setLoadingOptions(false);
      }
    }, 2000)
  ).current;

  const handleFilterSearch = (field: string, query: string) => {
    const value = query || "";
    if (!value || value.length === 0) {
      if (field === "Country") setCountryOptions(baseRef.current.Country);
      else if (field === "State") setStateOptions(baseRef.current.State);
      else if (field === "City") setCityOptions(baseRef.current.City);
      else if (field === "Organization") setOrganizationOptions(baseRef.current.Organization);
      else if (field === "Designation") setDesignationOptions(baseRef.current.Designation);
      else if (field === "orgSize") setOrgSizeOptions(baseRef.current.orgSize);
      else if (field === "orgIndustry") setOrgIndustryOptions(baseRef.current.orgIndustry);
      setLoadingDataKey("");
      setLoadingOptions(false);
      return;
    }
    if (value.length >= 3) {
      setLoadingOptions(true);
      setLoadingDataKey(field);
      debouncedFetchOptions(field, value);
    }
  };

  const getFilterTemplate = (placeholder: string) => (options: any) => {
    const { filterOptions } = options;
    return (
      <div className="px-5 p-multiselect-filter-container">
        <div className="p-input-icon-right w-full flex items-center gap-2">
          <span className="p-input-icon-left flex-1">
            <input
              value={selectedFilterValue[placeholder] || ""}
              onChange={(e) => {
                filterOptions.filter(e);
                const value = e.target.value;
                setSelectedFilterValue((prev: any) => ({
                  ...prev,
                  [placeholder]: value,
                }));
                if (placeholder === "Designation" && !String(value || "").trim()) {
                  setSelectAllDesignation(false);
                }
                handleFilterSearch(placeholder, value);
              }}
              className="w-full m-auto focus:outline-none bg-white text-xs px-3 py-1 my-2 rounded-full"
              placeholder={
                placeholder === "Designation"
                  ? `Please enter "Job Title" or "Keyword"`
                  : `Search ${placeholder}...`
              }
            />
          </span>
        </div>
      </div>
    );
  };

  const handleSelectAllDesignation = () => {
    let searchQuery: any;
    if (selectedFilterValue["Designation"]) {
      searchQuery = selectedFilterValue["Designation"]?.toLowerCase();
    } else {
      setSelectedFilterValue((prev: any) => ({ ...prev, Designation: "" }));
      searchQuery = "";
    }
    const filterValues = (designationOptions || []).filter((opt: any) =>
      String(opt || "").toLowerCase().includes(searchQuery)
    );
    const current = draftFilters["Designation"] ?? [];
    if (selectAllDesignation) {
      updateDraft("Designation", []);
    } else {
      updateDraft("Designation", dedupe([...(current || []), ...(filterValues || [])]));
    }
    setSelectAllDesignation(!selectAllDesignation);
  };

  const dropdownItemClass =
    "text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2";

  const msLoading = (key: string) => loadingOptions && loadingDataKey === key;

  const designationSearchValue = String(selectedFilterValue?.Designation || "").trim();
  const showDesignationSelectAll = Boolean(designationSearchValue);
  const designationSelectedItemsLabel = selectAllDesignation ? "Designation (All)" : "Designation ({0})";

  const filterSummary = useMemo(() => {
    const f = selectedFilters || {};
    const pairs: { k: string; v: any[] }[] = [];
    const addArr = (k: string, arr: any[]) => {
      if (Array.isArray(arr) && arr.length) pairs.push({ k, v: arr });
    };
    const selectAll = Boolean(f.selectAll);
    const keyword = String(f.searchQuery || "").trim();
    addArr("Country", f.Country || []);
    addArr("State", f.State || []);
    addArr("City", f.City || []);
    addArr("Organization", f.Organization || []);
    if (selectAll) {
      pairs.push({
        k: "Designation",
        v: [keyword ? `Selected all (keyword: ${keyword})` : "Selected all"],
      });
    } else {
      addArr("Designation", f.Designation || []);
    }
    addArr("Org Size", f.orgSize || []);
    addArr("Org Industry", f.orgIndustry || []);
    if (keyword && !selectAll) pairs.push({ k: "Keyword", v: [keyword] });
    return pairs;
  }, [selectedFilters]);

  const openAddToList = () => {
    if (selectedProfile.length > 0) {
      setAddMode("selected");
      setBulkConfig(null);
      setModalVisible(true);
      return;
    }
    const ids = (entries || [])
      .map((e: any) => Number(e?.row_id))
      .filter((n: any) => Number.isFinite(n) && n > 0);
    const startId = ids.length ? Math.min(...ids) : 0;
    setBulkStartRowId(startId);
    const maxRows = 500;
    setBulkRows(Math.min(PAGE_SIZE, maxRows));
    setBulkPages(1);
    setBulkConfig(null);
    setBulkConfigVisible(true);
  };

  const maxRows = 500;
  const maxPages = Math.max(1, Math.floor(maxRows / PAGE_SIZE));

  const handleBulkRowsChange = (val: number) => {
    const n = Math.min(Math.max(Number(val) || 1, 1), maxRows);
    setBulkRows(n);
    setBulkPages(Math.min(maxPages, Math.max(1, Math.ceil(n / PAGE_SIZE))));
  };

  const handleBulkPagesChange = (val: number) => {
    const p = Math.min(Math.max(Number(val) || 1, 1), maxPages);
    setBulkPages(p);
    const rows = Math.min(p * PAGE_SIZE, maxRows);
    setBulkRows(rows);
  };

  const proceedBulk = () => {
    if (!bulkRows || bulkRows < 1) return;
    setBulkConfig({
      filters: selectedFilters,
      take: bulkRows,
      startRowId: bulkStartRowId,
    });
    setAddMode("bulk");
    setBulkConfigVisible(false);
    setModalVisible(true);
  };

  const bulkRowsExactPages = bulkRows > 0 && bulkRows % PAGE_SIZE === 0;

  const handleAddedToList = (result: any) => {
    setAddResult(result);
    setAddResultVisible(true);
    setSelectedProfile([]);
  };

  useEffect(() => {
    const initialCountries = (countries_data?.Country || []).map((x: string) => TextToCapitalize(x));
    const initialStates = (state_data?.State || []).map((x: string) => TextToCapitalize(x));
    const initialCities = (cities_data?.City || []).map((x: string) => TextToCapitalize(x));
    const initialDesignations =
      (designation_groups_data?.Designation_Groups || []).map((x: string) => TextToCapitalize(x)) ||
      [];
    const initialOrgIndustry =
      (org_industry?.org_industry || []).map((x: string) => TextToCapitalize(x)) || [];
    const initialOrgSize = (org_size?.org_size || []).map((x: string) => TextToCapitalize(x)) || [];
    baseRef.current.Country = initialCountries;
    baseRef.current.State = initialStates;
    baseRef.current.City = initialCities;
    baseRef.current.Designation = initialDesignations;
    baseRef.current.Organization = [];
    baseRef.current.orgIndustry = initialOrgIndustry;
    baseRef.current.orgSize = initialOrgSize;
    setCountryOptions(initialCountries);
    setStateOptions(initialStates);
    setCityOptions(initialCities);
    setDesignationOptions(initialDesignations);
    setOrganizationOptions([]);
    setOrgIndustryOptions(initialOrgIndustry);
    setOrgSizeOptions(initialOrgSize);
    getCredit();
    setDraftFilters({});
    setSelectedFilters({});
    setIsDirtyFilters(false);
    setSelectAllDesignation(false);
    setRowClick(false);
    loadData(1, { filter: {} });
    return () => {
      debouncedFetchOptions.cancel();
      debouncedGoToPage.cancel();
    };
  }, [user?._id]);

  const headerCellClass =
    "bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-700 uppercase tracking-wider px-6 py-4";
  const bodyCellClass = "px-6 py-4 text-sm text-gray-600 border-b border-gray-100";

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] bg-gray-50">
      <Dialog
        header="Insufficient Credit"
        visible={visible}
        className="p-2 bg-white w-fit max-w-[420px] lg:w-1/2 rounded-xl"
        onHide={() => {
          if (!visible) return;
          setVisible(false);
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
        header="Added to List"
        visible={addResultVisible}
        className="p-2 bg-white w-[92vw] max-w-[520px] rounded-xl"
        onHide={() => setAddResultVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className="p-2">
          <div className="text-sm text-gray-800">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">List</span>
              <span className="font-semibold">{addResult?.listName || "-"}</span>
            </div>
            {"matched" in (addResult || {}) && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Matched</span>
                <span className="font-semibold">{Number(addResult?.matched || 0).toLocaleString()}</span>
              </div>
            )}
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Inserted</span>
              <span className="font-semibold">{Number(addResult?.inserted || 0).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Skipped (duplicates)</span>
              <span className="font-semibold">{Number(addResult?.duplicates || 0).toLocaleString()}</span>
            </div>
            {"lastRowId" in (addResult || {}) && (
              <div className="flex items-center justify-between py-2">
                <span className="text-gray-500">Last row_id</span>
                <span className="font-semibold">{Number(addResult?.lastRowId || 0).toLocaleString()}</span>
              </div>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setAddResultVisible(false)}
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              Done
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        header="Add multiple pages to list"
        visible={bulkConfigVisible}
        className="p-2 bg-white w-[92vw] max-w-[640px] rounded-xl"
        onHide={() => setBulkConfigVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className="p-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Rows to add (max {maxRows})</div>
              <input
                type="number"
                value={bulkRows}
                min={1}
                max={maxRows}
                onChange={(e) => handleBulkRowsChange(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="text-xs text-gray-500 mt-2">
                {bulkRowsExactPages ? "=" : "≈"}{" "}
                <span className="font-semibold">{bulkPages}</span> page(s) (page size {PAGE_SIZE})
              </div>
            </div>
            <div className="border border-gray-200 rounded-xl p-3 bg-gray-50">
              <div className="text-xs text-gray-500 mb-1">Pages to add (max {maxPages})</div>
              <input
                type="number"
                value={bulkPages}
                min={1}
                max={maxPages}
                onChange={(e) => handleBulkPagesChange(Number(e.target.value))}
                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <div className="text-xs text-gray-500 mt-2">
                = <span className="font-semibold">{bulkPages * PAGE_SIZE}</span> rows
              </div>
            </div>
          </div>
          <div className="mt-3 border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">Starting from</div>
            <div className="text-sm text-gray-800">
              row_id: <span className="font-semibold">{bulkStartRowId || 0}</span>
            </div>
          </div>
          <div className="mt-3 border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-500 mb-2">Selected filters</div>
            {filterSummary.length ? (
              <div className="flex flex-col gap-2">
                {filterSummary.map((p) => {
                  const vals = (p.v || []).slice(0, 6);
                  const more = (p.v || []).length - vals.length;
                  return (
                    <div key={p.k} className="text-sm">
                      <span className="text-gray-600 font-semibold">{p.k}:</span>{" "}
                      <span className="text-gray-800">
                        {vals.map((x: any) => String(x)).join(", ")}
                        {more > 0 ? ` +${more} more` : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No filters applied</div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={() => setBulkConfigVisible(false)}
              className="px-5 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={proceedBulk}
              className="px-5 py-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              Proceed
            </button>
          </div>
        </div>
      </Dialog>

      <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 sm:py-0 sm:h-20 flex items-center shadow-sm">
        <div className="w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap min-w-0">
            <button
              onClick={openAddToList}
              className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-orange-500/30 transition-all"
            >
              <List className="w-4 h-4" />
              <span>
                {selectedProfile.length > 0
                  ? `Add to List (${selectedProfile.length})`
                  : "Add multiple pages to list"}
              </span>
            </button>
            <div className="relative w-full sm:w-[380px] min-w-0">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={globalFilterValue}
                onChange={onGlobalFilterChange}
                placeholder="Search leads by name, company, or role..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
            <div className="px-4 py-2 bg-orange-50 border border-orange-200 rounded-lg text-gray-700 text-xs sm:text-sm font-medium whitespace-nowrap">
              <span className="text-orange-600 font-semibold">
                {totalDataCount?.toLocaleString()}
              </span>{" "}
              people
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 shadow-sm">
        <style>{`
          .lc-pill.p-multiselect { border-radius: 10px; border: 1px solid #e5e7eb; background: #fff; height: 44px; }
          .lc-pill.p-multiselect:not(.p-disabled):hover { border-color: #d1d5db; }
          .lc-pill.p-multiselect.p-focus { box-shadow: 0 0 0 3px rgba(249,115,22,0.18); border-color: rgb(249,115,22); }
          .lc-pill .p-multiselect-label { padding: 0.6rem 0.85rem 0.6rem 2.45rem; color: #111827; font-weight: 500; }
          .lc-pill .p-multiselect-trigger { width: 2.6rem; }
          .lc-pill .p-placeholder { color: #6b7280; }
          .lc-panel .p-multiselect-header { padding: 10px 10px; border-bottom: 1px solid #f3f4f6; }
          .lc-panel .p-multiselect-items-wrapper { padding: 6px; }
          .lc-panel .p-multiselect-items { padding: 4px; }
          .lc-panel .p-multiselect-item { border-radius: 10px; }
          .lc-panel .p-multiselect-item:hover { background: #fff7ed; }
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
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-gray-700 text-sm font-medium whitespace-nowrap">
            <FilterIcon className="w-4 h-4 text-gray-600" />
            <span>Filters:</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto flex-1 pb-1">
            <div className="relative min-w-[140px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Globe className="w-4 h-4 text-gray-500" />
              </div>
              <MultiSelect
                value={draftFilters.Country || []}
                options={countryOptions}
                onChange={(e) => updateDraft("Country", e.value)}
                filter
                filterTemplate={getFilterTemplate("Country")}
                loading={msLoading("Country")}
                showSelectAll
                placeholder="Country"
                maxSelectedLabels={0}
                selectedItemsLabel="Country ({0})"
                className="lc-pill w-full"
                panelClassName="lc-panel rounded-xl"
                dropdownIcon="pi pi-chevron-down"
                itemClassName={dropdownItemClass}
                emptyMessage={loadingDataKey === "Country" ? "Data Loading..." : "Search for more..."}
              />
            </div>
            <div className="relative min-w-[140px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <MultiSelect
                value={draftFilters.State || []}
                options={stateOptions}
                onChange={(e) => updateDraft("State", e.value)}
                filter
                filterTemplate={getFilterTemplate("State")}
                loading={msLoading("State")}
                showSelectAll
                placeholder="State"
                maxSelectedLabels={0}
                selectedItemsLabel="State ({0})"
                className="lc-pill w-full"
                panelClassName="lc-panel rounded-xl"
                dropdownIcon="pi pi-chevron-down"
                itemClassName={dropdownItemClass}
                emptyMessage={loadingDataKey === "State" ? "Data Loading..." : "Search for more..."}
              />
            </div>
            <div className="relative min-w-[140px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <MapPin className="w-4 h-4 text-gray-500" />
              </div>
              <MultiSelect
                value={draftFilters.City || []}
                options={cityOptions}
                onChange={(e) => updateDraft("City", e.value)}
                filter
                filterTemplate={getFilterTemplate("City")}
                loading={msLoading("City")}
                showSelectAll
                placeholder="City"
                maxSelectedLabels={0}
                selectedItemsLabel="City ({0})"
                className="lc-pill w-full"
                panelClassName="lc-panel rounded-xl"
                dropdownIcon="pi pi-chevron-down"
                itemClassName={dropdownItemClass}
                emptyMessage={loadingDataKey === "City" ? "Data Loading..." : "Search for more..."}
              />
            </div>
            <div className="relative min-w-[180px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Briefcase className="w-4 h-4 text-gray-500" />
              </div>
              <MultiSelect
                value={draftFilters.Designation || []}
                options={designationOptions}
                onChange={(e) => updateDraft("Designation", e.value)}
                filter
                filterTemplate={getFilterTemplate("Designation")}
                loading={msLoading("Designation")}
                placeholder="Designation"
                maxSelectedLabels={0}
                selectedItemsLabel={designationSelectedItemsLabel}
                className="lc-pill w-full"
                panelClassName="lc-panel rounded-xl"
                dropdownIcon="pi pi-chevron-down"
                itemClassName={dropdownItemClass}
                showSelectAll={showDesignationSelectAll}
                onSelectAll={handleSelectAllDesignation}
                emptyMessage={loadingDataKey === "Designation" ? "Data Loading..." : "Search for more..."}
              />
            </div>
            <div className="relative min-w-[200px]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                <Building2 className="w-4 h-4 text-gray-500" />
              </div>
              <MultiSelect
                value={draftFilters.Organization || []}
                options={organizationOptions}
                onChange={(e) => updateDraft("Organization", e.value)}
                filter
                filterTemplate={getFilterTemplate("Organization")}
                loading={msLoading("Organization")}
                showSelectAll
                placeholder="Organization"
                maxSelectedLabels={0}
                selectedItemsLabel="Organization ({0})"
                className="lc-pill w-full"
                panelClassName="lc-panel rounded-xl"
                dropdownIcon="pi pi-chevron-down"
                itemClassName={dropdownItemClass}
                emptyMessage={loadingDataKey === "Organization" ? "Data Loading..." : "Search for more..."}
              />
            </div>
            {!isFree && (
              <>
                <div className="relative min-w-[160px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Layers className="w-4 h-4 text-gray-500" />
                  </div>
                  <MultiSelect
                    value={draftFilters.orgIndustry || []}
                    options={orgIndustryOptions}
                    onChange={(e) => updateDraft("orgIndustry", e.value)}
                    filter
                    filterTemplate={getFilterTemplate("orgIndustry")}
                    loading={msLoading("orgIndustry")}
                    showSelectAll
                    placeholder="Org Industry"
                    maxSelectedLabels={0}
                    selectedItemsLabel="Org Industry ({0})"
                    className="lc-pill w-full"
                    panelClassName="lc-panel rounded-xl"
                    dropdownIcon="pi pi-chevron-down"
                    itemClassName={dropdownItemClass}
                    emptyMessage={loadingDataKey === "orgIndustry" ? "Data Loading..." : "Search for more..."}
                  />
                </div>
                <div className="relative min-w-[160px]">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <Users className="w-4 h-4 text-gray-500" />
                  </div>
                  <MultiSelect
                    value={draftFilters.orgSize || []}
                    options={orgSizeOptions}
                    onChange={(e) => updateDraft("orgSize", e.value)}
                    filter
                    filterTemplate={getFilterTemplate("orgSize")}
                    loading={msLoading("orgSize")}
                    showSelectAll
                    placeholder="Org Size"
                    maxSelectedLabels={0}
                    selectedItemsLabel="Org Size ({0})"
                    className="lc-pill w-full"
                    panelClassName="lc-panel rounded-xl"
                    dropdownIcon="pi pi-chevron-down"
                    itemClassName={dropdownItemClass}
                    emptyMessage={loadingDataKey === "orgSize" ? "Data Loading..." : "Search for more..."}
                  />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={runSearch}
              disabled={!isDirtyFilters || loading}
              className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                !isDirtyFilters || loading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20"
              }`}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <i className="pi pi-spin pi-spinner text-xs" />
                  Search
                </span>
              ) : (
                "Search"
              )}
            </button>
            <button
              onClick={clearAllFilters}
              className="text-sm font-medium text-gray-700 hover:text-orange-600 whitespace-nowrap"
            >
              Clear all
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <Dialog
            header={addMode === "bulk" ? "Add filtered rows to list" : "Add selected profiles to list"}
            visible={modalVisible}
            className="p-2 bg-white w-[92vw] lg:w-1/2 rounded-xl"
            onHide={() => setModalVisible(false)}
            draggable={false}
            resizable={false}
          >
            <CollaboratorAddToListComponent
              mode={addMode}
              people={addMode === "selected" ? selectedProfile : []}
              bulk={addMode === "bulk" ? bulkConfig : null}
              onClose={() => setModalVisible(false)}
              onComplete={handleAddedToList}
            />
          </Dialog>

          <div className="w-full overflow-x-auto overflow-y-hidden lc-table">
            {loading ? (
              <DataTable
                key="dt-loading"
                value={loadingRows}
                filters={filters}
                globalFilterFields={fields}
                tableStyle={{ minWidth: "100%" }}
                dataKey="row_id"
                scrollable
                scrollHeight="calc(100vh - 360px)"
                className="text-sm"
                rows={PAGE_SIZE}
                selectionMode={rowClick ? null : "checkbox"}
                onSelectionChange={(e: any) => setSelectedProfile(e.value)}
                selection={selectedProfile}
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
                filters={filters}
                globalFilterFields={fields}
                tableStyle={{ minWidth: "100%" }}
                dataKey="row_id"
                emptyMessage={emptyMessageTemplate}
                scrollable
                scrollHeight="calc(100vh - 360px)"
                className="text-sm"
                rows={PAGE_SIZE}
                selectionMode={rowClick ? null : "checkbox"}
                onSelectionChange={(e: any) => setSelectedProfile(e.value)}
                selection={selectedProfile}
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
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-gray-600 hidden sm:flex gap-1">
            Showing{" "}
            <span className="text-orange-600 font-semibold">
              {totalDataCount ? `${showingRange.start}-${showingRange.end}` : "0"}
            </span>{" "}
            of{" "}
            <span className="text-orange-600 font-semibold">
              {totalDataCount?.toLocaleString()}
            </span>{" "}
            results
          </div>
          <div className="hidden sm:flex items-center gap-3">
            <button
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-700 text-sm font-medium"
              onClick={() => handleChangePageNumber2("decrease")}
            >
              Previous
            </button>
            <input
              type="number"
              value={pageNumber}
              max={totalPages}
              className="w-[90px] text-center py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              onChange={(e) => handleChangePageNumber(e)}
            />
            <button
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-700 text-sm font-medium"
              onClick={() => handleChangePageNumber2("increase")}
            >
              Next
            </button>
            <div className="text-sm text-gray-500 min-w-[90px] text-right">
              {totalPages.toLocaleString()} pages
            </div>
          </div>
          <div className="sm:hidden flex items-center justify-between gap-3">
            <button
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-700 text-sm font-medium"
              onClick={() => handleChangePageNumber2("decrease")}
            >
              Previous
            </button>
            <div className="w-[90px]">
              <input
                type="number"
                value={pageNumber}
                max={totalPages}
                className="w-full text-center py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                onChange={(e) => handleChangePageNumber(e)}
              />
            </div>
            <button
              className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all text-gray-700 text-sm font-medium"
              onClick={() => handleChangePageNumber2("increase")}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}