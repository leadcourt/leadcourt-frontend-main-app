import { Link } from "react-router-dom";
import SwitchInputButton from "../../component/SwitchInputButton";
import { useRecoilState, useRecoilValue } from "recoil";
import { creditState, userState } from "../../utils/atom/authAtom";
import { getAllTransactions, getCreditBalance } from "../../utils/api/creditApi";
import { useEffect, useState } from "react";
import TextToCapitalize from "../../component/TextToCapital";
// import { getLocation } from "../../utils/api/location";


interface TransactionDataStructure{
  currency: string;
  plan: string;
  price: number;
  purchaseDate: string;
  status: string;
  subscriptionId: string;
}

export default function CreditBalance() {
  const user = useRecoilValue(userState)
    const [creditInfo, setCreditInfo] = useRecoilState(creditState)
    const [pageNumber, setPageNumber] = useState<number>(1)
    const [transactions, setTransactions] = useState<TransactionDataStructure[]>()
    
  // const [location, setLocation] = useState<string>('');


  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const formattedDate = date.toLocaleDateString("en-GB"); // DD/MM/YYYY format
    const formattedTime = date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} ${formattedTime}`;
  };
  // Get credit balance..
  const getCredit = async () => {
    await getCreditBalance().then((res)=>{
      setCreditInfo({id:user?.id ?? '', credits:res?.data?.credits||0, subscriptionType: res?.data?.subscriptionType || 'FREE'})
      
    })

    await getAllTransactions(pageNumber).then((res: any)=>{
      
      setTransactions(res?.data?.data)
    })
  }

  
  // const sub_price = ['₹', '$'];
  // const [paymentAmount, setPaymentAmount] = useState<string>(sub_price[1]);

  
  // const checkLocation = async () => {
  //   await getLocation().then((res) => {
  //     console.log("location response", res);
  //     setLocation(res?.data?.country);
  //     console.log(location);
      
  //     if (res?.data?.country=='IN'){
  //       setPaymentAmount(sub_price[0])
  //     } else {
  //       setPaymentAmount(sub_price[1])
  //     }
  //   });
  // };

  useEffect(()=>{
    getCredit()
    setPageNumber(1)
    // checkLocation();
  }, [])

  
  return (
    <div className="p-5 my-3">
      <div className="mt-10 mb-5">
        {/* <h3 className="text-sm text-gray-400">Manage Subscription</h3> */}
        <p className="text-4xl font-bold text-gray-600 my-2">
          My Subscriptions
        </p>
        <p className=" text-gray-500">
          Here is list of package/product that you have subscribed.
        </p>
      </div>
      <div className="my-5 rounded-xl p-5 border border-red-100">
      <div className="">
        <h3>Credit Balance</h3>
        <p className="flex items-center gap-2"><span className="pi pi-wallet text-[#f34f14] text-xs"></span><span className="text-gray-500">{creditInfo?.credits}</span></p>
        </div>
        <div className=" mt-5">
        <h3>Subscription</h3>
        <p className="flex items-center gap-2"><span className="pi pi-briefcase text-[#f34f14] text-xs"></span><span className="text-gray-500">{creditInfo?.subscriptionType}</span></p>
        </div>

      </div>
      <div className="">
        {transactions?.map((items)=>(

        <div key={items.subscriptionId} className={` ${items?.subscriptionId === transactions[0]?.subscriptionId ? '': 'bg-gray-50'}   lg:flex border border-red-50 hover:shadow shadow-red-200 rounded-xl overflow-hidden mb-5`}>
          <div className=" p-5 w-full">
            <div className="flex justify-between  flex-wrap mb-2 lg:mb-0">
              <p className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-[#f34f14]">
                {TextToCapitalize(`${items?.plan.toLowerCase()} Plan`)}
                </span>

                {
                    items.status === 'DENIED' || items.status.toLowerCase() === 'failed' ? '':
                items?.subscriptionId === transactions[0]?.subscriptionId ?
                <span className="text-[10px] bg-teal-300 text-white font-bold px-3 py-1 rounded-full">
                  
                  
                  Active
                </span>
                :
                
                <span className="text-[10px] bg-gray-300 text-white font-bold px-3 py-1 rounded-full">
                  Expired
                </span>
                }
              </p>
              <SwitchInputButton />
            </div>
            <p className="">
              <span className="text-sm text-gray-400">Subscription ID:</span>
              <span className="ml-2 text-lg text-gray-600">
                 {items.subscriptionId}
              </span>
            </p>
            <div className="mt-10 flex justify-between flex-wrap">
              <div className="text-sm">
                <p className=" text-gray-400">Start date</p>
                <p className=" text-gray-700">{formatDate(items.purchaseDate)}</p>
              </div>
              <div className="text-sm">
                <p className=" text-gray-400">Price</p>
                <p className=" text-gray-700">{items.currency === 'USD' ? '$': 
                  items.currency === 'INR' ? '₹' : ''} {items.price}</p>
              </div>
              <div className="text-sm">
                <p className=" text-gray-400">Status</p>

                {/* 
                // Payment capture completed, 
                Payment capture denied, 
                Payment capture pending, 
                Payment capture refunded, 
                Payment capture reversed
                
                */}
                <p className={` text-gray-700 text-xs px-3 py-1 rounded-full textwhite
                
                  ${
                    items.status === 'COMPLETED'?
                    'bg-green-200' :
                    items.status === 'DENIED' || items.status.toLowerCase() === 'failed' ?
                    'bg-red-200' :
                    items.status === 'PENDING'?
                    'bg-yellow-200' :
                    items.status === 'REFUNDED'?
                    'bg-purple-300' :
                    items.status === 'REVERSED'?
                    'bg-blue-300' :
                    ''
                  }
                `}>
                  {items.status === 'DENIED'? 'Failed':TextToCapitalize(items.status.toLowerCase())}
                  </p>
              </div>
            </div>
          </div>

          {items?.subscriptionId === transactions[0]?.subscriptionId ?

          <div className="bg-red-50 p-5 w-full lg:w-[270px] flex items-center justify-center">
            <div className="">
            <div className="w-fit m-auto">
              <Link to='/subscription/' className="bg-[#f34f14] font-bold text-white min-w-[100px] px-3 py-1 transition hover:py-2 text-center rounded-lg">
                Change Plan
              </Link>
            </div>
            {/* <p className="text-gray-500 text-sm mt-2 text-center">
              Next Billing on June 27, 2025
            </p> */}
            </div>
          </div>

:

          <div className="bg-red-50 p-5 w-full lg:w-[270px] flex items-center justify-center">
            <div className="">
            <div className="w-fit m-auto">
              <Link to='/subscription/' className="bg-white border text-[#f34f14] border-[#f34f14] hover:text-white hover:bg-[#f34f14] font-bold min-w-[100px] px-3 py-1 text-center rounded-lg">
                Renew Plan
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-2 text-center">
            You can renew the plan anytime.
            </p>
            </div>
          </div>}
        </div>
        ))}
        
        {/* <div className="lg:flex border border-gray-50 hover:shadow shadow-gray-200 bg-gray-50 rounded-xl overflow-hidden mb-5">
          <div className=" p-5 w-full">
            <div className="flex justify-between  flex-wrap mb-2 lg:mb-0">
              <p className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-[#f34f146c]">
                  Pro Plan
                </span>
                <span className="text-[10px] bg-gray-300 text-white font-bold px-3 py-1 rounded-full">
                  Expired
                </span>
              </p>
              <SwitchInputButton disabled={true} renewHistory={'true'}/>
            </div>
            <p className="">
              <span className="text-sm text-gray-400">Subscription ID:</span>
              <span className="ml-2 text-lg text-gray-600">
                TXN9034eri8587820250424
              </span>
            </p>
            <div className="mt-10 flex justify-between flex-wrap">
              <div className="text-sm">
                <p className=" text-gray-400">Start date</p>
                <p className=" text-gray-700">April 24, 2025</p>
              </div>
              <div className="text-sm">
                <p className=" text-gray-400">Price</p>
                <p className=" text-gray-700">$60</p>
              </div>
              <div className="text-sm">
                <p className=" text-gray-400">Access</p>
                <p className=" text-gray-700">Pro Access</p>
              </div>
            </div>
          </div>
          <div className="bg-red-50 p-5 w-full lg:w-[270px] flex items-center justify-center">
            <div className="">
            <div className="w-fit m-auto">
              <Link to='/subscription/' className="bg-white border text-[#f34f14] border-[#f34f14] hover:text-white hover:bg-[#f34f14] font-bold min-w-[100px] px-3 py-1 text-center rounded-lg">
                Renew Plan
              </Link>
            </div>
            <p className="text-gray-500 text-sm mt-2 text-center">
            You can renew the plan anytime.
            </p>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
}
