// Pure variable substitution for outreach templates. No I/O.

export interface TemplateFields {
  company: string;
  first_name: string | null;
  last_name: string | null;
  part_number: string | null;
}

export interface RenderedEmail {
  subject: string;
  body: string;
}

function nameOrThere(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "there";
}

function substitute(text: string, fields: TemplateFields): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    switch (key) {
      case "company":
        return fields.company ?? "";
      case "contact_name":
      case "first_name":
        return nameOrThere(fields.first_name);
      case "last_name":
        return fields.last_name?.trim() ?? "";
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
): RenderedEmail {
  return {
    subject: substitute(template.subject, fields),
    body: substitute(template.body, fields).replace(/\r\n/g, "\n").replace(/\r/g, "\n").trimEnd(),
  };
}