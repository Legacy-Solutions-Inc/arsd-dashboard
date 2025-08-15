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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardCharts({ costData }: { costData: any[] }) {
  return (
    <div className="flex flex-col gap-8 justify-center items-center">
      {/* Bar Chart */}
      <Bar
        data={{
          labels: ["Jan", "Feb", "Mar", "Apr", "May"],
          datasets: [
            {
              label: "Target Cost",
              data: costData.map((d) => d.target),
              backgroundColor: "#ef4444", // arsd-red
            },
            {
              label: "SWA Cost",
              data: costData.map((d) => d.swa),
              backgroundColor: "#22c55e", // green
            },
            {
              label: "Billed Cost",
              data: costData.map((d) => d.billed),
              backgroundColor: "#f59e42", // orange
            },
            {
              label: "Direct Cost",
              data: costData.map((d) => d.direct),
              backgroundColor: "#3b82f6", // blue
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "Cost Analysis" },
          },
        }}
        height={300}
      />
      {/* S-Curve Line Chart */}
      <Line
        data={{
          labels: Array.from({ length: 30 }, (_, i) => `Day ${i + 1}`),
          datasets: [
            {
              label: "Total",
              data: Array.from({ length: 30 }, (_, i) => i * 3.3),
              borderColor: "#ef4444",
              backgroundColor: "rgba(239,68,68,0.2)",
              fill: true,
            },
          ],
        }}
        options={{
          responsive: true,
          plugins: {
            legend: { position: "top" },
            title: { display: true, text: "S-Curve Progress" },
          },
          scales: {
            y: { min: 0, max: 100, ticks: { stepSize: 20 } },
          },
        }}
        height={300}
      />
    </div>
  );
}
