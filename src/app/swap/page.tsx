import React from "react";
import Component from "../components/Swap2";

const Page = () => {
  return (
    <div className="relative z-0 flex flex-col items-center justify-center min-h-screen px-4 lg:px-24">
      <div
        className="absolute -z-[1] top-0 left-0"
        style={{
          backgroundImage: "url('/feature-bg.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: "100%",
          width: "100%",
        }}
      />
      <h3 className="text-[#ED8FDD] font-medium text-[45px] font-oswald mb-4">
        SWAP
      </h3>
      <Component />
    </div>
  );
};

export default Page;
