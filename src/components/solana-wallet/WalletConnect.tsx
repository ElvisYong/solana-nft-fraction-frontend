import React, { CSSProperties } from 'react';
import {
  WalletMultiButton,
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { useWallet } from '@solana/wallet-adapter-react';

type WalletConnectProps = {
  className?: string;
  style?: CSSProperties;
  children: React.ReactNode;
};

const WalletConnect: React.FC<WalletConnectProps> = (props) => {
  const wallet = useWallet();

  return (
    <div>
      {wallet.publicKey ? (
        props.children
      ) : (
        <WalletModalProvider>
          <WalletMultiButton />
        </WalletModalProvider>
      )}
    </div>
  );
};

export default WalletConnect;
