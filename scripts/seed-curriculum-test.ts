/**
 * Seed test students with curriculum data for development/testing.
 * Usage: npx tsx scripts/seed-curriculum-test.ts
 */
import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// Teacher test account email
const TEACHER_EMAIL = 'tai.nishi1998@gmail.com'

async function main() {
  // Find teacher user
  const { data: teacherUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', TEACHER_EMAIL)
    .single()

  if (!teacherUser) {
    console.error('Teacher user not found:', TEACHER_EMAIL)
    process.exit(1)
  }
  const teacherId = teacherUser.id
  console.log('Teacher ID:', teacherId)

  // Check existing profiles
  const { data: existingProfiles } = await supabase
    .from('student_profiles')
    .select('id, name')
    .eq('teacher_id', teacherId)

  console.log('Existing profiles:', existingProfiles?.map(p => p.name))

  // Test students to create (using generic names, not real ones)
  const testStudents = [
    {
      name: '生徒A',
      grade: '高校3年',
      school: 'テスト高校',
      subjects: ['数学', '物理'],
      status: 'active',
      curriculum_year: '2025',
      curriculum_title: '理系科目カリキュラム',
      color: '#0C5394', // blue
    },
    {
      name: '生徒B',
      grade: '高校2年',
      school: 'テスト高校',
      subjects: ['数学', '英語'],
      status: 'active',
      curriculum_year: '2025',
      curriculum_title: '文系科目カリキュラム',
      color: '#45818E', // teal
    },
    {
      name: '生徒C',
      grade: '高校3年',
      school: 'テスト学園',
      subjects: ['物理', '化学'],
      status: 'active',
      curriculum_year: '2025',
      curriculum_title: '理科系カリキュラム',
      color: '#8E7CC3', // purple
    },
    {
      name: '生徒D',
      grade: '中学3年',
      school: 'テスト中学',
      subjects: ['数学', '英語', '理科'],
      status: 'active',
      curriculum_year: '2025',
      curriculum_title: '受験対策カリキュラム',
      color: '#F1C232', // yellow
    },
  ]

  // Create profiles (skip if already exists by name)
  const profileIds: string[] = []
  for (const student of testStudents) {
    const existing = existingProfiles?.find(p => p.name === student.name)
    if (existing) {
      console.log(`Profile "${student.name}" already exists, skipping`)
      profileIds.push(existing.id)
      continue
    }
    const { color, ...profileData } = student
    const { data, error } = await supabase
      .from('student_profiles')
      .insert({ ...profileData, teacher_id: teacherId })
      .select('id')
      .single()
    if (error) {
      console.error(`Error creating profile "${student.name}":`, error.message)
      continue
    }
    console.log(`Created profile "${student.name}":`, data.id)
    profileIds.push(data.id)
  }

  // For 生徒A: add full curriculum data matching the Pencil design
  const studentAId = profileIds[0]
  if (!studentAId) {
    console.error('No profile ID for 生徒A')
    process.exit(1)
  }

  // Check if materials already exist for this profile
  const { data: existingMaterials } = await supabase
    .from('curriculum_materials')
    .select('id')
    .eq('profile_id', studentAId)

  if (existingMaterials && existingMaterials.length > 0) {
    console.log(`Materials already exist for 生徒A (${existingMaterials.length} materials), cleaning up...`)
    // Delete existing materials (phases cascade)
    await supabase.from('curriculum_materials').delete().eq('profile_id', studentAId)
    // Delete existing exams
    await supabase.from('exam_schedules').delete().eq('profile_id', studentAId)
  }

  // --- Materials & Phases for 生徒A ---
  const mathMaterials = [
    {
      material_name: '青チャート 数ⅠA',
      subject: '数学',
      study_pace: '1日1h',
      color: '#0C5394',
      order_index: 0,
      phases: [
        { phase_name: '基本例題', total_hours: 80, start_date: '2025-04-01', end_date: '2025-07-31', status: 'completed', order_index: 0 },
      ],
    },
    {
      material_name: '黄チャート 数ⅡB',
      subject: '数学',
      study_pace: '1日1h',
      color: '#F1C232',
      order_index: 1,
      phases: [
        { phase_name: 'コンパス3', total_hours: 45, start_date: '2025-05-01', end_date: '2025-07-31', status: 'completed', order_index: 0 },
        { phase_name: 'コンパス4・5', total_hours: 45, start_date: '2025-08-01', end_date: '2025-10-31', status: 'in_progress', order_index: 1 },
      ],
    },
    {
      material_name: '黄チャート 数ⅢC',
      subject: '数学',
      study_pace: '1日1h',
      color: '#F1C232',
      order_index: 2,
      phases: [
        { phase_name: 'コンパス3', total_hours: 45, start_date: '2025-08-01', end_date: '2025-10-31', status: 'not_started', order_index: 0 },
        { phase_name: 'コンパス4・5', total_hours: 30, start_date: '2025-11-01', end_date: '2025-12-31', status: 'not_started', order_index: 1 },
      ],
    },
    {
      material_name: '過去問（数学）',
      subject: '数学',
      study_pace: '志望校別',
      color: '#0C5394',
      order_index: 3,
      phases: [
        { phase_name: '過去問演習', total_hours: 100, start_date: '2025-11-01', end_date: '2026-02-28', status: 'not_started', order_index: 0 },
      ],
    },
  ]

  const physicsMaterials = [
    {
      material_name: 'セミナー物理',
      subject: '物理',
      study_pace: '1日1h',
      color: '#45818E',
      order_index: 0,
      phases: [
        { phase_name: '基本例題・問題', total_hours: 60, start_date: '2025-04-01', end_date: '2025-06-30', status: 'completed', order_index: 0 },
      ],
    },
    {
      material_name: '物理のエッセンス',
      subject: '物理',
      study_pace: '1日1h',
      color: '#45818E',
      order_index: 1,
      phases: [
        { phase_name: '力学・波動', total_hours: 50, start_date: '2025-06-01', end_date: '2025-08-31', status: 'in_progress', order_index: 0 },
        { phase_name: '熱・電磁気・原子', total_hours: 50, start_date: '2025-09-01', end_date: '2025-11-30', status: 'not_started', order_index: 1 },
      ],
    },
    {
      material_name: 'セミナー物理（発展）',
      subject: '物理',
      study_pace: '1日2h',
      color: '#45818E',
      order_index: 2,
      phases: [
        { phase_name: '発展・総合問題', total_hours: 80, start_date: '2025-09-01', end_date: '2025-12-31', status: 'not_started', order_index: 0 },
      ],
    },
    {
      material_name: '過去問（物理）',
      subject: '物理',
      study_pace: '志望校別',
      color: '#45818E',
      order_index: 3,
      phases: [
        { phase_name: '過去問演習', total_hours: 100, start_date: '2025-11-01', end_date: '2026-02-28', status: 'not_started', order_index: 0 },
      ],
    },
  ]

  const allMaterials = [...mathMaterials, ...physicsMaterials]

  for (const mat of allMaterials) {
    const { phases, ...materialData } = mat
    const { data: matData, error: matError } = await supabase
      .from('curriculum_materials')
      .insert({ ...materialData, profile_id: studentAId })
      .select('id')
      .single()

    if (matError) {
      console.error(`Error creating material "${mat.material_name}":`, matError.message)
      continue
    }

    for (const phase of phases) {
      const { error: phaseError } = await supabase
        .from('curriculum_phases')
        .insert({
          ...phase,
          material_id: matData.id,
          is_date_manual: true,
        })
      if (phaseError) {
        console.error(`Error creating phase "${phase.phase_name}":`, phaseError.message)
      }
    }
    console.log(`Created material "${mat.material_name}" with ${phases.length} phases`)
  }

  // --- Exam Schedules for 生徒A ---
  const exams = [
    { exam_name: '芝浦工業大学', exam_category: 'recommendation', method: '総合型選抜（理工系女子特別）', exam_date: '2025-11-08' },
    { exam_name: '神奈川大学', exam_category: 'recommendation', method: '総合型選抜（適性検査型）', exam_date: '2025-11-16' },
    { exam_name: '神奈川大学', exam_category: 'general', method: '給費生試験', exam_date: '2025-12-21' },
    { exam_name: '共通テスト', exam_category: 'common_test', method: '大学入学共通テスト', exam_date: '2026-01-17' },
    { exam_name: '芝浦工業大学', exam_category: 'general', method: '一般選抜（前期）', exam_date: '2026-02-01' },
    { exam_name: '東京電機大学', exam_category: 'general', method: '一般選抜（前期）', exam_date: '2026-02-01' },
    { exam_name: '神奈川大学', exam_category: 'general', method: '一般入試（全学統一・3科目型）', exam_date: '2026-02-04' },
    { exam_name: '成蹊大学', exam_category: 'general', method: '一般選抜 A方式（理工学部）', exam_date: '2026-02-10' },
  ]

  for (const exam of exams) {
    const { error } = await supabase
      .from('exam_schedules')
      .insert({ ...exam, profile_id: studentAId })
    if (error) {
      console.error(`Error creating exam "${exam.exam_name}":`, error.message)
    }
  }
  console.log(`Created ${exams.length} exam schedules`)

  // --- Add some materials for 生徒B too ---
  const studentBId = profileIds[1]
  if (studentBId) {
    const { data: existingB } = await supabase
      .from('curriculum_materials')
      .select('id')
      .eq('profile_id', studentBId)

    if (!existingB || existingB.length === 0) {
      const bMaterials = [
        {
          material_name: '青チャート 数ⅠA',
          subject: '数学',
          study_pace: '1日1h',
          color: '#0C5394',
          order_index: 0,
          profile_id: studentBId,
        },
        {
          material_name: '英文法レベル別問題集',
          subject: '英語',
          study_pace: '1日30分',
          color: '#1D4ED8',
          order_index: 0,
          profile_id: studentBId,
        },
      ]

      for (const mat of bMaterials) {
        const { data: matData, error } = await supabase
          .from('curriculum_materials')
          .insert(mat)
          .select('id')
          .single()
        if (error) {
          console.error(`Error creating material for 生徒B:`, error.message)
          continue
        }
        // Add a phase
        await supabase.from('curriculum_phases').insert({
          material_id: matData.id,
          phase_name: '基礎演習',
          total_hours: 40,
          start_date: '2025-04-01',
          end_date: '2025-07-31',
          is_date_manual: true,
          status: 'in_progress',
          order_index: 0,
        })
      }
      console.log('Created materials for 生徒B')
    }
  }

  console.log('\n✅ Seed complete!')
}

main().catch(console.error)
