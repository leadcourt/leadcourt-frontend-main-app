// hooks/usePayPalScript.ts
import { useEffect, useState } from "react";

export const PaymentSDK = () => {
  const [loaded, setLoaded] = useState(false);

  const clientId = import.meta.env.VITE_PP_CLIENT_ID

  useEffect(() => {
    const scriptId = "paypal-sdk";

    // Avoid injecting the script multiple times
    if (document.getElementById(scriptId)) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}`;
    script.id = scriptId;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => {
      console.error("Failed to load the PayPal SDK script.");
      setLoaded(false);
    };

    document.body.appendChild(script);
  }, [clientId]);

  return loaded;
};
