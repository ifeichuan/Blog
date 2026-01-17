import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import mitt from 'mitt'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const emitter = mitt();


export const isMobileDevice = () => {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}



