import { BellIcon, GlobeIcon, SettingsIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "../../components/ui/breadcrumb";
import { Button } from "../../components/ui/button";
import { TenderDetailsSection } from "./sections/TenderDetailsSection/TenderDetailsSection";
import { VendorSubmissionSection } from "./sections/VendorSubmissionSection/VendorSubmissionSection";

const navigationIcons = [
  { src: "/icon---homeoutlined.svg", alt: "Icon homeoutlined" },
  { src: "/icon---tooloutlined.svg", alt: "Icon tooloutlined" },
];

const moduleIcons = [
  { src: "/polaris-module-inverted-1.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted-3.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted-6.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted-5.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted-4.svg", alt: "Polaris module" },
  { src: "/polaris-module-inverted-2.svg", alt: "Polaris module" },
];

export const VendorSubmission = (): JSX.Element => {
  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <aside className="flex flex-col w-[65px] items-center gap-6 px-[12.5px] py-6 bg-white shadow-box-shadow-tertiary">
        <div className="flex w-10 items-center gap-2.5 flex-[0_0_auto]">
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center justify-center gap-2.5 p-2 flex-1 h-auto"
          >
            <img
              className="w-[18px] h-[18px]"
              alt="Icon"
              src="/icon---doublerightoutlined.svg"
            />
          </Button>
        </div>

        <div className="flex flex-col items-center pt-6 pb-0 px-0 self-stretch w-full flex-[0_0_auto]">
          <div className="flex flex-col items-start justify-center self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start justify-center self-stretch w-full flex-[0_0_auto]">
              {navigationIcons.map((icon, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="flex w-10 h-10 items-center justify-center gap-2 px-7 py-0 rounded-lg"
                >
                  <img
                    className="w-4 h-4 ml-[-16.00px] mr-[-16.00px]"
                    alt={icon.alt}
                    src={icon.src}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start justify-center self-stretch w-full flex-[0_0_auto]">
            <div className="flex flex-col items-start justify-center self-stretch w-full flex-[0_0_auto]">
              {moduleIcons.map((icon, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="flex w-10 h-10 items-center justify-center gap-2 px-7 py-0 rounded-lg"
                >
                  <img
                    className="w-4 h-4 ml-[-16.00px] mr-[-16.00px]"
                    alt={icon.alt}
                    src={icon.src}
                  />
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start justify-center self-stretch w-full flex-[0_0_auto]">
            <Button
              variant="ghost"
              size="sm"
              className="flex w-10 h-10 items-center justify-center gap-2 px-7 py-0 rounded-lg"
            >
              <img
                className="w-4 h-4 ml-[-16.00px] mr-[-16.00px]"
                alt="Icon settingoutlined"
                src="/icon---settingoutlined-1.svg"
              />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Header */}
        <header className="flex w-full h-16 items-center gap-2.5 bg-transparent border-b border-[#0000000f]">
          <div className="flex items-center justify-around gap-[975px] px-6 py-0 flex-1">
            <div className="flex items-center justify-between flex-1">
              <div className="inline-flex items-center self-stretch flex-[0_0_auto]">
                <div className="inline-flex flex-col items-start justify-center gap-2.5 pl-0 pr-5 py-3 flex-[0_0_auto]">
                  <div className="inline-flex items-center gap-2.5 flex-[0_0_auto]">
                    <img
                      className="w-[77.59px] h-6 object-cover"
                      alt="Polaris edge"
                      src="/polaris-edge-2.png"
                    />
                  </div>
                </div>
              </div>

              <div className="inline-flex items-center justify-center gap-2.5 flex-[0_0_auto]">
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                  <SettingsIcon className="w-6 h-6" />
                </Button>

                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                  <BellIcon className="w-6 h-6" />
                </Button>

                <Button variant="ghost" size="sm" className="w-6 h-6 p-0">
                  <GlobeIcon className="w-6 h-6" />
                </Button>

                <div className="flex w-8 h-8 items-start gap-2 rounded-[96px]">
                  <img
                    className="w-8 h-8 rounded-[999px] object-cover"
                    alt="Rectangle"
                    src="/rectangle-3.png"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex items-center gap-2.5 p-6 bg-[#e6f2f2] flex-1">
          <div className="flex flex-col items-start gap-6 flex-1">
            {/* Breadcrumb */}
            <div className="inline-flex flex-wrap items-center gap-[0px_0px] px-6 py-0 flex-[0_0_auto]">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="gap-1 pl-0 pr-1 py-0 rounded inline-flex items-center flex-[0_0_auto]">
                      <div className="w-fit mt-[-1.00px] [font-family:'Montserrat',Helvetica] font-normal text-[#00000073] text-sm tracking-[0] leading-[22px] whitespace-nowrap">
                        River bridge
                      </div>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="gap-2.5 px-2 py-0 inline-flex items-center flex-[0_0_auto]">
                    <div className="inline-flex flex-col items-start gap-2 flex-[0_0_auto]">
                      <div className="w-fit mt-[-1.00px] [font-family:'Roboto',Helvetica] font-normal text-[#00000073] text-sm tracking-[0] leading-[22px] whitespace-nowrap">
                        /
                      </div>
                    </div>
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    <Badge className="inline-flex items-center gap-1 px-3 py-0.5 flex-[0_0_auto] bg-[#008080] rounded">
                      <div className="w-fit mt-[-1.00px] [font-family:'Montserrat',Helvetica] font-normal text-white text-xs tracking-[0] leading-[normal]">
                        Procurement
                      </div>
                    </Badge>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            {/* Sections */}
            <VendorSubmissionSection />
            <TenderDetailsSection />
          </div>
        </main>
      </div>
    </div>
  );
};
