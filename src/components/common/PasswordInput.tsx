"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  className?: string;
}

export default function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  className = "",
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative w-full">
      <input
        {...props}
        type={showPassword ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-3.5 pr-10 py-2.5 text-xs font-medium text-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 transition ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-indigo-600 focus:outline-none cursor-pointer transition p-1"
        title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-indigo-600" />
        ) : (
          <Eye className="w-4 h-4 text-zinc-400 hover:text-zinc-600" />
        )}
      </button>
    </div>
  );
}
