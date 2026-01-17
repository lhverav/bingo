import { getSession, logOut } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

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
          <button>Crear Nueva Ronda</button>
          <button>Ver Rondas</button>
        </div>
      </section>
    </main>
  );
}