import { redirect } from "next/navigation";
 import { login } from "@/lib/actions/auth";




export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const hasError = searchParams.error === "invalid";

  return (
    <main className="login-container">
      <div className="login-card">
        <h1>Bingo Host</h1>
        <p>Ingresa tus credenciales para continuar</p>

        {hasError && (
          <div className="error-message">
            Credenciales inválidas. Intenta de nuevo.
          </div>
        )}

        <form action={login}>
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="host@bingo.com"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••"
              required
            />
          </div>

          <button type="submit">Iniciar Sesión</button>
        </form>
      </div>
    </main>
  );
}
