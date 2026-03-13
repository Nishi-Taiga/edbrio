"use client"

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { ProtectedRoute } from '@/components/layout/protected-route'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import type { Invite } from '@/lib/types/database'
import type { NotificationPreferences } from '@/lib/types/database'
import type { PublicProfile, TeacherRow } from './_components/types'
import { migrateServiceAreas } from './_components/types'
import { ProfileEditTab } from './_components/profile-edit-tab'
import { NotificationSettingsTab } from './_components/notification-settings-tab'
import { SubscriptionTab } from './_components/subscription-tab'
import { InviteTab } from './_components/invite-tab'
import { AccountSettingsTab, DeleteAccountSection } from './_components/account-settings-tab'

export default function TeacherProfilePage() {
  const tc = useTranslations('common')
  return (
    <Suspense fallback={<div className="container mx-auto px-4 py-8 text-gray-500 dark:text-slate-400">{tc('loading')}</div>}>
      <TeacherProfileContent />
    </Suspense>
  )
}

function TeacherProfileContent() {
  const t = useTranslations('teacherProfile')
  const tc = useTranslations('common')
  const tNotif = useTranslations('notificationSettings')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [teacher, setTeacher] = useState<TeacherRow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedSubjects, setEditedSubjects] = useState<string[]>([])
  const [editedGrades, setEditedGrades] = useState<string[]>([])
  const [editedProfile, setEditedProfile] = useState<PublicProfile>({})

  // Notification preferences state
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>({})
  const [notifSaving, setNotifSaving] = useState(false)

  // Invite parent state
  const [inviteList, setInviteList] = useState<Pick<Invite, 'id' | 'email' | 'method' | 'used' | 'accepted_at' | 'created_at'>[]>([])
  const [inviteListLoading, setInviteListLoading] = useState(false)

  const supabase = useMemo(() => createClient(), [])
  const searchParams = useSearchParams()

  // Show toast for subscription / stripe redirect results
  useEffect(() => {
    const status = searchParams.get('subscription')
    if (status === 'success') {
      toast.success(t('upgradeSuccess'))
    } else if (status === 'canceled') {
      toast.info(t('upgradeCanceled'))
    }
    const stripeStatus = searchParams.get('stripe')
    if (stripeStatus === 'success') {
      toast.success(t('stripeConnectSuccess'))
    } else if (stripeStatus === 'refresh') {
      toast.info(t('stripeConnectRefresh'))
    }
  }, [searchParams, t])

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setError(null)
        setLoading(true)
        const { data: session } = await supabase.auth.getSession()
        const uid = session.session?.user?.id
        if (!uid) { setTeacher(null); return }
        const { data, error } = await supabase
          .from('teachers')
          .select('id,subjects,grades,plan,public_profile,stripe_account_id,stripe_customer_id,stripe_subscription_id,is_onboarding_complete')
          .eq('id', uid)
          .maybeSingle()
        if (error) throw error
        if (mounted) {
          const profile = (data?.public_profile || {}) as PublicProfile
          const migratedProfile = {
            ...profile,
            service_areas: migrateServiceAreas(profile.service_areas || []),
          }
          setTeacher(data)
          setEditedSubjects(data?.subjects || [])
          setEditedGrades(data?.grades || [])
          setEditedProfile(migratedProfile)
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : String(e))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [supabase])

  // Load invite history
  useEffect(() => {
    let mounted = true
    async function loadInvites() {
      setInviteListLoading(true)
      try {
        const { data } = await supabase
          .from('invites')
          .select('id, email, method, used, accepted_at, created_at')
          .order('created_at', { ascending: false })
          .limit(20)
        if (mounted && data) setInviteList(data)
      } catch {
        // Ignore - non-critical
      } finally {
        if (mounted) setInviteListLoading(false)
      }
    }
    loadInvites()
    return () => { mounted = false }
  }, [supabase])

  // Load notification preferences
  useEffect(() => {
    let mounted = true
    async function loadPrefs() {
      try {
        const res = await fetch('/api/notification-preferences')
        if (res.ok) {
          const data = await res.json()
          if (mounted) setNotifPrefs(data.preferences || {})
        }
      } catch {
        // Ignore - non-critical
      }
    }
    loadPrefs()
    return () => { mounted = false }
  }, [])

  const handleNotifToggle = async (key: keyof NotificationPreferences, value: boolean | number) => {
    const updated = { ...notifPrefs, [key]: value }
    setNotifPrefs(updated)
    setNotifSaving(true)
    try {
      const res = await fetch('/api/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      if (res.ok) {
        toast.success(tNotif('saveSuccess'))
      }
    } catch {
      // Revert on error
      setNotifPrefs(notifPrefs)
    } finally {
      setNotifSaving(false)
    }
  }

  return (
    <ProtectedRoute allowedRoles={["teacher"]}>
      <div className="container mx-auto px-4 py-8 space-y-6">
        {error && (
          <div className="p-3 text-sm bg-red-50 border border-red-200 rounded text-red-700 dark:bg-red-900/20 dark:border-red-800/30 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="text-gray-500 dark:text-slate-400">{tc('loading')}</div>
        ) : !teacher ? (
          <div className="text-gray-500 dark:text-slate-400">{t('profileNotFound')}</div>
        ) : isEditing ? (
          <ProfileEditTab
            teacher={teacher}
            editedSubjects={editedSubjects}
            setEditedSubjects={setEditedSubjects}
            editedGrades={editedGrades}
            setEditedGrades={setEditedGrades}
            editedProfile={editedProfile}
            setEditedProfile={setEditedProfile}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            setTeacher={setTeacher}
            setError={setError}
            supabase={supabase}
          />
        ) : (
          <>
            <InviteTab
              inviteList={inviteList}
              setInviteList={setInviteList}
              inviteListLoading={inviteListLoading}
            />

            <ProfileEditTab
              teacher={teacher}
              editedSubjects={editedSubjects}
              setEditedSubjects={setEditedSubjects}
              editedGrades={editedGrades}
              setEditedGrades={setEditedGrades}
              editedProfile={editedProfile}
              setEditedProfile={setEditedProfile}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              setTeacher={setTeacher}
              setError={setError}
              supabase={supabase}
            />

            <SubscriptionTab
              teacher={teacher}
              setError={setError}
            />

            <NotificationSettingsTab
              notifPrefs={notifPrefs}
              notifSaving={notifSaving}
              handleNotifToggle={handleNotifToggle}
            />

            <AccountSettingsTab supabase={supabase} />
          </>
        )}

        {/* Delete Account - always visible when teacher is loaded */}
        {!loading && teacher && <DeleteAccountSection />}

        {/* Version */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 pt-2 pb-8">v0.1.0</p>
      </div>
    </ProtectedRoute>
  )
}
