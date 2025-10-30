import {
  BriefcaseIcon,
  ChevronLeftIcon,
  DollarSignIcon,
  FileCheckIcon,
  FolderIcon,
  HelpCircleIcon,
  HistoryIcon,
  PinIcon,
  StarIcon,
  TagIcon,
} from "lucide-react";
import React from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { PriceLevelingTool } from "../../../../components/PriceLeveling/PriceLevelingTool";
import { BoQEditor } from "../../../../components/BoQEditor/BoQEditor";

const countdownData = [
  { value: "05", label: "DAYS" },
  { value: "12", label: "HOURS" },
  { value: "32", label: "MINUTES" },
];

const navigationTabs = [
  { icon: TagIcon, label: "Details", active: false },
  { icon: FolderIcon, label: "Tender Documentation", active: false, component: "boq-editor" },
  { icon: FileCheckIcon, label: "Submission Tab", active: false },
  { icon: HelpCircleIcon, label: "Questionnaire", active: false },
  { icon: HistoryIcon, label: "RFIs", active: false },
  { icon: PinIcon, label: "Bulletin", active: false },
  { icon: BriefcaseIcon, label: "Vendor Submission", active: false },
  { icon: DollarSignIcon, label: "Price Levelling", active: false, component: "price-leveling" },
  { icon: StarIcon, label: "Award", active: false },
];

export const TenderDetailsSection = (): JSX.Element => {
  const [activeTab, setActiveTab] = React.useState<string>("price-leveling");

  const getActiveTabComponent = () => {
    switch (activeTab) {
      case "boq-editor":
        return <BoQEditor />;
      case "price-leveling":
        return <PriceLevelingTool />;
      default:
        return <PriceLevelingTool />;
    }
  };

  return (
    <section className="flex flex-col items-start gap-6 p-6 w-full bg-white rounded overflow-hidden">
      <header className="flex items-center justify-between w-full">
        <div className="flex flex-col items-start gap-3">
          <div className="flex flex-col h-[46px] items-start gap-3 w-full">
            <div className="flex flex-col items-start justify-center">
              <h1 className="w-fit mt-[-1.00px] [font-family:'Montserrat',Helvetica] font-medium text-[#001d3d] text-xl tracking-[0] leading-[46px] whitespace-nowrap">
                Tender Management - Concrete Tender
              </h1>
            </div>
          </div>

          <div className="flex flex-col items-start w-full">
            <Button
              variant="ghost"
              className="h-auto inline-flex items-center justify-center gap-2 p-0 rounded-md"
            >
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="font-base-normal font-[number:var(--base-normal-font-weight)] text-[#001d3d] text-[length:var(--base-normal-font-size)] tracking-[var(--base-normal-letter-spacing)] leading-[var(--base-normal-line-height)] [font-style:var(--base-normal-font-style)]">
                Back to Tender Packages List
              </span>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          {countdownData.map((item, index) => (
            <React.Fragment key={item.label}>
              <Card className="bg-white rounded-lg overflow-hidden border border-solid border-[#0000000f] shadow-box-shadow-secondary">
                <CardContent className="flex items-center gap-2.5 pt-3 pb-1.5 px-7">
                  <div className="flex flex-col w-10 items-center gap-px">
                    <div className="flex items-center justify-center mt-[-1.00px] [font-family:'Montserrat',Helvetica] font-medium text-[#001d3d] text-[26px] text-center tracking-[0] leading-[22px]">
                      {item.value}
                    </div>
                    <div className="[font-family:'Montserrat',Helvetica] font-normal text-[#00000073] text-[10px] text-center tracking-[0] leading-[22px]">
                      {item.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
              {index < countdownData.length - 1 && (
                <div className="flex flex-col w-1 items-start gap-2">
                  <div className="w-full h-1 bg-[#00000073] rounded-sm" />
                  <div className="w-full h-1 bg-[#00000073] rounded-sm" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </header>

      <div className="flex flex-col items-start gap-6 w-full">
        <nav className="flex h-[46px] items-center border-b [border-bottom-style:solid] border-[#0000000f]">
          {navigationTabs.map((tab) => {
            const IconComponent = tab.icon;
            const isActive = tab.component === activeTab;
            return (
              <Button
                key={tab.label}
                variant="ghost"
                className={`h-auto flex h-[46px] items-center gap-2 px-4 py-3 ${
                  isActive
                    ? "border-b-2 [border-bottom-style:solid] border-[#008080]"
                    : ""
                }`}
                onClick={() => tab.component && setActiveTab(tab.component)}
              >
                <IconComponent className="w-4 h-4" />
                <span
                  className={`mt-[-2.00px] [font-family:'Montserrat',Helvetica] font-normal text-sm tracking-[0] leading-[22px] whitespace-nowrap ${
                    isActive ? "text-[#008080]" : "text-[#001d3d]"
                  }`}
                >
                  {tab.label}
                </span>
              </Button>
            );
          })}
        </nav>

        <div className="flex flex-col w-full items-start gap-9">
          <div className="w-full">
            {activeTab === "price-leveling" && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#001d3d] mb-2">
                  Price Leveling Tool
                </h2>
                <p className="text-gray-600">
                  Consolidate and analyze offers from multiple bidders
                </p>
              </div>
            )}
            {activeTab === "boq-editor" && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-[#001d3d] mb-2">
                  BoQ Template Generator
                </h2>
                <p className="text-gray-600">
                  Create and customize Bill of Quantities templates
                </p>
              </div>
            )}
            {getActiveTabComponent()}
          </div>
        </div>
      </div>
    </section>
  );
};
