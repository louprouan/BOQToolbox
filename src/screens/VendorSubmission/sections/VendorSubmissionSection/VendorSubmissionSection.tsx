import React from "react";

export const VendorSubmissionSection = (): JSX.Element => {
  const navigationItems = [
    { label: "Dashboard", isActive: false },
    { label: "Vendor", isActive: false },
    { label: "Tender", isActive: true },
    { label: "Expediting", isActive: false },
  ];

  return (
    <nav className="flex items-center px-3 py-0 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-[#0000000f]">
      {navigationItems.map((item, index) => (
        <div
          key={index}
          className={`inline-flex h-[46px] items-center p-3 relative flex-[0_0_auto] cursor-pointer ${
            item.isActive
              ? "border-b-2 [border-bottom-style:solid] border-[#008080]"
              : ""
          }`}
        >
          <div
            className={`relative w-fit mt-[-2.00px] [font-family:'Montserrat',Helvetica] font-normal text-sm tracking-[0] leading-[22px] whitespace-nowrap ${
              item.isActive ? "text-[#008080]" : "text-[#001d3d]"
            }`}
          >
            {item.label}
          </div>
        </div>
      ))}
    </nav>
  );
};
