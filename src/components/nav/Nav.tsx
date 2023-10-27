import React from 'react';
import Image from 'next/image';
import WalletConnect from '../solana-wallet/WalletConnect';
import { useRouter } from 'next/router';
import Link from 'next/link';


export default function NavBar() {
  const tabs: any[] = [
    { name: 'Create Nft', href: '/', current: true },
    { name: 'Fractionalize Nft', href: '/fractionalize', current: false },
  ]

  const router = useRouter();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="sm:hidden">
          {/* Use an "onChange" listener to redirect the user to the selected tab URL. */}
          <select
            id="tabs"
            name="tabs"
            className="block w-full rounded-md border-none bg-white/5 py-2 pl-3 pr-10 text-base text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm"
            defaultValue={tabs.find((tab) => tab.current).name}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center justify-between">
            <nav className="flex border-b border-white/10 py-4">
              <ul
                role="list"
                className="flex items-center min-w-full flex-none gap-x-6 px-2 text-sm font-semibold leading-6 text-gray-400"
              >
                <Image src="/favicon.ico" width="30" height="30" alt="nozomi" />
                <span className="ml-1 font-semibold text-xl">TRUSTMEBRO DEVNET</span>
                {tabs.map((tab) => (
                  <li key={tab.name}>
                    <Link href={tab.href} className={router.asPath === tab.href ? 'text-indigo-400' : ''}>
                      {tab.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <WalletConnect className="bg-primary text-white"/>
          </div>
        </div>
      </div>
    </div>
  )
}
