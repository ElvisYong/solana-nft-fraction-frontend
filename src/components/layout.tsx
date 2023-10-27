import { Toaster } from "react-hot-toast";
import NavBar from "./nav/Nav";


export default function Layout({ children: children }: { children: React.ReactNode }) {
  return (
    <>
      <div><Toaster
        position="bottom-left"
        toastOptions={{
          style: { wordBreak: "break-all" },
          duration: 20000,
        }}
      /></div>
      <NavBar />
      <div>
        {children}
      </div>
    </>
  )
}