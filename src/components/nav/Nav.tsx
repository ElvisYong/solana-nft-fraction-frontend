import React from 'react';
import Image from 'next/image';
import WalletConnect from '../solana-wallet/WalletConnect';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletDisconnectButton, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const tabs: any[] = [
  { name: 'Create Nft', href: '#', current: true },
  { name: 'Fractionalize Nft', href: '#', current: false },
]

export default function Example() {
  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="sm:hidden">
          <label htmlFor="tabs" className="sr-only">
            Select a tab
          </label>
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
                <span className="ml-1 font-semibold text-xl">TRUSTMEBRO</span>
                {tabs.map((tab) => (
                  <li key={tab.name}>
                    <a href={tab.href} className={tab.current ? 'text-indigo-400' : ''}>
                      {tab.name}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <WalletConnect
              className="bg-primary text-white"
              style={{
                width: '188.16px',
              }}
            >
              <WalletMultiButtonDynamic />
            </WalletConnect>
          </div>
        </div>
      </div>
    </div>
  )
}
