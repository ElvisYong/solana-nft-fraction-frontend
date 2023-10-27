import { PhotoIcon } from '@heroicons/react/24/solid'
import { useMemo, useState } from 'react'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { clusterApiUrl } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters';
import { AnchorProvider } from '@coral-xyz/anchor';
import { createGenericFileFromBrowserFile, generateSigner } from '@metaplex-foundation/umi';
import { awsUploader } from '@metaplex-foundation/umi-uploader-aws';
import { S3Client } from '@aws-sdk/client-s3';
import toast from 'react-hot-toast';
import WalletConnect from '../solana-wallet/WalletConnect';


export default function CreateNftForm() {
  const rpcEndpoint = clusterApiUrl(WalletAdapterNetwork.Devnet);
  const wallet = useAnchorWallet();
  const { connection } = useConnection();

  // Instantiate S3 client
  const s3 = new S3Client({
    region: process.env.AWS_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    }
  });
  const bucketName = process.env.AWS_BUCKET_NAME!;

  const provider = useMemo(() => new AnchorProvider(connection, wallet!, {}), [connection, wallet])
  const umi = useMemo(() =>
    createUmi(rpcEndpoint)
      .use(awsUploader(s3, bucketName))
      .use(walletAdapterIdentity(wallet!, true))
      .use(mplTokenMetadata()),
    [rpcEndpoint, wallet,]);

  // States
  const [nftName, setNftName] = useState("");
  const [nftFile, setNftFile] = useState<File>();
  const [nftDescription, setNftDescription] = useState("");

  const createNftOnClick = async () => {
    const validateInput = (input: any, message: string) => {
      if (!input) {
        toast.error(message)
        return false;
      }
      return true;
    }
    if (!validateInput(nftName, "Please enter a name for your NFT")) return;
    if (!validateInput(nftFile, "Please upload a file first")) return;
    if (!validateInput(nftDescription, "Please enter a description for your NFT")) return;

    // First upload the file
    const file = await createGenericFileFromBrowserFile(nftFile!);
    let [fileUri] = await umi.uploader.upload([file]);

    // Upload the Json metadata 
    const uri = await umi.uploader.uploadJson({
      name: nftName,
      descripotion: nftDescription,
      image: fileUri,
    })

    const mint = generateSigner(umi)
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
                    autoComplete="username"
                    className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                    placeholder="NFT Name"
                    onChange={(e) => setNftName(e.target.value)}
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
                  defaultValue={''}
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
                  <PhotoIcon className="mx-auto h-12 w-12 text-gray-500" aria-hidden="true" />
                  <div className="mt-4 flex text-sm leading-6 text-gray-400">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md bg-gray-900 font-semibold text-white focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-indigo-500"
                    >
                      <span>Upload a file</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={(e) => setNftFile(e.target.files?.[0])} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs leading-5 text-gray-400">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-x-6">
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
