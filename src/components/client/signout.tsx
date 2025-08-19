"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";


export default function SignOutButton() {
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut({
            redirect: false,
        });
        router.push("/login");
    }
}
