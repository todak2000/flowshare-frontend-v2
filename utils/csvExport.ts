import { ProductionEntry } from '../types';

export const generateCSV = (data: ProductionEntry[]): string => {
  const headers = [
    "Date",
    "Partner", 
    "Volume (bbl)",
    "BSW %",
    "Temperature (°F)",
    "Pressure (psi)",
  ];

  const rows = data.map((item) => {
    const date = item.timestamp instanceof Date
      ? item.timestamp.toLocaleDateString()
      : new Date(item.timestamp).toLocaleDateString();

    return [
      date,
      item.partner,
      item.gross_volume_bbl.toString(),
      item.bsw_percent.toString(),
      item.temperature_degF.toString(),
      item.pressure_psi.toString(),
    ];
  });

  return [headers, ...rows].map((row) => row.join(",")).join("\n");
};

export const downloadCSV = (data: ProductionEntry[], filename?: string) => {
  const csv = generateCSV(data);
  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename || `production-report-${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};