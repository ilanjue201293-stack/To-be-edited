import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"WeaponDesk — Weapon RNG",description:"Workspace privé de l'équipe Weapon RNG"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="fr"><body>{children}</body></html>}