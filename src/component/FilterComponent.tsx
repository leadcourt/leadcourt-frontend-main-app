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
import {debounce} from 'lodash';
import { useRecoilValue } from "recoil";
import { creditState } from "../utils/atom/authAtom";

export default function FilterComponent({ functionName, setFitler, setPage }: any) {
  const creditInfo = useRecoilValue(creditState)

  const [orgSize, setOrgSize] = useState<any>([])
  const [orgIndustry, setOrgIndustry] = useState<any>([])
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

  const handleFilterChange = (keyItem: any, value: any) => {
    setSelectedFilters((prevState: any) => ({
      ...prevState,
      [keyItem]: value,
    }));
  };

  const onSubmitFilter = async () => {
    setLoadingData('Main filter')
    
    
    const designationData = selectedFilters['Designation']?.map((item: any)=>{
      if (item.includes(' - ')){
        return item.split(' - ', 2)[1]
      }
      return item
    }
    )
 
    
    const payload = {
      ...selectedFilters,
      selectAll: selectedFilterValue['Designation']?.length? selectAllDesignation: false,
    }

    if (designationData){
      payload['Designation'] = designationData
    } 
    if (selectAllDesignation) {
      payload['searchQuery'] = selectedFilterValue['Designation'] ?? '';
    }
 
    setFitler(payload);
    
    setPage(1)
    await functionName(1, {filter:payload});
    setLoadingData('') 
    

  };

  // debounce to delay api call for 2 sec after user types || useRef to force delay
  const loadData = useRef(debounce(async (field: string, query: string) => {
    setLoading(true);
    setLoadingData(field);

    const payload = {
      field: field=== 'Designation'? 'designation':field,
      query: query,
    };

    if (query.length > 1 && field !== 'Designation') {

      await searchOption(payload).then((res: any) => {

        const dataInfo = res?.data?.map((item: string) =>
          TextToCapitalize(item)
        );
        if (field==='Country'){
          const dataInfor = [...countryJson, ...dataInfo]
          const unique = Array.from(new Set(dataInfor));
          setCountryJson(unique)
        } else if (field==='State'){
          const dataInfor = [...stateJson, ...dataInfo]
          const unique = Array.from(new Set(dataInfor));
          setStateJson(unique)
        } else if (field==='City'){
          const dataInfor = [...cityJson, ...dataInfo]
          const unique = Array.from(new Set(dataInfor));
          setCityJson(unique)
        } else if (field==='Organization'){
          const dataInfor = [...organization, ...dataInfo]
          const unique = Array.from(new Set(dataInfor));
          setOrganisation(unique)
        }


      }).catch(( )=>{
        toast.info('Try again..')

    setLoadingData("");
    setLoading(false);
      })
    } else if (query.length > 1 && field === 'Designation') {
      await searchOptionDesignation(payload).then((res: any) => {

        const dataInfo: any = res?.data?.map((item: string) =>
          TextToCapitalize(item)
        );

      if ( field === 'Designation'){
        const dataInfor = [...designations, ...dataInfo]
        
        const unique = Array.from(new Set(dataInfor));
        setDesignations(unique)
        
      }
    })
  }

    

    setLoadingData("");
    setLoading(false);
  }, 2000)).current;

  // {selectedFilters["Designation"]}
  const selectedItemTemplate = (item: any, key: string) => {
    
    return selectedFilters[key]?.length ? (
      <div className="">
        <div className="m-1 bg-red-100 text-amber-700 flex items-center justify-center gap-3  w-fit text-[11px] p1 px-3 py-0.5 rounded-full ">
          {item}
        </div>
      </div>
    ) : (
      <div className="">
        {creditInfo?.subscriptionType === 'FREE' && (key === 'orgSize' ||key === 'orgIndustry') ?
       <span className="text-gray-700">Upgrade Account</span>
      :`Select ${key === 'orgSize' ? "Organization Size" : key === 'orgIndustry'? 'Organization Industry': key}`
        }
      </div>
    );
  };

  const getFilterTemplate = (placeholder: string) => (options: any) => {
    const { filterOptions } = options; 
    
    return (
      <div className="px-5 p-multiselect-filter-container">
        <div className="p-input-icon-right w-full">
          <input
          value={selectedFilterValue[placeholder]}
            onChange={(e) => {
              filterOptions.filter(e);
              loadData(placeholder, e.target.value);
              setSelectedFilterValue({...selectedFilterValue, [placeholder]:e.target.value})
            }}
            className="w-full m-auto focus:outline-none bg-white text-xs p-2 my-2 rounded-2xl "
            placeholder={placeholder=='Designation'? `Please enter "Job Title" or "Keyword"`:`Search ${placeholder}...`}
          />
        </div>
      </div>
    );
  };
 
  const multiSelectRef : any= useRef(null);
  const handleSelectAll = () => {
    // const allValues = event.originalEvent.checked ? (multiSelectRef.current?.initialValue || designations) : [];
    
    // console.log('select all');
    // console.log('select all designation', designations.length);
    // console.log('select all button', selectAllDesignation);
    
    let searchQuery
    if ( selectedFilterValue['Designation']){
      searchQuery = selectedFilterValue['Designation']?.toLowerCase()
      console.log('select all searchQuery', searchQuery);
    } else {
      setSelectedFilterValue({...selectedFilterValue, Designation: ''})
      searchQuery = ''
      console.log('not select all searchQuery', searchQuery);
    }
    // console.log('select all searchQuery', searchQuery);
    
    const filterValues = designations.filter((options: any)=>
      options?.toLowerCase()?.includes(searchQuery)
    )
    // console.log('select all filterValues', filterValues);

    const allDesignationData = selectedFilters['Designation'] ?? []
    // console.log('select all allDesignationData', allDesignationData);
 
    if (selectAllDesignation){
      setSelectedFilters({...selectedFilters, Designation: []});
      console.log(' click select all searchQuery', searchQuery, {...selectedFilters, Designation: []});
    } else {
      setSelectedFilters({...selectedFilters, Designation: [...allDesignationData, ...filterValues]});
      console.log('unclick select all searchQuery', searchQuery, {...selectedFilters, Designation: []});
    }

    
    setSelectAllDesignation(!selectAllDesignation)
};
  

  useEffect(() => { 

    setCountryJson(
      countries_data?.Country?.map((item: string) => TextToCapitalize(item))
    );
    setStateJson(
      state_data?.State?.map((item: string) => TextToCapitalize(item))
    );
    setDesignations(
      designation_groups_data?.Designation_Groups?.map((item: string) =>
        TextToCapitalize(item)
      )
    );
    setCityJson(
      cities_data?.City?.map((item: string) => TextToCapitalize(item))
    );
    setOrgIndustry(
      org_industry?.org_industry?.map((item: string) => TextToCapitalize(item))
    );
    setOrgSize(
      org_size?.org_size?.map((item: string) => TextToCapitalize(item))
    );


  }, []);

  return (
    <div>
      <div className=" col-span-6 lg:col-span-12 gap-5">
        {/* Country filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            Country{" "}
            {selectedFilters["Country"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["Country"].length}
              </span>
            ) : (
              ""
            )}{" "}
          </h4>

          <MultiSelect
            value={selectedFilters["Country"]}
            options={countryJson}
            onChange={(e) => handleFilterChange("Country", e.value)}
            loading={loadingData === "Country" && loading}
            filter
            style={{
              minWidth: "100%",
            }}
            emptyMessage={loadingData === "Country"  ? 'Data Loading...' : 'Search for more...'}
            emptyFilterMessage={loadingData === "Country" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            filterPlaceholder="Search.."
            placeholder={`Select ${"Country"}`}
            display="chip"
            filterTemplate={getFilterTemplate("Country")}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "Country")}
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "

            // virtualScrollerOptions={{ itemSize: 43 }}
            className={` p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
              selectedFilters["Country"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
          />
        </div>

        {/* State filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            State{" "}
            {selectedFilters["State"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["State"].length}
              </span>
            ) : (
              ""
            )}{" "}
          </h4>

          <MultiSelect
            value={selectedFilters["State"]}
            onChange={(e) => handleFilterChange("State", e.value)}
            options={stateJson}
            onFilter={(e) => loadData("State", e.filter)}
            loading={loadingData === "State" && loading}
            filter
            style={{
              maxWidth: "100%",
            }} 
            // emptyMessage={loadingData === "State"  ? 'Data Loading...' : 'Search for more...'}
            emptyMessage={loadingData === "State"  ? 'Data Loading...' : 'Search for more...'}
            emptyFilterMessage={loadingData === "State" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            filterPlaceholder="Search.."
            placeholder={`Select ${"State"}`}
            display="chip"
            filterTemplate={getFilterTemplate('State')}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "State")}
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "
            className={` p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
              selectedFilters["State"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
          />
        </div>

        {/* City filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            City{" "}
            {selectedFilters["City"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["City"].length}
              </span>
            ) : (
              ""
            )}{" "}
          </h4>

          <MultiSelect
            value={selectedFilters["City"]}
            onChange={(e) => handleFilterChange("City", e.value)}
            options={cityJson}
            onFilter={(e) => loadData("City", e.filter)}
            loading={loadingData === "City" && loading}
            filter
            style={{
              maxWidth: "100%",
            }}
            
            emptyMessage={loadingData === "City"  ? 'Data Loading...' : 'Search for more...'}
            emptyFilterMessage={loadingData === "City" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            filterPlaceholder="Search.."
            placeholder={`Select ${"City"}`}
            display="chip"
            filterTemplate={getFilterTemplate('City')}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "City")}
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "
            className={` p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
              selectedFilters["City"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
          />
        </div>

        {/* Designation filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            Designation{" "}
            {/* {selectedFilters["Designation"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["Designation"].length}
              </span>
            ) : (
              ""
            )}{" "} */}
          </h4>
          {/*  */}

          <MultiSelect
            value={selectedFilters["Designation"]}
            onChange={(e) => handleFilterChange("Designation", e.value)}
            options={designations}
            onFilter={(e) =>  loadData("Designation", e.filter) }
            loading={loadingData === "Designation" && loading}
            filter
            style={{
              maxWidth: "100%",
            }}
            
            emptyMessage={loadingData === "Designation" ? 'Data Loading': 'Search for more..'}
            emptyFilterMessage={loadingData === "Designation" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            resetFilterOnHide={false}
            ref={multiSelectRef}
            onSelectAll={handleSelectAll}
            filterPlaceholder="Search.."
            placeholder={`Select ${"Designation"}`}
            display="chip"
            filterTemplate={getFilterTemplate('Designation')}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "Designation")}
            
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "
            
            // itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] max-w-[400px] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "
            // className={` p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
            //   selectedFilters["Designation"]?.length > 0
            //     ? "flex flex-wrap "
            //     : ""
            // } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
          
            className={` p-multiselect p-checkbox-box  w-full max-h-[100px] border-4 max-w-[100px] ${
              selectedFilters["Country"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
           
          />
        </div>

{/* Organization filter */}
<div className="card mb-2 flex flex-col justify-content-center">
  <h4 className="text-gray-400 text-xs flex items-start gap-3">
    Organization{" "}
    {selectedFilters["Organization"]?.length ? (
      <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
        {selectedFilters["Organization"].length}
      </span>
    ) : (
      ""
    )}{" "}
  </h4>

  <MultiSelect
    value={selectedFilters["Organization"]}
    onChange={(e) => handleFilterChange("Organization", e.value)}
    options={organization}
    onFilter={(e) => loadData("Organization", e.filter)}
    loading={loadingData === "Organization" && loading}
    filter
    style={{
      maxWidth: "100%",
    }}
    emptyMessage={loadingData === "Organization"  ? 'Data Loading...' : 'Search for more...'}
    emptyFilterMessage={loadingData === "Organization" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
    display="chip"
    filterTemplate={getFilterTemplate('Organization')}
    selectedItemTemplate={(e) => selectedItemTemplate(e, "Organization")}
    itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "

    placeholder={`Select Organization`}
    className={`   p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
      selectedFilters["City"]?.length > 0 ? "flex flex-wrap " : ""
    } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
 
  />
</div>


        {/* Organization Size filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            Organization Size{" "}
            {selectedFilters["orgSize"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["orgSize"].length}
              </span>
            ) : (
              ""
            )}{" "}
          </h4>

          <MultiSelect
            value={selectedFilters["orgSize"]}
            onChange={(e) => handleFilterChange("orgSize", e.value)}
            options={orgSize}
            onFilter={(e) => loadData("orgSize", e.filter)}
            loading={loadingData === "orgSize" && loading}
            filter
            style={{
              maxWidth: "100%",
            }}
            disabled={creditInfo?.subscriptionType === 'FREE' && true}
            emptyMessage={loadingData === "orgSize"  ? 'Data Loading...' : 'Search for more...'}
            emptyFilterMessage={loadingData === "orgSize" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            display="chip"
            filterTemplate={getFilterTemplate('Organization Size')}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "orgSize")}
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "

            placeholder={`Select ${"Organization Size"}`}
            className={`${creditInfo?.subscriptionType === 'FREE' ? 'bg-gray-400': ''}  p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
              selectedFilters["City"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
         
          />
        </div>


        {/* Organization Industry filter */}
        <div className="card mb-2 flex flex-col justify-content-center">
          <h4 className=" text-gray-400 text-xs flex items-start gap-3">
            Organization Industry{" "}
            {selectedFilters["orgIndustry"]?.length ? (
              <span className="text-xs py-1 px-2 text-gray-700 font-bold bg-orange-300 rounded-full">
                {selectedFilters["orgIndustry"].length}
              </span>
            ) : (
              ""
            )}{" "}
          </h4>

          <MultiSelect
            value={selectedFilters["orgIndustry"]}
            onChange={(e) => handleFilterChange("orgIndustry", e.value)}
            options={orgIndustry}
            onFilter={(e) => loadData("orgIndustry", e.filter)}
            loading={loadingData === "orgIndustry" && loading}
            filter
            style={{
              maxWidth: "100%",
            }}
            disabled={creditInfo?.subscriptionType === 'FREE' && true}
            emptyMessage={loadingData === "orgIndustry"  ? 'Data Loading...' : 'Search for more...'}
            emptyFilterMessage={loadingData === "orgIndustry" ? <div className="text-xs text-center p-2 flex items-center gap-2 justify-center"><i className="pi pi-spin pi-refresh"></i> Data Loading...</div> : <div className="text-xs text-center p-2 flex justify-center items-center gap-2 ">No result</div>}
            display="chip"
            filterTemplate={getFilterTemplate('Organization Industry')}
            selectedItemTemplate={(e) => selectedItemTemplate(e, "orgIndustry")}
            itemClassName="text-xs text-red-800 flex flex-wrap w-[100%] items-center gap-2  bg-red-50 border-b border-b-red-200 p-2 "

            placeholder={`Select ${"Organization Industry"}`}
            className={`${creditInfo?.subscriptionType === 'FREE' ? 'bg-gray-400': ''}  p-multiselect p-checkbox-box  w-full max-h-[100px] max-w-[100px] ${
              selectedFilters["City"]?.length > 0 ? "flex flex-wrap " : ""
            } overflow-auto  text-sm shadow border border-gray-200 p-2 md:w-20rem  custom-checkbox-multiselect`}
         
          />
        </div>




      </div>

      {loadingData==='Main filter'? 

<button
className={`bg-[#f34f146c] cursor-not-allowed flex items-center justify-center gap-2 rounded-lg text-white text-sm font-bold py-3 w-full mt-5`}
> <i className="pi pi-spin pi-spinner" ></i>
  Filter
</button>
      :
      <button
      className={`cursor-pointer bg-[#F35114] rounded-lg text-white text-sm font-bold py-3 w-full mt-5`}
      onClick={onSubmitFilter}
      >
        Filter
      </button>
      }
    </div>
  );
}



// "ceo - chief investment officer, president and interim chief executive officer"
// "ceo - executive vice president of strategic planning, chief information officer for cke restaurants"
// "ceo - chief executive officer"
// "ceo - president & chief executive officer"
// "ceo - president, chief executive officer"
// "ceo - president and chief executive officer"

// hr - human 








