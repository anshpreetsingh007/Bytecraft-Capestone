import Image from "next/image";
import Link from "next/link";
export default function Home() {
  return (
    <main className="login-page">
      <div className="login-card">

       

        <h1>Markit Roofing</h1>
        <p>Sign in to your account</p>

        <input 
          type="email"
          placeholder="Email"
        />

        <input
          type="password"
          placeholder="Password"
        />

        <button>
          Sign In
        </button>
<p>
  Don't have an account?{" "}
  <Link href="/signup">
    Sign Up
  </Link>
</p>
      </div>
    </main>
  );
}