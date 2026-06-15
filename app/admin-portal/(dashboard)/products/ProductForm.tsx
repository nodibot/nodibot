import Link from "next/link";
import { CATEGORIES, COND, HOSTS } from "@/app/_lib/taxonomy";
import type { AdminPart } from "@/app/_lib/types";

const LIFECYCLES = [
  "Active",
  "Active(aftermkt)",
  "Mature",
  "Phase-Out",
  "Discontinued",
  "Successor Available",
  "Obsolete",
];
const IMAGE_STATUSES = ["missing", "pending_review", "approved", "rejected"];

const lines = (values?: string[]) => values?.join("\n") ?? "";

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

      <div className="grid3">
        <div className="field">
          <label>Excel category L1</label>
          <input name="category_l1" defaultValue={part?.categoryL1 ?? ""} placeholder="e.g. Drive" />
        </div>
        <div className="field">
          <label>Excel category L2</label>
          <input name="category_l2" defaultValue={part?.categoryL2 ?? ""} placeholder="e.g. Servo Amplifier" />
        </div>
        <div className="field">
          <label>Availability label</label>
          <input name="availability_label" defaultValue={part?.availabilityLabel ?? ""} placeholder="e.g. Refurb Only" />
        </div>
      </div>

      <div className="grid3">
        <div className="field">
          <label>Series</label>
          <input name="series" defaultValue={part?.series ?? ""} placeholder="e.g. A06B-6079" />
        </div>
        <div className="field">
          <label>Equipment type</label>
          <input name="equipment_type" defaultValue={part?.equipmentType ?? ""} placeholder="e.g. Robot" />
        </div>
        <div className="field">
          <label>Controller generation</label>
          <input name="controller_generation" defaultValue={part?.controllerGeneration ?? ""} placeholder="Legacy / Current" />
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
          <label>Alternative part numbers</label>
          <textarea
            name="alternative_pns"
            defaultValue={lines(part?.alternativePns)}
            placeholder="One part number per line"
          />
        </div>
        <div className="field">
          <label>Failure keywords</label>
          <textarea
            name="failure_keywords"
            defaultValue={lines(part?.failureKeywords)}
            placeholder="One keyword per line"
          />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Compatible controllers</label>
          <textarea
            name="compatible_controllers"
            defaultValue={lines(part?.compatibleControllers)}
            placeholder="One controller/platform per line"
          />
        </div>
        <div className="field">
          <label>Compatible robot models</label>
          <textarea
            name="compatible_robot_models"
            defaultValue={lines(part?.compatibleRobotModels)}
            placeholder="One robot model per line"
          />
        </div>
      </div>

      <div className="field">
        <label>Korean description</label>
        <textarea
          name="description_kr"
          defaultValue={part?.descriptionKr ?? ""}
          placeholder="Imported Korean description or admin notes for translation"
        />
      </div>

      <div className="grid3">
        <div className="field">
          <label>Image URL</label>
          <input name="image_url" defaultValue={part?.imageUrl ?? ""} placeholder="https://..." />
        </div>
        <div className="field">
          <label>Image storage path</label>
          <input name="image_storage_path" defaultValue={part?.imageStoragePath ?? ""} placeholder="product-images/..." />
        </div>
        <div className="field">
          <label>Image status</label>
          <select name="image_status" defaultValue={part?.imageStatus ?? "missing"}>
            {IMAGE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid3">
        <div className="field">
          <label>Demand score</label>
          <input name="demand_score" type="number" defaultValue={part?.demandScore ?? ""} />
        </div>
        <div className="field">
          <label>Scarcity score</label>
          <input name="scarcity_score" type="number" defaultValue={part?.scarcityScore ?? ""} />
        </div>
        <div className="field">
          <label>Sales priority score</label>
          <input name="sales_priority_score" type="number" defaultValue={part?.salesPriorityScore ?? ""} />
        </div>
      </div>

      <div className="grid2">
        <div className="field">
          <label>Sales priority grade</label>
          <input name="sales_priority_grade" defaultValue={part?.salesPriorityGrade ?? ""} placeholder="S / A / B / C" />
        </div>
        <div className="field">
          <label>Source URLs</label>
          <textarea
            name="source_urls"
            defaultValue={lines(part?.sourceUrls)}
            placeholder="One URL per line"
          />
        </div>
      </div>

      <div className="field">
        <label>Admin notes (internal)</label>
        <textarea
          name="admin_notes"
          defaultValue={part?.adminNotes ?? ""}
          placeholder="Where to source, image review notes, internal context…"
        />
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
