import { MultiSelect } from "primereact/multiselect";
import { useEffect, useRef, useState } from "react";
import TextToCapitalize from "./TextToCapital";
import { searchOption, searchOptionDesignation } from "../utils/api/data";

import { countries_data } from "../utils/data/countries";
import { cities_data } from "../utils/data/city";
import { state_data } from "../utils/data/states";
import { designation_groups_data } from "../utils/data/designation_groups";
import { org_size } from "../utils/data/org_size";
import { org_industry } from "../utils/data/org_industry";
import { toast } from "react-toastify";
import { debounce } from "lodash";
import { useRecoilValue } from "recoil";
import { creditState } from "../utils/atom/authAtom";

export default function FilterComponent({
  functionName,
  setFitler,
  setPage,
}: any) {
  const creditInfo = useRecoilValue(creditState);

  const [orgSize, setOrgSize] = useState<any>([]);
  const [orgIndustry, setOrgIndustry] = useState<any>([]);
  const [selectedFilters, setSelectedFilters] = useState<any>({});
  const [selectedFilterValue, setSelectedFilterValue] = useState<any>({});
  const [loading, setLoading] = useState<any>(false);
  const [countryJson, setCountryJson] = useState<any>([]);
  const [stateJson, setStateJson] = useState<any>([]);
  const [cityJson, setCityJson] = useState<any>([]);
  const [organization, setOrganisation] = useState<any>([]);
  const [designations, setDesignations] = useState<any>([]);
  const [loadingData, setLoadingData] = useState<any>("");
  const [selectAllDesignation, setSelectAllDesignation] = useState<any>(false);

  const [baseCountryJson, setBaseCountryJson] = useState<any>([]);
  const [baseStateJson, setBaseStateJson] = useState<any>([]);
  const [baseCityJson, setBaseCityJson] = useState<any>([]);
  const [baseOrganization, setBaseOrganization] = useState<any>([]);
  const [baseDesignations, setBaseDesignations] = useState<any>([]);
  const [baseOrgSize, setBaseOrgSize] = useState<any>([]);
  const [baseOrgIndustry, setBaseOrgIndustry] = useState<any>([]);

  const handleFilterChange = (keyItem: any, value: any) => {
    setSelectedFilters((prevState: any) => ({
      ...prevState,
      [keyItem]: value,
    }));
  };

  const onSubmitFilter = async () => {
    setLoadingData("Main filter");

    const designationData = selectedFilters["Designation"]?.map((item: any) => {
      if (item.includes(" - ")) {
        return item.split(" - ", 2)[1];
      }
      return item;
    });

    const payload: any = {
      ...selectedFilters,
      selectAll: selectedFilterValue["Designation"]?.length
        ? selectAllDesignation
        : false,
    };

    if (designationData) {
      payload["Designation"] = designationData;
    }
    if (selectAllDesignation) {
      payload["searchQuery"] = selectedFilterValue["Designation"] ?? "";
    }

    setFitler(payload);
    setPage(1);
    await functionName(1, { filter: payload });
    setLoadingData("");
  };

  const loadData = useRef(
    debounce(async (field: string, query: string) => {
      try {
        const payload = {
          field: field === "Designation" ? "designation" : field,
          query,
        };

        if (query.length >= 3 && field !== "Designation") {
          const res: any = await searchOption(payload);
          const dataInfo = res?.data?.map((item: string) =>
            TextToCapitalize(item)
          );

          if (!dataInfo) return;

          if (field === "Country") {
            const dataInfor = [...baseCountryJson, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setCountryJson(unique);
          } else if (field === "State") {
            const dataInfor = [...baseStateJson, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setStateJson(unique);
          } else if (field === "City") {
            const dataInfor = [...baseCityJson, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setCityJson(unique);
          } else if (field === "Organization") {
            const dataInfor = [...baseOrganization, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setBaseOrganization(unique);
            setOrganisation(unique);
          } else if (field === "orgSize") {
            const dataInfor = [...baseOrgSize, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setOrgSize(unique);
          } else if (field === "orgIndustry") {
            const dataInfor = [...baseOrgIndustry, ...dataInfo];
            const unique = Array.from(new Set(dataInfor));
            setOrgIndustry(unique);
          }
        } else if (query.length >= 3 && field === "Designation") {
          const res: any = await searchOptionDesignation(payload);
          const dataInfo: any =
            res?.data?.map((item: string) => TextToCapitalize(item)) || [];
          const dataInfor = [...baseDesignations, ...dataInfo];
          const unique = Array.from(new Set(dataInfor));
          setDesignations(unique);
        }
      } catch (e) {
        toast.info("Try again..");
      } finally {
        setLoadingData("");
        setLoading(false);
      }
    }, 2000)
  ).current;

  const handleFilterSearch = (field: string, query: string) => {
    const value = query || "";

    if (!value || value.length === 0) {
      if (field === "Country") {
        setCountryJson(baseCountryJson);
      } else if (field === "State") {
        setStateJson(baseStateJson);
      } else if (field === "City") {
        setCityJson(baseCityJson);
      } else if (field === "Organization") {
        setOrganisation(baseOrganization);
      } else if (field === "Designation") {
        setDesignations(baseDesignations);
      } else if (field === "orgSize") {
        setOrgSize(baseOrgSize);
      } else if (field === "orgIndustry") {
        setOrgIndustry(baseOrgIndustry);
      }
      setLoadingData("");
      setLoading(false);
      return;
    }

    if (value.length >= 3) {
      setLoading(true);
      setLoadingData(field);
      loadData(field, value);
    }
  };

  const selectedItemTemplate = (item: any, key: string) => {
    return selectedFilters[key]?.length ? (
      <div>
        <div className="m-1 bg-white border border-gray-200 text-gray-800 flex items-center justify-center gap-2 w-fit text-[11px] px-3 py-0.5 rounded-full">
          {item}
        </div>
      </div>
    ) : (
      <div>
        {creditInfo?.subscriptionType === "FREE" &&
        (key === "orgSize" || key === "orgIndustry") ? (
          <span className="text-gray-700">Upgrade Account</span>
        ) : (
          `Select ${
            key === "orgSize"
              ? "Organization Size"
              : key === "orgIndustry"
              ? "Organization Industry"
              : key
          }`
        )}
      </div>
    );
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

  const handleSelectAll = () => {
    let searchQuery;
    if (selectedFilterValue["Designation"]) {
      searchQuery = selectedFilterValue["Designation"]?.toLowerCase();
    } else {
      setSelectedFilterValue({
        ...selectedFilterValue,
        Designation: "",
      });
      searchQuery = "";
    }

    const filterValues = designations.filter((options: any) =>
      options?.toLowerCase()?.includes(searchQuery)
    );

    const allDesignationData = selectedFilters["Designation"] ?? [];

    if (selectAllDesignation) {
      setSelectedFilters({ ...selectedFilters, Designation: [] });
    } else {
      setSelectedFilters({
        ...selectedFilters,
        Designation: [...allDesignationData, ...filterValues],
      });
    }

    setSelectAllDesignation(!selectAllDesignation);
  };

  useEffect(() => {
    const initialCountries = countries_data?.Country?.map((item: string) =>
      TextToCapitalize(item)
    );
    const initialStates = state_data?.State?.map((item: string) =>
      TextToCapitalize(item)
    );
    const initialDesignations =
      designation_groups_data?.Designation_Groups?.map((item: string) =>
        TextToCapitalize(item)
      ) || [];
    const initialCities = cities_data?.City?.map((item: string) =>
      TextToCapitalize(item)
    );
    const initialOrgIndustry =
      org_industry?.org_industry?.map((item: string) =>
        TextToCapitalize(item)
      ) || [];
    const initialOrgSize =
      org_size?.org_size?.map((item: string) => TextToCapitalize(item)) || [];

    setBaseCountryJson(initialCountries);
    setBaseStateJson(initialStates);
    setBaseDesignations(initialDesignations);
    setBaseCityJson(initialCities);
    setBaseOrgIndustry(initialOrgIndustry);
    setBaseOrgSize(initialOrgSize);

    setCountryJson(initialCountries);
    setStateJson(initialStates);
    setDesignations(initialDesignations);
    setCityJson(initialCities);
    setOrgIndustry(initialOrgIndustry);
    setOrgSize(initialOrgSize);
  }, []);

  return (
    <div>
      <div className="col-span-6 lg:col-span-12 gap-5">
        {/* Country */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-globe text-xs text-gray-500 ml-5" />
            <span className="font-semibold">Country</span>
            {selectedFilters["Country"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["Country"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["Country"]}
            options={countryJson}
            onChange={(e) => handleFilterChange("Country", e.value)}
            loading={loadingData === "Country" && loading}
            filter
            style={{ minWidth: "100%" }}
            emptyMessage={
              loadingData === "Country" ? "Data Loading..." : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "Country" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            filterPlaceholder="Search.."
            placeholder="Select Country"
            display="chip"
            filterTemplate={getFilterTemplate("Country")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "Country")}
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            className="p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm hover:shadow shadow-sm border border-gray-300 hover:border-gray-400 px-3 py-0.5 md:w-20rem rounded-full"
          />
        </div>

        {/* State */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-flag text-xs text-gray-500 ml-5" />
            <span className="font-semibold">State</span>
            {selectedFilters["State"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["State"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["State"]}
            onChange={(e) => handleFilterChange("State", e.value)}
            options={stateJson}
            onFilter={(e) => handleFilterSearch("State", e.filter)}
            loading={loadingData === "State" && loading}
            filter
            style={{ maxWidth: "100%" }}
            emptyMessage={
              loadingData === "State" ? "Data Loading..." : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "State" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            filterPlaceholder="Search.."
            placeholder="Select State"
            display="chip"
            filterTemplate={getFilterTemplate("State")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "State")}
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            className="p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm hover:shadow shadow-sm border border-gray-300 hover:border-gray-400 px-3 py-0.5 md:w-20rem rounded-full"
          />
        </div>

        {/* City */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-map-marker text-xs text-gray-500 ml-5" />
            <span className="font-semibold">City</span>
            {selectedFilters["City"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["City"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["City"]}
            onChange={(e) => handleFilterChange("City", e.value)}
            options={cityJson}
            onFilter={(e) => handleFilterSearch("City", e.filter)}
            loading={loadingData === "City" && loading}
            filter
            style={{ maxWidth: "100%" }}
            emptyMessage={
              loadingData === "City" ? "Data Loading..." : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "City" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            filterPlaceholder="Search.."
            placeholder="Select City"
            display="chip"
            filterTemplate={getFilterTemplate("City")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "City")}
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            className="p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm hover:shadow shadow-sm border border-gray-300 hover:border-gray-400 px-3 py-0.5 md:w-20rem rounded-full"
          />
        </div>

        {/* Designation */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-briefcase text-xs text-gray-500 ml-5" />
            <span className="font-semibold">Designation</span>
          </h4>

          <MultiSelect
            value={selectedFilters["Designation"]}
            onChange={(e) => handleFilterChange("Designation", e.value)}
            options={designations}
            onFilter={(e) => handleFilterSearch("Designation", e.filter)}
            loading={loadingData === "Designation" && loading}
            filter
            style={{ maxWidth: "100%" }}
            emptyMessage={
              loadingData === "Designation" ? "Data Loading" : "Search for more.."
            }
            emptyFilterMessage={
              loadingData === "Designation" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            resetFilterOnHide={false}
            onSelectAll={handleSelectAll}
            filterPlaceholder="Search.."
            placeholder="Select Designation"
            display="chip"
            filterTemplate={getFilterTemplate("Designation")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "Designation")}
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            className="p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm hover:shadow border border-gray-300 hover:border-gray-400 px-3 py-0.5 md:w-20rem rounded-full"
          />
        </div>

        {/* Organization */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-building text-xs text-gray-500 ml-5" />
            <span className="font-semibold">Organization</span>
            {selectedFilters["Organization"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["Organization"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["Organization"]}
            onChange={(e) => handleFilterChange("Organization", e.value)}
            options={organization}
            onFilter={(e) => handleFilterSearch("Organization", e.filter)}
            loading={loadingData === "Organization" && loading}
            filter
            style={{ maxWidth: "100%" }}
            emptyMessage={
              loadingData === "Organization"
                ? "Data Loading..."
                : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "Organization" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            display="chip"
            filterTemplate={getFilterTemplate("Organization")}
            selectedItemTemplate={(e) =>
              selectedItemTemplate(e, "Organization")
            }
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            placeholder="Select Organization"
            className="p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm hover:shadow shadow-sm border border-gray-300 hover:border-gray-400 px-3 py-0.5 md:w-20rem rounded-full"
          />
        </div>

        {/* Org Size */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-users text-xs text-gray-500 ml-5" />
            <span className="font-semibold">Organization Size</span>
            {selectedFilters["orgSize"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["orgSize"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["orgSize"]}
            onChange={(e) => handleFilterChange("orgSize", e.value)}
            options={orgSize}
            onFilter={(e) => handleFilterSearch("orgSize", e.filter)}
            loading={loadingData === "orgSize" && loading}
            filter
            style={{ maxWidth: "100%" }}
            disabled={creditInfo?.subscriptionType === "FREE" && true}
            emptyMessage={
              loadingData === "orgSize" ? "Data Loading..." : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "orgSize" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            display="chip"
            filterTemplate={getFilterTemplate("Organization Size")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "orgSize")}
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            placeholder="Select Organization Size"
            className={`${
              creditInfo?.subscriptionType === "FREE"
                ? "bg-gray-200 border border-gray-300"
                : "hover:shadow border border-gray-300 hover:border-gray-400"
            } p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm shadow-sm px-3 py-0.5 md:w-20rem rounded-full`}
          />
        </div>

        {/* Org Industry */}
        <div className="card mb-4 flex flex-col justify-content-center">
          <h4 className="text-gray-800 text-sm flex items-center gap-2 mb-1">
            <span className="pi pi-briefcase text-xs text-gray-500 ml-5" />
            <span className="font-semibold">Organization Industry</span>
            {selectedFilters["orgIndustry"]?.length ? (
              <span className="text-[10px] py-0.5 px-2 text-gray-700 font-bold bg-orange-300 rounded-full ml-1">
                {selectedFilters["orgIndustry"].length}
              </span>
            ) : null}
          </h4>

          <MultiSelect
            value={selectedFilters["orgIndustry"]}
            onChange={(e) => handleFilterChange("orgIndustry", e.value)}
            options={orgIndustry}
            onFilter={(e) => handleFilterSearch("orgIndustry", e.filter)}
            loading={loadingData === "orgIndustry" && loading}
            filter
            style={{ maxWidth: "100%" }}
            disabled={creditInfo?.subscriptionType === "FREE" && true}
            emptyMessage={
              loadingData === "orgIndustry"
                ? "Data Loading..."
                : "Search for more..."
            }
            emptyFilterMessage={
              loadingData === "orgIndustry" ? (
                <div className="text-xs text-center p-2 flex items-center gap-2 justify-center">
                  <i className="pi pi-spin pi-refresh"></i> Data Loading...
                </div>
              ) : (
                <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">
                  No result
                </div>
              )
            }
            display="chip"
            filterTemplate={getFilterTemplate("Organization Industry")}
            selectedItemTemplate={(e) =>
              selectedItemTemplate(e, "orgIndustry")
            }
            itemClassName="text-xs text-gray-800 flex flex-wrap w-[100%] items-center gap-2 bg-white border-b border-b-gray-100 p-2"
            placeholder="Select Organization Industry"
            className={`${
              creditInfo?.subscriptionType === "FREE"
                ? "bg-gray-200 border border-gray-300"
                : "hover:shadow border border-gray-300 hover:border-gray-400"
            } p-multiselect p-checkbox-box custom-checkbox-multiselect w-full text-sm px-3 py-0.5 md:w-20rem rounded-full`}
          />
        </div>
      </div>

      <div className="mt-2">
        {loadingData === "Main filter" ? (
          <button
            type="button"
            disabled
            className="w-full flex items-center justify-center gap-2 rounded-full text-white text-sm font-bold py-3 cursor-not-allowed"
            style={{
              background:
                "linear-gradient(90deg, #3B82F6 0%, #6366F1 50%, #F97316 100%)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
              opacity: 0.7,
            }}
          >
            <i className="pi pi-spin pi-spinner text-xs" />
            <span>Filter</span>
          </button>
        ) : (
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 rounded-full text-white text-sm font-bold py-3"
            style={{
              background:
                "linear-gradient(90deg, #3B82F6 0%, #6366F1 50%, #F97316 100%)",
              boxShadow: "0 10px 20px rgba(0,0,0,0.18)",
            }}
            onClick={onSubmitFilter}
          >
            <i className="pi pi-filter text-xs" />
            <span>Filter</span>
          </button>
        )}
      </div>
    </div>
  );
}