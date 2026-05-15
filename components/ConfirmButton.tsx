"use client";

import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  message: string;
};

export function ConfirmButton({ message, onClick, ...rest }: Props) {
  return (
    <button
      {...rest}
      onClick={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
          return;
        }
        onClick?.(e);
      }}
    />
  );
}
