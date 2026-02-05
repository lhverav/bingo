import { getSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import { getAllCardBunchesAction } from "@/lib/actions/cardBunches";
import DeleteButton from "./DeleteButton";
import Link from "next/link";

export default async function CartasPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  const bunches = await getAllCardBunchesAction();

  return (
    <main className="page-container">
      <div className="page-header">
        <Link href="/host" className="back-link">
          &larr; Volver al Panel
        </Link>
        <h1>Grupos de Cartas</h1>
        <Link href="/host/cartas/crear" className="btn-primary">
          + Crear Grupo
        </Link>
      </div>

      {bunches.length === 0 ? (
        <div className="empty-state">
          <p>No hay grupos de cartas creados.</p>
          <Link href="/host/cartas/crear" className="btn-primary">
            Crear primer grupo
          </Link>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tamaño</th>
                <th>Números</th>
                <th>Cantidad de Cartas</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {bunches.map((bunch) => (
                <tr key={bunch.id}>
                  <td>{bunch.name}</td>
                  <td>{bunch.cardSize}x{bunch.cardSize}</td>
                  <td>1 - {bunch.maxNumber}</td>
                  <td>{bunch.cards.length}</td>
                  <td>
                    <DeleteButton id={bunch.id} name={bunch.name} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
