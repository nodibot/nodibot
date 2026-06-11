import { notFound } from "next/navigation";
import { getPartById } from "@/app/_lib/admin";
import { updatePartAction } from "../../actions";
import { ProductForm } from "../../ProductForm";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = await getPartById(id);
  if (!part) notFound();

  const action = updatePartAction.bind(null, id);

  return (
    <>
      <div className="admin-top">
        <div>
          <h1>Edit product</h1>
          <div className="sub mono">{part.pn}</div>
        </div>
      </div>
      <div className="admin-content">
        <ProductForm action={action} part={part} />
      </div>
    </>
  );
}
