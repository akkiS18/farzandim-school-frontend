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
        className={`w-full bg-white border border-neutral-300 rounded-none pl-3.5 pr-10 py-2.5 text-xs font-sans text-slate-800 outline-none focus:border-[#1E2B42] focus:ring-0 transition-colors ${className}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShowPassword((prev) => !prev)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer transition p-1"
        title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
      >
        {showPassword ? (
          <EyeOff className="w-4 h-4 text-slate-600" />
        ) : (
          <Eye className="w-4 h-4 text-slate-400 hover:text-slate-600" />
        )}
      </button>
    </div>
  );
}
