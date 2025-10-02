import React from "react";

// Example data source type
export type DataSource = {
  id: string;
  name: string;
  importedBy: string;
  date: string;
  status: "error" | "ok";
  refreshUrl?: string;
};

// Example data, replace with your actual data
const dataSources: DataSource[] = [
  {
    id: "1",
    name: "ssdsd/",
    importedBy: "You",
    date: "Just now",
    status: "error",
    refreshUrl: "#",
  },
  // Add more sources as needed
];

export default function DataSourceTable() {
  return (
    <div style={{ background: "#edf0f1", minHeight: "100vh", padding: 32 }}>
      <h2 style={{ marginBottom: 24 }}>Knowledge base</h2>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24 }}>
        <div style={{ fontWeight: 500, marginBottom: 16 }}>
          All data sources ({dataSources.length})
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #eee", color: "#888" }}>
              <th style={{ width: 40 }}></th>
              <th>Data source</th>
              <th>Imported by</th>
              <th>Date</th>
              <th>Status</th>
              <th>Refresh</th>
            </tr>
          </thead>
          <tbody>
            {dataSources.map((ds) => (
              <tr key={ds.id} style={{ borderBottom: "1px solid #f5f5f5" }}>
                <td>
                  <input type="checkbox" />
                </td>
                <td>
                  <a
                    href="#"
                    style={{ color: "#1677ff", textDecoration: "underline" }}
                  >
                    {ds.name}
                  </a>
                </td>
                <td>{ds.importedBy}</td>
                <td>{ds.date}</td>
                <td>
                  {ds.status === "error" ? (
                    <span style={{ color: "#ff4d4f" }}>❗</span>
                  ) : (
                    <span style={{ color: "#52c41a" }}>✔️</span>
                  )}
                </td>
                <td>
                  <a href={ds.refreshUrl || "#"} style={{ color: "#1677ff" }}>
                    Never
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Example usage in a workspace or page component
// Import this component where you want to display the table:
// import DataSourceTable from './components/knowledge-base/DataSourceTable';

// Then use it in your JSX:
// <DataSourceTable />

// If you want to pass real data, replace the mock dataSources array with your actual data from props or state.
