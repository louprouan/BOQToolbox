import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { VendorSubmission } from "./screens/VendorSubmission/VendorSubmission";

createRoot(document.getElementById("app") as HTMLElement).render(
  <StrictMode>
    <VendorSubmission />
  </StrictMode>,
);
