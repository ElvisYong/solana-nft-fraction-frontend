import { Toaster } from "react-hot-toast";
import NavBar from "./nav/Nav";


export default function Layout({ children: children }: { children: React.ReactNode }) {
  return (
    <>
      <div><Toaster
        position="top-right"
      /></div>
      <NavBar />
      <div>
        {children}
      </div>
    </>
  )
}