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

      {/* Legacy sections - to be removed after migration */}
      <section className="host-content legacy-section">
        <h2>Rondas (Legacy)</h2>
        <p>Sistema anterior de rondas individuales.</p>

        <div className="actions">
          <Link href="/host/rondas/crear" className="btn-primary">
            Crear Nueva Ronda
          </Link>
          <Link href="/host/rondas" className="btn-secondary">
            Ver Rondas
          </Link>
        </div>
      </section>

      <section className="host-content legacy-section">
        <h2>Grupos de Cartas (Legacy)</h2>
        <p>Sistema anterior de cartas pre-generadas.</p>

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
