import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function LoginPage(props: {
  searchParams: Promise<{ message: string }>;
}) {

  const signIn = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect('/login?message=Could not authenticate user. Please check your credentials.');
    }

    return redirect('/teacher/create');
  };

  const signUp = async (formData: FormData) => {
    'use server';

    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // This assumes your app is running on localhost:3000
        emailRedirectTo: `http://localhost:3000/auth/callback`,
      },
    });

    if (error) {
      return redirect(`/login?message=${error.message}`);
    }

    // If you disabled "Confirm email" in Supabase, they will be logged in immediately
    return redirect('/create'); 
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto mt-20 font-sans">
      <div className="text-center mb-8 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Welcome Back</h1>
        <p className="text-gray-500">Sign in or create an account to start generating AI quizzes.</p>
      </div>

      <form className="flex-1 flex flex-col w-full justify-center gap-4 text-gray-800">
        <div className="space-y-1">
          <label className="text-md font-semibold" htmlFor="email">
            Email
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            name="email"
            placeholder="you@example.com"
            required
            type="email"
          />
        </div>
        
        <div className="space-y-1">
          <label className="text-md font-semibold" htmlFor="password">
            Password
          </label>
          <input
            className="w-full rounded-xl border border-gray-300 px-4 py-3 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            type="password"
            name="password"
            placeholder="••••••••"
            required
          />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <button
            formAction={signIn}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-sm"
          >
            Sign In
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-300"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">or</span>
            <div className="flex-grow border-t border-gray-300"></div>
          </div>

          <button
            formAction={signUp}
            className="w-full bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-xl transition-all shadow-sm"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}