import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTransfer } from '../hooks/useObscura';
import { useWallet } from '../context/WalletContext';
import { colors, spacing, borderRadius } from '../constants/theme';

const CHAINS = ['ethereum', 'solana', 'polygon', 'arbitrum'] as const;
const PRIVACY_LEVELS = ['shielded', 'compliant', 'transparent'] as const;

export default function TransferScreen() {
  const { transfer, loading, error, intent } = useTransfer();
  const { wallet, signTransaction } = useWallet();
  
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('ETH');
  const [chain, setChain] = useState<typeof CHAINS[number]>('ethereum');
  const [privacyLevel, setPrivacyLevel] = useState<typeof PRIVACY_LEVELS[number]>('shielded');

  const handleTransfer = async () => {
    if (!wallet.connected) {
      Alert.alert('Wallet Required', 'Please connect your wallet first');
      return;
    }

    if (!recipient || !amount) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      // Sign the transaction with wallet
      const signature = await signTransaction({
        type: 'transfer',
        recipient,
        amount,
        asset,
        chain,
        privacyLevel,
      });

      if (!signature) {
        Alert.alert('Error', 'Transaction signing failed');
        return;
      }

      const result = await transfer({
        recipient,
        amount,
        asset,
        sourceChain: chain,
        privacyLevel,
      });
      
      Alert.alert(
        'Transfer Created',
        `Intent ID: ${result.intentId}\n\nYour transfer is being processed privately.`
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Transfer failed');
    }
  };

  // Show connect wallet prompt if not connected
  if (!wallet.connected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.connectPrompt}>
          <Text style={styles.connectIcon}>🔐</Text>
          <Text style={styles.connectTitle}>Wallet Required</Text>
          <Text style={styles.connectDesc}>
            Connect your wallet to make private transfers
          </Text>
          <Text style={styles.connectHint}>
            Tap the "Connect Wallet" button in the header
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Private Transfer</Text>
        <Text style={styles.subtitle}>Send tokens with hidden amounts</Text>

        {/* Connected Wallet Info */}
        <View style={styles.walletInfo}>
          <View style={styles.walletDot} />
          <Text style={styles.walletText}>
            From: {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)}
          </Text>
        </View>

        {/* Recipient */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recipient Address</Text>
          <TextInput
            style={styles.input}
            placeholder="0x... or wallet address"
            placeholderTextColor={colors.text.muted}
            value={recipient}
            onChangeText={setRecipient}
            autoCapitalize="none"
          />
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="0.0"
              placeholderTextColor={colors.text.muted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.assetInput]}
              placeholder="ETH"
              placeholderTextColor={colors.text.muted}
              value={asset}
              onChangeText={setAsset}
              autoCapitalize="characters"
            />
          </View>
          <Text style={styles.balanceHint}>Available: {wallet.balance}</Text>
        </View>

        {/* Chain Selection */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chain</Text>
          <View style={styles.chipRow}>
            {CHAINS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.chip, chain === c && styles.chipActive]}
                onPress={() => setChain(c)}
              >
                <Text style={[styles.chipText, chain === c && styles.chipTextActive]}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Privacy Level */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Privacy Level</Text>
          <View style={styles.chipRow}>
            {PRIVACY_LEVELS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, privacyLevel === p && styles.chipActive]}
                onPress={() => setPrivacyLevel(p)}
              >
                <Text style={[styles.chipText, privacyLevel === p && styles.chipTextActive]}>
                  {p === 'shielded' ? '🛡️' : p === 'compliant' ? '📋' : '🔓'} {p}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.buttonWrapper}
          onPress={handleTransfer}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.buttonText}>🔒 Send Private Transfer</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {intent && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✅ Transfer Created</Text>
            <Text style={styles.resultText}>Intent ID: {intent.intentId}</Text>
            <Text style={styles.resultText}>Commitment: {intent.commitment?.slice(0, 20)}...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>❌ {error}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  connectPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  connectIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  connectDesc: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  connectHint: {
    fontSize: 14,
    color: colors.brand.primary,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginBottom: spacing.lg,
  },
  walletInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.brand.primary,
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
    marginRight: spacing.sm,
  },
  walletText: {
    color: colors.text.secondary,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  inputGroup: {
    marginBottom: spacing.lg,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  amountRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  assetInput: {
    width: 80,
    textAlign: 'center',
  },
  balanceHint: {
    color: colors.text.muted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  chipActive: {
    backgroundColor: colors.brand.primary,
    borderColor: colors.brand.primary,
  },
  chipText: {
    color: colors.text.muted,
    fontSize: 12,
  },
  chipTextActive: {
    color: colors.text.primary,
  },
  buttonWrapper: {
    marginTop: spacing.lg,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  button: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  resultCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  resultTitle: {
    color: colors.status.success,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  resultText: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: 4,
  },
  errorCard: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: colors.status.error,
    fontSize: 14,
  },
});
