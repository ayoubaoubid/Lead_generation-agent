import type { Metadata } from "next";

import { DesignSystemDemo } from "./showcase";
import "./showcase.css";

export const metadata: Metadata = {
  title: "Design system — Lead Generation Sales",
  description: "Référence interne des composants et tokens de la plateforme.",
};

export default function DesignSystemPage() {
  return <DesignSystemDemo />;
}
