"use client";

import dynamic from "next/dynamic";
import type { TrafficChartsProps } from "./TrafficCharts";

const TrafficChartsNoSSR = dynamic(
  () => import("./TrafficCharts").then((m) => m.TrafficCharts),
  { ssr: false },
);

export function TrafficChartsClient(props: TrafficChartsProps) {
  return <TrafficChartsNoSSR {...props} />;
}
