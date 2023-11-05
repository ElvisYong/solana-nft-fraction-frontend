import * as anchor from "@coral-xyz/anchor";
import { useEffect, useMemo, useState } from 'react'
import { SystemProgram, SYSVAR_INSTRUCTIONS_PUBKEY, ComputeBudgetProgram, clusterApiUrl, Signer, VersionedTransaction, PublicKey } from '@solana/web3.js'
import { DigitalAssetWithTokenAndJson, NftJsonType } from '@/types/NftJsonType'
import { AnchorProvider, Program } from '@coral-xyz/anchor'
import { MPL_TOKEN_METADATA_PROGRAM_ID, TokenStandard, fetchDigitalAssetWithTokenByMint, findMetadataPda, mplTokenMetadata } from '@metaplex-foundation/mpl-token-metadata'
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults'
import { walletAdapterIdentity } from '@metaplex-foundation/umi-signer-wallet-adapters'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react'
import { useRouter } from 'next/router'
import { isSome, publicKey, publicKeyBytes, unwrapOption } from '@metaplex-foundation/umi'
import toast from 'react-hot-toast'
import { ASSOCIATED_PROGRAM_ID, TOKEN_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { SolanaNftFraction, IDL } from "@/idl/solana_nft_fraction";
import { getAssociatedTokenAddress } from "@solana/spl-token";

const FRACTION_PROGRAM_ID = "CgzL8rB2MyJDVNJxWeLr7D7vNMudLRFGVFK8a2QHqCJT";

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

  const program = new Program(IDL, FRACTION_PROGRAM_ID, provider) as Program<SolanaNftFraction>;

  // Used by all
  const [asset, setAsset] = useState<DigitalAssetWithTokenAndJson>();

  // Used by FT
  const [nftVaultAccount, setNftVaultAccount] = useState<any>();
  const [fractionAccount, setFractionAccount] = useState<any>();
  const [fractionDetails, setFractionDetails] = useState<any>();

  // Used by NFT 
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

        if (unwrapOption(asset.metadata.tokenStandard) !== TokenStandard.NonFungible) {
          // First we grab the program derived accounts
          const [nftVault, nftVaultBump] = await anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(anchor.utils.bytes.utf8.encode("nft_vault")), publicKeyBytes(asset.token.mint)],
            program.programId
          );

          const [fractionPDA, fractionBump] = anchor.web3.PublicKey.findProgramAddressSync(
            [Buffer.from(anchor.utils.bytes.utf8.encode("fraction")), nftVault.toBuffer()],
            program.programId
          );

          // We will need to get account info to get the serialized data from fractionPDA
          let fractionAccountInfo = await provider.connection.getAccountInfo(fractionPDA, {
            commitment: "confirmed"
          });

          if (!fractionAccountInfo) {
            toast.error("Fractionalization account does not exist")
            return;
          }

          // Use anchor's borshdecoder to decode the data, anchor provides a really nice interface for it
          const fractionCoder = new anchor.BorshCoder(IDL);
          let fractionDetails = fractionCoder.accounts.decode("fractionDetails", fractionAccountInfo.data)

          console.log("fraction details: ", fractionDetails)

          setNftVaultAccount(nftVault);
          setFractionAccount(fractionPDA);
          setFractionDetails(fractionDetails);
        }

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

      // Generate the token mint account for the fractionalized token
      const tokenMint = anchor.web3.Keypair.generate();

      // Generate the program derived addresses for the nft vault and fraction account and metadata
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

      // Fill up the instruction arguments
      const ixArgs = {
        shareAmount: new anchor.BN(fractionAmount),
        fractionAccount: fractionPDA,
      }

      // Create an associated token address for the user to store the spl tokens
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

      // We need to modify the compute units to be able to run the instructions
      const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000
      });

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

      toast.dismiss();
      toast.success("NFT Fractionalized: " + txid)
    } catch (e: any) {
      console.log(e)
      toast.error("Error: " + e)
    }
  }

  const onUnFractionalizeClick = async () => {
    if (!provider.wallet) {
      toast.error("Please connect your wallet")
      return;
    }

    if (!asset) {
      toast.error("Please input an amount to fractionalize thats greater than 0")
      return;
    }

    try {
      toast.loading("Un-Fractionalizing & withdrawing NFT")

      // Fill up the instruction arguments
      // Create an associated token address for the user to store the spl tokens
      let userNftAccount = await getAssociatedTokenAddress(fractionDetails.nftMint, provider.wallet.publicKey);

      const ixAccounts = {
        user: provider.wallet.publicKey,
        fractionAccount: fractionAccount,
        nftVault: nftVaultAccount,
        userNftAccount: userNftAccount,
        nftMint: fractionDetails.nftMint,
        nftMetadataAccount: fractionDetails.nftMetadata,
        fractionTokenMetadata: asset.metadata.publicKey,
        userFractionToken: asset.token.publicKey,
        fractionTokenMint: asset.token.mint,
        tokenMetadataProgram: MPL_TOKEN_METADATA_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        ataProgram: ASSOCIATED_PROGRAM_ID,
        sysvarInstructions: SYSVAR_INSTRUCTIONS_PUBKEY,
        systemProgram: SystemProgram.programId,
      }

      // We need to modify the compute units to be able to run the instructions
      const modifyComputeUnitsIx = ComputeBudgetProgram.setComputeUnitLimit({
        units: 1000000
      });

      let ix = await program.methods.unfractionalizeNft()
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

      const txid = await provider.connection.sendTransaction(signedTx, {
        preflightCommitment: "confirmed"
      });

      toast.dismiss();
      toast.success("NFT UnFractionalized and withdrawned: " + txid)
    } catch (e: any) {
      console.log(e)
      toast.error("Error: " + e)
    }
  }

  // Show views for non FTs
  return (
    asset &&
    <div >
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
            <div className="flex items-center">
              <img
                src={asset?.image}
                className="h-10 w-10 object-cover object-center sm:rounded-full"
              />
              <h1 className="text-3xl font-bold tracking-tight text-white ml-3">{asset.metadata.name}</h1>
            </div>


            <div className="mt-3">
              <h3 className="text-gray-400 font-medium text-sm">
                Symbol
              </h3>
              <p className="text-3xl tracking-tight text-white">{asset.metadata.symbol}</p>
            </div>
            <div className="mt-6">
              <h3 className="text-gray-400 font-medium">
                Description
              </h3>
              <p>{asset.description}</p>
            </div>

            {
              // For FTs, show the fractionalization details and the un-fractionalize NFT UI
              unwrapOption(asset.metadata.tokenStandard) !== TokenStandard.NonFungible ? (
                <>
                  <div className="mt-6">
                    <h3 className="text-gray-400 font-medium">
                      Shares Details
                    </h3>
                    <p>Total shares for token: <b>{fractionDetails.sharesAmount.toString()}</b></p>
                    <p>Amount Owned: <b>{asset.token.amount.toString()}</b></p>
                  </div>

                  <div className="mt-10 flex">
                    <button
                      onClick={onUnFractionalizeClick}
                      className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                    >
                      Un-Fractionalize & Withdraw NFT
                    </button>
                  </div>
                </>
              ) :
                // Show the fractionalization UI if NFT
                (
                  <>
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

                    <div className="mt-10 flex">
                      <button
                        onClick={onFractionalizeClick}
                        className="flex max-w-xs flex-1 items-center justify-center rounded-md border border-transparent bg-indigo-600 px-8 py-3 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-50 sm:w-full"
                      >
                        Fractionalize NFT
                      </button>
                    </div>
                  </>
                )
            }

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
    </div>
  )
}

