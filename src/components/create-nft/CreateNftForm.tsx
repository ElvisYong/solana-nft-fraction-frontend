import { PhotoIcon } from '@heroicons/react/24/solid'
import { useMemo, useState } from 'react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { TokenStandard, createV1, mintV1, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { AnchorProvider } from '@coral-xyz/anchor';
import { createGenericFileFromBrowserFile, generateSigner, percentAmount } from '@metaplex-foundation/umi';
import { awsUploader } from '@metaplex-foundation/umi-uploader-aws';
import { S3Client } from '@aws-sdk/client-s3';
import toast from 'react-hot-toast';
import WalletConnect from '../solana-wallet/WalletConnect';
import { base58 } from '@metaplex-foundation/umi/serializers';


export default function CreateNftForm() {
  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // Instantiate S3 client
  const s3 = new S3Client({
    region: process.env.NEXT_PUBLIC_AWS_REGION,
    credentials: {
      accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY!,
    }
  });
  const bucketName = process.env.NEXT_PUBLIC_S3_BUCKET_NAME!;

  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(awsUploader(s3, bucketName))
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet,]);

  // States
  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [nftFile, setNftFile] = useState<File>();
  const [nftDescription, setNftDescription] = useState("");

  const cancelOnClick = () => {
    // Reset all states
    setNftName("");
    setNftSymbol("");
    setNftDescription("");
    setNftFile(undefined);
  }

  const createNftOnClick = async () => {
    const validateInput = (input: any, message: string) => {
      if (!input) {
        toast.error(message)
        return false;
      }
      return true;
    }
    if (!validateInput(nftName, "Please enter a name for your NFT")) return;
    if (!validateInput(nftSymbol, "Please enter a symbol for your NFT")) return;
    if (!validateInput(nftFile, "Please upload a file first")) return;
    if (!validateInput(nftDescription, "Please enter a description for your NFT")) return;

    // First upload the file
    const file = await createGenericFileFromBrowserFile(nftFile!);
    let [fileUri] = await umi.uploader.upload([file]);

    console.log("file uri", fileUri)

    // Upload the Json metadata 
    const jsonUri = await umi.uploader.uploadJson({
      name: nftName,
      symbol: nftSymbol,
      description: nftDescription,
      image: fileUri,
    })

    console.log("json uri", jsonUri)

    // Now we create the NFT
    // Our Nft Mint
    const mint = generateSigner(umi)

    console.log("mint", mint.publicKey)

    // First create the metadata account
    try {
      toast.loading("Creating NFT...")
      let createTx = await createV1(umi, {
        mint: mint,
        authority: umi.identity,
        updateAuthority: umi.identity,
        payer: umi.payer,
        name: nftName,
        symbol: nftSymbol,
        uri: jsonUri,
        sellerFeeBasisPoints: percentAmount(0),
        tokenStandard: TokenStandard.NonFungible,
        primarySaleHappened: false,
      }).sendAndConfirm(umi, {
        send: {
          preflightCommitment: "confirmed",
        },
      })

      toast.dismiss();
      toast.success(`NFT created tx: ${base58.deserialize(createTx.signature)[0]}`);
    } catch (err) {
      toast.dismiss()
      toast.error(`Failed to create NFT: ${err}`)
      return
    }

    try {
      toast.loading("Minting NFT...")
      let mintTx = await mintV1(umi, {
        mint: mint.publicKey,
        authority: umi.identity,
        amount: 1,
        payer: umi.payer,
        tokenOwner: umi.identity.publicKey,
        tokenStandard: TokenStandard.NonFungible
      }).sendAndConfirm(umi, {
        send: {
          preflightCommitment: "confirmed",
        }
      })

      toast.dismiss()
      toast.success(`NFT minted tx: ${base58.deserialize(mintTx.signature)[0]}`)
    } catch (err) {
      toast.dismiss()
      toast.error(`Failed to mint NFT: ${err}`)
    }
  }

  return (
    <div>
      <div className="space-y-12">
        <div className="border-b border-white/10 pb-12">
          <h2 className="text-base font-semibold leading-7 text-white">NFT your estate</h2>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            Create your NFT here.
          </p>

          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-white">
                Nft Name
              </label>
              <div className="mt-2">
                <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="NFT Name"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="sm:col-span-4">
              <label htmlFor="username" className="block text-sm font-medium leading-6 text-white">
                Nft Symbol
              </label>
              <div className="mt-2">
                <div className="flex rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                  <input
                    type="text"
                    name="nftSymbol"
                    id="nftSymbol"
                    className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="NFT Symbol"
                    value={nftSymbol}
                    onChange={(e) => setNftSymbol(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-full">
              <label htmlFor="about" className="block text-sm font-medium leading-6 text-white">
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="about"
                  name="about"
                  rows={3}
                  className="block w-full rounded-md border-0 bg-white/5 py-1.5 text-white shadow-sm ring-1 ring-inset ring-white/10 focus:ring-2 focus:ring-inset focus:ring-indigo-500 sm:text-sm sm:leading-6"
                  value={nftDescription}
                  onChange={(e) => setNftDescription(e.target.value)}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-400">Describe your NFT</p>
            </div>

            <div className="col-span-full">
              <label htmlFor="cover-photo" className="block text-sm font-medium leading-6 text-white">
                Nft Image
              </label>
              <div className="mt-2 flex justify-center rounded-lg border border-dashed border-white/25 px-6 py-10">
                <div className="text-center">
                  {
                    nftFile ?
                      <img src={URL.createObjectURL(nftFile)} alt="NFT" className="mx-auto text-gray-500" />
                      :
                      <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" aria-hidden="true" />
                  }
                  <div className="mt-4 flex text-sm leading-6 text-gray-400">
                    <div className="mx-auto">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setNftFile(e.target.files?.[0])} />
                      </label>
                      <p className="pl-1">no drag and drop cuz I am busy</p>
                    </div>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
        <button onClick={cancelOnClick} type="button" className="text-sm font-semibold leading-6 text-white">
          Cancel
        </button>
        {wallet?.publicKey ? (
          <button
            onClick={createNftOnClick}
            className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            Save
          </button>
        ) : (
          <WalletConnect className="bg-primary text-white" />
        )
        }
      </div>
    </div>
  )
}
