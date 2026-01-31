/**
 * Wallet Connection Button Component
 * Supports Solana Mobile Wallet Adapter and EVM wallets
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useWallet, ChainType } from '../context/WalletContext';
import { colors, spacing, borderRadius } from '../constants/theme';

interface WalletOption {
  id: string;
  name: string;
  chain: ChainType;
  icon: string;
  deepLink?: string;
}

const SOLANA_WALLETS: WalletOption[] = [
  { 
    id: 'phantom', 
    name: 'Phantom', 
    chain: 'solana', 
    icon: '👻',
    deepLink: 'phantom://',
  },
  { 
    id: 'solflare', 
    name: 'Solflare', 
    chain: 'solana', 
    icon: '🔥',
    deepLink: 'solflare://',
  },
  { 
    id: 'backpack', 
    name: 'Backpack', 
    chain: 'solana', 
    icon: '🎒',
    deepLink: 'backpack://',
  },
];

const EVM_WALLETS: WalletOption[] = [
  { 
    id: 'metamask', 
    name: 'MetaMask', 
    chain: 'ethereum', 
    icon: '🦊',
    deepLink: 'metamask://',
  },
  { 
    id: 'rainbow', 
    name: 'Rainbow', 
    chain: 'ethereum', 
    icon: '🌈',
    deepLink: 'rainbow://',
  },
  { 
    id: 'trust', 
    name: 'Trust Wallet', 
    chain: 'ethereum', 
    icon: '🛡️',
    deepLink: 'trust://',
  },
];

export default function WalletButton() {
  const { wallet, connect, disconnect, refreshBalance } = useWallet();
  const [modalVisible, setModalVisible] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async (option: WalletOption) => {
    setConnecting(option.id);
    setError(null);
    
    try {
      await connect(option.chain);
      setModalVisible(false);
    } catch (err: any) {
      console.error('Connection failed:', err);
      
      // Check if wallet app is installed
      if (option.deepLink && Platform.OS !== 'web') {
        const canOpen = await Linking.canOpenURL(option.deepLink);
        if (!canOpen) {
          setError(`${option.name} not installed. Please install it first.`);
          // Optionally open app store
          Alert.alert(
            'Wallet Not Found',
            `${option.name} is not installed. Would you like to install it?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { 
                text: 'Install', 
                onPress: () => {
                  // Open app store link based on wallet
                  const storeLinks: Record<string, string> = {
                    phantom: 'https://phantom.app/download',
                    solflare: 'https://solflare.com/download',
                    backpack: 'https://backpack.app/download',
                    metamask: 'https://metamask.io/download',
                    rainbow: 'https://rainbow.me',
                    trust: 'https://trustwallet.com/download',
                  };
                  Linking.openURL(storeLinks[option.id] || 'https://phantom.app/download');
                }
              },
            ]
          );
        } else {
          setError(err.message || 'Connection failed. Please try again.');
        }
      } else {
        setError(err.message || 'Connection failed. Please try again.');
      }
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    disconnect();
    setModalVisible(false);
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Connected state button
  if (wallet.connected && wallet.address) {
    return (
      <TouchableOpacity
        style={styles.connectedButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <View style={styles.connectedContent}>
          <View style={styles.statusDot} />
          <Text style={styles.addressText}>{formatAddress(wallet.address)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  // Disconnected state button
  return (
    <>
      <TouchableOpacity
        style={styles.connectWrapper}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#8B5CF6', '#6366F1']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.connectButton}
        >
          <Text style={styles.connectText}>Connect</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Wallet Selection Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {wallet.connected ? 'Wallet Connected' : 'Connect Wallet'}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButtonWrapper}
              >
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {wallet.connected ? (
              /* Connected View */
              <View style={styles.connectedInfo}>
                <View style={styles.walletInfo}>
                  <View style={styles.chainBadge}>
                    <Text style={styles.chainText}>
                      {wallet.chain.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.balanceLabel}>{wallet.balance}</Text>
                  <Text style={styles.fullAddress}>{wallet.address}</Text>
                </View>
                
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={refreshBalance}
                  >
                    <Text style={styles.refreshText}>🔄 Refresh</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.disconnectButton}
                    onPress={handleDisconnect}
                  >
                    <Text style={styles.disconnectText}>Disconnect</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* Wallet Selection View */
              <>
                {/* Solana Wallets */}
                <Text style={styles.sectionLabel}>Solana Wallets</Text>
                <Text style={styles.sectionHint}>
                  Connect with Mobile Wallet Adapter
                </Text>
                {SOLANA_WALLETS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.walletOption,
                      connecting === option.id && styles.walletOptionActive,
                    ]}
                    onPress={() => handleConnect(option)}
                    disabled={connecting !== null}
                  >
                    <Text style={styles.walletIcon}>{option.icon}</Text>
                    <View style={styles.walletDetails}>
                      <Text style={styles.walletName}>{option.name}</Text>
                      <Text style={styles.walletChain}>Solana</Text>
                    </View>
                    {connecting === option.id ? (
                      <ActivityIndicator color={colors.brand.primary} size="small" />
                    ) : (
                      <Text style={styles.walletArrow}>→</Text>
                    )}
                  </TouchableOpacity>
                ))}

                {/* EVM Wallets */}
                <Text style={[styles.sectionLabel, { marginTop: spacing.lg }]}>
                  EVM Wallets
                </Text>
                <Text style={styles.sectionHint}>
                  Ethereum, Polygon, Arbitrum
                </Text>
                {EVM_WALLETS.map((option) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.walletOption,
                      connecting === option.id && styles.walletOptionActive,
                    ]}
                    onPress={() => handleConnect(option)}
                    disabled={connecting !== null}
                  >
                    <Text style={styles.walletIcon}>{option.icon}</Text>
                    <View style={styles.walletDetails}>
                      <Text style={styles.walletName}>{option.name}</Text>
                      <Text style={styles.walletChain}>EVM</Text>
                    </View>
                    {connecting === option.id ? (
                      <ActivityIndicator color={colors.brand.primary} size="small" />
                    ) : (
                      <Text style={styles.walletArrow}>→</Text>
                    )}
                  </TouchableOpacity>
                ))}

                {/* Info */}
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    🔐 Your keys stay in your wallet. We never have access to your funds.
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  connectWrapper: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  connectButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  connectText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  connectedButton: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  connectedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
  },
  addressText: {
    color: colors.text.primary,
    fontSize: 13,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.secondary,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl + spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text.primary,
  },
  closeButtonWrapper: {
    padding: spacing.sm,
  },
  closeButton: {
    fontSize: 20,
    color: colors.text.muted,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: spacing.md,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  walletOptionActive: {
    borderColor: colors.brand.primary,
  },
  walletIcon: {
    fontSize: 28,
    marginRight: spacing.md,
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  walletChain: {
    fontSize: 12,
    color: colors.text.muted,
    marginTop: 2,
  },
  walletArrow: {
    fontSize: 18,
    color: colors.text.muted,
  },
  connectedInfo: {
    alignItems: 'center',
  },
  walletInfo: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    width: '100%',
  },
  chainBadge: {
    backgroundColor: colors.brand.primary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  chainText: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  balanceLabel: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  fullAddress: {
    fontSize: 11,
    color: colors.text.muted,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  refreshButton: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  refreshText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: '500',
  },
  disconnectButton: {
    flex: 1,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  disconnectText: {
    color: colors.status.error,
    fontSize: 14,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  infoText: {
    color: colors.text.muted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
