import { getSession, logOut } from "@/lib/actions/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function HostPage() {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/");
  }

  return (
    <main className="host-container">
      <header className="host-header">
        <h1>Panel de Host</h1>
        <div className="user-info">
          <span>Hola, {session.name}</span>
          <form action={logOut}>
            <button type="submit">Cerrar Sesión</button>
          </form>
        </div>
      </header>

      <section className="host-content">
        <h2>Gestión de Rondas</h2>
        <p>Bienvenido al panel de control del Bingo.</p>

        <div className="actions">
          <Link href="/host/rondas/crear" className="btn-primary">
            Crear Nueva Ronda
          </Link>
          <Link href="/host/rondas" className="btn-secondary">
            Ver Rondas
          </Link>
        </div>
      </section>

      <section className="host-content">
        <h2>Gestión de Cartas</h2>
        <p>Crea grupos de cartas pre-generadas para usar en tus rondas.</p>

        <div className="actions">
          <Link href="/host/cartas/crear" className="btn-primary">
            Crear Grupo de Cartas
          </Link>
          <Link href="/host/cartas" className="btn-secondary">
            Ver Grupos de Cartas
          </Link>
        </div>
      </section>
    </main>
  );
}