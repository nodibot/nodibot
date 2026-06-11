import { createPartAction } from "../actions";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <>
      <div className="admin-top">
        <div>
          <h1>New product</h1>
          <div className="sub">Add a component to the public catalog</div>
        </div>
      </div>
      <div className="admin-content">
        <ProductForm action={createPartAction} />
      </div>
    </>
  );
}
