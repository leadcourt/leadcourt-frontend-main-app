 

export default function  TextToCapitalize (text: any) {
  
    const c = text?.split(" ").map((word: any) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    return c;
  };