"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

function useObjectUrl(file: File | null): string | null {
  const url = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  useEffect(() => {
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [url]);

  return url;
}

type TeacherPhotoContextValue = {
  teacherPhoto: File | null;
  setTeacherPhoto: (file: File | null) => void;
  draftPreviewUrl: string | null;
};

const TeacherPhotoContext = createContext<TeacherPhotoContextValue | null>(null);

export function TeacherPhotoProvider({ children }: { children: ReactNode }) {
  const [teacherPhoto, setTeacherPhotoState] = useState<File | null>(null);
  const draftPreviewUrl = useObjectUrl(teacherPhoto);

  const setTeacherPhoto = useCallback((file: File | null) => {
    setTeacherPhotoState(file);
  }, []);

  const value = useMemo(
    () => ({ teacherPhoto, setTeacherPhoto, draftPreviewUrl }),
    [teacherPhoto, setTeacherPhoto, draftPreviewUrl],
  );

  return (
    <TeacherPhotoContext.Provider value={value}>{children}</TeacherPhotoContext.Provider>
  );
}

export function useTeacherPhoto() {
  const ctx = useContext(TeacherPhotoContext);
  if (!ctx) {
    throw new Error("useTeacherPhoto must be used within TeacherPhotoProvider");
  }
  return ctx;
}
