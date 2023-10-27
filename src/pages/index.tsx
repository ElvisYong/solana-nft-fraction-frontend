import Image from 'next/image'
import { Inter } from 'next/font/google'
import Nav from '@/components/nav/Nav'
import CreateNftForm from '@/components/create-nft/CreateNftForm'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <CreateNftForm />
      </div>
    </>
  )
}
