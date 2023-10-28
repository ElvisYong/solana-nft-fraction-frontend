import { DigitalAssetWithTokenAndJson, NftJsonType } from "@/types/NftJsonType";
import { AnchorProvider } from "@coral-xyz/anchor";
import { DigitalAssetWithToken, fetchAllDigitalAssetWithTokenByOwner, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { parseJsonFromGenericFile } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { awsUploader } from "@metaplex-foundation/umi-uploader-aws";
import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { clusterApiUrl } from "@solana/web3.js";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

const NftView = () => {
  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet]);

  const [digitalAssetsWithTokenAndImage, setDigitalAssetsWithTokenAndImage] = useState<DigitalAssetWithTokenAndJson[]>([])

  // Get all digital assets with token
  useEffect(() => {
    const fetchAllNfts = async () => {
      const assets = await fetchAllDigitalAssetWithTokenByOwner(umi, umi.identity.publicKey)
      const genericFiles = await umi.downloader.download(assets.map((asset) => {
        return asset.metadata.uri;
      }));
      // Parse JSON file into an object
      let nftJsonFiles = genericFiles.map((file) => parseJsonFromGenericFile(file)) as NftJsonType[];

      // Map digitalAssetsWithToken using the nftJsonFiles, they should be in the same order, 
      // simply extract the image from the data and append it into the DigitalAssetWithTokenObject object
      // Extract this into a new array as type DigitalAssetWWithTokenAndJson[]
      const assetsWithImage = assets.map((asset, i) => {
        return {
          ...asset,
          ...nftJsonFiles[i],
        }
      }) as DigitalAssetWithTokenAndJson[];

      console.log(assetsWithImage)

      setDigitalAssetsWithTokenAndImage(assetsWithImage);
    }

    if (!wallet) {
      return;
    }

    fetchAllNfts();
  }, [umi])

  return (
    <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
      {wallet && digitalAssetsWithTokenAndImage && digitalAssetsWithTokenAndImage.map((nft, i) => (
        <li key={i} className="relative">
          <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
            <img src={nft.image} alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
            <button type="button" className="absolute inset-0 focus:outline-none">
              <span className="sr-only">View details for {nft.name}</span>
            </button>
          </div>
          <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-white">{nft.name}</p>
          <p className="pointer-events-none block text-sm font-medium text-gray-500">{nft.symbol}</p>
        </li>
      ))}
    </ul>
  )
}

export default NftView;