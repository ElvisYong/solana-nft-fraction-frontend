import { useEffect, useMemo, useState } from 'react'
import { Disclosure, RadioGroup, Tab } from '@headlessui/react'
import { StarIcon } from '@heroicons/react/20/solid'
import { HeartIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline'
import { clusterApiUrl } from '@solana/web3.js'
import { DigitalAssetWithTokenAndJson, NftJsonType } from '@/types/NftJsonType'
import { AnchorProvider } from '@coral-xyz/anchor'
import { fetchDigitalAssetWithTokenByMint, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import { publicKey } from '@metaplex-foundation/umi'
import toast from 'react-hot-toast'

const product = {
  name: 'Zip Tote Basket',
  price: '$140',
  rating: 4,
  images: [
    {
      id: 1,
      name: 'Angled view',
      src: 'https://tailwindui.com/img/ecommerce-images/product-page-03-product-01.jpg',
      alt: 'Angled front view with bag zipped and handles upright.',
    },
    // More images...
  ],
  colors: [
    { name: 'Washed Black', bgColor: 'bg-gray-700', selectedColor: 'ring-gray-700' },
    { name: 'White', bgColor: 'bg-white', selectedColor: 'ring-gray-400' },
    { name: 'Washed Gray', bgColor: 'bg-gray-500', selectedColor: 'ring-gray-500' },
  ],
  description: `
    <p>The Zip Tote Basket is the perfect midpoint between shopping tote and comfy backpack. With convertible straps, you can hand carry, should sling, or backpack this convenient and spacious bag. The zip top and durable canvas construction keeps your goods protected for all-day use.</p>
  `,
  details: [
    {
      name: 'Features',
      items: [
        'Multiple strap configurations',
        'Spacious interior with top zip',
        'Leather handle and tabs',
        'Interior dividers',
        'Stainless strap loops',
        'Double stitched construction',
        'Water-resistant',
      ],
    },
    // More sections...
  ],
}

function classNames(...classes: any) {
  return classes.filter(Boolean).join(' ')
}

// TODO: Support check if NFT or FT
export default function NftInfo() {
  const [selectedColor, setSelectedColor] = useState(product.colors[0])
  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet]);

  const router = useRouter();
  const { id } = router.query;

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
