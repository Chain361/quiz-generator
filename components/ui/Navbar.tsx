import { AuthButton } from "@/components/auth-button";
import Link from "next/link";
import { Suspense } from "react";

const Navbar = () => {
    return(
        <nav className="cosmic-night w-full flex justify-center border-b border-secondary bg-card h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm text-foreground">
            <div className="flex gap-5 items-center font-semibold">
              <Link href={"/"}>Quiz Generator</Link>
            </div>
            <Suspense>
              <AuthButton />
            </Suspense>
          </div>
        </nav>
    );
}

export default Navbar;