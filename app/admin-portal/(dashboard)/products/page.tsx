import Link from "next/link";
import { getAllParts } from "@/app/_lib/admin";
import { CAT_LABEL } from "@/app/_lib/taxonomy";
import { DeleteButton } from "./DeleteButton";

export default async function AdminProductsPage() {
  const parts = await getAllParts();

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Inventory</h1>
          <div className="sub">{parts.length} products in the catalog</div>
        </div>
        <Link className="btn btn-primary" href="/admin-portal/products/new">
          + New product
        </Link>
      </div>

      <div className="admin-content">
        {parts.length === 0 ? (
          <div className="admin-empty">
            No products yet. <Link href="/admin-portal/products/new">Add your first one →</Link>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Part number</th>
                  <th>Brand</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th>Views</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {parts.map((p) => (
                  <tr key={p.id} className={p.isActive ? "" : "dim"}>
                    <td className="mono">{p.pn}</td>
                    <td>{p.brand}</td>
                    <td>{p.name}</td>
                    <td>{CAT_LABEL[p.cat] ?? p.cat}</td>
                    <td>
                      {p.stock === "in" ? (
                        <span className="badge badge-in">In · {p.qty ?? 0}</span>
                      ) : (
                        <span className="badge badge-req">On request</span>
                      )}
                    </td>
                    <td className="mono">{p.views}</td>
                    <td>
                      {p.isActive ? (
                        <span className="badge badge-in">Active</span>
                      ) : (
                        <span className="badge badge-life">Hidden</span>
                      )}
                    </td>
                    <td>
                      <div className="row-actions">
                        <Link className="btn btn-ghost btn-sm" href={`/admin-portal/products/${p.id}/edit`}>
                          Edit
                        </Link>
                        <DeleteButton id={p.id} pn={p.pn} />
                      </div>
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
