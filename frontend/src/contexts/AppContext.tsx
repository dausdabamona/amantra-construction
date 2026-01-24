import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Project {
  id: string;
  name: string;
  description?: string;
  location: string;
  ownerId: string;
  contractorId?: string;
  supervisorId?: string;
  witnessId?: string;
  owner?: { name: string; email: string };
  contractor?: { name: string; email: string };
  supervisor?: { name: string; email: string };
  witness?: { name: string; email: string };
  contract?: any;
  createdAt: string;
}

export interface Contract {
  id: string;
  projectId: string;
  contractNumber: string;
  totalValue: number;
  startDate: string;
  endDate: string;
  terms?: Term[];
}

export interface Term {
  id: string;
  contractId: string;
  termNumber: number;
  name: string;
  description?: string;
  value: number;
  percentage: number;
  status: 'DRAFT' | 'SUBMITTED' | 'VERIFIED' | 'VALID' | 'REJECTED' | 'PAID';
  startDate?: string;
  endDate?: string;
  progress?: any[];
  verifications?: any[];
  payment?: any;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

interface AppContextType {
  // Projects
  projects: Project[];
  setProjects: (projects: Project[]) => void;
  currentProject: Project | null;
  setCurrentProject: (project: Project | null) => void;

  // Terms
  currentTerm: Term | null;
  setCurrentTerm: (term: Term | null) => void;

  // Notifications
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;

  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentTerm, setCurrentTerm] = useState<Term | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addNotification = useCallback(
    (notification: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substr(2, 9);
      const newNotification: Notification = { ...notification, id };

      setNotifications((prev) => [...prev, newNotification]);

      // Auto-remove notification
      if (notification.duration !== 0) {
        setTimeout(() => {
          removeNotification(id);
        }, notification.duration || 5000);
      }
    },
    []
  );

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <AppContext.Provider
      value={{
        projects,
        setProjects,
        currentProject,
        setCurrentProject,
        currentTerm,
        setCurrentTerm,
        notifications,
        addNotification,
        removeNotification,
        isLoading,
        setIsLoading,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
