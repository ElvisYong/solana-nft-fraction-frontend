import NavBar from "./nav/Nav";


export default function Layout({ children }) {
  return (
    <>
      <NavBar />
      <div>
        {children}
      </div>
    </>
  )
}