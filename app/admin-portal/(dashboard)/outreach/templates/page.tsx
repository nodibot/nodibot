import Link from "next/link";
import { getTemplates } from "@/app/_lib/outreach/queries";
import { Pagination, paginateItems, parsePageParam } from "../../_components/Pagination";
import { TemplateForm } from "./TemplateForm";
import { TemplatesList } from "./TemplatesList";

export default async function TemplatesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const templates = await getTemplates();
  const pageSize = 10;
  const currentPage = parsePageParam(params);
  const pagedTemplates = paginateItems(templates, currentPage, pageSize);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Email templates</h1>
          <div className="sub">
            Variables: {"{{company}}"}, {"{{contact_name}}"} (first name), {"{{last_name}}"}, {"{{part_number}}"}
          </div>
        </div>
        <Link className="btn btn-ghost" href="/admin-portal/outreach">
          ← Back to outreach
        </Link>
      </div>

      <div className="admin-content">
        <section className="admin-panel" style={{ marginBottom: 28, maxWidth: 760 }}>
          <h2 className="admin-section-title">New template</h2>
          <TemplateForm />
        </section>

        <section>
          <h2 className="admin-section-title">Existing templates</h2>
          {templates.length === 0 ? (
            <div className="admin-empty">
              No templates yet. The cron needs one active <code>initial</code> and one active{" "}
              <code>reminder</code> template.
            </div>
          ) : (
            <>
              <TemplatesList templates={pagedTemplates} />
              <Pagination
                pathname="/admin-portal/outreach/templates"
                currentPage={currentPage}
                totalItems={templates.length}
                pageSize={pageSize}
                searchParams={params}
              />
            </>
          )}
        </section>
      </div>
    </>
  );
}
