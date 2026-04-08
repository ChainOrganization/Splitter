import { useState } from "react";
import type { Group } from "../types";

interface Props {
  group: Group | null;
}

export default function AddExpense({ group }: Props) {
  const [payer, setPayer] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");

  const handleAdd = async () => {
    if (!group) { setStatus("Create a group first."); return; }
    if (!payer || !amount || !description) { setStatus("Fill all fields."); return; }

    // TODO: call contract.add_expense via Soroban RPC + Freighter wallet
    setStatus(`Expense "${description}" of ${amount} XLM by ${payer.slice(0, 8)}... recorded (simulated).`);
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Add Expense</h2>
      {group && (
        <p style={{ color: "#888", marginBottom: "1rem" }}>
          Group: <strong style={{ color: "#fff" }}>{group.id}</strong>
        </p>
      )}

      <label>Payer</label>
      <select value={payer} onChange={(e) => setPayer(e.target.value)} style={inputStyle}>
        <option value="">Select payer</option>
        {group?.members.map((m) => (
          <option key={m} value={m}>{m.slice(0, 12)}...</option>
        ))}
      </select>

      <label style={{ marginTop: "1rem", display: "block" }}>Amount (XLM)</label>
      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="e.g. 30"
        style={inputStyle}
      />

      <label style={{ marginTop: "1rem", display: "block" }}>Description</label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. dinner"
        style={inputStyle}
      />

      <button onClick={handleAdd} style={{ ...btnStyle, marginTop: "1rem" }}>
        Add Expense
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
