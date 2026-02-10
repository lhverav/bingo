import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import CardBunchFormWithProgress from "./CardBunchFormWithProgress";

export default async function CrearCartasPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host/cartas" className="back-link">
          &larr; Volver a Grupos de Cartas
        </Link>
        <h1>Crear Grupo de Cartas</h1>
      </div>

      <CardBunchFormWithProgress />
    </main>
  );
}
