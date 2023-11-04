export type SolanaNftFraction = {
  "version": "0.1.0",
  "name": "solana_nft_fraction",
  "instructions": [
    {
      "name": "fractionalizeNft",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The user who is fractionalizing the NFT"
          ]
        },
        {
          "name": "fractionAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that holds the fraction account details",
            "We will use the nft_vault as the seed for the pda"
          ]
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The pda vault thats going to hold the NFT",
            "Use the created token_mint as seed for the vault"
          ]
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The original account that holds the NFT token"
          ]
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The NFT Mint Account"
          ]
        },
        {
          "name": "nftMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionTokenMetadata",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata account of the Fractionalized NFT Token.",
            "This account must be uninitialized.",
            ""
          ]
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination token account"
          ]
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account will be initialized if necessary.",
            "",
            "Must be a signer if:",
            "* the token mint account does not exist.",
            ""
          ]
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token Metadata Program"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl token program"
          ]
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl ata program"
          ]
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana native system program"
          ]
        }
      ],
      "args": [
        {
          "name": "shareAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unfractionalizeNft",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The user who is fractionalizing the NFT"
          ]
        },
        {
          "name": "fractionAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that holds the fraction account details",
            "We will use the nft_vault as the seed for the pda"
          ]
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The pda vault thats holding the NFT"
          ]
        },
        {
          "name": "userNftAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The user account to hold the nft"
          ]
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The NFT Mint Account"
          ]
        },
        {
          "name": "nftMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionTokenMetadata",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata account of the Fractionalized NFT Token.",
            "This account must be uninitialized.",
            ""
          ]
        },
        {
          "name": "userFractionToken",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination token account"
          ]
        },
        {
          "name": "fractionTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The account will be initialized if necessary.",
            "",
            "Must be a signer if:",
            "* the token mint account does not exist.",
            ""
          ]
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token Metadata Program"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl token program"
          ]
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl ata program"
          ]
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana native system program"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fractionDetails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftVaultAccount",
            "docs": [
              "The vault account for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "docs": [
              "The nft mint for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "docs": [
              "The spl token mint for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "withdrawAuthority",
            "docs": [
              "The authority that can withdraw the NFT from the vault. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "sharesAmount",
            "docs": [
              "The number of shares that exist for this NFT. (8)"
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "WrongOwner",
      "msg": "SPL token owner does not belong to the user"
    },
    {
      "code": 6001,
      "name": "NotEnoughShares",
      "msg": "Not enough shares to unfractionalize"
    }
  ]
};

export const IDL: SolanaNftFraction = {
  "version": "0.1.0",
  "name": "solana_nft_fraction",
  "instructions": [
    {
      "name": "fractionalizeNft",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The user who is fractionalizing the NFT"
          ]
        },
        {
          "name": "fractionAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that holds the fraction account details",
            "We will use the nft_vault as the seed for the pda"
          ]
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The pda vault thats going to hold the NFT",
            "Use the created token_mint as seed for the vault"
          ]
        },
        {
          "name": "nftAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The original account that holds the NFT token"
          ]
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The NFT Mint Account"
          ]
        },
        {
          "name": "nftMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionTokenMetadata",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata account of the Fractionalized NFT Token.",
            "This account must be uninitialized.",
            ""
          ]
        },
        {
          "name": "userTokenAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination token account"
          ]
        },
        {
          "name": "tokenMint",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account will be initialized if necessary.",
            "",
            "Must be a signer if:",
            "* the token mint account does not exist.",
            ""
          ]
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token Metadata Program"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl token program"
          ]
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl ata program"
          ]
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana native system program"
          ]
        }
      ],
      "args": [
        {
          "name": "shareAmount",
          "type": "u64"
        }
      ]
    },
    {
      "name": "unfractionalizeNft",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The user who is fractionalizing the NFT"
          ]
        },
        {
          "name": "fractionAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "PDA that holds the fraction account details",
            "We will use the nft_vault as the seed for the pda"
          ]
        },
        {
          "name": "nftVault",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The pda vault thats holding the NFT"
          ]
        },
        {
          "name": "userNftAccount",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The user account to hold the nft"
          ]
        },
        {
          "name": "nftMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The NFT Mint Account"
          ]
        },
        {
          "name": "nftMetadataAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "fractionTokenMetadata",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Metadata account of the Fractionalized NFT Token.",
            "This account must be uninitialized.",
            ""
          ]
        },
        {
          "name": "userFractionToken",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "Destination token account"
          ]
        },
        {
          "name": "fractionTokenMint",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "The account will be initialized if necessary.",
            "",
            "Must be a signer if:",
            "* the token mint account does not exist.",
            ""
          ]
        },
        {
          "name": "tokenMetadataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Token Metadata Program"
          ]
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl token program"
          ]
        },
        {
          "name": "ataProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "spl ata program"
          ]
        },
        {
          "name": "sysvarInstructions",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "Solana native system program"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "fractionDetails",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "nftVaultAccount",
            "docs": [
              "The vault account for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "nftMint",
            "docs": [
              "The nft mint for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "splTokenMint",
            "docs": [
              "The spl token mint for the fractionalized NFT. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "withdrawAuthority",
            "docs": [
              "The authority that can withdraw the NFT from the vault. (32)"
            ],
            "type": "publicKey"
          },
          {
            "name": "sharesAmount",
            "docs": [
              "The number of shares that exist for this NFT. (8)"
            ],
            "type": "u64"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "WrongOwner",
      "msg": "SPL token owner does not belong to the user"
    },
    {
      "code": 6001,
      "name": "NotEnoughShares",
      "msg": "Not enough shares to unfractionalize"
    }
  ]
};
