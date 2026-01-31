import React, { useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useHealth } from '../hooks/useObscura';
import { useWallet } from '../context/WalletContext';
import WalletButton from '../components/WalletButton';
import { colors, spacing, borderRadius } from '../constants/theme';

export default function HomeScreen({ navigation }: any) {
  const { checkHealth, loading, data, error } = useHealth();
  const { wallet } = useWallet();

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header with Logo and Wallet */}
        <View style={styles.topBar}>
          <View style={styles.logoSmall}>
            <Image 
              source={require('../../assets/logo/logo_white.png')} 
              style={styles.logoIcon}
              resizeMode="contain"
            />
          </View>
          <WalletButton />
        </View>

        {/* Hero Section */}
        <View style={styles.header}>
          <Text style={styles.title}>OBSCURA</Text>
          <Text style={styles.subtitle}>Post-Quantum Private Transactions</Text>
        </View>

        {/* Wallet Status Card */}
        {wallet.connected && wallet.address && (
          <View style={styles.walletCard}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.2)', 'rgba(99, 102, 241, 0.1)']}
              style={styles.walletGradient}
            >
              <View style={styles.walletHeader}>
                <View style={styles.walletStatus}>
                  <View style={styles.walletDot} />
                  <Text style={styles.walletChain}>{wallet.chain.toUpperCase()}</Text>
                </View>
                <Text style={styles.walletBalance}>{wallet.balance}</Text>
              </View>
              <Text style={styles.walletAddress}>
                {wallet.address.slice(0, 12)}...{wallet.address.slice(-8)}
              </Text>
            </LinearGradient>
          </View>
        )}

        {/* API Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusDot, data?.status === 'healthy' && styles.statusDotActive]} />
            <Text style={styles.statusLabel}>Network Status</Text>
          </View>
          {loading ? (
            <ActivityIndicator color={colors.brand.primary} size="small" />
          ) : error ? (
            <Text style={styles.statusError}>Offline</Text>
          ) : data ? (
            <Text style={styles.statusOk}>Connected</Text>
          ) : null}
        </View>

        {/* Main Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Transfer')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#8B5CF6', '#6366F1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🔒</Text>
              <Text style={styles.actionTitle}>Private Transfer</Text>
              <Text style={styles.actionDesc}>Send tokens with hidden amounts</Text>
              {!wallet.connected && (
                <Text style={styles.actionWarning}>Connect wallet to use</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Swap')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366F1', '#3B82F6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionIcon}>🔄</Text>
              <Text style={styles.actionTitle}>Private Swap</Text>
              <Text style={styles.actionDesc}>Swap tokens anonymously</Text>
              {!wallet.connected && (
                <Text style={styles.actionWarning}>Connect wallet to use</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Privacy Levels */}
        <View style={styles.privacySection}>
          <Text style={styles.sectionTitle}>Privacy Levels</Text>
          <View style={styles.privacyCards}>
            <View style={styles.privacyCard}>
              <Text style={styles.privacyIcon}>🛡️</Text>
              <Text style={styles.privacyName}>Shielded</Text>
              <Text style={styles.privacyDesc}>Maximum privacy</Text>
            </View>
            <View style={styles.privacyCard}>
              <Text style={styles.privacyIcon}>📋</Text>
              <Text style={styles.privacyName}>Compliant</Text>
              <Text style={styles.privacyDesc}>With viewing keys</Text>
            </View>
            <View style={styles.privacyCard}>
              <Text style={styles.privacyIcon}>🔓</Text>
              <Text style={styles.privacyName}>Transparent</Text>
              <Text style={styles.privacyDesc}>Debug mode</Text>
            </View>
          </View>
        </View>

        {/* Powered By Section */}
        <View style={styles.poweredBy}>
          <Text style={styles.poweredByTitle}>Powered By</Text>
          <View style={styles.partnerLogos}>
            <Image 
              source={require('../../assets/powered_by/daemonprotocol_logo_White_transparent_text.png')} 
              style={styles.partnerLogo}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/powered_by/Arcium_Isolated_White.png')} 
              style={styles.partnerLogoSmall}
              resizeMode="contain"
            />
            <Image 
              source={require('../../assets/powered_by/Helius-Horizontal-Logo-White.png')} 
              style={styles.partnerLogo}
              resizeMode="contain"
            />
          </View>
        </View>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 40,
    height: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text.primary,
    letterSpacing: 6,
  },
  subtitle: {
    fontSize: 14,
    color: colors.text.muted,
    marginTop: spacing.xs,
  },
  walletCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  walletGradient: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: borderRadius.lg,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  walletStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  walletDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.success,
    marginRight: spacing.sm,
  },
  walletChain: {
    color: colors.brand.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  walletBalance: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  walletAddress: {
    color: colors.text.muted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  statusCard: {
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.status.error,
    marginRight: spacing.sm,
  },
  statusDotActive: {
    backgroundColor: colors.status.success,
  },
  statusLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  statusOk: {
    color: colors.status.success,
    fontSize: 14,
    fontWeight: '600',
  },
  statusError: {
    color: colors.status.error,
    fontSize: 14,
  },
  actions: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  actionCard: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: spacing.lg,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: spacing.sm,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  actionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  actionWarning: {
    fontSize: 12,
    color: colors.status.warning,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  privacySection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  privacyCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  privacyCard: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  privacyIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  privacyName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 2,
  },
  privacyDesc: {
    fontSize: 10,
    color: colors.text.muted,
    textAlign: 'center',
  },
  poweredBy: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.default,
  },
  poweredByTitle: {
    fontSize: 12,
    color: colors.text.muted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  partnerLogos: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  partnerLogo: {
    width: 100,
    height: 30,
    opacity: 0.7,
  },
  partnerLogoSmall: {
    width: 40,
    height: 40,
    opacity: 0.7,
  },
});
