// navDropList.jsx — Admin
// The old static `badge` string values (e.g. 'Assign', 'Approved') have been
// removed from all children. Dynamic number badges are injected at render time
// by AdminSideBar.jsx via the `notifBadge` prop — no changes needed here.

const navDropList = [
  {
    _id: 1,
    name: 'Application Management',
    icon: 'bi bi-kanban',
    description: 'Manage Project Reviews and Finalization',
    children: [
      {
        _id: '1-0',
        name: 'Assign Submission',
        icon: 'bi bi-person',
        href: 'main2/AssignSubmission',
      },
      {
        _id: '1-1',
        name: 'Approved for Application',
        icon: 'bi bi-check2-square',
        href: 'main2/ApprovedforApplication',
      },
      {
        _id: '1-2',
        name: 'Active Reviews',
        icon: 'bi bi-list-check',
        href: 'main2/ActiveReviews',
      },
      {
        _id: '1-3',
        name: 'Resubmission',
        icon: 'bi bi-arrow-repeat',
        href: 'main2/AdminResubmission',
      },
      {
        _id: '1-4',
        name: 'PAS Reports',
        icon: 'bi bi-file-earmark-bar-graph',
        href: 'main2/PASReports',
      },
    ],
  },

  {
    _id: 2,
    name: 'User Management',
    icon: 'bi bi-people',
    color: '#16a34a',
    description: 'Account Management Per Users',
    children: [
      {
        _id: '2-1',
        name: 'Account Management',
        icon: 'bi bi-person-lines-fill',
        href: 'main2/AccountManagement',
      },
      {
        _id: '2-3',
        name: 'User Directory',
        icon: 'bi bi-person-badge',
        href: 'main2/Userdirectory',
      },
      {
        _id: '2-4',
        name: 'Role Permissions',
        icon: 'bi bi-shield-lock',
        href: 'main2/RolePermissions',
      },
    ],
  },

  {
    _id: 4,
    name: 'Account & Support',
    icon: 'bi bi-person-gear',
    color: '#2563eb',
    description: 'Account and Support',
    children: [
      {
        _id: '4-1',
        name: 'IP Reference Library',
        icon: 'bi bi-journal-bookmark',
        href: 'main2/ReferenceLibrary',
      },
      {
        _id: '4-2',
        name: 'Terms & Conditions',
        icon: 'bi bi-file-earmark-text',
        href: 'main2/TermsConditions',
      },
    ],
  },
];

export default navDropList;