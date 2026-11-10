import Link from "next/link";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-slate-900">
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 text-[#0070ba] flex items-center justify-center mb-4 shadow-sm">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-3xl font-black text-slate-950 mb-2">404 - Page Not Found</h2>
      <p className="text-sm text-slate-500 mb-6 text-center max-w-md">
        The requested security terminal page does not exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="py-3 px-6 rounded-full font-bold text-sm bg-slate-950 hover:bg-neutral-800 text-white flex items-center gap-2 transition"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Dashboard
      </Link>
    </div>
  );
}
