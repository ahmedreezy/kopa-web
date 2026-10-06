const rolePermissions = {
  owner: ['*'],
  manager: [
    'dashboard.view', 'search.use', 'borrowers.view', 'borrowers.manage', 'borrowers.export',
    'borrowers.export_bulk', 'documents.view', 'documents.manage', 'loan_products.view',
    'loan_products.manage', 'loans.view', 'loans.manage', 'collections.view', 'repayments.create',
    'repayments.reverse', 'receipts.view', 'reports.view', 'staff.view', 'branches.view',
    'branches.manage', 'company.view', 'audit.view',
  ],
  loan_officer: [
    'dashboard.view', 'search.use', 'borrowers.view', 'borrowers.manage', 'borrowers.export',
    'documents.view', 'documents.manage', 'loan_products.view', 'loans.view', 'loans.manage',
    'branches.view', 'company.view',
  ],
  collector: [
    'dashboard.view', 'search.use', 'borrowers.view', 'loans.view', 'collections.view',
    'repayments.create', 'receipts.view', 'company.view',
  ],
  accountant: [
    'dashboard.view', 'search.use', 'borrowers.view', 'loans.view', 'collections.view',
    'receipts.view', 'reports.view', 'company.view',
  ],
}

export function permissionsFor(user) {
  return user?.permissions?.length ? user.permissions : (rolePermissions[user?.role] || [])
}

export function userCan(user, permission) {
  const permissions = permissionsFor(user)
  return permissions.includes('*') || permissions.includes(permission)
}

export function userCanAny(user, permissions = []) {
  return permissions.some((permission) => userCan(user, permission))
}
