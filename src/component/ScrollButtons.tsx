import { useEffect, useState } from "react";

export default function ScrollButtons() {
  const [scrollY, setScrollY] = useState(0);

  const handleScrollUp = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setScrollY(0);
  };
  const handleScrollDown = () => {
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
    setScrollY(document.body.scrollHeight);

  };
 

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  return (
    <div>
      <div className="flex flex-col gap-2">
        {scrollY < 100 ?"":<button onClick={handleScrollUp}><i className='pi pi-angle-up  cursor-pointer rounded-full bg-[#F35114] opacity-80 p-5 text-2xl text-white font-bold '></i></button>}
        {scrollY > document.body.scrollHeight - window.innerHeight - 100 ? "":<button onClick={handleScrollDown}><i className='pi pi-angle-down cursor-pointer rounded-full bg-[#F35114] opacity-80 p-5 text-2xl text-white font-bold '></i></button>}
      </div>
    </div>
  )
}
