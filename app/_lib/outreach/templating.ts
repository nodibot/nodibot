// Pure variable substitution for outreach templates. No I/O.

export interface TemplateFields {
  company: string;
  contact_name: string | null;
  part_number: string | null;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

function substitute(text: string, fields: TemplateFields): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    switch (key) {
      case "company":
        return fields.company ?? "";
      case "contact_name":
        return fields.contact_name && fields.contact_name.trim() ? fields.contact_name : "there";
      case "part_number":
        return fields.part_number ?? "";
      default:
        return "";
    }
  });
}

export function renderTemplate(
  template: { subject: string; body: string },
  fields: TemplateFields,
  footer: string,
): RenderedEmail {
  return {
    subject: substitute(template.subject, fields),
    body: substitute(template.body, fields) + "\n\n--\n" + footer,
  };
}
