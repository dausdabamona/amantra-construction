import React from 'react';
import { UserRole } from '@/types/intent';

interface RoleSelectorProps {
  selectedRole: UserRole | null;
  onRoleSelect: (role: UserRole) => void;
  disabled?: boolean;
}

const roleDescriptions: Record<UserRole, { title: string; description: string; icon: string }> = {
  INVESTOR: {
    title: 'Investor',
    description: 'Penyedia modal dan pendana proyek konstruksi',
    icon: '💰',
  },
  OPERATOR: {
    title: 'Operator',
    description: 'Pengelola dan pelaksana proyek konstruksi',
    icon: '🏗️',
  },
  AUDITOR: {
    title: 'Auditor',
    description: 'Pihak ketiga independen untuk verifikasi',
    icon: '✓',
  },
  SYSTEM: {
    title: 'Admin Sistem',
    description: 'Administrator platform (akses khusus)',
    icon: '⚙️',
  },
};

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  selectedRole,
  onRoleSelect,
  disabled = false,
}) => {
  const roles: UserRole[] = [UserRole.INVESTOR, UserRole.OPERATOR, UserRole.AUDITOR, UserRole.SYSTEM];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Pilih Peran Anda</h3>
      <p className="text-sm text-gray-600">
        Pilih peran yang paling sesuai dengan posisi Anda dalam ekosistem AMANTRA
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const info = roleDescriptions[role];
          const isSelected = selectedRole === role;

          return (
            <button
              key={role}
              onClick={() => !disabled && onRoleSelect(role)}
              disabled={disabled}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-blue-300'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-3xl">{info.icon}</span>
                <div className="text-left">
                  <h4 className="font-bold text-gray-900">{info.title}</h4>
                  <p className="text-sm text-gray-600">{info.description}</p>
                  {isSelected && (
                    <span className="inline-block mt-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                      ✓ Dipilih
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedRole && (
        <div className="p-4 rounded-lg bg-blue-50 border-2 border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Peran terpilih:</strong> {roleDescriptions[selectedRole].title}
          </p>
        </div>
      )}
    </div>
  );
};

export default RoleSelector;
