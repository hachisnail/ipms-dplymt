const navDropList = [
  {
    _id: 1,
    name: 'Project Management',
    icon: 'bi bi-kanban',
    description: 'Manage Project Reviews and Finalization',
    children: [
      {
        _id: '1-1',
        name: 'Active Reviews',
        icon: 'bi bi-list-check',
        href: 'main2/ActiveReviews',
        badge: 'Reviews'
      },
      {
        _id: '1-2',
        name: 'Finalized Projects',
        icon: 'bi bi-clipboard-check',
        href: 'main2/FinalizedProjects',
        badge: 'Finalized'
      },
    ]
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
        name: 'Inventor Directory',
        icon: 'bi bi-person-badge',
        href: 'main2/InventorDirectory',
        badge: 'Inventor'
      },
      {
        _id: '2-2',
        name: 'Specialist Directory',
        icon: 'bi bi-person-workspace',
        href: 'main2/SpecialistDirectory',
        badge: 'Speacialist'
      },
      {
        _id: '2-3',
        name: 'Role Permissions',
        icon: 'bi bi-shield-lock',
        href: 'main2/RolePermissions',
        badge: 'Permissions'
      },
    ]
  },

  {
    _id: 3,
    name: 'System Records (Formerly Portal Configuration)',
    icon: 'bi bi-gear',
    color: '#2563eb',
    description: 'Portal Configuration',
    children: [
      {
        _id: '3-1',
        name: 'IP Reference Library',
        icon: 'bi bi-journal-bookmark',
        href: 'main2/ReferenceLibrary',
        badge: 'Reference'
      },
      {
        _id: '3-2',
        name: 'System Audit Logs',
        icon: 'bi bi-clipboard-data',
        href: 'main2/SystemAudit',
        badge: 'Audit'
      },
    ]
  },
   {
    _id: 4,
    name: 'Account & Support',
    icon: 'bi bi-person-gear',
    color: '#2563eb',
    description: 'Account and Support',
    children: [
      {
        _id: '3-1',
        name: 'Admin Setting',
        icon: 'bi bi-gear-wide-connected',
        href: 'main2/AdminSetting',
        badge: 'ID'
      },
      {
        _id: '3.2',
        name: 'Terms & Conditions',
        icon: 'bi bi-file-earmark-text',
        href: 'main2/TermsConditions',
        badge: 'T&C'
      }
    ]
  },
];

export default navDropList;
