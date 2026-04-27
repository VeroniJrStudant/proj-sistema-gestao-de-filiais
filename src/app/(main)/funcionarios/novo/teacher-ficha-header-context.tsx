"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Ctx = {
  draftName: string;
  setDraftName: (v: string) => void;
  draftNickname: string;
  setDraftNickname: (v: string) => void;
  draftJobRole: string;
  setDraftJobRole: (v: string) => void;
  draftEmployeeCodeLine: string;
  setDraftEmployeeCodeLine: (v: string) => void;
};

const TeacherFichaHeaderContext = createContext<Ctx | null>(null);

export function TeacherFichaHeaderProvider({ children }: { children: ReactNode }) {
  const [draftName, setDraftNameState] = useState("");
  const [draftNickname, setDraftNicknameState] = useState("");
  const [draftJobRole, setDraftJobRoleState] = useState("");
  const [draftEmployeeCodeLine, setDraftEmployeeCodeLineState] = useState("");

  const setDraftName = useCallback((v: string) => {
    setDraftNameState(v);
  }, []);

  const setDraftNickname = useCallback((v: string) => {
    setDraftNicknameState(v);
  }, []);

  const setDraftJobRole = useCallback((v: string) => {
    setDraftJobRoleState(v);
  }, []);

  const setDraftEmployeeCodeLine = useCallback((v: string) => {
    setDraftEmployeeCodeLineState(v);
  }, []);

  const value = useMemo(
    () => ({
      draftName,
      setDraftName,
      draftNickname,
      setDraftNickname,
      draftJobRole,
      setDraftJobRole,
      draftEmployeeCodeLine,
      setDraftEmployeeCodeLine,
    }),
    [
      draftName,
      setDraftName,
      draftNickname,
      setDraftNickname,
      draftJobRole,
      setDraftJobRole,
      draftEmployeeCodeLine,
      setDraftEmployeeCodeLine,
    ],
  );

  return (
    <TeacherFichaHeaderContext.Provider value={value}>
      {children}
    </TeacherFichaHeaderContext.Provider>
  );
}

export function useOptionalTeacherFichaHeader() {
  return useContext(TeacherFichaHeaderContext);
}
