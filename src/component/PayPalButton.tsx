// components/PayPalButton.tsx
import { useEffect, useState } from "react";
import { PaymentSDK } from "./PaymentSDK";
import { toast } from "react-toastify"; 
import { useNavigate } from "react-router-dom";


interface PayPalCustomerDetail {
  amount: string;
  userId: string;
  subscriptionType: 'STARTER' | 'PRO' | 'BUSINESS' | 'CUSTOM';
  customData?: Record<string, any>;
}


const PayPalButton = (paymentInfo: any) => {
  const isScriptLoaded = PaymentSDK();

  const [customerPaymentInfo, setCustomerPaymentInfo] = useState<PayPalCustomerDetail>()

  const navigate = useNavigate()
 

  const paypalFunction = () => {


    if (isScriptLoaded && (window as any).paypal) {
      (window as any).paypal.Buttons({
        createOrder: (data: any, actions: any) => {
          data = paymentInfo
          
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: data.paymentInfo.amount.toString(), 
                },
                custom_id: JSON.stringify(customerPaymentInfo)
              },
            ],
          });
        },
        onApprove: (data: any, actions: any) => {
          JSON.stringify(data)
          
          return actions.order.capture().then(() => { 

            toast.success('Payment processing..')
            navigate('/subscription/balance')
          });
        },
        onError: () => {
          toast.error(`Transaction not completed!!!`);

        },
      }).render("#paypal-button-container");
    }
  }
  

  useEffect(() => {
    paypalFunction()
    setCustomerPaymentInfo({
      amount: paymentInfo.paymentInfo.amount,
      userId: paymentInfo.paymentInfo.userId, 
      subscriptionType: paymentInfo.paymentInfo.plan
    })

  
  }, [isScriptLoaded]);

  return <div id="paypal-button-container"></div>;
};

export default PayPalButton;

 