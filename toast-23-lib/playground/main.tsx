import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Playground } from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Playground />
  </StrictMode>,
);
