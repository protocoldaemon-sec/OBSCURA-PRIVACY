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
import { useSwap } from '../hooks/useObscura';
import { useWallet } from '../context/WalletContext';
import { colors, spacing, borderRadius } from '../constants/theme';

const TOKENS = ['ETH', 'USDC', 'USDT', 'SOL', 'WBTC'] as const;
const PRIVACY_LEVELS = ['shielded', 'compliant', 'transparent'] as const;

export default function SwapScreen() {
  const { swap, loading, error, intent } = useSwap();
  const { wallet, signTransaction } = useWallet();
  
  const [tokenIn, setTokenIn] = useState('ETH');
  const [tokenOut, setTokenOut] = useState('USDC');
  const [amountIn, setAmountIn] = useState('');
  const [minAmountOut, setMinAmountOut] = useState('');
  const [privacyLevel, setPrivacyLevel] = useState<typeof PRIVACY_LEVELS[number]>('shielded');

  const handleSwap = async () => {
    if (!wallet.connected) {
      Alert.alert('Wallet Required', 'Please connect your wallet first');
      return;
    }

    if (!amountIn || !minAmountOut) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    try {
      // Sign the transaction with wallet
      const signature = await signTransaction({
        type: 'swap',
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        privacyLevel,
      });

      if (!signature) {
        Alert.alert('Error', 'Transaction signing failed');
        return;
      }

      const result = await swap({
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        privacyLevel,
      });
      
      Alert.alert(
        'Swap Created',
        `Intent ID: ${result.intentId}\n\nYour swap is being processed privately.`
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Swap failed');
    }
  };

  const switchTokens = () => {
    const temp = tokenIn;
    setTokenIn(tokenOut);
    setTokenOut(temp);
  };

  // Show connect wallet prompt if not connected
  if (!wallet.connected) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.connectPrompt}>
          <Text style={styles.connectIcon}>🔐</Text>
          <Text style={styles.connectTitle}>Wallet Required</Text>
          <Text style={styles.connectDesc}>
            Connect your wallet to make private swaps
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
        <Text style={styles.title}>Private Swap</Text>
        <Text style={styles.subtitle}>Swap tokens with hidden amounts</Text>

        {/* Connected Wallet Info */}
        <View style={styles.walletInfo}>
          <View style={styles.walletDot} />
          <Text style={styles.walletText}>
            {wallet.address?.slice(0, 8)}...{wallet.address?.slice(-6)} • {wallet.balance}
          </Text>
        </View>

        {/* Token In */}
        <View style={styles.swapCard}>
          <Text style={styles.label}>You Pay</Text>
          <View style={styles.tokenRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={colors.text.muted}
              value={amountIn}
              onChangeText={setAmountIn}
              keyboardType="decimal-pad"
            />
            <View style={styles.tokenSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TOKENS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tokenChip, tokenIn === t && styles.tokenChipActive]}
                    onPress={() => setTokenIn(t)}
                  >
                    <Text style={[styles.tokenText, tokenIn === t && styles.tokenTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>

        {/* Switch Button */}
        <TouchableOpacity style={styles.switchButton} onPress={switchTokens} activeOpacity={0.8}>
          <LinearGradient
            colors={['#8B5CF6', '#6366F1']}
            style={styles.switchGradient}
          >
            <Text style={styles.switchText}>⇅</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Token Out */}
        <View style={styles.swapCard}>
          <Text style={styles.label}>You Receive (min)</Text>
          <View style={styles.tokenRow}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.0"
              placeholderTextColor={colors.text.muted}
              value={minAmountOut}
              onChangeText={setMinAmountOut}
              keyboardType="decimal-pad"
            />
            <View style={styles.tokenSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {TOKENS.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.tokenChip, tokenOut === t && styles.tokenChipActive]}
                    onPress={() => setTokenOut(t)}
                  >
                    <Text style={[styles.tokenText, tokenOut === t && styles.tokenTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
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
          onPress={handleSwap}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#3B82F6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.button, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={colors.text.primary} />
            ) : (
              <Text style={styles.buttonText}>🔄 Execute Private Swap</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {intent && (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>✅ Swap Created</Text>
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
  swapCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  label: {
    color: colors.text.secondary,
    fontSize: 12,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tokenRow: {
    gap: spacing.md,
  },
  amountInput: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text.primary,
    padding: 0,
  },
  tokenSelector: {
    marginTop: spacing.md,
  },
  tokenChip: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  tokenChipActive: {
    backgroundColor: colors.brand.primary,
  },
  tokenText: {
    color: colors.text.muted,
    fontSize: 14,
    fontWeight: '600',
  },
  tokenTextActive: {
    color: colors.text.primary,
  },
  switchButton: {
    alignSelf: 'center',
    marginVertical: -spacing.md,
    zIndex: 1,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  switchGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchText: {
    color: colors.text.primary,
    fontSize: 20,
  },
  inputGroup: {
    marginTop: spacing.lg,
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
    marginTop: spacing.xl,
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
