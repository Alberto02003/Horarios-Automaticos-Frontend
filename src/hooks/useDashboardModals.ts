import { useState } from "react";

export function useDashboardModals() {
  const [showGenerate, setShowGenerate] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [showActivateConfirm, setShowActivateConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showTeam, setShowTeam] = useState(false);
  const [showShifts, setShowShifts] = useState(false);

  return {
    showGenerate, setShowGenerate,
    showCreateModal, setShowCreateModal,
    showConfig, setShowConfig,
    showActivateConfirm, setShowActivateConfirm,
    showDeleteConfirm, setShowDeleteConfirm,
    showTeam, setShowTeam,
    showShifts, setShowShifts,
  };
}
