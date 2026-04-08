import { useState } from "react";
import type { Group } from "../types";

interface Props {
  group: Group | null;
}

export default function Settle({ group }: Props) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");

  const handleSettle = async () => {
    if (!group) { setStatus("Create a group first."); return; }
    if (!from || !to || !amount) { setStatus("Fill all fields."); return; }
    if (from === to) { setStatus("From and To must be different."); return; }

    // TODO: call contract.settle via Soroban RPC + Freighter wallet signing
    setStatus(`Settlement of ${amount} XLM from ${from.slice(0, 8)}... to ${to.slice(0, 8)}... submitted (simulated).`);
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Settle</h2>
      {group && (
        <p style={{ color: "#888", marginBottom: "1rem" }}>
          Group: <strong style={{ color: "#fff" }}>{group.id}</strong>
        </p>
      )}

      <label>From (who pays)</label>
      <select value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle}>
        <option value="">Select</option>
        {group?.members.map((m) => (
          <option key={m} value={m}>{m.slice(0, 12)}...</option>
        ))}
      </select>

      <label style={{ marginTop: "1rem", display: "block" }}>To (who receives)</label>
      <select value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle}>
        <option value="">Select</option>
        {group?.members.map((m) => (
          <option key={m} value={m}>{m.slice(0, 12)}...</option>
        ))}
      </select>

      <label style={{ marginTop: "1rem", display: "block" }}>Amount (XLM)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 10"
        style={inputStyle}
      />

      <button onClick={handleSettle} style={{ ...btnStyle, marginTop: "1rem" }}>
        Settle Now
      </button>

      {status && <p style={{ marginTop: "1rem", color: "#6c63ff" }}>{status}</p>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "0.5rem 0.75rem",
  marginTop: "0.4rem",
  background: "#1a1a24",
  border: "1px solid #333",
  borderRadius: "6px",
  color: "#fff",
  fontSize: "0.95rem",
};

const btnStyle: React.CSSProperties = {
  padding: "0.5rem 1.2rem",
  background: "#6c63ff",
  border: "none",
  borderRadius: "6px",
  color: "#fff",
  cursor: "pointer",
};
