"use client"

import React from "react";
import {HeroUIProvider} from "@heroui/react";

export default function Providers({ children }) {
  return <HeroUIProvider>{children}</HeroUIProvider>;
}
