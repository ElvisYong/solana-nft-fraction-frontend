import * as anchor from "@coral-xyz/anchor";
import { useEffect, useMemo, useState } from 'react'
import { SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, ComputeBudgetProgram, clusterApiUrl, Signer, VersionedTransaction } from '@solana/web3.js'
import { DigitalAssetWithTokenAndJson, NftJsonType } from '@/types/NftJsonType'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { MPL_TOKEN_METADATA_PROGRAM_ID, fetchDigitalAssetWithTokenByMint, findMetadataPda, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import { publicKey, publicKeyBytes } from '@metaplex-foundation/umi'
import toast from 'react-hot-toast'
import idl from '../../../idl/solana_nft_fraction.json';
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SolanaNftFraction } from "@/idl/solana_nft_fraction";
import { getAssociatedTokenAddress } from "@solana/spl-token";

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
  const program = new Program(idl as SolanaNftFraction, FRACTION_PROGRAM_ID, provider) as Program<SolanaNftFraction>;

  const [asset, setAsset] = useState<DigitalAssetWithTokenAndJson>();
  const [fractionAmount, setFractionAmount] = useState<number | string>(0);

  useEffect(() => {
    const fetchNftInfo = async () => {
      if (!id) {
        return;
      }

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
  }, [id, umi])

  const onFractionalizeClick = async () => {
    if (!provider.wallet) {
      toast.error("Please connect your wallet")
      return;
    }

    if (!asset || fractionAmount as number <= 0) {
      toast.error("Please input an amount to fractionalize thats greater than 0")
      return;
    }

    try {
      toast.loading("Fractionalizing NFT")

      const tokenMint = anchor.web3.Keypair.generate();

      const [nftVault, nftVaultBump] = await anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("nft_vault")), tokenMint.publicKey.toBuffer()],
        program.programId
      );

      const [fractionPDA, fractionBump] = anchor.web3.PublicKey.findProgramAddressSync(
        [Buffer.from(anchor.utils.bytes.utf8.encode("fraction")), nftVault.toBuffer()],
        program.programId
      );


      const [fractionMetadataAccount, fractionMetadataAccountBump] = findMetadataPda(umi, {
        mint: publicKey(tokenMint.publicKey)
      });

      const ixArgs = {
        shareAmount: new anchor.BN(fractionAmount),
        fractionAccount: fractionPDA,
      }

      let userTokenAccount = await getAssociatedTokenAddress(tokenMint.publicKey, provider.wallet.publicKey);

      const ixAccounts = {
        user: provider.wallet.publicKey,
        fractionAccount: fractionPDA,
        nftVault: nftVault,
        nftAccount: asset.token.publicKey,
        nftMint: asset.mint.publicKey,
        nftMetadataAccount: asset.metadata.publicKey,
        fractionTokenMetadata: fractionMetadataAccount,
        userTokenAccount: userTokenAccount,
        tokenMint: tokenMint.publicKey,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        ataProgram: ASSOCIATED_PROGRAM_ID,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
      }

      // We need to modify the compute units to be able to run the transaction
      const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000
      });

      // let txid = await program.methods.fractionalizeNft(ixArgs.shareAmount)
      //   .accounts(ixAccounts)
      //   .signers([wallet.payer, tokenMint])
      //   .preInstructions([modifyComputeUnits])
      //   .rpc();

      let ix = await program.methods.fractionalizeNft(ixArgs.shareAmount)
        .accounts(ixAccounts)
        .instruction();

      // Step 1 - Fetch the latest blockhash
      let latestBlockhash = await provider.connection.getLatestBlockhash("confirmed");
      console.log(
        "   ✅ - Fetched latest blockhash. Last Valid Height:",
        latestBlockhash.lastValidBlockHeight
      );

      // Step 2 - Generate Transaction Message
      const messageV0 = new anchor.web3.TransactionMessage({
        payerKey: provider.wallet.publicKey,
        instructions: [modifyComputeUnitsIx, ix],
        recentBlockhash: latestBlockhash.blockhash,
      }).compileToV0Message();
      const transaction = new anchor.web3.VersionedTransaction(messageV0);

      // Step 3 - Sign Transaction
      let signedTx = await provider.wallet.signTransaction(transaction);
      let tokenSigner: Signer = {
        publicKey: tokenMint.publicKey,
        secretKey: tokenMint.secretKey
      }

      // Add the token signer to the transaction
      signedTx.sign([tokenSigner]);

      const txid = await provider.connection.sendTransaction(signedTx);

      toast.success("NFT Fractionalized: " + txid)
    } catch (e: any) {
      console.log(e)
      toast.error("Error: " + e)
    }

  }

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

              <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                <div className="sm:col-span-4">
                  <label htmlFor="username" className="block text-sm font-medium leading-6 text-white">
                    Amounts to Fractionalize
                  </label>
                  <div className="mt-2">
                    <div className="flex pl-3 rounded-md bg-white/5 ring-1 ring-inset ring-white/10 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-500">
                      <input
                        type="number"
                        className="flex-1 border-0 bg-transparent py-1.5 pl-1 text-white focus:ring-0 sm:text-sm sm:leading-6"
                        placeholder="10"
                        value={fractionAmount || ""}
                        onChange={(e) => setFractionAmount(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* TODO Add checks if this is your NFT/FT */}
              <div className="mt-10 flex">
                <button
                  onClick={onFractionalizeClick}
                  className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                >
                  Fractionalize NFT
                </button>
              </div>

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

