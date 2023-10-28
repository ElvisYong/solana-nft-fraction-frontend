import { DigitalAssetWithToken } from "@metaplex-foundation/mpl-token-metadata";

type NftJsonType = {
  name: string,
  symbol: string,
  description: string,
  image: string,
}

type DigitalAssetWithTokenAndJson = DigitalAssetWithToken & NftJsonType;

export type { NftJsonType, DigitalAssetWithTokenAndJson };
