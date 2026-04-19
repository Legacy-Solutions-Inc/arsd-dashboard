"use client";

import { Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
);

/**
 * Resolve CSS custom properties at runtime so charts track the active theme.
 * Re-reads on theme change; safe on SSR via hex fallbacks.
 */
function useChartColors() {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState({
    primary: "#c71f1f",
    primarySoft: "rgba(199, 31, 31, 0.18)",
    success: "#10b981",
    warning: "#f59e0b",
    info: "#0ea5e9",
    foreground: "#1a1a1a",
    muted: "#635f58",
    border: "#e2ded8",
  });

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    const hsl = (name: string, alpha = 1) => {
      const v = root.getPropertyValue(name).trim();
      if (!v) return alpha < 1 ? `hsla(0, 0%, 0%, ${alpha})` : "#000";
      return alpha < 1 ? `hsla(${v}, ${alpha})` : `hsl(${v})`;
    };
    setColors({
      primary: hsl("--primary"),
      primarySoft: hsl("--primary", 0.18),
      success: "#10b981",
      warning: "#f59e0b",
      info: "#0ea5e9",
      foreground: hsl("--foreground"),
      muted: hsl("--muted-foreground"),
      border: hsl("--border"),
    });
  }, [resolvedTheme]);

  return colors;
}

export default function DashboardCharts({ costData }: { costData: any[] }) {
  const c = useChartColors();

  const barData = useMemo(
    () => ({
      labels: ["Jan", "Feb", "Mar", "Apr", "May"],
      datasets: [
        { label: "Target", data: costData.map((d) => d.target), backgroundColor: c.primary },
        { label: "SWA", data: costData.map((d) => d.swa), backgroundColor: c.success },
        { label: "Billed", data: costData.map((d) => d.billed), backgroundColor: c.warning },
        { label: "Direct", data: costData.map((d) => d.direct), backgroundColor: c.info },
      ],
    }),
    [costData, c.primary, c.success, c.warning, c.info],
  );

  const lineData = useMemo(
    () => ({
      labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
      datasets: [
        {
          label: "Accumulative progress",
          data: Array.from({ length: 30 }, (_, i) => i * 3.3),
          borderColor: c.primary,
          backgroundColor: c.primarySoft,
          fill: true,
          tension: 0.35,
        },
      ],
    }),
    [c.primary, c.primarySoft],
  );

  const sharedOptions = useMemo(
    () => ({
      responsive: true,
      plugins: {
        legend: {
          position: "top" as const,
          labels: { color: c.foreground, font: { size: 12 } },
        },
        title: { display: false },
        tooltip: {
          backgroundColor: c.foreground,
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          borderColor: c.border,
          borderWidth: 1,
          cornerRadius: 6,
          padding: 10,
        },
      },
    }),
    [c.foreground, c.border],
  );

  const barOptions = useMemo(
    () => ({
      ...sharedOptions,
      scales: {
        x: { ticks: { color: c.muted }, grid: { color: c.border } },
        y: { ticks: { color: c.muted }, grid: { color: c.border } },
      },
    }),
    [sharedOptions, c.muted, c.border],
  );

  const lineOptions = useMemo(
    () => ({
      ...sharedOptions,
      scales: {
        x: { ticks: { color: c.muted }, grid: { color: c.border } },
        y: {
          min: 0,
          max: 100,
          ticks: { stepSize: 20, color: c.muted },
          grid: { color: c.border },
        },
      },
    }),
    [sharedOptions, c.muted, c.border],
  );

  return (
    <div className="flex flex-col gap-6">
      <Bar data={barData} options={barOptions} height={300} />
      <Line data={lineData} options={lineOptions} height={300} />
    </div>
  );
}
