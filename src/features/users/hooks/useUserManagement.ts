import { useEffect, useState, useCallback, useMemo } from 'react';
import toast from 'react-hot-toast';
import { authService } from '@/features/auth/services/authService';
import { ticketService } from '@/features/tickets/services/ticketService';
import { tierService } from '@/features/tickets/services/tierService';
import type { CustomerTier } from '@/features/tickets/services/tierService';
import type { User, UserUpdateRequest, UserCreateRequest, AgentSkill, UserRole } from '@/types';
import type { TabView, ModalMode, SkillForm } from '../types';

const INITIAL_SKILL: SkillForm = { area_id: 0, proficiency_level: 'BEGINNER' };

export function useUserManagement() {
  // ── Core Data ────────────────────────────────────────────────────────────────
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [areas, setAreas] = useState<Array<{ area_id: number; name: string }>>([]);
  const [tiers, setTiers] = useState<CustomerTier[]>([]);
  const [loading, setLoading] = useState(true);

  // ── UI State ─────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabView>('support_agent');
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Forms ────────────────────────────────────────────────────────────────────
  const [userForm, setUserForm] = useState<Partial<UserCreateRequest & UserUpdateRequest>>({
    email: '',
    full_name: '',
    role: 'support_agent',
    is_active: true,
  });

  // ── Agent Skills (manage existing) ───────────────────────────────────────────
  const [agentSkills, setAgentSkills] = useState<AgentSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [newSkill, setNewSkill] = useState<SkillForm>(INITIAL_SKILL);

  // ── Agent Skills (create flow) ───────────────────────────────────────────────
  const [createSkills, setCreateSkills] = useState<SkillForm[]>([]);
  const [createNewSkill, setCreateNewSkill] = useState<SkillForm>(INITIAL_SKILL);

  // ── Data Loading ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [users, areasData, tiersData] = await Promise.all([
        authService.getAllUsers(),
        ticketService.getAreasOfConcern(),
        tierService.listTiers(),
      ]);
      setAllUsers(users);
      setAreas(areasData);
      setTiers(tiersData);
    } catch {
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Derived Data ─────────────────────────────────────────────────────────────

  const adminUsers = useMemo(() => allUsers.filter((u) => u.role === 'admin'), [allUsers]);
  const leadUsers = useMemo(() => allUsers.filter((u) => u.role === 'team_lead'), [allUsers]);
  const agentUsers = useMemo(() => allUsers.filter((u) => u.role === 'support_agent'), [allUsers]);
  const customerUsers = useMemo(() => allUsers.filter((u) => u.role === 'user'), [allUsers]);

  const activeList = useMemo(() => {
    switch (activeTab) {
      case 'admin':
        return adminUsers;
      case 'team_lead':
        return leadUsers;
      case 'support_agent':
        return agentUsers;
      case 'customers':
        return customerUsers;
    }
  }, [activeTab, adminUsers, leadUsers, agentUsers, customerUsers]);

  const filtered = useMemo(
    () =>
      activeList.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.full_name || '').toLowerCase().includes(search.toLowerCase())
      ),
    [activeList, search]
  );

  const availableAreas = useMemo(
    () => areas.filter((a) => !agentSkills.some((s) => s.area_id === a.area_id)),
    [areas, agentSkills]
  );
  const availableCreateAreas = useMemo(
    () => areas.filter((a) => !createSkills.some((s) => s.area_id === a.area_id)),
    [areas, createSkills]
  );

  function getTierName(id: number | null) {
    if (!id) return 'Free';
    return tiers.find((t) => t.tier_id === id)?.name ?? `Tier ${id}`;
  }

  function getUserName(userId: string | null) {
    if (!userId) return null;
    const user = allUsers.find((u) => u.id === userId);
    return user?.full_name || user?.email || userId;
  }

  // ── Modal ────────────────────────────────────────────────────────────────────

  function openModal(mode: ModalMode, user?: User) {
    setModalMode(mode);
    setSelectedUser(user || null);
    if (mode === 'create') {
      setUserForm({ email: '', full_name: '', role: 'support_agent', is_active: true });
      setCreateSkills([]);
      setCreateNewSkill(INITIAL_SKILL);
    } else if (mode === 'edit' && user)
      setUserForm({ full_name: user.full_name || '', is_active: user.is_active });
    else if (mode === 'skills' && user) loadAgentSkills(user.id);
    else if (mode === 'view' && user && user.role === 'support_agent') loadAgentSkills(user.id);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setUserForm({});
    setAgentSkills([]);
    setNewSkill(INITIAL_SKILL);
    setCreateSkills([]);
    setCreateNewSkill(INITIAL_SKILL);
  }

  const modalTitle =
    {
      view: 'User Details',
      edit: 'Edit User',
      create: 'Create New User',
      skills: 'Manage Agent Skills',
    }[modalMode!] ?? '';

  // ── Agent Skills (manage existing) ───────────────────────────────────────────

  async function loadAgentSkills(userId: string) {
    setSkillsLoading(true);
    try {
      const r = await authService.getUserSkills(userId);
      setAgentSkills(r.skills);
    } catch {
      toast.error('Failed to load agent skills');
    } finally {
      setSkillsLoading(false);
    }
  }

  async function handleAddSkill() {
    if (!selectedUser || !newSkill.area_id) {
      toast.error('Please select an area');
      return;
    }
    setSaving(true);
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: [
          ...agentSkills.map((s) => ({
            area_id: s.area_id,
            proficiency_level: s.proficiency_level,
          })),
          { area_id: newSkill.area_id, proficiency_level: newSkill.proficiency_level },
        ],
      });
      toast.success('Skill added');
      loadAgentSkills(selectedUser.id);
      setNewSkill(INITIAL_SKILL);
    } catch {
      toast.error('Failed to add skill');
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveSkill(areaId: number) {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: agentSkills
          .filter((s) => s.area_id !== areaId)
          .map((s) => ({ area_id: s.area_id, proficiency_level: s.proficiency_level })),
      });
      toast.success('Skill removed');
      loadAgentSkills(selectedUser.id);
    } catch {
      toast.error('Failed to remove skill');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateSkillProficiency(areaId: number, newLevel: string) {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await authService.updateUserSkills(selectedUser.id, {
        skills: agentSkills.map((s) =>
          s.area_id === areaId
            ? { area_id: s.area_id, proficiency_level: newLevel }
            : { area_id: s.area_id, proficiency_level: s.proficiency_level }
        ),
      });
      toast.success('Skill updated');
      loadAgentSkills(selectedUser.id);
    } catch {
      toast.error('Failed to update skill');
    } finally {
      setSaving(false);
    }
  }

  // ── Agent Skills (create flow) ───────────────────────────────────────────────

  function handleAddCreateSkill() {
    if (!createNewSkill.area_id) {
      toast.error('Please select an area');
      return;
    }
    setCreateSkills((prev) => [...prev, { ...createNewSkill }]);
    setCreateNewSkill(INITIAL_SKILL);
  }

  function handleRemoveCreateSkill(areaId: number) {
    setCreateSkills((prev) => prev.filter((s) => s.area_id !== areaId));
  }

  // ── User CRUD ────────────────────────────────────────────────────────────────

  async function handleCreateUser() {
    if (!userForm.email || !userForm.role) {
      toast.error('Email and role are required');
      return;
    }
    setSaving(true);
    try {
      const r = await authService.createUser({
        email: userForm.email,
        full_name: userForm.full_name || '',
        role: userForm.role as UserRole,
      });
      if (createSkills.length > 0 && userForm.role === 'support_agent') {
        try {
          await authService.updateUserSkills(r.user.id, { skills: createSkills });
        } catch {
          toast.error('User created but failed to assign skills. You can add skills later.');
        }
      }
      return r;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      toast.error(error.response?.data?.detail || 'Failed to create user');
      return null;
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateUserAndClose() {
    const r = await handleCreateUser();
    if (r) {
      toast.success(`User created successfully. Temporary password: ${r.temporary_password}`, {
        duration: 10000,
      });
      closeModal();
      loadData();
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return;
    setSaving(true);
    try {
      await authService.updateUser(selectedUser.id, {
        full_name: userForm.full_name,
        is_active: userForm.is_active,
      });
      toast.success('User updated successfully');
      closeModal();
      loadData();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setSaving(false);
    }
  }

  // ── Customer Toggle ──────────────────────────────────────────────────────────

  async function handleToggleCustomer(u: User) {
    setTogglingId(u.id);
    try {
      await authService.updateUser(u.id, { is_active: !u.is_active });
      setAllUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: !u.is_active } : x))
      );
      toast.success(`Customer ${!u.is_active ? 'activated' : 'deactivated'} successfully`);
    } catch {
      toast.error('Failed to update customer status');
    } finally {
      setTogglingId(null);
    }
  }

  // ── Tab ──────────────────────────────────────────────────────────────────────

  function switchTab(tab: TabView) {
    setActiveTab(tab);
    setSearch('');
  }

  // ── Public API ───────────────────────────────────────────────────────────────

  return {
    // data
    loading,
    areas,
    tiers,
    adminUsers,
    leadUsers,
    agentUsers,
    customerUsers,
    filtered,

    // ui
    search,
    setSearch,
    activeTab,
    switchTab,
    modalMode,
    selectedUser,
    openModal,
    closeModal,
    modalTitle,
    saving,
    togglingId,

    // forms
    userForm,
    setUserForm,

    // user crud
    handleCreateUserAndClose,
    handleUpdateUser,
    handleToggleCustomer,

    // skills (manage)
    agentSkills,
    skillsLoading,
    newSkill,
    setNewSkill,
    availableAreas,
    handleAddSkill,
    handleRemoveSkill,
    handleUpdateSkillProficiency,

    // skills (create)
    createSkills,
    createNewSkill,
    setCreateNewSkill,
    availableCreateAreas,
    handleAddCreateSkill,
    handleRemoveCreateSkill,

    // helpers
    getTierName,
    getUserName,
  };
}
