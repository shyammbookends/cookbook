import { LoginForm } from "./LoginForm";

export const metadata = { title: "Admin Login", robots: { index: false, follow: false } };

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0A2399] px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white/5 p-8 backdrop-blur">
        <p className="eyebrow text-[#C6E86B]">Bookends Hospitality</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Admin sign in</h1>
        <LoginForm next={next} />
      </div>
    </div>
  );
}
