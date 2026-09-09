import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Trade Atlas — Maritime routes', description: 'Explore the Strait of Hormuz, global trade chokepoints, and Ukraine’s Black Sea trade connections.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
