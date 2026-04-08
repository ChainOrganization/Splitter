import { useState } from "react";
import CreateGroup from "./pages/CreateGroup";
import AddExpense from "./pages/AddExpense";
import Balances from "./pages/Balances";
import Settle from "./pages/Settle";
import type { Group } from "./types";

type Page = "create" | "expense" | "balances" | "settle";

export default function App() {
  const [page, setPage] = useState<Page>("create");
  const [group, setGroup] = useState<Group | null>(null);

  const nav = (p: Page) => setPage(p);

  return (
    <div>
      <header style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.8rem", fontWeight: 700 }}>⛓ SplitChain</h1>
        <p style={{ color: "#888", marginTop: "0.25rem" }}>
          Shared expense splitter on Stellar
        </p>
      </header>

      <nav style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
        {(["create", "expense", "balances", "settle"] as Page[]).map((p) => (
          <button
            key={p}
            onClick={() => nav(p)}
            style={{
              padding: "0.4rem 1rem",
              borderRadius: "6px",
              border: "1px solid #333",
              background: page === p ? "#6c63ff" : "#1a1a24",
              color: "#fff",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {p === "create" ? "Create Group" : p === "expense" ? "Add Expense" : p}
          </button>
        ))}
      </nav>

      {page === "create" && <CreateGroup onCreated={(g) => { setGroup(g); nav("expense"); }} />}
      {page === "expense" && <AddExpense group={group} />}
      {page === "balances" && <Balances group={group} />}
      {page === "settle" && <Settle group={group} />}
    </div>
  );
}
