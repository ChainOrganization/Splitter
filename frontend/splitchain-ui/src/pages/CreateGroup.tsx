import { useState } from "react";
import type { Group } from "../types";

interface Props {
  onCreated: (group: Group) => void;
}

export default function CreateGroup({ onCreated }: Props) {
  const [groupId, setGroupId] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [status, setStatus] = useState("");

  const addMember = () => {
    const addr = memberInput.trim();
    if (addr && !members.includes(addr)) {
      setMembers([...members, addr]);
      setMemberInput("");
    }
  };

  const handleCreate = async () => {
    if (!groupId || members.length < 2) {
      setStatus("Need a group ID and at least 2 members.");
      return;
    }
    // TODO: call contract.create_group via Soroban RPC
    setStatus(`Group "${groupId}" created (simulated). Connect wallet to go on-chain.`);
    onCreated({ id: groupId, members });
  };

  return (
    <div>
      <h2 style={{ marginBottom: "1rem" }}>Create Group</h2>

      <label>Group ID</label>
      <input
        value={groupId}
        onChange={(e) => setGroupId(e.target.value)}
        placeholder="e.g. trip2025"
        style={inputStyle}
      />

      <label style={{ marginTop: "1rem", display: "block" }}>Add Member (Stellar address)</label>
      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={memberInput}
          onChange={(e) => setMemberInput(e.target.value)}
          placeholder="G..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={addMember} style={btnStyle}>Add</button>
      </div>

      {members.length > 0 && (
        <ul style={{ margin: "1rem 0", paddingLeft: "1.2rem" }}>
          {members.map((m) => (
            <li key={m} style={{ fontSize: "0.85rem", color: "#aaa" }}>{m}</li>
          ))}
        </ul>
      )}

      <button onClick={handleCreate} style={{ ...btnStyle, marginTop: "1rem" }}>
        Create Group
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
