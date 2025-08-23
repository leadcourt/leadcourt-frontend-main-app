import { useEffect, useState } from "react";
import {
  exportList,
  getLinkedInUrl,
  // getDataPhoneAndEmail,
  getSingleListDetail,
} from "../../utils/api/data";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { useNavigate, useParams } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { creditState, userState } from "../../utils/atom/authAtom";
import { showPhoneAndEmail } from "../../utils/api/getPhoneAndEmail";
import TextToCapitalize from "../../component/TextToCapital";
import { toast } from "react-toastify";
import { Dialog } from "primereact/dialog";
import { Skeleton } from "primereact/skeleton";
import hubspotLogo from "../../assets/integrations/hubspot/HubSpot.png";
import { exportToHubspotApi } from "../../utils/api/crmIntegrations";

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
}

interface RevealedProfile {
  phoneLength: number;
  emailLength: number;
}

interface ListDetailPayload {
  userId: string | undefined;
  page: number | undefined;
  listName: string | undefined;
}

export default function ListDetailPage() {
  const params = useParams();
  const navigate = useNavigate();
  const user = useRecoilValue(userState);
  const creditInfo = useSetRecoilState(creditState);
  const creditInfoValue = useRecoilValue(creditState);

  const [pageNumber, setPageNumber] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [rowClick, setRowClick] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState([]);
  const [loadRow, setLoadRow] = useState<any>();
  const [visible, setVisible] = useState(false);
  const [insufficientCredit, setInsufficientCredit] = useState<string>("");
  const [exportOptions, setExportOptions] = useState<string>("");
  const [profilesRevealed, setProfileRevealed] = useState<
    RevealedProfile | any
  >();
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedProfilesRevealed, setSelectedProfileRevealed] = useState<
    RevealedProfile | any
  >();

  const columns = [
    { field: "Name", header: "Name" },
    { field: "Designation", header: "Designation" },
    { field: "Phone", header: "Phone" },
    { field: "Email", header: "Email" },
    { field: "", header: "LinkedIn" },
    { field: "Organization", header: "Organization" },
    { field: "Org Industry", header: "Organization Industry" },
    { field: "Org Size", header: "Organization Size" },
    { field: "City", header: "City" },
    { field: "State", header: "State" },
    { field: "Country", header: "Country" },
  ];

  const loadingColumns = [
    {
      row_id: "",
      Name: "",
      Designation: "",
      Email: "",
      Phone: "",
      LinkedIn: "",
      Organization: "",
      City: "",
      State: "",
      Country: "",
      "Organization Size": "",
      "Organization Industry": "",
    },
  ];

  const fields = columns.map((item) => {
    return item.field;
  });

  const handleShowButton = async (option: any) => {
    const data = entries.map((person: Person) => person.row_id);
    const selectedData = selectedProfile.map((person: Person) => person.row_id);

    setLoadRow({ type: option });

    const action = [
      { option: "allPhone", data: data, payload: "phone" },
      { option: "allEmail", data: data, payload: "email" },
      { option: "selectedPhone", data: selectedData, payload: "phone" },
      { option: "selectedEmail", data: selectedData, payload: "email" },
    ];

    action.map((item: any) => {
      if (item.option === option) {
        showPhoneAndEmail(item.payload, item.data, user)
          .then((res) => {
            const resMap = new Map(
              res?.data?.results?.map((item: any) => [item.row_id, item])
            );

            const updatedEntries: any = entries.map((entry: any) => {
              const match: any = resMap.get(entry.row_id);
              return match ? { ...entry, ...match } : entry;
            });

            creditInfo({
              id: user?.id ?? "",
              credits: res?.data?.remainingCredits,
              subscriptionType: creditInfoValue?.subscriptionType || "FREE",
            });

            setEntries(updatedEntries);
            checkPhone(updatedEntries);

            const updatedSelectedEntries: any = selectedProfile.map(
              (entry: any) => {
                const match: any = resMap.get(entry.row_id);
                return match ? { ...entry, ...match } : entry;
              }
            );

            checkSelectedPhone(updatedSelectedEntries);
          })
          .catch(() => {});
      }
    });

    // } catch (err) {

    // }

    setLoadRow({});
  };

  const changeRowClick = (e: any) => {
    setSelectedProfile(e.value);
    setRowClick(rowClick);
    checkSelectedPhone(e.value);
  };

  const handleShowPhoneOrEmail = async (type: string, id: any) => {
    setLoadRow({ type: type, row_id: id });
    await showPhoneAndEmail(type, [id], user)
      .then((res) => {
        if (res?.data?.error) {
          setVisible(true);
          setInsufficientCredit("Insufficient credit");
        }

        let prevEntries: any = {};

        prevEntries = entries.map((entry: any) =>
          entry.row_id === id
            ? { ...entry, ...res?.data.results[0] } // Update the Phone or Email field
            : entry
        );

        checkPhone(prevEntries);

        creditInfo({
          id: user?.id ?? "",
          credits: res?.data?.remainingCredits,
          subscriptionType: creditInfoValue?.subscriptionType || "FREE",
        });
        setEntries(prevEntries);
      })
      .catch(() => {
        // console.log("err occured in show phone or email", err);
      });

    setLoadRow({});
    // loadData(pageNumber);
  };

  const openLinkedInPopup = async (id: any) => {
    setLoadRow({ type: "linkedIn", row_id: id });
    const payload = {
      row_id: id,
    };

    await getLinkedInUrl(payload).then((res: any) => {
      window.open(
        `https://${res?.data?.linkedin_url}`,
        "popupWindow",
        "width=600,height=600"
      );
      setLoadRow({});
    });
  };

  const showPhone = (rowData: any) => {
    return (
      <div className="">
        {!rowData.Phone ? (
          <div
            onClick={() => handleShowPhoneOrEmail("phone", rowData.row_id)}
            className="button_hover text-xs cursor-pointer w-fit p-2 flex items-center justify-center gap-2  font-bold rounded-lg"
          >
            {loadRow?.type === "phone" && loadRow.row_id === rowData.row_id ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              <i className="pi pi-phone text-xs"></i>
            )}
            <span>Show Phone</span>
          </div>
        ) : rowData.Phone.toLowerCase() === "nil" ? (
          ""
        ) : (
          <div className="">{rowData.Phone}</div>
        )}
      </div>
    );
  };

  const showEmail = (rowData: any) => {
    return (
      <div className="">
        {!rowData.Email ? (
          <div
            onClick={() => handleShowPhoneOrEmail("email", rowData.row_id)}
            className="button_hover text-xs cursor-pointer w-fit p-2 flex items-center justify-center gap-2  font-bold rounded-lg"
          >
            {loadRow?.type === "email" && loadRow.row_id === rowData.row_id ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              <i className="pi pi-inbox text-xs"></i>
            )}
            <span>Show Email</span>
          </div>
        ) : (
          rowData.Email
        )}
      </div>
    );
  };

  const showOrgIndustry = (rowData: any) => {
    return (
      <div className="">{TextToCapitalize(rowData?.["Org Industry"])}</div>
    );
  };

  const showName = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.Name)}</div>;
  };

  const showLinkedIn = (rowData: any) => {
    return (
      <div className="">
        <i
          onClick={() => openLinkedInPopup(rowData.row_id)}
          className={`
      
            ${
              loadRow?.type === "linkedIn" && loadRow.row_id === rowData.row_id
                ? "pi pi-spinner"
                : "pi pi-address-book"
            }
         font-bold text-2xl cursor-pointer rounded-lg button_hover  p-2 `}
        ></i>
      </div>
    );
  };

  const showDesignation = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.Designation)}</div>;
  };

  const showCity = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.City)}</div>;
  };

  const showState = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.State)}</div>;
  };

  const showCountry = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.Country)}</div>;
  };

  const showOrganization = (rowData: any) => {
    return <div className="">{TextToCapitalize(rowData.Organization)}</div>;
  };

  const exportCurrentList = async () => {
    setExportLoading(true);

    const payload: any = {
      listName: params?.listName,
    };

    if (exportOptions.toLowerCase() === "hubspot") {
      await exportToHubspotApi(payload)
        .then((res) => {
          console.log("response from hubspot export", res);
          // data :
          //   portalId: 242990985
          //   success: true
          if (res?.data?.success) {
            toast.success("Exported to Hubspot successfully");
            window.open(
              `https://app-na2.hubspot.com/import/${res?.data?.portalId}`,
              "_blank",
              "noopener,noreferrer"
            );
          }
        })
        .catch(() => {});
    } else if (exportOptions.toLowerCase() === "email") {
      payload["email"] = user?.email;
      await exportList(payload)
        .then(() => {
          toast.success("You will receive a mail shortly");
        })
        .catch(() => {
          toast.error("Unable to send mail, try again!");
        });
    }
    setVisible(false);
    setExportLoading(false);
  };

  const listDetail = async (pageNum: number) => {
    setLoading(true);

    const payload: ListDetailPayload = {
      userId: user?.id,
      page: pageNum,
      listName: params?.listName,
    };

    await getSingleListDetail(payload)
      .then((res) => {
        const data = res?.data?.sort((a: Person, b: Person): number =>
          a.Name.localeCompare(b.Name)
        );

        checkPhone(res?.data);

        setEntries(data);
      })
      .catch(() => {
        // console.log("Error occurred: ", err);
      });

    setLoading(false);
  };

  const openDialog = (option: string) => {
    setVisible(true);
    setExportOptions(option);
  };

  // Update the revealed profiles
  const checkPhone = (dataInfo: any) => {
    let phone = dataInfo.filter((item: any) => {
      if (item.Phone !== null) {
        return item;
      }
    });
    let email = dataInfo.filter((item: any) => {
      if (item.Email !== null) {
        return item;
      }
    });

    setProfileRevealed({
      phoneLength: phone?.length,
      emailLength: email?.length,
    });
  };

  // Update the selected revealed profiles
  const checkSelectedPhone = (dataInfo: any) => {
    let phone = dataInfo.filter((item: any) => {
      if (item.Phone !== null) {
        return item;
      }
    });
    let email = dataInfo.filter((item: any) => {
      if (item.Email !== null) {
        return item;
      }
    });

    setSelectedProfileRevealed({
      phoneLength: phone?.length,
      emailLength: email?.length,
    });
  };

  const handleChangePageNumber = (e: any) => {
    e.preventDefault();

    setPageNumber(e.target.value);
    listDetail(e.target.value);
  };

  const handleChangePageNumber2 = (chk: string) => {
    if (chk === "increase") {
      setPageNumber(pageNumber + 1);
      listDetail(pageNumber + 1);
    } else if (chk === "decrease") {
      setPageNumber(pageNumber - 1);
      listDetail(pageNumber - 1);
    }
  };

  const skeletonLoad = () => {
    return <Skeleton height="2rem" className="mb-2 bg-[#f34f1415] "></Skeleton>;
  };
 

  useEffect(() => {
    // checkPhone(entries);

    checkSelectedPhone(selectedProfile);
  }, [creditInfo]);

  useEffect(() => {
    listDetail(pageNumber);
  }, []);

  return (
    <div className=" h-[90vh]">
      <Dialog
        header={`Insufficient Credit`}
        visible={visible && insufficientCredit === "Insufficient credit"}
        className="p-2 bg-white w-fit max-w-[400px] lg:w-1/2"
        // style={{ maxWidth: "400px" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
          setInsufficientCredit("");
        }}
        draggable={false}
        resizable={false}
      >
        <div className="pb-3 w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className="flex">
              <i className="pi pi-exclamation-triangle text-yellow-700 p-1 rounded"></i>
              <span className=" text-sm">
                You have insufficient credits to view this profile(s).
              </span>
            </p>
          </div>

          <div className="mt-6 flex items-center pb-2">
            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={() => navigate("/subscription")}
                className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </Dialog>

      <Dialog
        header={`Export to ${TextToCapitalize(exportOptions)}`}
        visible={visible && exportOptions.length > 0}
        className="p-2 bg-white w-fit max-w-[400px] lg:w-1/2"
        // style={{ maxWidth: "400px" }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
        draggable={false}
        resizable={false}
      >
        <div className=" w-fit m-auto">
          <div className="flex flex-col gap-3 m-5 text-center">
            <p className="flex">
              <i className="pi pi-exclamation-triangle text-yellow-700 p-1 rounded"></i>
              <span className=" text-sm">
                Note: Only the rows with revealed email or phone number will be
                included in your export.
              </span>
            </p>
          </div>

          <div className="mt-6 flex mb-3">
            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={() => {
                  setVisible(false);
                  setExportOptions("");
                }}
                className="bg-gray-500 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                Cancel
              </button>
            </div>

            <div className=" cursor-pointer w-fit m-auto">
              <button
                onClick={exportCurrentList}
                className="bg-[#F35114] flex items-center gap-2 cursor-pointer text-white text-md rounded-full px-6 py-2"
              >
                {exportLoading ? <i className="pi pi-spinner pi-spin"></i> : ""}
                Export
              </button>
            </div>
          </div>
        </div>
      </Dialog>
 
      <div className="px-10">
         
        <div className="p-2 lg:flex flex-wrap gap-10 gap-y-3 items-center justify-between">
          <p className="">
            <span className="cursor-pointer" onClick={() => navigate("/list")}>
              List
            </span>{" "}
            /{" "}
            <span className="text-sm text-gray-500 ">
              {params?.listName?.replace(/-/g, " ")}
            </span>
          </p>

          <div className=" flex items-center gap-5">
            <button
              onClick={() => openDialog("hubspot")}
              className="transition_hover group text-xs flex items-center gap-2 cursor-pointer border hover:bg-[#F35114] border-[#F35114] font-bold hover:text-white text-[#F35114] px-2 py-1 rounded-lg"
            >
              <img
                src={hubspotLogo}
                className="w-5 transition_hover group-hover:p-1 bg-white rounded "
                alt=""
              />
              <span>Hubspot</span>
            </button>

            <button
              onClick={() => openDialog("email")}
              className="text-xs button_hover font-bold px-6 py-2 rounded-lg"
            >
              Export
            </button>
          </div>
        </div>

        <div className="my-2 flex flex-wrap justify-center gap-5 text-gray-600">
          <button
            className="text-xs cursor-pointer w-fit p-2 px-4 flex items-center justify-center gap-2  font-bold button_hover rounded-lg"
            onClick={() => handleShowButton("allPhone")}
          >
            {loadRow?.type == "allPhone" ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              ""
            )}
            <span className="flex items-center gap-1">
              <i className="pi pi-wallet"></i>
              <span>
                {(entries?.length - profilesRevealed?.phoneLength) * 5}
              </span>
            </span>
            Show all phone
          </button>
          <button
            className="text-xs cursor-pointer w-fit p-2 px-4 flex items-center justify-center gap-2  font-bold button_hover rounded-lg"
            onClick={() => handleShowButton("allEmail")}
          >
            {loadRow?.type == "allEmail" ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              ""
            )}
            <span className="flex items-center gap-1">
              <i className="pi pi-wallet"></i>
              <span>
                {(entries?.length - profilesRevealed?.emailLength) * 1}
              </span>
            </span>
            Show all email
          </button>
          <button
            className="text-xs cursor-pointer w-fit p-2 px-4 flex items-center justify-center gap-2  font-bold button_hover rounded-lg"
            onClick={() => handleShowButton("selectedPhone")}
          >
            {loadRow?.type == "selectedPhone" ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              ""
            )}
            {selectedProfile?.length ? (
              <span className="flex items-center gap-1">
                <i className="pi pi-wallet"></i>
                <span>
                  {(selectedProfile?.length -
                    selectedProfilesRevealed?.phoneLength) *
                    5}
                </span>
              </span>
            ) : (
              ""
            )}
            Show selected phone{" "}
          </button>
          <button
            className="text-xs cursor-pointer w-fit p-2 px-4 flex items-center justify-center gap-2  font-bold button_hover rounded-lg"
            onClick={() => handleShowButton("selectedEmail")}
          >
            {loadRow?.type == "selectedEmail" ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              ""
            )}
            {selectedProfile?.length ? (
              <span className="flex items-center gap-1">
                <i className="pi pi-wallet"></i>
                <span>
                  {(selectedProfile?.length -
                    selectedProfilesRevealed?.emailLength) *
                    1}
                </span>
              </span>
            ) : (
              ""
            )}
            Show selected email
          </button>
        </div>

