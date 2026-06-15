import { getAllParts } from "@/app/_lib/admin";
import { CAT_LABEL } from "@/app/_lib/taxonomy";
import type { AdminPart } from "@/app/_lib/types";

// A part is on the "buy list" if there's demand but no stock on hand —
// either source-on-request, or in stock but running low.
function needsSourcing(p: AdminPart): boolean {
  return p.stock === "request" || (p.stock === "in" && (p.qty ?? 0) <= 2);
}

export default async function DemandPage() {
  const parts = (await getAllParts())
    .filter((p) => p.isActive)
    .sort((a, b) => (b.demandScore ?? b.views) - (a.demandScore ?? a.views));

  const maxDemand = Math.max(1, ...parts.map((p) => p.demandScore ?? p.views));
  const totalViews = parts.reduce((sum, p) => sum + p.views, 0);
  const toSource = parts.filter(needsSourcing);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Demand &amp; buy list</h1>
          <div className="sub">Parts ranked by engineer interest — your sourcing-trip checklist</div>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-stats">
          <div className="admin-stat">
            <div className="n">{totalViews.toLocaleString()}</div>
            <div className="l">Total product views</div>
          </div>
          <div className="admin-stat">
            <div className="n">{parts.length}</div>
            <div className="l">Active parts tracked</div>
          </div>
          <div className="admin-stat">
            <div className="n">{toSource.length}</div>
            <div className="l">On the buy list</div>
          </div>
        </div>

        {parts.length === 0 ? (
          <div className="admin-empty">No active parts to analyze yet.</div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Part number</th>
                  <th>Brand</th>
                  <th>Category</th>
                  <th>Demand</th>
                  <th>Scarcity</th>
                  <th>On hand</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {parts.map((p, i) => (
                  <tr key={p.id}>
                    <td className="mono">{i + 1}</td>
                    <td className="mono">{p.pn}</td>
                    <td>{p.brand}</td>
                    <td>{CAT_LABEL[p.cat] ?? p.cat}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          className="demand-bar"
                          style={{
                            ["--w" as string]: `${Math.round(((p.demandScore ?? p.views) / maxDemand) * 100)}%`,
                          }}
                        >
                          <span />
                        </div>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {p.demandScore ?? p.views}
                        </span>
                      </div>
                    </td>
                    <td className="mono">{p.scarcityScore ?? "—"}</td>
                    <td>{p.stock === "in" ? `${p.qty ?? 0} in stock` : "—"}</td>
                    <td>
                      {needsSourcing(p) ? (
                        <span className="need-flag">● Source</span>
                      ) : (
                        <span className="dim">Stocked</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
