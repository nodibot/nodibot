import { addSourcingQuoteAction } from "../actions";

export function SourcingQuoteForm({ inquiryId }: { inquiryId: string }) {
  return (
    <form action={addSourcingQuoteAction} className="admin-form" style={{ maxWidth: "none" }}>
      <input type="hidden" name="inquiry_id" value={inquiryId} />

      <div className="grid3">
        <div className="field">
          <label>Platform</label>
          <select name="platform" defaultValue="1688">
            <option value="1688">1688</option>
            <option value="alibaba">Alibaba</option>
            <option value="taobao">Taobao</option>
            <option value="xianyu">Xianyu</option>
            <option value="wechat">WeChat</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="field">
          <label>Supplier / shop</label>
          <input name="supplier_name" placeholder="Shop or supplier name" required />
        </div>
        <div className="field">
          <label>Supplier contact</label>
          <input name="contact_handle" placeholder="WeChat / phone / contact person" />
        </div>
      </div>

      <div className="field">
        <label>Listing URL</label>
        <input name="listing_url" type="url" placeholder="https://..." required />
      </div>

      <div className="grid3">
        <div className="field">
          <label>Condition</label>
          <input name="condition" placeholder="new / used / refurbished" />
        </div>
        <div className="field">
          <label>MOQ</label>
          <input name="moq" type="number" min={1} placeholder="1" />
        </div>
        <div className="field">
          <label>Lead time (days)</label>
          <input name="lead_time_days" type="number" min={1} placeholder="3" />
        </div>
      </div>

      <div className="field">
        <label>Notes</label>
        <textarea name="notes" placeholder="Factory tags, visual proof, negotiation notes, authenticity concerns..." />
      </div>

      <div className="admin-form-foot">
        <button className="btn btn-primary" type="submit">
          Save supplier finding
        </button>
      </div>
    </form>
  );
}