<div className=" overflow-hidden overflow-y-auto scrollbar-hide h-[70vh] ">
        {loading ? (
          <DataTable
            value={Array(10).fill(loadingColumns)}
            // filters={filters}
            globalFilterFields={fields}
            tableStyle={{ minWidth: "100%" }}
            dataKey="row_id"
                  scrollable 
                  scrollHeight="70vh"
            // paginator
            className="text-sm rounded-lg overflow-hidden"
            rows={50}
            selectionMode={rowClick ? null : "checkbox"}
            onSelectionChange={(e: any) => setSelectedProfile(e.value)}
            selection={selectedProfile}
            paginatorTemplate="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport"
          >
            <Column
              selectionMode="multiple"
              headerClassName={"bg-[#F35114] p-3 "}
              className="bg-[#f34f146c] text-center"
              headerStyle={{ width: "3rem" }}
            ></Column>

            {columns.map((col) => (
              <Column
                key={col.field}
                field={col.field}
                className={`text-sm py-3 border-b border-gray-100 p-5 ${
                  col.header === "User"
                    ? "font-bold text-gray-700"
                    : "text-gray-500"
                }  `}
                // body={col.field}
                body={
                  col.field === "Phone"
                    ? skeletonLoad
                    : col.field === "Email"
                    ? skeletonLoad
                    : col.field === "Name"
                    ? skeletonLoad
                    : col.field === "Designation"
                    ? skeletonLoad
                    : col.field === "City"
                    ? skeletonLoad
                    : col.field === "State"
                    ? skeletonLoad
                    : col.field === "Country"
                    ? skeletonLoad
                    : col.field === ""
                    ? skeletonLoad
                    : col.field === "Organization"
                    ? skeletonLoad
                    : col.field === "Org Industry"
                    ? skeletonLoad
                    : col.field === "Org Size"
                    ? skeletonLoad
                    : null
                }
                // body={col.field === "Phone" ? showPhone : ''}
                header={col.header}
                headerClassName={"bg-[#F35114] text-white p-3 min-w-50"}
              />
            ))}
          </DataTable>
        ) : (
          <div className=" max-w-full my10 ">
            <DataTable
              value={entries}
              globalFilterFields={fields}
              tableStyle={{ minWidth: "100%" }}
              dataKey="row_id"
                  scrollable 
                  scrollHeight="70vh" 
              // paginator
              className="text-sm rounded-lg overflow-hidden"
              rows={50}
              selectionMode={rowClick ? null : "checkbox"}
              onSelectionChange={(e: any) => changeRowClick(e)}
              selection={selectedProfile}
              paginatorTemplate="RowsPerPageDropdown PrevPageLink PageLinks NextPageLink CurrentPageReport"
            >
              <Column
                selectionMode="multiple"
                headerClassName={"bg-[#F35114] p-3 "}
                className="bg-[#f34f146c] text-center"
                headerStyle={{ width: "3rem" }}
              ></Column>

              {columns.map((col) => (
                <Column
                  key={col.field}
                  field={col.field}
                  className={`text-sm py-3 border-b border-gray-100 p-5 ${
                    col.header === "User"
                      ? "font-bold text-gray-700"
                      : "text-gray-500"
                  }  `}
                  // body={col.field}
                  body={
                    col.field === "Phone"
                      ? showPhone
                      : col.field === "Email"
                      ? showEmail
                      : col.field === "Name"
                      ? showName
                      : col.field === ""
                      ? showLinkedIn
                      : col.field === "Designation"
                      ? showDesignation
                      : col.field === "City"
                      ? showCity
                      : col.field === "State"
                      ? showState
                      : col.field === "Country"
                      ? showCountry
                      : col.field === "Organization"
                      ? showOrganization
                      : col.field === "Org Industry"
                      ? showOrgIndustry
                      : null
                  }
                  // body={col.field === "Phone" ? showPhone : ''}
                  header={col.header}
                  headerClassName={"bg-[#F35114] text-white p-3 min-w-50"}
                />
              ))}
              {/* <Column
                    body={actionBodyTemplate}
                    className="border-b"
                    header="Actions"
                  /> */}
            </DataTable>
          </div>
        )}
