import type { Metadata } from "next";
import AboutClient from "./AboutClient";

export const metadata: Metadata = {
  title: "About Us – 3T Dairy Payment Network",
  description: "Explore the vision, architecture, and technology behind the 3T Dairy Payment Network.",
};

export default function AboutPage() {
  return <AboutClient />;
}
