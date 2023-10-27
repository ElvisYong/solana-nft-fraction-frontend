import React, { CSSProperties } from 'react';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';
import dynamic from 'next/dynamic';

type WalletConnectProps = {
  className?: string;
  style?: CSSProperties;
};

export const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

const WalletConnect: React.FC<WalletConnectProps> = () => {
  return (
    <div>
      <WalletModalProvider>
        <WalletMultiButtonDynamic />
      </WalletModalProvider>
    </div>
  );
};

export default WalletConnect;
