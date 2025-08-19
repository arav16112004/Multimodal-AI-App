'use client';

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { loginSchema, type LoginSchema } from "~/schemas/auth";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const form = useForm<LoginSchema>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: LoginSchema) {
        try{
            setLoading(true);
            const signInResult = await signIn("credentials", {
                redirect: false,
                email: data.email,
                password: data.password,
            });

            if(signInResult?.error){
                setError("Invalid email or password");
            }
            else{
                router.push("/");
            }

        }catch(error){
            setError("Something went wrong");
        }finally{
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 relative overflow-hidden">
            {/* Background animated elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-600/20 to-purple-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-600/10 to-blue-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-10 flex h-16 items-center justify-between border-b border-gray-700/50 backdrop-blur-md bg-gray-900/50 px-10">
                <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                        </svg>
                    </div>
                    <span className="text-2xl font-extrabold text-white">SentimentAnalysis</span>
                </div>
                <div className="flex space-x-6">
                    <a href="/signup" className="text-gray-300 hover:text-white transition-colors font-semibold">Sign Up</a>
                </div>
            </nav>

            {/* Main Content */}
            <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-4rem)] px-4">
                <div className="w-full max-w-md">
                    {/* Glass Card */}
                    <div className="backdrop-blur-xl bg-gray-800/40 border border-gray-700/50 rounded-3xl p-8 shadow-2xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                </svg>
                            </div>
                            <h1 className="text-3xl font-black text-white mb-2">Welcome Back</h1>
                            <p className="text-purple-300 font-semibold">Video Sentiment Analysis</p>
                            <p className="text-purple-300 font-semibold">Sign in to continue</p>
                        </div>

                        {/* Form */}
                        <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
                            {error && <div 
                                    role="alert"
                                    className="rounded-xl bg-rose-100/20 p-4 text-sm border-2 border-rose-400 text-rose-300 font-semibold shadow-lg flex items-center gap-2"
                                    >
                                    <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M11 7h2v6h-2zM11 15h2v2h-2z"/>
                                    <path d="M12 2a10 10 0 1 0 .001 20.001A10 10 0 0 0 12 2z"/>
                                    </svg>
                                    <span>{error}</span>
                            </div>}

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">Email Address</label>
                                <input {...form.register("email")} 
                                    type="email" 
                                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 font-medium"
                                    placeholder="Enter your email"
                                />
                                {
                                    form.formState.errors.email && (
                                        <p className="text-red-500 text-sm">
                                            {form.formState.errors.email.message}
                                        </p>
                                    )
                                }
                            </div>

                            <div>
                                <label className="block text-white text-sm font-bold mb-2">Password</label>
                                <div className="relative">
                                    <input {...form.register("password")} 
                                        type="password" 
                                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 transition-all duration-300 pr-12 font-medium"
                                        placeholder="Enter your password"
                                    />
                                    {
                                        form.formState.errors.password && (
                                            <p className="text-red-500 text-sm">
                                                {form.formState.errors.password.message}
                                            </p>
                                        )}
                                    <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={loading}
                                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-black rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                            >
                                {loading ? "Signing in..." : "Sign In"}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-gray-400 text-sm font-medium">
                                Don't have an account?{' '}
                                <a href="/signup" className="text-purple-400 hover:text-purple-300 font-bold transition-colors">
                                    Sign up
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}