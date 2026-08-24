import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Clipboard,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Typography, Spacing, BorderRadius } from '@/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAccountStore } from '@/store/useAccountStore';
import { useCategoryStore } from '@/store/useCategoryStore';
import { useTransactionStore } from '@/store/useTransactionStore';
import { useSQLiteContext } from 'expo-sqlite';
import { db as firestore } from '@/config/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  arrayUnion,
  writeBatch,
} from 'firebase/firestore';
import { syncWithFirebase } from '@/services/syncService';
import { SyncStatus } from '@/types/enums';

export default function FamilyScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const db = useSQLiteContext();

  const user = useAuthStore((s) => s.user);
  const { isFamilyMode, activeFamilyId, setFamilyMode } = useSettingsStore();

  const [families, setFamilies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Forms
  const [showCreate, setShowCreate] = useState(false);
  const [familyName, setFamilyName] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFamilies = async () => {
    if (!user || user.uid === 'local-user') {
      setIsLoading(false);
      return;
    }
    try {
      const q = query(
        collection(firestore, 'family-groups'),
        where('memberIds', 'array-contains', user.uid),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
      setFamilies(list);
    } catch (e) {
      console.error('Failed to fetch family groups:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFamilies();
  }, [user]);

  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name.');
      return;
    }
    setActionLoading(true);
    try {
      const familyRef = doc(collection(firestore, 'family-groups'));
      const familyId = familyRef.id;
      const code = generateInviteCode();

      const newFamily = {
        id: familyId,
        name: familyName.trim(),
        ownerUserId: user!.uid,
        inviteCode: code,
        mode: 'common',
        icon: '👨‍👩‍👧‍👦',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isActive: true,
        memberIds: [user!.uid],
      };

      // 1. Create family document
      await setDoc(familyRef, newFamily);

      // 2. Add owner as admin member
      const memberRef = doc(firestore, `family-groups/${familyId}/members`, user!.uid);
      await setDoc(memberRef, {
        familyId,
        userId: user!.uid,
        email: user!.email || '',
        displayName: user!.displayName || 'Group Owner',
        photoURL: user!.photoURL || '',
        role: 'admin',
        joinedAt: Date.now(),
        isActive: true,
      });

      // 3. Create default family account inside Firestore
      const accountRef = doc(firestore, `family-groups/${familyId}/accounts`, 'default-family-savings');
      await setDoc(accountRef, {
        accountId: 'default-family-savings',
        userId: familyId,
        name: 'Family Savings',
        type: 'bank',
        balance: 0,
        description: 'Default family savings account',
        institution: 'Family Bank',
        currency: 'INR',
        createdAt: Date.now(),
        isActive: true,
        familyId,
      });

      // 4. Create default categories in Firestore
      const batch = writeBatch(firestore);
      const defaultCategories = [
        { name: 'Rent', icon: '🏠', color: '#f43f5e', type: 'expense' },
        { name: 'Groceries', icon: '🛒', color: '#10b981', type: 'expense' },
        { name: 'Electricity', icon: '⚡', color: '#eab308', type: 'expense' },
        { name: 'Salary', icon: '💰', color: '#8b5cf6', type: 'income' },
      ];
      defaultCategories.forEach((cat, index) => {
        const catId = `family-cat-${index}-${Date.now()}`;
        const catRef = doc(firestore, `family-groups/${familyId}/categories`, catId);
        batch.set(catRef, {
          id: catId,
          userId: user!.uid,
          name: cat.name,
          type: cat.type,
          icon: cat.icon,
          color: cat.color,
          createdAt: Date.now(),
          isSystem: false,
          familyId,
        });
      });
      await batch.commit();

      Alert.alert('Success', `Family group "${familyName}" created! Invite code is: ${code}`);
      setFamilyName('');
      setShowCreate(false);
      await fetchFamilies();

      // Automatically switch to the newly created family
      await handleActivateFamily(newFamily);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to create family group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter a valid invite code.');
      return;
    }
    setActionLoading(true);
    try {
      const cleanCode = inviteCode.trim().toUpperCase();
      const q = query(
        collection(firestore, 'family-groups'),
        where('inviteCode', '==', cleanCode),
        where('isActive', '==', true)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert('Error', 'Invalid invite code. Family group not found.');
        return;
      }

      const familyDoc = snap.docs[0];
      const family = { id: familyDoc.id, ...familyDoc.data() as any };

      if (family.memberIds.includes(user!.uid)) {
        Alert.alert('Notice', 'You are already a member of this family group.');
        // Switch to it anyway
        await handleActivateFamily(family);
        setShowJoin(false);
        setInviteCode('');
        return;
      }

      // Add to memberIds list
      await updateDoc(doc(firestore, 'family-groups', family.id), {
        memberIds: arrayUnion(user!.uid),
      });

      // Add members collection entry
      await setDoc(doc(firestore, `family-groups/${family.id}/members`, user!.uid), {
        familyId: family.id,
        userId: user!.uid,
        email: user!.email || '',
        displayName: user!.displayName || 'Family Member',
        photoURL: user!.photoURL || '',
        role: 'member',
        joinedAt: Date.now(),
        isActive: true,
      });

      Alert.alert('Success', `Joined family group "${family.name}"!`);
      setInviteCode('');
      setShowJoin(false);
      await fetchFamilies();

      // Switch mode to active family
      await handleActivateFamily(family);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to join family group.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivateFamily = async (family: any) => {
    setIsLoading(true);
    try {
      setFamilyMode(true, family.id);
      // Execute pull sync for the family group
      await syncWithFirebase(db, user!.uid, family.id);
      // Reload UI stores
      await useAccountStore.getState().loadAccounts(db, user!.uid);
      await useCategoryStore.getState().loadCategories(db, user!.uid);
      await useTransactionStore.getState().loadTransactions(db, user!.uid);
      
      Alert.alert('Group Active', `Switched to "${family.name}" dashboard view.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPersonalMode = async () => {
    setIsLoading(true);
    try {
      setFamilyMode(false, null);
      // Reload stores for personal mode
      await useAccountStore.getState().loadAccounts(db, user!.uid);
      await useCategoryStore.getState().loadCategories(db, user!.uid);
      await useTransactionStore.getState().loadTransactions(db, user!.uid);

      Alert.alert('Personal Mode Active', 'Switched to your personal dashboard.');
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (code: string) => {
    Clipboard.setString(code);
    Alert.alert('Copied', 'Invite code copied to clipboard!');
  };

  if (!user || user.uid === 'local-user') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <View style={styles.centerBox}>
          <Ionicons name="lock-closed-outline" size={64} color={colors.textTertiary} />
          <Text style={[styles.centerTitle, { color: colors.text }]}>Authentication Required</Text>
          <Text style={[styles.centerSub, { color: colors.textSecondary }]}>
            Sign in with email and password to sync and manage family group dashboards.
          </Text>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/sign-in')}
          >
            <Text style={styles.btnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Dynamic Header offset */}
      <View style={{ height: Platform.OS === 'ios' ? 120 : 100 }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: colors.text }]}>Family Groups</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Collaborate on budgets, expenses, and accounts with family members in real-time.
        </Text>

        {/* Current Active Mode */}
        <View style={[styles.modeIndicator, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
          <View style={styles.modeRow}>
            <View
              style={[
                styles.modeDot,
                { backgroundColor: isFamilyMode ? colors.primary : colors.textSecondary },
              ]}
            />
            <Text style={[styles.modeLabel, { color: colors.textSecondary }]}>Active Dashboard Mode:</Text>
            <Text style={[styles.modeVal, { color: isFamilyMode ? colors.primary : colors.text }]}>
              {isFamilyMode ? 'Family Group' : 'Personal (Local)'}
            </Text>
          </View>
          {isFamilyMode && (
            <TouchableOpacity style={styles.switchLink} onPress={handleSetPersonalMode}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Switch to Personal Mode</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Your Groups</Text>

            {families.map((family) => {
              const isActive = activeFamilyId === family.id && isFamilyMode;
              return (
                <View
                  key={family.id}
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isActive ? colors.primary : colors.borderLight,
                      borderWidth: isActive ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardIcon}>{family.icon || '👨‍👩‍👧‍👦'}</Text>
                    <View style={styles.cardDetails}>
                      <Text style={[styles.cardName, { color: colors.text }]}>{family.name}</Text>
                      <TouchableOpacity style={styles.codeRow} onPress={() => copyToClipboard(family.inviteCode)}>
                        <Text style={[styles.cardCode, { color: colors.textSecondary }]}>
                          Code: {family.inviteCode}
                        </Text>
                        <Ionicons name="copy-outline" size={12} color={colors.textTertiary} style={{ marginLeft: 4 }} />
                      </TouchableOpacity>
                    </View>
                    {isActive ? (
                      <View style={[styles.activeBadge, { backgroundColor: colors.primaryContainer }]}>
                        <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '700' }}>Active</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.activateBtn, { backgroundColor: colors.surfaceVariant }]}
                        onPress={() => handleActivateFamily(family)}
                      >
                        <Text style={[styles.activateBtnText, { color: colors.text }]}>Switch</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}

            {families.length === 0 && (
              <View style={styles.emptyCard}>
                <Ionicons name="people-outline" size={44} color={colors.textTertiary} />
                <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>
                  You are not in any family groups yet.
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Action Options */}
        <View style={styles.actionsContainer}>
          {/* Create Family Form toggle */}
          {showCreate ? (
            <View style={[styles.formBlock, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Create Family Group</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={familyName}
                onChangeText={setFamilyName}
                placeholder="Family Name (e.g. The Smiths)"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formBtn, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => setShowCreate(false)}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formBtn, { backgroundColor: colors.primary }]}
                  onPress={handleCreateFamily}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Create</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            !showJoin && (
              <TouchableOpacity
                style={[styles.actionRowBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowCreate(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.actionRowBtnText}>Create a Family Group</Text>
              </TouchableOpacity>
            )
          )}

          {/* Join Family Form toggle */}
          {showJoin ? (
            <View style={[styles.formBlock, { backgroundColor: colors.surface, borderColor: colors.borderLight }]}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Join Family Group</Text>
              <TextInput
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                value={inviteCode}
                onChangeText={setInviteCode}
                placeholder="Invite Code (e.g. XY79K)"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="characters"
              />
              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={[styles.formBtn, { backgroundColor: colors.surfaceVariant }]}
                  onPress={() => setShowJoin(false)}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formBtn, { backgroundColor: colors.primary }]}
                  onPress={handleJoinFamily}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Join</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            !showCreate && (
              <TouchableOpacity
                style={[styles.actionRowBtn, { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }]}
                onPress={() => setShowJoin(true)}
              >
                <Ionicons name="enter-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                <Text style={[styles.actionRowBtnText, { color: colors.text }]}>Join Group with Code</Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },
  title: {
    ...Typography.displaySmall,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.xl,
  },
  centerBox: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  centerTitle: {
    ...Typography.titleLarge,
    marginTop: 16,
    marginBottom: 8,
  },
  centerSub: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    marginBottom: 24,
  },
  btn: {
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  btnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modeIndicator: {
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    marginBottom: 24,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  modeLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginRight: 6,
  },
  modeVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  switchLink: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  cardDetails: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  cardCode: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  activateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  activateBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyCardText: {
    fontSize: 13,
    marginTop: 8,
  },
  actionsContainer: {
    gap: 12,
  },
  actionRowBtn: {
    height: 48,
    borderRadius: BorderRadius.xl,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionRowBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  formBlock: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  formBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
});
