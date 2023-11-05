import { DigitalAssetWithTokenAndJson } from "@/types/NftJsonType";
import Link from "next/link";
import React from "react";

type GalleryViewProps = {
  tokens: DigitalAssetWithTokenAndJson[];
};

const GalleryView: React.FC<GalleryViewProps> = (props: GalleryViewProps) => {
  return (
    <>
      <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 sm:gap-x-6 lg:grid-cols-4 xl:gap-x-8">
        {props.tokens && props.tokens.map((token, i) => (
          <li key={i} className="relative">
            <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg bg-gray-100 focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-100">
              <Link href={`/token/${encodeURIComponent(token.mint.publicKey)}`}>
                <img src={token.image} alt="" className="pointer-events-none object-cover group-hover:opacity-75" />
              </Link>
            </div>
            <p className="pointer-events-none mt-2 block truncate text-sm font-medium text-white">{token.metadata.name}</p>
            <p className="pointer-events-none block text-sm font-medium text-gray-500">{token.metadata.symbol}</p>
          </li>
        ))}
      </ul>
    </>
  )
}

export default GalleryView;