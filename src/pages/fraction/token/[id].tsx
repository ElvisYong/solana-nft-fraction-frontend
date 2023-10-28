import { useEffect, useMemo, useState } from 'react'
import { Disclosure, RadioGroup, Tab } from '@headlessui/react'
import { StarIcon } from '@heroicons/react/20/solid'
import { HeartIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { clusterApiUrl } from '@solana/web3.js'
import { DigitalAssetWithTokenAndJson, NftJsonType } from '@/types/NftJsonType'
import { AnchorProvider, Idl, Program } from '@coral-xyz/anchor'
import { fetchDigitalAssetWithTokenByMint, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import { publicKey } from '@metaplex-foundation/umi'
import toast from 'react-hot-toast'
import idl from '../../../idl/solana_nft_fraction.json';

const FRACTION_PROGRAM_ID = "5FYYwBNgxgGdUWWrY1Mxo53nwLFzH3q8pwHQD3BNre8x";

// TODO: Support check if NFT or FT
export default function NftInfo() {
  const router = useRouter();
  const { id } = router.query;

  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet]);
  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const program = new Program(idl as Idl, FRACTION_PROGRAM_ID, provider);

  const [asset, setAsset] = useState<DigitalAssetWithTokenAndJson>();

  useEffect(() => {
    console.log(id)
    const fetchNftInfo = async () => {
      try {
        const digitalAsset = await fetchDigitalAssetWithTokenByMint(umi, publicKey(id as string))
        const nftJson = await umi.downloader.downloadJson<NftJsonType>(digitalAsset.metadata.uri);

        const asset = {
          ...digitalAsset,
          ...nftJson,
        } as DigitalAssetWithTokenAndJson;

        setAsset(asset);
      } catch (e: any) {
        toast.error("Error: " + e.message)
      }
    }

    fetchNftInfo();
  }, [])

  return (
    <div >
      {
        asset &&
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8">
            <div className="flex flex-col-reverse">
              <div className="aspect-h-1 aspect-w-1 w-full">
                <img
                  src={asset?.image}
                  className="h-full w-full object-cover object-center sm:rounded-lg"
                />
              </div>
            </div>

            <div className="mt-10 px-4 sm:mt-16 sm:px-0 lg:mt-0">
              <h1 className="text-3xl font-bold tracking-tight text-white">{asset.name}</h1>
              <div className="mt-3">
                <p className="text-3xl tracking-tight text-white">{asset.symbol}</p>
              </div>

              <div className="mt-6">
                <p>{asset.description}</p>
              </div>

              <form className="mt-6">
                {/* Colors */}

                <div className="mt-10 flex">
                  <button
                    type="submit"
                    className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                  >
                    Fractionalize NFT
                  </button>
                </div>
              </form>

              <section aria-labelledby="details-heading" className="mt-12">
                <h2 id="details-heading" className="sr-only">
                  Additional details
                </h2>

                <h3 className="text-gray-400 font-medium">
                  Details
                </h3>

                <ul className="text-gray-400 py-3 space-y-2">
                  <li >metadata: {asset.metadata.publicKey}</li>
                  <li >mint: {asset.publicKey}</li>
                  <li>ATA: {asset.token.publicKey}</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      }

    </div>
  )
}
