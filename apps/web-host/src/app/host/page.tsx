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
        <h2>Gestión de Juegos</h2>
        <p>Crea y administra juegos de bingo con múltiples rondas.</p>

        <div className="actions">
          <Link href="/host/juegos/crear" className="btn-primary">
            Crear Nuevo Juego
          </Link>
          <Link href="/host/juegos" className="btn-secondary">
            Ver Juegos
          </Link>
        </div>
      </section>

      <section className="host-content">
        <h2>Patrones de Juego</h2>
        <p>Administra los patrones de victoria para los juegos.</p>

        <div className="actions">
          <Link href="/host/patrones/crear" className="btn-primary">
            Crear Patrón
          </Link>
          <Link href="/host/patrones" className="btn-secondary">
            Ver Patrones
          </Link>
        </div>
      </section>

      <section className="host-content">
        <h2>Parámetros Generales</h2>
        <p>Configura los valores por defecto para los juegos.</p>

        <div className="actions">
          <Link href="/host/parametros" className="btn-secondary">
            Configurar Parámetros
          </Link>
        </div>
      </section>

      <section className="host-content">
        <h2>Cartones</h2>
        <p>Genera y administra grupos de cartones pre-generados para los juegos.</p>

        <div className="actions">
          <Link href="/host/cartas/crear" className="btn-primary">
            Crear Grupo de Cartones
          </Link>
          <Link href="/host/cartas" className="btn-secondary">
            Ver Cartones
          </Link>
        </div>
      </section>
    </main>
  );
}
