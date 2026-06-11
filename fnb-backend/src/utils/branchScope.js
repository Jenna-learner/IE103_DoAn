const PRIVILEGED_ROLES = new Set(['admin', 'giam_doc_van_hanh']);

const canAccessBranchData = (user, maCN) => (
  PRIVILEGED_ROLES.has(user?.vaiTro) || (user?.maCN && user.maCN === maCN)
);

const resolveBranchScope = (user, requestedMaCN) => {
  if (PRIVILEGED_ROLES.has(user?.vaiTro)) {
    return requestedMaCN || user?.maCN || '';
  }
  return user?.maCN || requestedMaCN || '';
};

module.exports = { canAccessBranchData, resolveBranchScope };
