import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  Animated,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSQLiteContext } from 'expo-sqlite';
import { syncWithFirebase } from '@/services/syncService';

interface SideDrawerProps {
  visible: boolean;
  onClose: () => void;
}

const DRAWER_WIDTH = 300;
const SCREEN_WIDTH = Dimensions.get('window').width;

export default function SideDrawer({ visible, onClose }: SideDrawerProps) {
  const router = useRouter();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const accounts = useAccountStore((s) => s.accounts);
  const categories = useCategoryStore((s) => s.categories);

  const isGuest = !user || user.uid === 'local-user' || user.email === 'guest@local';

  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Slide out and fade backdrop
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    // Animate out then call onClose prop
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -DRAWER_WIDTH,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const navigateTo = (path: string) => {
    handleClose();
    // Use setTimeout to allow the drawer slide-out animation to complete first
    setTimeout(() => {
      router.push(path as any);
    }, 220);
  };

  const handleSync = async () => {
    if (isGuest) {
      Alert.alert('Sync to Cloud', 'Please sign in to synchronize your data with the cloud.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => navigateTo('/(auth)/sign-in') },
      ]);
      return;
    }

    Alert.alert('Sync to Cloud', 'Synchronizing with Firebase Firestore. Please wait...', []);
    try {
      await syncWithFirebase(db, user!.uid);
      // Reload stores
      await useAccountStore.getState().loadAccounts(db, user!.uid);
      await useCategoryStore.getState().loadCategories(db, user!.uid);
      await useTransactionStore.getState().loadTransactions(db, user!.uid);
      
      // Close alert and show success
      Alert.alert('Sync Success', 'Your accounts, categories, and transactions are fully synchronized!');
    } catch (e) {
      Alert.alert('Sync Failed', 'Failed to synchronize with the cloud. Please try again.');
    }
  };

  const handleSignOut = () => {
    handleClose();
    setTimeout(() => {
      Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            logout();
            router.replace('/(auth)/sign-in');
          },
        },
      ]);
    }, 220);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Backdrop overlay */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        </Animated.View>

        {/* Drawer body */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.surface,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
            <View style={styles.logoRow}>
              <View style={[styles.logoIcon, { backgroundColor: colors.primary }]}>
                <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.appName, { color: colors.text }]}>Money Manager</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileSection}>
            <TouchableOpacity
              style={[
                styles.profileCard,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.borderLight },
              ]}
              onPress={() => navigateTo('/more')}
            >
              <Image
                source={{
                  uri: user?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
                }}
                style={styles.profileAvatar}
              />
              <View style={styles.profileDetails}>
                <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={1}>
                  {user?.displayName || 'Guest User'}
                </Text>
                <Text style={[styles.profileEmail, { color: colors.textSecondary }]} numberOfLines={1}>
                  {user?.email || 'Offline Database'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Menu Items */}
          <View style={styles.navContainer}>
            <Text style={[styles.sectionHeading, { color: colors.textTertiary }]}>Navigation</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(tabs)')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="home-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/accounts')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="wallet-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Accounts</Text>
              <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{accounts.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/categories')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentContainer }]}>
                <Ionicons name="layers-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Categories</Text>
              <View style={[styles.badge, { backgroundColor: colors.surfaceVariant }]}>
                <Text style={[styles.badgeText, { color: colors.textSecondary }]}>{categories.length}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/family')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentContainer }]}>
                <Ionicons name="people-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Family Groups</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/(tabs)/budgets')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="pie-chart-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Budgets</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/goals')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.accentContainer }]}>
                <Ionicons name="ribbon-outline" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Goals</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => navigateTo('/reports')}>
              <View style={[styles.menuIconBox, { backgroundColor: colors.primaryContainer }]}>
                <Ionicons name="bar-chart-outline" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuText, { color: colors.text }]}>Reports</Text>
            </TouchableOpacity>
          </View>

          {/* Cloud Action Footer */}
          <View style={[styles.footer, { borderTopColor: colors.borderLight }]}>
            <TouchableOpacity style={[styles.syncButton, { backgroundColor: colors.primary }]} onPress={handleSync}>
              <Ionicons name="cloud-upload-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.syncButtonText}>Sync to Cloud</Text>
            </TouchableOpacity>

            {isGuest ? (
              <TouchableOpacity
                style={[styles.authButton, { borderColor: colors.border }]}
                onPress={() => navigateTo('/(auth)/sign-in')}
              >
                <Ionicons name="log-in-outline" size={18} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.authButtonText, { color: colors.text }]}>Sign In</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.authButton, { borderColor: colors.border }]}
                onPress={handleSignOut}
              >
                <Ionicons name="log-out-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
                <Text style={[styles.authButtonText, { color: "#EF4444" }]}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    height: '100%',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    paddingTop: 48,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appName: {
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  profileSection: {
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  profileAvatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
  },
  profileDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  navContainer: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 6,
  },
  sectionHeading: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  menuIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  footer: {
    borderTopWidth: 1,
    padding: 16,
    gap: 10,
    paddingBottom: 28,
  },
  syncButton: {
    height: 44,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  authButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
