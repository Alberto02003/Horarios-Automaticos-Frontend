import { createContext, useContext, useState, type ReactNode } from "react";

export interface DragPayload {
  type: "new-member" | "move-assignment";
  memberId: number;
  memberName: string;
  memberColor: string;
  sourceDate?: string;
  assignmentId?: number;
  shiftTypeId?: number;
}

export interface DropResult {
  date: string;
  payload: DragPayload;
  x: number;
  y: number;
}

interface DragContextValue {
  dragPayload: DragPayload | null;
  setDragPayload: (p: DragPayload | null) => void;
  highlightedDate: string | null;
  setHighlightedDate: (d: string | null) => void;
  dropResult: DropResult | null;
  setDropResult: (r: DropResult | null) => void;
}

const DragCtx = createContext<DragContextValue | null>(null);

export function useDrag() {
  return useContext(DragCtx);
}

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragPayload, setDragPayload] = useState<DragPayload | null>(null);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);
  const [dropResult, setDropResult] = useState<DropResult | null>(null);

  return (
    <DragCtx.Provider value={{ dragPayload, setDragPayload, highlightedDate, setHighlightedDate, dropResult, setDropResult }}>
      {children}
    </DragCtx.Provider>
  );
}
