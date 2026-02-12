import { redirect } from "next/navigation";

export default function Page() {
  redirect("/customers?new=1");
}