</div>

        {/* pagination */}
        <div className="px-10 py-5 flex items-center m-auto">
          <div className="text-xs w-full m-auto  flex items-center justify-center gap-5">
            <div className="text-gray-500">Rows 50</div>
            <i
              className="pi pi-angle-left text-2xl text-gray-300 p-3 cursor-pointer"
              onClick={() => handleChangePageNumber2("decrease")}
            ></i>

            <input
              type="number"
              value={pageNumber}
              disabled
              className="w-fit text-center order border-gray-300"
              onChange={(e) => handleChangePageNumber(e)}
            />

            <i
              className="pi pi-angle-right text-2xl text-gray-300 p-3 cursor-pointer"
              onClick={() => handleChangePageNumber2("increase")}
            ></i>
            {/* <div className="text-gray-500">
            {" "}
            {Math.round(totalDataCount / 50).toLocaleString()} pages
          </div> */}
          </div>
        </div>

        {/* <div className="flex gap-2 items-center justify-start">
          <div
            onClick={deleteList}
            className="flex items-center cursor-pointer gap-2 px-10 py-2 bg-amber-300 text-gray-600 text-xs w-fit rounded"
          >
            {loadingDeletePage ? (
              <i className="pi pi-spin pi-spinner"></i>
            ) : (
              <i className="pi pi-trash"></i>
            )}
            Delete List
          </div>
          <div
            onClick={() => setRenameListAction(true)}
            className="flex items-center cursor-pointer gap-2 px-10 py-2 text-white bg-gray-400 text-xs w-fit rounded"
          >
            <i className="pi pi-pencil"></i>
            <span>Rename List</span>
          </div>
        </div> */}
      </div>
    </div>
  );
}
