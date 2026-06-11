import Link from "next/link";
import { CATEGORIES, COND, HOSTS } from "@/app/_lib/taxonomy";
import type { AdminPart } from "@/app/_lib/types";

const LIFECYCLES = ["Active", "Mature", "Phase-Out", "Discontinued", "Obsolete"];

export function ProductForm({
  action,
  part,
}: {
  action: (formData: FormData) => Promise<void>;
  part?: AdminPart;
}) {
  const isEdit = Boolean(part);
  return (
    <form className="admin-form" action={action}>
      <div className="grid2">
        <div className="field">
          <label>
            Part number <span className="req">*</span>
          </label>
          <input name="pn" defaultValue={part?.pn} required placeholder="e.g. 3HAC050363-001" />
        </div>
        <div className="field">
          <label>
            Brand <span className="req">*</span>
          </label>
          <input name="brand" defaultValue={part?.brand} required placeholder="e.g. ABB" />
        </div>
      </div>

      <div className="field">
        <label>
          Name / description <span className="req">*</span>
        </label>
        <input name="name" defaultValue={part?.name} required placeholder="Short product name" />
      </div>

      <div className="grid3">
        <div className="field">
          <label>Category</label>
          <select name="cat" defaultValue={part?.cat ?? CATEGORIES[0].id}>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Lifecycle</label>
          <select name="life" defaultValue={part?.life ?? "Active"}>
            {LIFECYCLES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Condition</label>
          <select name="cond" defaultValue={part?.cond ?? "tested"}>
            {Object.entries(COND).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid3">
        <div className="field">
          <label>Refurb low (USD)</label>
          <input name="refurb_low" type="number" min="0" defaultValue={part?.refurb[0] ?? 0} />
        </div>
        <div className="field">
          <label>Refurb high (USD)</label>
          <input name="refurb_high" type="number" min="0" defaultValue={part?.refurb[1] ?? 0} />
        </div>
        <div className="field">
          <label>OEM list (USD)</label>
          <input name="oem" type="number" min="0" defaultValue={part?.oem ?? 0} />
        </div>
      </div>

      <div className="grid3">
        <div className="field">
          <label>Availability</label>
          <select name="stock" defaultValue={part?.stock ?? "request"}>
            <option value="request">Source on request</option>
            <option value="in">In stock</option>
          </select>
        </div>
        <div className="field">
          <label>Qty (if in stock)</label>
          <input name="qty" type="number" min="0" defaultValue={part?.qty ?? ""} />
        </div>
        <div className="field">
          <label>Lead time</label>
          <input name="lead" defaultValue={part?.lead ?? ""} placeholder="e.g. 5–9 days" />
        </div>
      </div>

      <div className="field">
        <label>Compatible host systems</label>
        <div className="admin-hosts">
          {HOSTS.map((h) => (
            <label key={h.id}>
              <input
                type="checkbox"
                name={`host_${h.id}`}
                defaultChecked={part?.hosts.includes(h.id) ?? false}
              />
              {h.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Supplier notes (internal)</label>
          <textarea
            name="supplier_notes"
            defaultValue={part?.supplierNotes ?? ""}
            placeholder="Where to source, contacts, reference links…"
          />
        </div>
        <div className="field">
          <label>Resale reference (USD, internal)</label>
          <input name="resale_ref" type="number" min="0" defaultValue={part?.resaleRef ?? ""} />
        </div>
      </div>

      <label className="admin-toggle">
        <input type="checkbox" name="is_active" defaultChecked={part?.isActive ?? true} />
        Listing active (visible on the public catalog)
      </label>

      <div className="admin-form-foot">
        <button className="btn btn-primary" type="submit">
          {isEdit ? "Save changes" : "Create product"}
        </button>
        <Link className="btn btn-ghost" href="/admin-portal/products">
          Cancel
        </Link>
      </div>
    </form>
  );
}
