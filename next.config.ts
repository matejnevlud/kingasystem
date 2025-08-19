import type { NextConfig } from "next";
import withFlowbiteReact from "flowbite-react/plugin/nextjs";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  /* config options here */
};

const configWithPWA = withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig);

export default withFlowbiteReact(configWithPWA);