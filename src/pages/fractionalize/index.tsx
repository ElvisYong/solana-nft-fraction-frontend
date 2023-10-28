import GalleryView from '@/components/gallery-view/GalleryView';
import { DigitalAssetWithTokenAndJson, NftJsonType } from '@/types/NftJsonType';
import { AnchorProvider } from '@coral-xyz/anchor';
import { mplTokenMetadata, fetchAllDigitalAssetWithTokenByOwner, TokenStandard } from '@metaplex-foundation/mpl-token-metadata';
import { parseJsonFromGenericFile, unwrapOption } from '@metaplex-foundation/umi';
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { clusterApiUrl } from '@solana/web3.js';
import React, { useEffect, useMemo, useState } from 'react'

const FractionalizePage = () => {
  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet]);

  const [nfts, setNfts] = useState<DigitalAssetWithTokenAndJson[]>([])
  const [fungibleTokens, setFungibleTokens] = useState<DigitalAssetWithTokenAndJson[]>([])

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

      // Split the assets into NFTs and FTs
      let nfts = []
      let fungibleTokens = []
      for (let i = 0; i < assetsWithImage.length; i++) {
        if (unwrapOption(assetsWithImage[i].metadata.tokenStandard) === TokenStandard.NonFungible) {
          nfts.push(assetsWithImage[i])
        } else {
          fungibleTokens.push(assetsWithImage[i])
        }
      }

      setNfts(nfts);
      setFungibleTokens(fungibleTokens);
    }

    if (!wallet) {
      return;
    }

    fetchAllNfts();
  }, [umi])
  return (
    <>
      <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-base font-semibold leading-7 text-white">Your NFTs</h1>
        <p className="mt-1 text-sm leading-6 text-gray-400">
          View all your NFTs here
        </p>
        <GalleryView tokens={nfts} />
      </div>
    </>
  )
}

export default FractionalizePage;
