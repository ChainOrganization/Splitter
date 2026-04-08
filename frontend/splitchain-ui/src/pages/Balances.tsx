import { useState } from "react";
import type { Group, Balances as BalancesType } from "../types";

interface Props {
  group: Group | null;
}

export default function Balances({ group }: Props) {
  const [balances, setBalances] = useState<BalancesType | null>(null);
  const [status, setStatus] = useState("");

  const fetchBalances = async () => {
    if (!group) { setStatus("Create a group first."); return; }

    // TODO: call contract.get_balances via Soroban RPC
    // Simulated data for now
    const mock: BalancesType = {};
    group.members.forEach((m, i) => {
      mock[m] = i === 0 ? 20 : -10;
    });
    setBalances(mock);
    setStatus("");
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Balances</h2>
      {group && (
        <p style={{ color: "#888", marginBottom: "1rem" }}>
          Group: <strong style={{ color: "#fff" }}>{group.id}</strong>
        </p>
      )}

      <button onClick={fetchBalances} style={btnStyle}>Fetch Balances</button>

      {status && <p style={{ marginTop: "1rem", color: "#f66" }}>{status}</p>}

      {balances && (
        <table style={{ marginTop: "1.5rem", width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #333" }}>
              <th style={thStyle}>Member</th>
              <th style={thStyle}>Balance (XLM)</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(balances).map(([addr, bal]) => (
              <tr key={addr} style={{ borderBottom: "1px solid #222" }}>
                <td style={tdStyle}>{addr.slice(0, 12)}...</td>
                <td style={{ ...tdStyle, color: bal >= 0 ? "#4caf50" : "#f44336" }}>
                  {bal >= 0 ? "+" : ""}{bal} XLM
                </td>
                <td style={tdStyle}>
                  {bal > 0 ? "🟢 owed" : bal < 0 ? "🔴 owes" : "✅ settled"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "0.5rem 1.2rem",
  background: "#6c63ff",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem",
  color: "#888",
  fontWeight: 500,
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem",
  fontSize: "0.9rem",
};
